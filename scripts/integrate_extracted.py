"""
Integrate extracted bass tabs into SongTracks.ts
Replaces hand-written bass functions with auto-extracted data.
"""
import json
import os
import re

EXTRACTED_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted_tabs')
SONG_TRACKS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'core', 'note', 'SongTracks.ts')

# Map track IDs to function names in SongTracks.ts
ID_TO_FUNC = {
    'song-solanin-bass': 'solaninBass',
    'song-tadakimi-bass': 'tadaKimiBass',
    'song-seishun-bass': 'seishunBass',
    'song-kickback-bass': 'kickbackBass',
    'song-rewrite-bass': 'rewriteBass',
    'song-tentai-bass': 'tentaiBass',
    'song-yoruni-bass': 'yoruNiBass',
    'song-pretender-bass': 'pretenderBass',
    'song-lemon-bass': 'lemonBass',
    'song-zenzenzense-bass': 'zenzenzenseBass',
    'song-unravel-bass': 'unravelBass',
    'song-guitar-kodoku-bass': 'guitarKodokuBass',
    'song-seiza-bass': 'seizaBass',
}


def load_extracted(track_id: str) -> dict | None:
    path = os.path.join(EXTRACTED_DIR, f'{track_id}.json')
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def gen_bass_function(func_name: str, tab: dict) -> str:
    """Generate a TypeScript bass function from extracted tab data."""
    lines = [
        f'function {func_name}(): Track {{',
        f'  // Auto-extracted from audio: {tab["title"]}',
        f'  // {tab["totalNotes"]} notes, {tab["totalMeasures"]} measures, {tab["durationSec"]}s',
        '  const ev: NoteEvent[] = [',
    ]
    for e in tab['events']:
        lines.append(
            f'    n({e["time"]}, {e["duration"]}, {e["string"]}, {e["fret"]}, {e["midi"]}),'
        )
    lines.append('  ]')
    lines.append(f'  return {{')
    lines.append(f"    id: '{tab.get('id', func_name)}', title: '{tab['title']} (Bass)', bpm: {tab['bpm']},")
    lines.append(f'    timeSignature: [{tab["timeSignature"][0]}, {tab["timeSignature"][1]}],')
    lines.append(f'    tuning: STANDARD_BASS, events: ev, measures: measures({tab["totalMeasures"]}),')
    lines.append('  }')
    lines.append('}')
    return '\n'.join(lines)


def replace_function(source: str, func_name: str, new_body: str) -> str:
    """Replace a function in the source code."""
    # Find function start
    pattern = rf'function {func_name}\(\): Track \{{'
    match = re.search(pattern, source)
    if not match:
        print(f'  WARNING: function {func_name} not found')
        return source

    start = match.start()

    # Find matching closing brace by counting
    depth = 0
    i = match.end() - 1  # start at the opening {
    while i < len(source):
        if source[i] == '{':
            depth += 1
        elif source[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
        i += 1
    else:
        print(f'  WARNING: could not find end of {func_name}')
        return source

    return source[:start] + new_body + source[end:]


def main():
    with open(SONG_TRACKS, 'r', encoding='utf-8') as f:
        source = f.read()

    replaced = 0
    for track_id, func_name in ID_TO_FUNC.items():
        tab = load_extracted(track_id)
        if not tab:
            print(f'  Skip: {track_id} (no extracted data)')
            continue

        # Add the track ID to tab data for the function
        tab['id'] = track_id
        new_func = gen_bass_function(func_name, tab)
        old_len = len(source)
        source = replace_function(source, func_name, new_func)
        if len(source) != old_len:
            print(f'  Replaced: {func_name} ({tab["totalNotes"]} notes)')
            replaced += 1
        else:
            print(f'  FAILED: {func_name}')

    with open(SONG_TRACKS, 'w', encoding='utf-8') as f:
        f.write(source)

    print(f'\nDone: {replaced}/{len(ID_TO_FUNC)} bass functions replaced')


if __name__ == '__main__':
    main()
