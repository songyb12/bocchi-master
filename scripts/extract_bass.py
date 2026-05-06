"""
Bass Tab Extractor — YouTube → NoteEvent JSON

Pipeline:
  1. yt-dlp: download audio from YouTube
  2. Bandpass filter (40-400Hz): isolate bass frequencies
  3. librosa pYIN: pitch tracking + onset detection → notes
  4. Quantize + convert → BocchiMaster NoteEvent format

Usage:
  python scripts/extract_bass.py --url "https://youtube.com/watch?v=..." --bpm 175 --title "Song Name"
  python scripts/extract_bass.py --url "..." --bpm 175 --title "Song" --start 0 --end 60
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter, sosfilt


BASS_OPEN = [28, 33, 38, 43]  # E1, A1, D2, G2 MIDI


def midi_to_bass_pos(midi: int):
    """Map MIDI note to (string, fret) on 4-string bass, prefer low positions."""
    if midi < 28 or midi > 67:
        return None
    best = None
    for s in range(4):
        f = midi - BASS_OPEN[s]
        if 0 <= f <= 24:
            if best is None or f < best[1]:
                best = (s, f)
    return best


def bandpass_bass(y, sr, low=35, high=500):
    """Bandpass filter to isolate bass frequencies."""
    sos = butter(5, [low, high], btype='band', fs=sr, output='sos')
    return sosfilt(sos, y)


def download_audio(url: str, work_dir: str, start: float, end: float) -> str:
    print('[1/4] Downloading audio...')
    out = os.path.join(work_dir, 'audio.%(ext)s')
    cmd = ['yt-dlp', '--js-runtimes', 'node', '--remote-components', 'ejs:github',
           '-x', '--audio-format', 'wav', '--audio-quality', '0', '-o', out, url]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        # Retry without extra flags
        cmd2 = ['yt-dlp', '-x', '--audio-format', 'wav', '-o', out, url]
        r = subprocess.run(cmd2, capture_output=True, text=True)
        if r.returncode != 0:
            print(f'  Error: {r.stderr[:300]}')
            sys.exit(1)

    wav = None
    for f in os.listdir(work_dir):
        if f.startswith('audio') and f.endswith('.wav'):
            wav = os.path.join(work_dir, f)
    if not wav:
        print('  Error: no WAV file produced')
        sys.exit(1)

    if start > 0 or end > 0:
        y, sr = sf.read(wav)
        s_start = int(start * sr) if start > 0 else 0
        s_end = int(end * sr) if end > 0 else len(y)
        y = y[s_start:s_end]
        trimmed = os.path.join(work_dir, 'audio_trim.wav')
        sf.write(trimmed, y, sr)
        wav = trimmed

    print(f'  OK: {wav} ({os.path.getsize(wav) // 1024} KB)')
    return wav


def transcribe(audio_path: str, work_dir: str) -> list[dict]:
    """Extract bass notes: bandpass → pYIN pitch + onset detection."""
    print('[2/4] Loading & filtering audio...')
    y, sr = librosa.load(audio_path, sr=22050, mono=True)
    dur = len(y) / sr
    print(f'  Duration: {dur:.1f}s, sr={sr}')

    # Bandpass filter for bass (35-500 Hz)
    y_bass = bandpass_bass(y, sr, low=35, high=500)

    # Save filtered bass for debugging
    sf.write(os.path.join(work_dir, 'bass_filtered.wav'), y_bass, sr)

    print('[3/4] Detecting notes (onset + pitch)...')

    # Onset detection on bass-filtered signal
    onset_frames = librosa.onset.onset_detect(
        y=y_bass, sr=sr, hop_length=512,
        backtrack=True, units='frames',
        pre_max=3, post_max=3, pre_avg=3, post_avg=5,
        delta=0.05, wait=4,
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=512)
    print(f'  Onsets: {len(onset_times)}')

    # pYIN pitch tracking (optimized for bass range)
    f0, voiced, _ = librosa.pyin(
        y_bass, sr=sr,
        fmin=librosa.note_to_hz('D1'),   # just below open E
        fmax=librosa.note_to_hz('C4'),   # high bass range
        hop_length=512,
        fill_na=0.0,
    )
    pitch_times = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=512)

    # Build notes from onsets + pitch
    notes = []
    for i, t in enumerate(onset_times):
        t_end = onset_times[i + 1] if i + 1 < len(onset_times) else t + 0.5
        t_end = min(t_end, t + 2.0)

        # Sample pitch in window after onset
        mask = (pitch_times >= t) & (pitch_times <= t + 0.08)
        pitches = f0[mask]
        valid = pitches[pitches > 0]

        if len(valid) < 1:
            # Wider window
            mask2 = (pitch_times >= t) & (pitch_times <= t + 0.15)
            valid = f0[mask2]
            valid = valid[valid > 0]

        if len(valid) < 1:
            continue

        hz = float(np.median(valid))
        midi = int(round(librosa.hz_to_midi(hz)))

        if midi < 28 or midi > 60:  # reasonable bass range
            continue

        notes.append({
            'start_sec': round(float(t), 4),
            'end_sec': round(float(t_end), 4),
            'duration_sec': round(float(t_end - t), 4),
            'midi': midi,
            'hz': round(hz, 1),
            'note_name': librosa.midi_to_note(midi),
        })

    # Deduplicate notes very close together
    filtered = []
    for n in notes:
        if n['duration_sec'] < 0.025:
            continue
        if filtered and abs(n['start_sec'] - filtered[-1]['start_sec']) < 0.03:
            continue
        filtered.append(n)

    print(f'  Notes: {len(filtered)} (from {len(notes)} raw)')

    # Save raw notes
    with open(os.path.join(work_dir, 'raw_notes.json'), 'w') as f:
        json.dump(filtered, f, indent=2)

    return filtered


def quantize(notes: list[dict], bpm: float, grid: int = 16) -> list[dict]:
    """Snap note times to rhythmic grid."""
    bps = bpm / 60.0
    gs = 4.0 / grid  # grid size in beats

    out = []
    seen = set()
    for n in notes:
        beat = n['start_sec'] * bps
        q = round(beat / gs) * gs
        dur = max(n['duration_sec'] * bps, gs)
        q_dur = round(dur / gs) * gs
        q_dur = max(q_dur, gs)

        if q not in seen:
            seen.add(q)
            out.append({**n, 'beat': round(q, 4), 'dur_beats': round(q_dur, 4)})

    return out


def to_tab(notes: list[dict], bpm: float, title: str, ts=(4, 4)) -> dict:
    print('[4/4] Building tab...')
    bpm_m = ts[0]
    events = []
    for i, n in enumerate(notes):
        pos = midi_to_bass_pos(n['midi'])
        if not pos:
            continue
        s, f = pos
        events.append({
            'id': f'e{i}', 'time': n['beat'], 'duration': n['dur_beats'],
            'string': s, 'fret': f, 'midi': n['midi'],
        })

    max_beat = max((e['time'] + e['duration'] for e in events), default=0)
    n_measures = int(max_beat / bpm_m) + 1
    measures = [{'index': i, 'startBeat': i * bpm_m} for i in range(n_measures)]

    tab = {
        'title': title, 'events': events, 'measures': measures,
        'bpm': bpm, 'timeSignature': list(ts),
        'totalNotes': len(events), 'totalMeasures': n_measures,
        'durationSec': round(max_beat * 60 / bpm, 1),
    }
    print(f'  {len(events)} events, {n_measures} measures, {tab["durationSec"]}s')
    return tab


def gen_ts(tab: dict, track_id: str) -> str:
    lines = [
        f'// Auto-extracted: {tab["title"]}',
        f'// {tab["totalNotes"]} notes, {tab["totalMeasures"]} measures',
        'const ev: NoteEvent[] = [',
    ]
    for e in tab['events']:
        lines.append(
            f'  {{ id: nid(), time: {e["time"]}, duration: {e["duration"]}, '
            f'string: {e["string"]}, fret: {e["fret"]}, midi: {e["midi"]} }},'
        )
    lines += [
        ']',
        f'const ms = measures({tab["totalMeasures"]})',
        'return {',
        f'  id: \'{track_id}\', title: \'{tab["title"]} (Bass)\', bpm: {tab["bpm"]},',
        f'  timeSignature: [{tab["timeSignature"][0]}, {tab["timeSignature"][1]}],',
        '  tuning: STANDARD_BASS, events: ev, measures: ms,',
        '}',
    ]
    return '\n'.join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--url', required=True)
    p.add_argument('--bpm', type=float, required=True)
    p.add_argument('--title', required=True)
    p.add_argument('--track-id', default='')
    p.add_argument('--start', type=float, default=0)
    p.add_argument('--end', type=float, default=0)
    p.add_argument('--output', default='')
    p.add_argument('--work-dir', default='')
    p.add_argument('--ts', action='store_true')
    p.add_argument('--quantize', type=int, default=16)
    a = p.parse_args()

    wd = a.work_dir or tempfile.mkdtemp(prefix='bass_')
    os.makedirs(wd, exist_ok=True)

    print(f'=== Bass Tab Extractor ===')
    print(f'{a.title} @ {a.bpm} BPM | work: {wd}\n')

    audio = download_audio(a.url, wd, a.start, a.end)
    notes = transcribe(audio, wd)
    notes = quantize(notes, a.bpm, a.quantize)
    print(f'  Quantized ({a.quantize}th): {len(notes)} notes')

    tab = to_tab(notes, a.bpm, a.title)

    out = a.output or os.path.join(wd, 'tab.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(tab, f, indent=2, ensure_ascii=False)
    print(f'\nJSON: {out}')

    if a.ts:
        tid = a.track_id or f'song-bass'
        ts_code = gen_ts(tab, tid)
        tsp = out.replace('.json', '.ts')
        with open(tsp, 'w', encoding='utf-8') as f:
            f.write(ts_code)
        print(f'TS:   {tsp}')

    print(f'\nDone! {tab["totalNotes"]} notes.')


if __name__ == '__main__':
    main()
