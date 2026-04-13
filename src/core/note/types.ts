import type { NoteName, InstrumentConfig } from '@/types/music'

// ─── Technique ─────────────────────────────────────────

export type Technique =
  | 'T'      // Thumb slap
  | 'P'      // Pop/pluck
  | 'H'      // Hammer-on
  | 'PO'     // Pull-off
  | 'S'      // Slide
  | 'x'      // Mute/ghost note
  | 'bend'
  | 'vibrato'
  | 'strum-down'
  | 'strum-up'

// ─── Note Event ────────────────────────────────────────

export interface NoteEvent {
  id: string
  /** Beat position from start (float, e.g. 0, 0.5, 1, 1.25) */
  time: number
  /** Duration in beats */
  duration: number
  /** 0-based string index (0 = lowest/thickest) */
  string: number
  /** Fret number (0 = open, -1 = mute) */
  fret: number
  /** Pre-computed MIDI note number */
  midi: number
  technique?: Technique
  accent?: boolean
}

// ─── Measure ───────────────────────────────────────────

export interface MeasureMeta {
  index: number
  /** Beat position where this measure starts */
  startBeat: number
  /** Optional label (e.g. "Verse", "Chorus") */
  label?: string
}

// ─── Guide Overlay ─────────────────────────────────────

export interface GuideOverlay {
  type: 'scale' | 'chord' | 'pattern'
  scaleName?: string
  rootNote?: NoteName
  positions?: { string: number; fret: number }[]
  label: string
}

// ─── Track ─────────────────────────────────────────────

export interface Track {
  id: string
  title: string
  bpm: number
  timeSignature: [number, number]
  tuning: InstrumentConfig
  events: NoteEvent[]
  measures: MeasureMeta[]
  /** Link to curriculum */
  lessonId?: string
  drillId?: string
  /** Scale/chord guide overlay for fretboard */
  guide?: GuideOverlay
}

// ─── Scoring ───────────────────────────────────────────

export type RhythmRating = 'perfect' | 'good' | 'ok' | 'miss'

export interface NoteResult {
  noteId: string
  rating: RhythmRating
  timingOffsetMs: number
  detectedMidi: number | null
}
