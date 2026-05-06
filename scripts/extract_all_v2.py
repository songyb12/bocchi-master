"""Batch bass extraction v2 — Demucs AI source separation."""
import subprocess, sys, os

SONGS = [
    {'title': '青春コンプレックス', 'artist': '結束バンド', 'yt': 'Yd8kUoB72xU', 'bpm': 175, 'id': 'song-seishun-bass'},
    {'title': 'ギターと孤独と蒼い惑星', 'artist': '結束バンド', 'yt': 'B7BxrAAXl94', 'bpm': 168, 'id': 'song-guitar-kodoku-bass'},
    {'title': '星座になれたら', 'artist': '結束バンド', 'yt': 'wSTbdqo-j74', 'bpm': 160, 'id': 'song-seiza-bass'},
    {'title': 'ただ君に晴れ', 'artist': 'ヨルシカ', 'yt': '-VKIqrvVOpo', 'bpm': 138, 'id': 'song-tadakimi-bass'},
    {'title': 'KICK BACK', 'artist': '米津玄師', 'yt': 'M2cckDmNLMI', 'bpm': 150, 'id': 'song-kickback-bass'},
    {'title': 'Lemon', 'artist': '米津玄師', 'yt': 'SX_ViT4Ra7k', 'bpm': 87, 'id': 'song-lemon-bass'},
    {'title': 'ソラニン', 'artist': 'AKFG', 'yt': 'xZD1B1TskXs', 'bpm': 162, 'id': 'song-solanin-bass'},
    {'title': 'リライト', 'artist': 'AKFG', 'yt': 'ZmeudwRMrsU', 'bpm': 167, 'id': 'song-rewrite-bass'},
    {'title': '天体観測', 'artist': 'BUMP OF CHICKEN', 'yt': 'j7CDb610Bg0', 'bpm': 165, 'id': 'song-tentai-bass'},
    {'title': '夜に駆ける', 'artist': 'YOASOBI', 'yt': 'by4SYYWlhEs', 'bpm': 130, 'id': 'song-yoruni-bass'},
    {'title': 'Pretender', 'artist': 'Official髭男dism', 'yt': 'TQ8WlA2GXbk', 'bpm': 92, 'id': 'song-pretender-bass'},
    {'title': '前前前世', 'artist': 'RADWIMPS', 'yt': 'PDSkFeMVNFs', 'bpm': 190, 'id': 'song-zenzenzense-bass'},
    {'title': 'unravel', 'artist': 'TK from 凛として時雨', 'yt': 'Fve_lHIPa-I', 'bpm': 135, 'id': 'song-unravel-bass'},
]

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted_tabs_v2')

def run(song, force=False):
    out = os.path.join(OUT_DIR, f'{song["id"]}.json')
    work = os.path.join(OUT_DIR, f'work_{song["id"].replace("song-", "")}')

    if os.path.exists(out) and not force:
        print(f'  Skip: {song["title"]} (exists)')
        return True

    print(f'\n{"="*50}')
    print(f'  {song["title"]} — {song["artist"]} ({song["bpm"]} BPM)')
    print(f'{"="*50}')

    cmd = [
        sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extract_bass_v2.py'),
        '--url', f'https://www.youtube.com/watch?v={song["yt"]}',
        '--bpm', str(song['bpm']),
        '--title', song['title'],
        '--track-id', song['id'],
        '--end', '90',
        '--output', out,
        '--work-dir', work,
        '--ts',
    ]

    env = os.environ.copy()
    env['PYTHONIOENCODING'] = 'utf-8'
    r = subprocess.run(cmd, env=env, timeout=600)
    return r.returncode == 0


def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--force', action='store_true')
    p.add_argument('--song', help='Filter by title substring')
    a = p.parse_args()

    targets = SONGS
    if a.song:
        targets = [s for s in SONGS if a.song.lower() in s['title'].lower()]

    ok = 0
    fail = 0
    for s in targets:
        try:
            if run(s, a.force):
                ok += 1
            else:
                fail += 1
        except Exception as e:
            print(f'  ERROR: {e}')
            fail += 1

    print(f'\nResults: {ok} success, {fail} failed out of {len(targets)}')


if __name__ == '__main__':
    main()
