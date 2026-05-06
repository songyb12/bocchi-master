"""
Bass Tab Extractor v2 — AudioChord pipeline (Demucs GPU + Basic Pitch ONNX)

Pipeline:
  1. POST /api/v1/ingest/youtube → file_id (cached on AudioChord library)
  2. POST /api/v1/analyze/pitch-to-midi (instrument_hint=bass, pre_separate=true)
     → Nous GPU runs Demucs separation + Basic Pitch transcription
  3. Download MIDI, parse with mido
  4. Quantize to 16th grid, map pitches to 4-string bass (string, fret)
  5. Output JSON (+ optional .ts)

Requires: requests, mido
"""
import argparse, json, os, time
import requests
import mido

AUDIOCHORD_BASE = os.environ.get('AUDIOCHORD_URL', 'http://localhost:8220')


def parse_args():
    p = argparse.ArgumentParser(description='Bass tab extractor v2 (AudioChord)')
    p.add_argument('--url', required=True, help='YouTube URL or video ID')
    p.add_argument('--bpm', type=float, required=True)
    p.add_argument('--title', default='Untitled')
    p.add_argument('--track-id', default='bass')
    p.add_argument('--start', type=float, default=0, help='(unused — AudioChord keeps full track)')
    p.add_argument('--end', type=float, default=90, help='(unused — AudioChord keeps full track)')
    p.add_argument('--output', default='output.json')
    p.add_argument('--work-dir', default='work')
    p.add_argument('--ts', action='store_true')
    return p.parse_args()


def ingest_youtube(url: str) -> dict:
    r = requests.post(f'{AUDIOCHORD_BASE}/api/v1/ingest/youtube',
                      data={'url': url}, timeout=300)
    r.raise_for_status()
    return r.json()


def run_pitch_to_midi(file_id: str) -> dict:
    r = requests.post(
        f'{AUDIOCHORD_BASE}/api/v1/analyze/pitch-to-midi',
        data={'file_id': file_id, 'instrument_hint': 'bass', 'pre_separate': 'true'},
        timeout=600,
    )
    r.raise_for_status()
    return r.json()


def download_midi(midi_url: str, out_path: str) -> str:
    r = requests.get(f'{AUDIOCHORD_BASE}{midi_url}', timeout=60)
    r.raise_for_status()
    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    with open(out_path, 'wb') as f:
        f.write(r.content)
    return out_path


def parse_midi_notes(midi_path: str, clip_end: float | None = None) -> tuple[list, float]:
    """Extract (time_sec, dur_sec, midi) from MIDI file. Optionally clip to clip_end seconds."""
    mid = mido.MidiFile(midi_path)
    tempo = 500000  # default 120 BPM
    ticks_per_beat = mid.ticks_per_beat

    # Find first tempo meta event
    for msg in mid.tracks[0]:
        if msg.type == 'set_tempo':
            tempo = msg.tempo
            break

    notes = []
    duration = 0.0
    for track in mid.tracks:
        active = {}  # pitch -> start_time_sec
        cur_tick = 0
        cur_sec = 0.0
        for msg in track:
            cur_tick += msg.time
            cur_sec += mido.tick2second(msg.time, ticks_per_beat, tempo)
            if msg.type == 'set_tempo':
                tempo = msg.tempo
            elif msg.type == 'note_on' and msg.velocity > 0:
                active[msg.note] = cur_sec
            elif (msg.type == 'note_off') or (msg.type == 'note_on' and msg.velocity == 0):
                start = active.pop(msg.note, None)
                if start is not None:
                    dur = cur_sec - start
                    if dur > 0.02:
                        notes.append({'time_sec': start, 'dur_sec': dur, 'midi': msg.note})
            duration = max(duration, cur_sec)

    if clip_end is not None:
        notes = [n for n in notes if n['time_sec'] < clip_end]
        duration = min(duration, clip_end)

    notes.sort(key=lambda n: n['time_sec'])
    return notes, duration


BASS_OPEN = [28, 33, 38, 43]  # E1, A1, D2, G2 — 4-string standard

def midi_to_bass_fret(midi: int) -> tuple[int, int]:
    best = (0, 0, 100)
    for s, base in enumerate(BASS_OPEN):
        fret = midi - base
        if 0 <= fret <= 24 and fret < best[2]:
            best = (s, fret, fret)
    if best[2] == 100:
        fret = max(0, min(24, midi - BASS_OPEN[0]))
        return 0, fret
    return best[0], best[1]


def quantize_and_tab(raw_notes: list, bpm: float, time_sig: list = [4, 4]):
    beat_dur = 60.0 / bpm
    events = []
    seen_slots = set()

    for note in raw_notes:
        beat = note['time_sec'] / beat_dur
        q = round(beat * 4) / 4
        slot = round(q * 4)
        if slot in seen_slots:
            continue
        seen_slots.add(slot)

        dur_beats = max(0.25, round(note['dur_sec'] / beat_dur * 4) / 4)
        # Bass pitches often get transcribed an octave high by Basic Pitch; fold down if out of bass range
        midi = note['midi']
        while midi > 55:  # G3 is highest typical bass territory
            midi -= 12
        while midi < 28:
            midi += 12
        s, f = midi_to_bass_fret(midi)

        events.append({
            'time': round(q, 4),
            'duration': round(dur_beats, 4),
            'string': s,
            'fret': f,
            'midi': midi,
        })

    events.sort(key=lambda e: e['time'])
    bpMeasure = time_sig[0]
    total_beats = events[-1]['time'] + events[-1]['duration'] if events else 0
    total_measures = int(total_beats / bpMeasure) + 1
    return events, total_measures, total_beats


def save_json(events, args, total_measures, duration):
    data = {
        'id': args.track_id,
        'title': args.title,
        'bpm': args.bpm,
        'timeSignature': [4, 4],
        'totalNotes': len(events),
        'totalMeasures': total_measures,
        'durationSec': round(duration, 1),
        'events': events,
    }
    os.makedirs(os.path.dirname(args.output) or '.', exist_ok=True)
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'\nJSON: {args.output}')
    return data


def save_ts(data, path):
    lines = [
        f"// Auto-extracted (AudioChord v2): {data['title']}",
        f"// {data['totalNotes']} notes, {data['totalMeasures']} measures",
        'const ev: NoteEvent[] = [',
    ]
    for e in data['events']:
        lines.append(
            f"  {{ id: nid(), time: {e['time']}, duration: {e['duration']}, "
            f"string: {e['string']}, fret: {e['fret']}, midi: {e['midi']} }},"
        )
    lines.append(']')
    lines.append(f"const ms = measures({data['totalMeasures']})")
    lines.append('return {')
    lines.append(f"  id: '{data['id']}', title: '{data['title']} (Bass)', bpm: {data['bpm']},")
    lines.append(f"  timeSignature: [{data['timeSignature'][0]}, {data['timeSignature'][1]}],")
    lines.append(f"  tuning: STANDARD_BASS, events: ev, measures: ms,")
    lines.append('}')

    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'TS:   {path}')


def main():
    args = parse_args()
    print(f'=== Bass Tab Extractor v2 (AudioChord) ===')
    print(f'{args.title} @ {args.bpm} BPM | AudioChord: {AUDIOCHORD_BASE}')

    print(f'\n[1/4] Ingesting YouTube audio...')
    t0 = time.time()
    ingest = ingest_youtube(args.url)
    print(f"  file_id={ingest['file_id']}, cached={ingest.get('cached')}, "
          f"duration={ingest['duration_sec']:.1f}s ({time.time()-t0:.1f}s)")

    print(f'\n[2/4] Running pitch-to-MIDI on GPU (Demucs + Basic Pitch)...')
    t1 = time.time()
    pm = run_pitch_to_midi(ingest['file_id'])
    print(f"  {pm['note_count']} notes, elapsed={pm.get('elapsed_sec', 0):.1f}s "
          f"(wall={time.time()-t1:.1f}s)")

    print(f'\n[3/4] Downloading + parsing MIDI...')
    os.makedirs(args.work_dir, exist_ok=True)
    midi_path = os.path.join(args.work_dir, 'bass.mid')
    download_midi(pm['midi_url'], midi_path)
    raw_notes, duration = parse_midi_notes(midi_path, clip_end=args.end if args.end > 0 else None)
    print(f'  MIDI: {midi_path}, {len(raw_notes)} notes (after clip to {args.end}s)')

    print(f'\n[4/4] Quantizing & building tab...')
    events, total_measures, total_beats = quantize_and_tab(raw_notes, args.bpm)
    print(f'  {len(events)} events, {total_measures} measures, {total_beats:.1f} beats')

    data = save_json(events, args, total_measures, duration)

    if args.ts:
        ts_path = args.output.replace('.json', '.ts')
        save_ts(data, ts_path)

    print(f'\nDone! {len(events)} notes.')


if __name__ == '__main__':
    main()
