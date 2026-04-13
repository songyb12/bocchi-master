/**
 * Scoring Engine
 *
 * Evaluates timing and pitch accuracy of player input
 * against expected notes from the track.
 */

import type { NoteEvent, RhythmRating, NoteResult } from '@/core/note/types'

// Timing windows in milliseconds
const PERFECT_MS = 40
const GOOD_MS = 80
const OK_MS = 150

export interface ScoringConfig {
  perfectMs: number
  goodMs: number
  okMs: number
  pitchToleranceCents: number
}

const DEFAULT_CONFIG: ScoringConfig = {
  perfectMs: PERFECT_MS,
  goodMs: GOOD_MS,
  okMs: OK_MS,
  pitchToleranceCents: 50,
}

export class ScoringEngine {
  private config: ScoringConfig
  private results: NoteResult[] = []
  private combo = 0
  private maxCombo = 0

  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Evaluate a detected pitch against the expected note.
   */
  evaluate(
    expected: NoteEvent,
    detectedMidi: number | null,
    timingOffsetMs: number,
  ): NoteResult {
    const absOffset = Math.abs(timingOffsetMs)

    let rating: RhythmRating
    if (detectedMidi === null) {
      rating = 'miss'
    } else {
      // Check pitch (allow some tolerance)
      const pitchDiff = Math.abs(detectedMidi - expected.midi)
      if (pitchDiff > 1) {
        rating = 'miss'
      } else if (absOffset <= this.config.perfectMs) {
        rating = 'perfect'
      } else if (absOffset <= this.config.goodMs) {
        rating = 'good'
      } else if (absOffset <= this.config.okMs) {
        rating = 'ok'
      } else {
        rating = 'miss'
      }
    }

    // Update combo
    if (rating === 'miss') {
      this.combo = 0
    } else {
      this.combo++
      this.maxCombo = Math.max(this.maxCombo, this.combo)
    }

    const result: NoteResult = {
      noteId: expected.id,
      rating,
      timingOffsetMs,
      detectedMidi,
    }
    this.results.push(result)
    return result
  }

  getResults() { return this.results }
  getCombo() { return this.combo }
  getMaxCombo() { return this.maxCombo }

  getAccuracy(): number {
    if (this.results.length === 0) return 0
    const hits = this.results.filter(r => r.rating !== 'miss').length
    return hits / this.results.length
  }

  getScore(): number {
    let score = 0
    for (const r of this.results) {
      switch (r.rating) {
        case 'perfect': score += 100; break
        case 'good': score += 70; break
        case 'ok': score += 40; break
        case 'miss': break
      }
    }
    return score
  }

  reset(): void {
    this.results = []
    this.combo = 0
    this.maxCombo = 0
  }
}
