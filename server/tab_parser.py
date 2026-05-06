"""Guitar Pro file parser — Converts .gp files to BocchiMaster NoteEvent format.

Supports Guitar Pro 3-8 via PyGuitarPro.
Outputs JSON compatible with BocchiMaster's Track/NoteEvent types.
"""

import uuid
from pathlib import Path

import guitarpro


# MIDI note numbers for standard tunings
# PyGuitarPro stores string tuning as MIDI values
def _get_tempo(tempo) -> int:
    """Extract tempo value — handles both int and Tempo object."""
    if isinstance(tempo, int):
        return tempo
    return getattr(tempo, 'value', 120)


TECHNIQUE_MAP = {
    # GP SlapEffect -> BocchiMaster Technique
    "open": None,
    "slapping": "T",
    "popping": "P",
    "tapping": "T",
}

SLIDE_TYPES_TO_TECHNIQUE = {
    guitarpro.SlideType.intoFromAbove,
    guitarpro.SlideType.intoFromBelow,
    guitarpro.SlideType.outDownwards,
    guitarpro.SlideType.outUpwards,
    guitarpro.SlideType.shiftSlideTo,
    guitarpro.SlideType.legatoSlideTo,
}


def _duration_to_beats(duration: guitarpro.Duration) -> float:
    """Convert GP Duration to beat count (quarter note = 1.0)."""
    # GP Duration.value: 1=whole, 2=half, 4=quarter, 8=eighth, etc.
    beats = 4.0 / duration.value
    # Dotted note
    if duration.isDotted:
        beats *= 1.5
    # Tuplet
    tuplet = duration.tuplet
    if tuplet.enters != 0 and tuplet.times != 0:
        beats *= tuplet.times / tuplet.enters
    return beats


def _get_note_technique(note: guitarpro.Note, beat: guitarpro.Beat) -> str | None:
    """Extract technique from GP note/beat effects."""
    effect = note.effect

    # Hammer-on / Pull-off
    if effect.hammer:
        return "H"  # Could be H or PO, GP doesn't distinguish

    # Slide
    if effect.slides:
        return "S"

    # Bend
    if effect.bend:
        return "bend"

    # Vibrato
    if note.effect.vibrato or beat.effect.vibrato:
        return "vibrato"

    # Ghost note / muted
    if note.type == guitarpro.NoteType.tie:
        return None
    if note.effect.ghostNote:
        return "x"

    # Slap/Pop from beat effect
    slap = beat.effect.slapEffect
    if slap:
        name = slap.name if hasattr(slap, 'name') else str(slap)
        if 'slapping' in name.lower() or 'tapping' in name.lower():
            return "T"
        if 'popping' in name.lower():
            return "P"

    # Strum direction
    stroke = beat.effect.stroke
    if stroke and stroke.direction:
        if stroke.direction == guitarpro.BeatStrokeDirection.down:
            return "strum-down"
        elif stroke.direction == guitarpro.BeatStrokeDirection.up:
            return "strum-up"

    return None


def _string_midi(tuning_values: list[int], string_idx: int, fret: int) -> int:
    """Calculate MIDI note number from string tuning and fret."""
    return tuning_values[string_idx] + fret


def parse_gp_file(
    file_path: str | Path,
    target_track: str | int | None = None,
) -> dict:
    """Parse a Guitar Pro file and return BocchiMaster-compatible JSON.

    Args:
        file_path: Path to .gp/.gp3/.gp4/.gp5/.gpx/.gp file.
        target_track: Track name (str) or 0-based index (int).
                      If None, returns first non-percussion track.

    Returns:
        Dict matching BocchiMaster Track type with NoteEvent array.
    """
    song = guitarpro.parse(str(file_path))

    # Select track
    track = _select_track(song, target_track)
    if track is None:
        raise ValueError(f"Track not found: {target_track}")

    # Extract tuning info
    string_count = len(track.strings)
    # GP strings are ordered highest to lowest, BocchiMaster uses lowest to highest (0=lowest)
    # Reverse so index 0 = lowest/thickest
    tuning_values = [s.value for s in reversed(track.strings)]
    tuning_notes = [_midi_to_note(v) for v in tuning_values]

    # Build metadata
    metadata = {
        "title": song.title or Path(file_path).stem,
        "artist": song.artist or None,
        "album": song.album or None,
        "allTracks": [
            {"index": i, "name": t.name, "channel": t.channel.channel, "stringCount": len(t.strings)}
            for i, t in enumerate(song.tracks)
        ],
        "selectedTrack": track.name,
    }

    # Process measures → NoteEvents
    events = []
    measures_meta = []
    current_beat_pos = 0.0  # absolute beat position
    current_bpm = _get_tempo(song.tempo)

    for measure_idx, measure in enumerate(track.measures):
        header = measure.header
        time_sig = (header.timeSignature.numerator, header.timeSignature.denominator.value)

        measure_start_beat = current_beat_pos
        measures_meta.append({
            "index": measure_idx,
            "startBeat": round(measure_start_beat, 4),
            "bpm": current_bpm,
            "timeSignature": list(time_sig),
        })

        # Process voices (usually voice 0 is the main one)
        for voice in measure.voices:
            beat_pos_in_measure = 0.0

            for beat in voice.beats:
                beat_duration = _duration_to_beats(beat.duration)

                # Check for tempo change via MixTableChange
                mtc = beat.effect.mixTableChange
                if mtc and mtc.tempo:
                    current_bpm = _get_tempo(mtc.tempo)
                    # Update current measure's BPM
                    measures_meta[-1]["bpm"] = current_bpm

                if beat.status == guitarpro.BeatStatus.rest:
                    beat_pos_in_measure += beat_duration
                    continue

                for note in beat.notes:
                    # Skip rest notes, but allow 'normal' and 'tie'
                    if note.type == guitarpro.NoteType.rest and not note.value:
                        continue

                    # GP string numbers are 1-based, highest=1
                    # Convert to 0-based lowest=0
                    gp_string = note.string  # 1-based, 1=highest
                    bm_string = string_count - gp_string  # 0-based, 0=lowest

                    fret = note.value
                    midi = _string_midi(tuning_values, bm_string, fret)
                    technique = _get_note_technique(note, beat)

                    event = {
                        "id": uuid.uuid4().hex[:8],
                        "time": round(current_beat_pos + beat_pos_in_measure, 4),
                        "duration": round(beat_duration, 4),
                        "string": bm_string,
                        "fret": fret,
                        "midi": midi,
                    }
                    if technique:
                        event["technique"] = technique
                    if note.effect.accentuatedNote or note.effect.heavyAccentuatedNote:
                        event["accent"] = True

                    events.append(event)

                beat_pos_in_measure += beat_duration

        # Advance by measure duration in beats
        measure_beats = time_sig[0] * (4.0 / time_sig[1])
        current_beat_pos += measure_beats

    # Build final Track object
    initial_bpm = _get_tempo(song.tempo)
    first_ts = song.measureHeaders[0].timeSignature if song.measureHeaders else None
    time_signature = [
        first_ts.numerator if first_ts else 4,
        first_ts.denominator.value if first_ts else 4,
    ]

    return {
        "id": f"gp-{uuid.uuid4().hex[:12]}",
        "title": metadata["title"],
        "artist": metadata.get("artist"),
        "bpm": initial_bpm,
        "timeSignature": time_signature,
        "tuning": {
            "type": "bass" if string_count <= 5 else "guitar",
            "name": _describe_tuning(tuning_values, string_count),
            "stringCount": string_count,
            "fretCount": track.fretCount or 24,
            "tuning": tuning_notes,
        },
        "events": events,
        "measures": measures_meta,
        "metadata": metadata,
    }


def _select_track(song: guitarpro.Song, target: str | int | None) -> guitarpro.Track | None:
    """Select track by name, index, or auto-detect first non-percussion."""
    if target is None:
        for t in song.tracks:
            if not t.isPercussionTrack:
                return t
        return song.tracks[0] if song.tracks else None

    if isinstance(target, int):
        if 0 <= target < len(song.tracks):
            return song.tracks[target]
        return None

    # String match (case-insensitive, partial)
    target_lower = target.lower()
    for t in song.tracks:
        if target_lower in t.name.lower():
            return t
    return None


def _midi_to_note(midi: int) -> dict:
    """Convert MIDI number to {name, octave, midiNumber}."""
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    return {
        "name": names[midi % 12],
        "octave": (midi // 12) - 1,
        "midiNumber": midi,
    }


def _describe_tuning(tuning_values: list[int], string_count: int) -> str:
    """Generate human-readable tuning description."""
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    note_names = [names[v % 12] for v in tuning_values]

    # Standard tuning detection
    standard_guitar = [40, 45, 50, 55, 59, 64]  # E2-E4
    standard_bass_4 = [28, 33, 38, 43]  # E1-G2
    standard_bass_5 = [23, 28, 33, 38, 43]  # B0-G2

    if tuning_values == standard_guitar[:string_count]:
        return "Standard Guitar"
    if tuning_values == standard_bass_4:
        return "Standard Bass (4-string)"
    if tuning_values == standard_bass_5:
        return "Standard Bass (5-string, Low-B)"

    return f"Custom ({'-'.join(note_names)})"
