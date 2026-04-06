# Bocchi-master — Guitar & Bass Practice Studio

## Overview
기타/베이스 연습 웹앱. React SPA + 옵션 Python 백엔드 (AI 코드 검색).

## Tech Stack
- **Frontend**: React 19 + TypeScript 5.9 + Tailwind 4 + Vite 7
- **Backend** (optional): FastAPI + Claude CLI (AI chord search)
- **Audio**: Web Audio API + WebMIDI API
- **Storage**: localStorage (no database)

## Quick Start
```bash
# Frontend
npm install
npm run dev          # -> http://localhost:3001

# Backend (optional, for AI chord search)
pip install -r server/requirements.txt
uvicorn server.main:app --host 0.0.0.0 --port 8080
```

## Project Structure
```
src/
  components/       # UI components by feature
    song/           # Song chord search, chord sheet, live mode
    metronome/      # Metronome panel, BPM slider, tap tempo
    fretboard/      # SVG fretboard rendering
    scale/          # Scale selector, scale patterns
    trainer/        # Quiz, drills, interval trainer
    curriculum/     # Guided learning system
    ...
  hooks/            # Custom React hooks (useMetronome, useMidi, etc.)
  data/             # Seed data, stores
  types/            # TypeScript type definitions
  utils/            # Utilities (transpose, audio, storage)
  constants/        # Notes, tunings
server/
  main.py           # Standalone FastAPI chord search server
```

## Key Features
- Fretboard SVG with multi-overlay (scale/voicing/pattern/chord-tone)
- Web Audio metronome (accent, subdivision, swing, pendulum)
- Song chord search (15 seed songs + AI search via Claude CLI)
- Live mode (metronome-synced auto chord progression)
- Beginner/Advanced UI mode
- MIDI input support
- Curriculum system with gamification

## Environment Variables
- `VITE_API_PORT` — Backend API port (default: 8080)
- `CLAUDE_CLI_PATH` — Override Claude CLI binary path (auto-detected)

## Origin
Extracted from UFS Master Core Ecosystem (`D:\Claude\01_UFS\frontend\bocchi-master\`).
71 commits of history available in the original repo.
