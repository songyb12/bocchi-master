/**
 * Convert v1 DrillConfig / DrillTabs into v2 Track format.
 * Also provides demo tracks for testing.
 */

import type { Track, NoteEvent, MeasureMeta } from './types'
import { STANDARD_GUITAR, STANDARD_BASS } from '@/data/tunings'
import { buildScaleGuide } from '@/utils/scalePositions'

let _nextId = 0
function noteId(): string { return `n${_nextId++}` }

/**
 * Generate a simple chromatic scale track for testing.
 */
export function createDemoTrack(): Track {
  const events: NoteEvent[] = []
  const tuning = STANDARD_GUITAR
  const beatsPerMeasure = 4
  const totalMeasures = 4

  // Simple ascending pattern on the low E string, 1 note per beat
  for (let i = 0; i < totalMeasures * beatsPerMeasure; i++) {
    const fret = i % 13 // 0-12 chromatic
    events.push({
      id: noteId(),
      time: i,
      duration: 1,
      string: 0, // low E
      fret,
      midi: tuning.tuning[0].midiNumber + fret,
    })
  }

  const measures: MeasureMeta[] = Array.from({ length: totalMeasures }, (_, i) => ({
    index: i,
    startBeat: i * beatsPerMeasure,
  }))

  return {
    id: 'demo-chromatic',
    title: 'Chromatic Exercise',
    bpm: 80,
    timeSignature: [4, 4],
    tuning,
    events,
    measures,
  }
}

/**
 * Generate a pentatonic scale track.
 */
export function createPentatonicTrack(): Track {
  const tuning = STANDARD_GUITAR
  const pentatonic = [0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0, 3, 5, 7, 10, 12]
  const events: NoteEvent[] = pentatonic.map((fret, i) => ({
    id: noteId(),
    time: i,
    duration: 1,
    string: 0,
    fret,
    midi: tuning.tuning[0].midiNumber + fret,
  }))

  const measures: MeasureMeta[] = Array.from({ length: 4 }, (_, i) => ({
    index: i,
    startBeat: i * 4,
  }))

  return {
    id: 'demo-pentatonic',
    title: 'Am Pentatonic Scale',
    bpm: 90,
    timeSignature: [4, 4],
    tuning,
    events,
    measures,
    guide: buildScaleGuide('Pentatonic Minor', 'A', tuning),
  }
}

/**
 * Generate a simple bass groove track.
 */
export function createBassGrooveTrack(): Track {
  const tuning = STANDARD_BASS
  // Simple root-fifth pattern in E
  const pattern = [
    { string: 0, fret: 0 },  // E
    { string: 0, fret: 0 },  // E
    { string: 1, fret: 2 },  // B (fifth)
    { string: 0, fret: 0 },  // E
    { string: 0, fret: 3 },  // G
    { string: 0, fret: 5 },  // A
    { string: 1, fret: 2 },  // B
    { string: 0, fret: 0 },  // E
  ]

  const events: NoteEvent[] = []
  for (let measure = 0; measure < 4; measure++) {
    for (let i = 0; i < pattern.length; i++) {
      const p = pattern[i]
      events.push({
        id: noteId(),
        time: measure * 4 + i * 0.5,
        duration: 0.5,
        string: p.string,
        fret: p.fret,
        midi: tuning.tuning[p.string].midiNumber + p.fret,
      })
    }
  }

  const measures: MeasureMeta[] = Array.from({ length: 4 }, (_, i) => ({
    index: i,
    startBeat: i * 4,
  }))

  return {
    id: 'demo-bass-groove',
    title: 'Bass Groove in E',
    bpm: 100,
    timeSignature: [4, 4],
    tuning,
    events,
    measures,
  }
}

export const DEMO_TRACKS: Track[] = [
  createDemoTrack(),
  createPentatonicTrack(),
  createBassGrooveTrack(),
]
