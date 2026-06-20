import { describe, it, expect } from 'vitest'
import {
  measureBoundariesFromBpm,
  quantizeToMeasures,
  trimSilenceCells,
  type ChordSegment,
} from './chordQuantize'

describe('measureBoundariesFromBpm', () => {
  it('builds one boundary per measure plus the closing edge', () => {
    expect(measureBoundariesFromBpm(120, 4, 8)).toEqual([0, 2, 4, 6, 8])
  })

  it('returns a safe zero boundary for invalid tempo or duration', () => {
    expect(measureBoundariesFromBpm(0, 4, 8)).toEqual([0])
    expect(measureBoundariesFromBpm(120, 0, 8)).toEqual([0])
    expect(measureBoundariesFromBpm(120, 4, 0)).toEqual([0])
  })
})

describe('quantizeToMeasures', () => {
  it('splits a chord crossing a measure boundary into both cells', () => {
    const cells = quantizeToMeasures(
      [{ start: 1, end: 3, label: 'C', confidence: 0.8 }],
      [0, 2, 4],
    )

    expect(cells).toHaveLength(2)
    expect(cells[0].label).toBe('C')
    expect(cells[0].contributions[0].durationInMeasure).toBe(1)
    expect(cells[1].label).toBe('C')
    expect(cells[1].contributions[0].durationInMeasure).toBe(1)
  })

  it('chooses non-silence over silence even when silence has longer coverage', () => {
    const cells = quantizeToMeasures(
      [
        { start: 0, end: 1.5, label: 'N', confidence: 0.2 },
        { start: 1.5, end: 2, label: 'Am', confidence: 0.9 },
      ],
      [0, 2],
    )

    expect(cells[0].label).toBe('Am')
    expect(cells[0].contributions.map((c) => c.label)).toEqual(['N', 'Am'])
  })

  it('keeps boundary-touching segments out of adjacent measures', () => {
    const cells = quantizeToMeasures(
      [
        { start: 0, end: 2, label: 'C', confidence: 0.8 },
        { start: 2, end: 4, label: 'G', confidence: 0.7 },
      ],
      [0, 2, 4],
    )

    expect(cells[0].label).toBe('C')
    expect(cells[0].contributions).toHaveLength(1)
    expect(cells[1].label).toBe('G')
    expect(cells[1].contributions).toHaveLength(1)
  })

  it('uses stable insertion order for equal-duration ambiguous chords', () => {
    const chords: ChordSegment[] = [
      { start: 0, end: 1, label: 'Dm', confidence: 0.7 },
      { start: 1, end: 2, label: 'G', confidence: 0.8 },
    ]

    expect(quantizeToMeasures(chords, [0, 2])[0].label).toBe('Dm')
  })
})

describe('trimSilenceCells', () => {
  it('trims leading and trailing silence while preserving interior silence', () => {
    const cells = quantizeToMeasures(
      [
        { start: 0, end: 2, label: 'N', confidence: 0 },
        { start: 2, end: 4, label: 'C', confidence: 0.9 },
        { start: 4, end: 6, label: 'N', confidence: 0 },
        { start: 6, end: 8, label: 'G', confidence: 0.8 },
        { start: 8, end: 10, label: 'N', confidence: 0 },
      ],
      [0, 2, 4, 6, 8, 10],
    )

    expect(trimSilenceCells(cells)).toEqual({ lo: 1, hi: 4 })
  })

  it('keeps one cell when all measures are silence', () => {
    const cells = quantizeToMeasures([{ start: 0, end: 4, label: 'N', confidence: 0 }], [0, 2, 4])
    expect(trimSilenceCells(cells)).toEqual({ lo: 1, hi: 2 })
  })
})
