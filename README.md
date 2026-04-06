# Bocchi-master

Guitar & Bass practice studio — web app for chord progressions, fretboard visualization, metronome, and more.

## Quick Start

```bash
npm install
npm run dev    # http://localhost:3001
```

### AI Chord Search (optional)

```bash
pip install -r server/requirements.txt
uvicorn server.main:app --host 0.0.0.0 --port 8080
```

Requires [Claude Code](https://claude.ai/claude-code) CLI installed.

## Features

- **Fretboard** — SVG rendering, multi-overlay (scale/voicing/chord-tone), auto-zoom
- **Metronome** — Web Audio, accent patterns, subdivision, swing, pendulum
- **Song Chords** — 15 built-in songs + AI-powered search
- **Live Mode** — Metronome-synced auto chord progression
- **Theory** — Circle of Fifths, scale library, chord voicing DB
- **Practice** — Fretboard quiz, chord transitions, rhythm scoring
- **MIDI** — WebMIDI input support
- **Beginner/Advanced Mode** — Simplified UI for beginners

## Tech Stack

React 19 · TypeScript 5.9 · Tailwind 4 · Vite 7 · Web Audio API
