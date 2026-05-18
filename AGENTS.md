# 14_BocchiMaster

## Purpose
- Bass/guitar practice studio for routines, song practice, tab/fretboard playback, YouTube sync, and session review.
- User-facing UX should answer: "I want to practice bass now. Where do I start?"

## Current Status
- 2026-05-18: Added a Practice Home entry screen and rail item. The app now opens to a quick-start surface with direct actions for 15-minute bass warmup, routine, song practice, curriculum drills, session recording, learn, and vocal.
- 2026-05-18: Existing Songs, Routine, Curriculum, Session, Learn, Vocal, and Play views are kept intact. The change only adds a safer first decision layer and keeps default track quick-start wired to the first demo track.
- 2026-05-19: Practice Home now separates "15-minute routine" from "play default track" and presents the intended flow as routine → drill → song → log. Vite `base` was changed to `./` so the app works inside HertaAssistant `/proxy/bocchi/`; build passed and the proxied JS asset returns 200. Existing repo-wide lint debt remains, but `src/app/PracticeHome.tsx` lints cleanly.
- 2026-05-19: Added AudioChord handoff import. URLs with `#audiochord=` now open Songs view, validate the compact chord payload, create a chord-only bass practice track, and feed the imported chords into the existing ChordTimeline/Fretboard root-hint flow. Build passed.

## Next UX Targets
- Make the song list prioritize bass-ready songs and recent practice history.
- Add persisted recent AudioChord imports and manual BPM/key correction for imported practice sessions.
- Reduce inline style sprawl over time by extracting shared shell components after the UX stabilizes.
