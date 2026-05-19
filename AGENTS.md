# 14_BocchiMaster

## Purpose
- Bass/guitar practice studio for routines, song practice, tab/fretboard playback, YouTube sync, and session review.
- User-facing UX should answer: "I want to practice bass now. Where do I start?"

## Current Status
- 2026-05-18: Added a Practice Home entry screen and rail item. The app now opens to a quick-start surface with direct actions for 15-minute bass warmup, routine, song practice, curriculum drills, session recording, learn, and vocal.
- 2026-05-18: Existing Songs, Routine, Curriculum, Session, Learn, Vocal, and Play views are kept intact. The change only adds a safer first decision layer and keeps default track quick-start wired to the first demo track.
- 2026-05-19: Practice Home now separates "15-minute routine" from "play default track" and presents the intended flow as routine → drill → song → log. Vite `base` was changed to `./` so the app works inside HertaAssistant `/proxy/bocchi/`; build passed and the proxied JS asset returns 200. Existing repo-wide lint debt remains, but `src/app/PracticeHome.tsx` lints cleanly.
- 2026-05-19: Added AudioChord handoff import. URLs with `#audiochord=` now open Songs view, validate the compact chord payload, create a chord-only bass practice track, and feed the imported chords into the existing ChordTimeline/Fretboard root-hint flow. Build passed.
- 2026-05-20: Added persistent recent AudioChord imports, imported-session BPM/key correction, catalog BPM/key shortcut for known songs such as `yt_5CSNv9MNEC4`, and mobile stacking for the Songs workspace. Build passed.
- 2026-05-19: Bass-learning UX pass deployed. Quick Start now opens the bass groove instead of the first guitar-style demo, curriculum drills default to bass tuning, Practice Home includes a root/rhythm/song learning map and AudioChord shortcut, Songs view surfaces Recent Practice and Bass-ready Tabs first, and same-day session re-saves no longer double-count total minutes. `npm.cmd run build` passed and port 3001 serves the new bundle.

## Next UX Targets
- Let imported AudioChord sessions graduate into saved practice logs after a real practice run.
- Add a beginner diagnostic that recommends root-only, fifth/octave, or full-tab practice based on the user's last few sessions.
- Reduce inline style sprawl over time by extracting shared shell components after the UX stabilizes.
