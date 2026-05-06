/**
 * Track generation: demo tracks + curriculum drill → Track converter.
 */

import type { Track, NoteEvent, MeasureMeta } from './types'
import type { Drill, DrillConfig } from '@/data/curriculum'
import type { NoteName, InstrumentConfig } from '@/types/music'
import { STANDARD_GUITAR, STANDARD_BASS } from '@/data/tunings'
import { CHROMATIC_SCALE } from '@/data/notes'
import { SCALES, getScaleNoteNames } from '@/data/scales'
import { buildScaleGuide } from '@/utils/scalePositions'

let _nextId = 0
function noteId(): string { return `n${_nextId++}` }

function makeMeasures(count: number, beatsPerMeasure: number): MeasureMeta[] {
  return Array.from({ length: count }, (_, i) => ({ index: i, startBeat: i * beatsPerMeasure }))
}

// ─── Demo Tracks ───────────────────────────────────────

export function createChromaticTrack(): Track {
  const tuning = STANDARD_GUITAR
  const events: NoteEvent[] = []
  for (let i = 0; i < 16; i++) {
    events.push({
      id: noteId(), time: i, duration: 1, string: 0,
      fret: i % 13, midi: tuning.tuning[0].midiNumber + (i % 13),
    })
  }
  return {
    id: 'demo-chromatic', title: 'Chromatic Exercise', bpm: 80,
    timeSignature: [4, 4], tuning, events, measures: makeMeasures(4, 4),
  }
}

export function createPentatonicTrack(): Track {
  const tuning = STANDARD_GUITAR
  const frets = [0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0, 3, 5, 7, 10, 12]
  const events: NoteEvent[] = frets.map((fret, i) => ({
    id: noteId(), time: i, duration: 1, string: 0, fret,
    midi: tuning.tuning[0].midiNumber + fret,
  }))
  return {
    id: 'demo-pentatonic', title: 'Am Pentatonic Scale', bpm: 90,
    timeSignature: [4, 4], tuning, events, measures: makeMeasures(4, 4),
    guide: buildScaleGuide('Pentatonic Minor', 'A', tuning),
  }
}

export function createOpenChordsTrack(): Track {
  const tuning = STANDARD_GUITAR
  // C - G - Am - F progression, strumming all strings
  const chords: { name: string; frets: (number | -1)[] }[] = [
    { name: 'C',  frets: [-1, 3, 2, 0, 1, 0] },
    { name: 'G',  frets: [3, 2, 0, 0, 0, 3] },
    { name: 'Am', frets: [-1, 0, 2, 2, 1, 0] },
    { name: 'F',  frets: [-1, -1, 3, 2, 1, 1] },
  ]
  const events: NoteEvent[] = []
  for (let measure = 0; measure < 4; measure++) {
    const chord = chords[measure % chords.length]
    // 4 strums per measure (one per beat)
    for (let beat = 0; beat < 4; beat++) {
      for (let s = 0; s < 6; s++) {
        const fret = chord.frets[s]
        if (fret === -1) continue
        events.push({
          id: noteId(),
          time: measure * 4 + beat,
          duration: 1,
          string: s,
          fret,
          midi: tuning.tuning[s].midiNumber + fret,
          technique: beat === 0 ? 'strum-down' : undefined,
          accent: beat === 0,
        })
      }
    }
  }
  return {
    id: 'demo-open-chords', title: 'C - G - Am - F (Open Chords)', bpm: 75,
    timeSignature: [4, 4], tuning, events, measures: makeMeasures(4, 4),
  }
}

export function createArpeggioTrack(): Track {
  const tuning = STANDARD_GUITAR
  // Am arpeggio pattern across strings
  const pattern = [
    // Am: x02210
    { s: 1, f: 0 }, { s: 2, f: 2 }, { s: 3, f: 2 }, { s: 4, f: 1 },
    { s: 3, f: 2 }, { s: 2, f: 2 }, { s: 1, f: 0 }, { s: 2, f: 2 },
    // C: x32010
    { s: 1, f: 3 }, { s: 2, f: 2 }, { s: 3, f: 0 }, { s: 4, f: 1 },
    { s: 3, f: 0 }, { s: 2, f: 2 }, { s: 1, f: 3 }, { s: 2, f: 2 },
    // F: xx3211 (simplified)
    { s: 2, f: 3 }, { s: 3, f: 2 }, { s: 4, f: 1 }, { s: 5, f: 1 },
    { s: 4, f: 1 }, { s: 3, f: 2 }, { s: 2, f: 3 }, { s: 3, f: 2 },
    // G: 320003
    { s: 0, f: 3 }, { s: 1, f: 2 }, { s: 2, f: 0 }, { s: 5, f: 3 },
    { s: 2, f: 0 }, { s: 1, f: 2 }, { s: 0, f: 3 }, { s: 1, f: 2 },
  ]
  const events: NoteEvent[] = pattern.map((p, i) => ({
    id: noteId(), time: i * 0.5, duration: 0.5, string: p.s, fret: p.f,
    midi: tuning.tuning[p.s].midiNumber + p.f,
  }))
  return {
    id: 'demo-arpeggio', title: 'Arpeggio: Am - C - F - G', bpm: 85,
    timeSignature: [4, 4], tuning, events, measures: makeMeasures(4, 4),
    guide: buildScaleGuide('Natural Minor (Aeolian)', 'A', tuning),
  }
}

export function createBassGrooveTrack(): Track {
  const tuning = STANDARD_BASS
  const pattern = [
    { s: 0, f: 0 }, { s: 0, f: 0 }, { s: 1, f: 2 }, { s: 0, f: 0 },
    { s: 0, f: 3 }, { s: 0, f: 5 }, { s: 1, f: 2 }, { s: 0, f: 0 },
  ]
  const events: NoteEvent[] = []
  for (let m = 0; m < 4; m++) {
    for (let i = 0; i < pattern.length; i++) {
      const p = pattern[i]
      events.push({
        id: noteId(), time: m * 4 + i * 0.5, duration: 0.5,
        string: p.s, fret: p.f, midi: tuning.tuning[p.s].midiNumber + p.f,
      })
    }
  }
  return {
    id: 'demo-bass-groove', title: 'Bass Groove in E', bpm: 100,
    timeSignature: [4, 4], tuning, events, measures: makeMeasures(4, 4),
  }
}

// ─── Curriculum Drill → Track Converter ────────────────

/**
 * Convert a curriculum drill into a playable Track.
 */
export function drillToTrack(drill: Drill, instrument: 'guitar' | 'bass'): Track {
  const tuning = instrument === 'bass' ? STANDARD_BASS : STANDARD_GUITAR
  const config = drill.config
  const bpm = config.targetBpm ?? 80

  switch (drill.type) {
    case 'scale-run':
      return buildScaleRunTrack(drill, config, tuning, bpm)
    case 'chord-change':
      return buildChordChangeTrack(drill, config, tuning, bpm)
    case 'arpeggio':
      return buildArpeggioFromConfig(drill, config, tuning, bpm)
    default:
      return buildGenericTrack(drill, tuning, bpm)
  }
}

function buildScaleRunTrack(drill: Drill, config: DrillConfig, tuning: InstrumentConfig, bpm: number): Track {
  const scaleName = config.scaleName ?? 'Pentatonic Minor'
  const rootNote = (config.rootNote ?? 'A') as NoteName
  const scale = SCALES.find(s => s.name === scaleName) ?? SCALES[10] // fallback to pentatonic minor
  const scaleNotes = getScaleNoteNames(rootNote, scale)

  // Generate ascending then descending on the lowest string
  const events: NoteEvent[] = []
  const startFret = config.position ?? 0
  const maxFret = startFret + 12

  // Find frets on the lowest string that are in the scale
  const frets: number[] = []
  for (let f = startFret; f <= maxFret; f++) {
    const midi = tuning.tuning[0].midiNumber + f
    const noteName = CHROMATIC_SCALE[midi % 12]
    if (scaleNotes.includes(noteName)) frets.push(f)
  }

  // Ascending
  frets.forEach((f, i) => {
    events.push({
      id: noteId(), time: i, duration: 1, string: 0, fret: f,
      midi: tuning.tuning[0].midiNumber + f,
    })
  })
  // Descending
  const desc = [...frets].reverse().slice(1)
  desc.forEach((f, i) => {
    events.push({
      id: noteId(), time: frets.length + i, duration: 1, string: 0, fret: f,
      midi: tuning.tuning[0].midiNumber + f,
    })
  })

  const totalBeats = frets.length + desc.length
  const totalMeasures = Math.ceil(totalBeats / 4)

  return {
    id: `drill-${drill.id}`, title: drill.title, bpm,
    timeSignature: [4, 4], tuning, events,
    measures: makeMeasures(totalMeasures, 4),
    drillId: drill.id,
    guide: buildScaleGuide(scaleName, rootNote, tuning),
  }
}

function buildChordChangeTrack(drill: Drill, config: DrillConfig, tuning: InstrumentConfig, bpm: number): Track {
  const chordNames = config.chords ?? ['C', 'G', 'Am', 'F']

  // Simple open chord voicings lookup
  const voicings: Record<string, (number | -1)[]> = {
    'C':  [-1, 3, 2, 0, 1, 0],
    'G':  [3, 2, 0, 0, 0, 3],
    'Am': [-1, 0, 2, 2, 1, 0],
    'F':  [-1, -1, 3, 2, 1, 1],
    'D':  [-1, -1, 0, 2, 3, 2],
    'Dm': [-1, -1, 0, 2, 3, 1],
    'E':  [0, 2, 2, 1, 0, 0],
    'Em': [0, 2, 2, 0, 0, 0],
    'A':  [-1, 0, 2, 2, 2, 0],
  }

  const events: NoteEvent[] = []
  const totalMeasures = chordNames.length * 2 // 2 measures per chord

  for (let ci = 0; ci < chordNames.length; ci++) {
    const name = chordNames[ci]
    const frets = voicings[name] ?? [0, 0, 0, 0, 0, 0]
    for (let beat = 0; beat < 8; beat++) { // 8 beats = 2 measures
      const time = ci * 8 + beat
      for (let s = 0; s < tuning.stringCount; s++) {
        const f = frets[s]
        if (f === undefined || f === -1) continue
        events.push({
          id: noteId(), time, duration: 1, string: s, fret: f,
          midi: tuning.tuning[s].midiNumber + f,
          technique: beat % 4 === 0 ? 'strum-down' : undefined,
          accent: beat % 4 === 0,
        })
      }
    }
  }

  return {
    id: `drill-${drill.id}`, title: drill.title, bpm,
    timeSignature: [4, 4], tuning, events,
    measures: makeMeasures(totalMeasures, 4),
    drillId: drill.id,
  }
}

function buildArpeggioFromConfig(drill: Drill, _config: DrillConfig, tuning: InstrumentConfig, bpm: number): Track {
  // Simple arpeggio on open strings
  const events: NoteEvent[] = []
  for (let m = 0; m < 4; m++) {
    for (let i = 0; i < 8; i++) {
      const s = i % tuning.stringCount
      events.push({
        id: noteId(), time: m * 4 + i * 0.5, duration: 0.5,
        string: s, fret: 0, midi: tuning.tuning[s].midiNumber,
      })
    }
  }
  return {
    id: `drill-${drill.id}`, title: drill.title, bpm,
    timeSignature: [4, 4], tuning, events,
    measures: makeMeasures(4, 4), drillId: drill.id,
  }
}

function buildGenericTrack(drill: Drill, tuning: InstrumentConfig, bpm: number): Track {
  // Fallback: simple 4-measure metronome click pattern (no notes, just timing)
  const events: NoteEvent[] = Array.from({ length: 16 }, (_, i) => ({
    id: noteId(), time: i, duration: 1, string: 0, fret: 0,
    midi: tuning.tuning[0].midiNumber,
  }))
  return {
    id: `drill-${drill.id}`, title: drill.title, bpm,
    timeSignature: [4, 4], tuning, events,
    measures: makeMeasures(4, 4), drillId: drill.id,
  }
}

// ─── CAGED Scale Position Tracks ──────────────────────

/**
 * Am Pentatonic CAGED positions — each position is a box pattern
 * played ascending 6th→1st string then descending, across all strings.
 *
 * Standard CAGED positions for Am Pentatonic:
 * Pos 1 (E shape): frets 0-3   (open position)
 * Pos 2 (D shape): frets 2-5
 * Pos 3 (C shape): frets 5-8
 * Pos 4 (A shape): frets 7-10
 * Pos 5 (G shape): frets 10-13 (wraps to 12)
 */

interface ScalePosition {
  name: string
  // frets per string, index 0=low E, ascending to high E
  // each string has 2-3 notes
  notes: { string: number; fret: number }[]
}

const AM_PENT_POSITIONS: ScalePosition[] = [
  {
    name: 'Pos 1 (E shape) — Frets 0-3',
    notes: [
      // 6th string (low E)
      { string: 0, fret: 0 }, { string: 0, fret: 3 },
      // 5th string (A)
      { string: 1, fret: 0 }, { string: 1, fret: 2 },
      // 4th string (D)
      { string: 2, fret: 0 }, { string: 2, fret: 2 },
      // 3rd string (G)
      { string: 3, fret: 0 }, { string: 3, fret: 2 },
      // 2nd string (B)
      { string: 4, fret: 0 }, { string: 4, fret: 3 },
      // 1st string (high E)
      { string: 5, fret: 0 }, { string: 5, fret: 3 },
    ],
  },
  {
    name: 'Pos 2 (D shape) — Frets 2-5',
    notes: [
      { string: 0, fret: 3 }, { string: 0, fret: 5 },
      { string: 1, fret: 2 }, { string: 1, fret: 5 },
      { string: 2, fret: 2 }, { string: 2, fret: 5 },
      { string: 3, fret: 2 }, { string: 3, fret: 5 },
      { string: 4, fret: 3 }, { string: 4, fret: 5 },
      { string: 5, fret: 3 }, { string: 5, fret: 5 },
    ],
  },
  {
    name: 'Pos 3 (C shape) — Frets 5-8',
    notes: [
      { string: 0, fret: 5 }, { string: 0, fret: 7 },
      { string: 1, fret: 5 }, { string: 1, fret: 7 },
      { string: 2, fret: 5 }, { string: 2, fret: 7 },
      { string: 3, fret: 5 }, { string: 3, fret: 7 },
      { string: 4, fret: 5 }, { string: 4, fret: 8 },
      { string: 5, fret: 5 }, { string: 5, fret: 8 },
    ],
  },
  {
    name: 'Pos 4 (A shape) — Frets 7-10',
    notes: [
      { string: 0, fret: 7 }, { string: 0, fret: 10 },
      { string: 1, fret: 7 }, { string: 1, fret: 10 },
      { string: 2, fret: 7 }, { string: 2, fret: 9 },
      { string: 3, fret: 7 }, { string: 3, fret: 9 },
      { string: 4, fret: 8 }, { string: 4, fret: 10 },
      { string: 5, fret: 8 }, { string: 5, fret: 10 },
    ],
  },
  {
    name: 'Pos 5 (G shape) — Frets 10-13',
    notes: [
      { string: 0, fret: 10 }, { string: 0, fret: 12 },
      { string: 1, fret: 10 }, { string: 1, fret: 12 },
      { string: 2, fret: 9 }, { string: 2, fret: 12 },
      { string: 3, fret: 9 }, { string: 3, fret: 12 },
      { string: 4, fret: 10 }, { string: 4, fret: 12 },
      { string: 5, fret: 10 }, { string: 5, fret: 12 },
    ],
  },
]

function createCAGEDTrack(pos: ScalePosition, index: number): Track {
  const tuning = STANDARD_GUITAR
  const events: NoteEvent[] = []
  // Ascending
  const ascending = [...pos.notes]
  // Descending (reverse, skip first/last to avoid double)
  const descending = [...pos.notes].reverse().slice(1, -1)
  const allNotes = [...ascending, ...descending]

  for (let i = 0; i < allNotes.length; i++) {
    const { string, fret } = allNotes[i]
    events.push({
      id: noteId(), time: i, duration: 1, string, fret,
      midi: tuning.tuning[string].midiNumber + fret,
    })
  }

  const totalBeats = allNotes.length
  return {
    id: `caged-pos${index + 1}`,
    title: `Am Pent ${pos.name}`,
    bpm: 80,
    timeSignature: [4, 4],
    tuning,
    events,
    measures: makeMeasures(Math.ceil(totalBeats / 4), 4),
    guide: buildScaleGuide('Pentatonic Minor', 'A', tuning),
  }
}

// Full CAGED run: all 5 positions connected ascending
function createCAGEDFullTrack(): Track {
  const tuning = STANDARD_GUITAR
  const events: NoteEvent[] = []
  let t = 0

  for (let p = 0; p < AM_PENT_POSITIONS.length; p++) {
    for (const { string, fret } of AM_PENT_POSITIONS[p].notes) {
      events.push({
        id: noteId(), time: t, duration: 0.5, string, fret,
        midi: tuning.tuning[string].midiNumber + fret,
      })
      t += 0.5
    }
  }
  // Descend all the way back
  for (let p = AM_PENT_POSITIONS.length - 1; p >= 0; p--) {
    const notes = [...AM_PENT_POSITIONS[p].notes].reverse()
    for (const { string, fret } of notes) {
      events.push({
        id: noteId(), time: t, duration: 0.5, string, fret,
        midi: tuning.tuning[string].midiNumber + fret,
      })
      t += 0.5
    }
  }

  const totalBeats = Math.ceil(t)
  const ms = makeMeasures(Math.ceil(totalBeats / 4), 4)
  ms[0].label = 'Pos 1→5'
  const mid = Math.floor(ms.length / 2)
  if (ms[mid]) ms[mid].label = '5→1'

  return {
    id: 'caged-full',
    title: 'Am Pent CAGED Full Run',
    bpm: 100,
    timeSignature: [4, 4],
    tuning,
    events,
    measures: ms,
    guide: buildScaleGuide('Pentatonic Minor', 'A', tuning),
  }
}

export const CAGED_TRACKS: Track[] = [
  ...AM_PENT_POSITIONS.map((pos, i) => createCAGEDTrack(pos, i)),
  createCAGEDFullTrack(),
]

// ─── Exports ───────────────────────────────────────────

export const DEMO_TRACKS: Track[] = [
  createChromaticTrack(),
  createPentatonicTrack(),
  createOpenChordsTrack(),
  createArpeggioTrack(),
  createBassGrooveTrack(),
]
