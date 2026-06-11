# Bocchi-master

Guitar & Bass practice studio — YouTube-synced chord timelines, tab playback, fretboard visualization, and a bass-focused learning curriculum.

## Quick Start

```bash
npm install
npm run dev    # http://localhost:3001
```

Chord analysis and stem separation are delegated to the AudioChord service (15_AudioChord, `:8220`); the Vite dev server proxies `/api/v1/*` to it. See `.env.example` for `VITE_AC_API_KEY` / `VITE_AC_UI_URL`.

### Optional backend (currently not wired to the frontend)

`server/` contains a standalone FastAPI app: AI chord search (Claude CLI) and a Guitar Pro tab parser (`POST /api/parse/tab`, .gp3–.gpx). No frontend code calls it today.

```bash
pip install -r server/requirements.txt
uvicorn main:app --app-dir server --host 0.0.0.0 --port 8081
```

AI chord search requires the [Claude Code](https://claude.ai/claude-code) CLI installed.

## Features

- **Songs** — YouTube embed sync + AudioChord chord timeline (measure-quantized), stem mixer, per-song sync offset, Stage Mode (TV fullscreen)
- **Tab playback** — B mode (fixed tab, moving cursor) / A mode (scrolling notes), measure-click looping, BPM ½×/1×/2×
- **Fretboard** — SVG rendering, scale guides, bass chord-root hints
- **Mic scoring** — pitch detection → hit/miss feedback, combo, session results
- **Curriculum** — guitar/bass levels with lessons & drills (Korean theory content)
- **Session** — evidence-based 30-min practice blocks, streak tracking
- **Learn / Vocal / Routine** — bass tone workshop, vocal technique guide, daily routine templates

## Tech Stack

React 19 · TypeScript 5.9 · Tailwind 4 · Vite 7 · Web Audio API
