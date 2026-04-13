/**
 * Compute fretboard positions for a given scale.
 * Used by GuideOverlay to highlight scale dots on the fretboard.
 */

import type { NoteName, InstrumentConfig } from '@/types/music'
import type { GuideOverlay } from '@/core/note/types'
import { SCALES, getScaleNoteNames } from '@/data/scales'
import { CHROMATIC_SCALE } from '@/data/notes'

export function computeScalePositions(
  scaleName: string,
  rootNote: NoteName,
  tuning: InstrumentConfig,
  maxFret = 15,
): { string: number; fret: number }[] {
  const scale = SCALES.find(s => s.name === scaleName)
  if (!scale) return []

  const scaleNotes = getScaleNoteNames(rootNote, scale)
  const positions: { string: number; fret: number }[] = []

  for (let stringIdx = 0; stringIdx < tuning.stringCount; stringIdx++) {
    const openMidi = tuning.tuning[stringIdx].midiNumber
    for (let fret = 0; fret <= maxFret; fret++) {
      const midi = openMidi + fret
      const noteName = CHROMATIC_SCALE[midi % 12]
      if (scaleNotes.includes(noteName)) {
        positions.push({ string: stringIdx, fret })
      }
    }
  }

  return positions
}

/**
 * Build a complete GuideOverlay from scale info + tuning.
 */
export function buildScaleGuide(
  scaleName: string,
  rootNote: NoteName,
  tuning: InstrumentConfig,
): GuideOverlay {
  return {
    type: 'scale',
    scaleName,
    rootNote,
    positions: computeScalePositions(scaleName, rootNote, tuning),
    label: `${rootNote} ${scaleName}`,
  }
}
