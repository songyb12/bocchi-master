"""
Batch extract bass tabs for all BocchiMaster songs.
Usage:
  python scripts/extract_all_songs.py
  python scripts/extract_all_songs.py --song "KICK BACK"
  python scripts/extract_all_songs.py --list
"""
import argparse, json, os, subprocess, sys

SONGS = [
    {'title': '青春コンプレックス', 'artist': '結束バンド', 'yt': 'Yd8kUoB72xU', 'bpm': 175, 'id': 'song-seishun-bass', 'end': 90},
    {'title': 'ギターと孤独と蒼い惑星', 'artist': '結束バンド', 'yt': 'B7BxrAAXl94', 'bpm': 168, 'id': 'song-guitar-kodoku-bass', 'end': 90},
    {'title': '星座になれたら', 'artist': '結束バンド', 'yt': 'wSTbdqo-j74', 'bpm': 160, 'id': 'song-seiza-bass', 'end': 90},
    {'title': 'ただ君に晴れ', 'artist': 'ヨルシカ', 'yt': '-VKIqrvVOpo', 'bpm': 138, 'id': 'song-tadakimi-bass', 'end': 90},
    {'title': 'KICK BACK', 'artist': '米津玄師', 'yt': 'M2cckDmNLMI', 'bpm': 150, 'id': 'song-kickback-bass', 'end': 90},
    {'title': 'Lemon', 'artist': '米津玄師', 'yt': 'SX_ViT4Ra7k', 'bpm': 87, 'id': 'song-lemon-bass', 'end': 90},
    {'title': 'ソラニン', 'artist': 'AKFG', 'yt': 'xZD1B1TskXs', 'bpm': 162, 'id': 'song-solanin-bass', 'end': 90},
    {'title': 'リライト', 'artist': 'AKFG', 'yt': 'ZmeudwRMrsU', 'bpm': 167, 'id': 'song-rewrite-bass', 'end': 90},
    {'title': '天体観測', 'artist': 'BUMP OF CHICKEN', 'yt': 'j7CDb610Bg0', 'bpm': 165, 'id': 'song-tentai-bass', 'end': 90},
    {'title': '夜に駆ける', 'artist': 'YOASOBI', 'yt': 'x8VYWazR5mE', 'bpm': 130, 'id': 'song-yoruni-bass', 'end': 90},
    {'title': 'Pretender', 'artist': 'Official髭男dism', 'yt': 'TQ8WlA2GXbk', 'bpm': 92, 'id': 'song-pretender-bass', 'end': 90},
    {'title': '前前前世', 'artist': 'RADWIMPS', 'yt': 'PDSkFeMVNFs', 'bpm': 190, 'id': 'song-zenzenzense-bass', 'end': 90},
    {'title': 'unravel', 'artist': 'TK from 凛として時雨', 'yt': 'Fve_lHIPa-I', 'bpm': 135, 'id': 'song-unravel-bass', 'end': 90},
]

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extract_bass.py')
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted_tabs')

def run(song, force=False):
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f'{song["id"]}.json')
    wd = os.path.join(OUT_DIR, f'work_{song["id"]}')
    if os.path.exists(out) and not force:
        print(f'  Skip: {song["title"]} (exists)')
        return True
    url = f'https://www.youtube.com/watch?v={song["yt"]}'
    cmd = [sys.executable, SCRIPT,
           '--url', url, '--bpm', str(song['bpm']),
           '--title', song['title'], '--track-id', song['id'],
           '--end', str(song.get('end', 0)),
           '--output', out, '--work-dir', wd, '--ts']
    print(f'\n{"="*50}')
    print(f'  {song["title"]} — {song["artist"]} ({song["bpm"]} BPM)')
    print(f'{"="*50}')
    r = subprocess.run(cmd)
    return r.returncode == 0

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--song', help='Specific song title')
    p.add_argument('--list', action='store_true')
    p.add_argument('--force', action='store_true')
    a = p.parse_args()
    if a.list:
        for i, s in enumerate(SONGS):
            print(f'  {i+1:2d}. {s["title"]} — {s["artist"]} ({s["bpm"]} BPM)')
        return
    targets = SONGS
    if a.song:
        targets = [s for s in SONGS if a.song.lower() in s['title'].lower()]
        if not targets:
            print(f'No match for "{a.song}"')
            sys.exit(1)
    ok, fail = 0, 0
    for s in targets:
        if run(s, a.force): ok += 1
        else: fail += 1
    print(f'\n\nResults: {ok} success, {fail} failed out of {len(targets)}')

if __name__ == '__main__':
    main()
