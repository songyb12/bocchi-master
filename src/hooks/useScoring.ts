/**
 * Hook that wires ScoringEngine to playback + audio input.
 * Evaluates each note as the cursor passes it, using mic pitch data.
 */

import { useRef, useCallback, useMemo } from 'react'
import { ScoringEngine } from '@/core/scoring/ScoringEngine'
import type { Track, NoteResult, RhythmRating } from '@/core/note/types'

interface ScoringState {
  combo: number
  maxCombo: number
  accuracy: number
  score: number
  lastRating: RhythmRating | null
  results: NoteResult[]
}

export function useScoring(track: Track | null) {
  const engineRef = useRef(new ScoringEngine())
  const evaluatedRef = useRef(new Set<string>())
  const lastRatingRef = useRef<RhythmRating | null>(null)

  const reset = useCallback(() => {
    engineRef.current.reset()
    evaluatedRef.current.clear()
    lastRatingRef.current = null
  }, [])

  /**
   * Called each beat tick. Checks if any notes at (currentBeat - small window)
   * haven't been evaluated yet, and scores them.
   */
  const evaluate = useCallback((
    currentBeat: number,
    detectedMidi: number | null,
    bpm: number,
  ): RhythmRating | null => {
    if (!track) return null

    const msPerBeat = 60000 / bpm
    // Look for notes that should have been played by now (within 1 beat window)
    const windowStart = currentBeat - 1
    const windowEnd = currentBeat + 0.1

    let latestRating: RhythmRating | null = null

    for (const note of track.events) {
      if (note.time < windowStart || note.time > windowEnd) continue
      if (evaluatedRef.current.has(note.id)) continue

      // Only evaluate notes that the cursor has passed
      if (currentBeat >= note.time) {
        const timingOffsetMs = (currentBeat - note.time) * msPerBeat
        const result = engineRef.current.evaluate(note, detectedMidi, timingOffsetMs)
        evaluatedRef.current.add(note.id)
        lastRatingRef.current = result.rating
        latestRating = result.rating
      }
    }

    return latestRating
  }, [track])

  const state: ScoringState = useMemo(() => ({
    combo: engineRef.current.getCombo(),
    maxCombo: engineRef.current.getMaxCombo(),
    accuracy: engineRef.current.getAccuracy(),
    score: engineRef.current.getScore(),
    lastRating: lastRatingRef.current,
    results: engineRef.current.getResults(),
  }), [
    // Force re-compute — these change on every evaluate call
    // We rely on the parent re-rendering on each beat tick
    engineRef.current.getCombo(),
    engineRef.current.getScore(),
  ])

  return { ...state, evaluate, reset }
}
