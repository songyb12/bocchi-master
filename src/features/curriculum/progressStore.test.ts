import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  applyDrillCompletion,
  markDrillComplete,
  loadProgress,
  emptyProgress,
  type DrillCompletionResult,
} from './progressStore'
import { BASS_CURRICULUM } from '../../data/curriculum'

// First bass lesson with 2+ drills — uses real curriculum data so the test
// keeps tracking the actual content.
const LESSON = (() => {
  for (const level of BASS_CURRICULUM.levels) {
    for (const lesson of level.lessons) {
      if (lesson.drills.length >= 2) return lesson
    }
  }
  throw new Error('BASS_CURRICULUM has no lesson with 2+ drills')
})()

function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => store.clear(),
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('applyDrillCompletion (pure)', () => {
  it('awards the drill XP once — repeat completion is a no-op', () => {
    const drill = LESSON.drills[0]
    const first = applyDrillCompletion(emptyProgress(), 'bass', drill.id)
    expect(first).not.toBeNull()
    expect(first!.xpGained).toBe(drill.xpReward)
    expect(first!.progress.xp).toBe(drill.xpReward)
    expect(first!.progress.completedDrills).toContain(drill.id)
    expect(first!.lessonCompleted).toBe(false) // lesson has 2+ drills

    expect(applyDrillCompletion(first!.progress, 'bass', drill.id)).toBeNull()
  })

  it('grants the lesson bonus exactly once, when the last drill completes', () => {
    let progress = emptyProgress()
    let last: DrillCompletionResult | null = null
    for (const drill of LESSON.drills) {
      last = applyDrillCompletion(progress, 'bass', drill.id)
      expect(last).not.toBeNull()
      progress = last!.progress
    }
    expect(last!.lessonCompleted).toBe(true)
    expect(progress.completedLessons).toEqual([LESSON.id])

    const drillXp = LESSON.drills.reduce((s, d) => s + d.xpReward, 0)
    expect(progress.xp).toBe(drillXp + LESSON.xpReward)
  })

  it('returns null for an unknown drill id', () => {
    expect(applyDrillCompletion(emptyProgress(), 'bass', 'no-such-drill')).toBeNull()
  })

  it('preserves session XP ledger fields while completing drills', () => {
    const drill = LESSON.drills[0]
    const result = applyDrillCompletion(
      {
        ...emptyProgress(),
        xp: 12,
        sessionXpByDate: { '2026-06-10': 12 },
      },
      'bass',
      drill.id,
    )

    expect(result).not.toBeNull()
    expect(result!.progress.sessionXpByDate).toEqual({ '2026-06-10': 12 })
    expect(result!.progress.xp).toBe(12 + drill.xpReward)
  })
})

describe('markDrillComplete (localStorage)', () => {
  beforeEach(stubLocalStorage)

  it('persists the snapshot and stays idempotent across reloads', () => {
    const drill = LESSON.drills[0]
    const result = markDrillComplete('bass', drill.id)
    expect(result).not.toBeNull()

    const reloaded = loadProgress('bass')
    expect(reloaded.xp).toBe(drill.xpReward)
    expect(reloaded.completedDrills).toEqual([drill.id])

    expect(markDrillComplete('bass', drill.id)).toBeNull()
    expect(loadProgress('bass').xp).toBe(drill.xpReward)
  })

  it('tolerates corrupt stored JSON', () => {
    localStorage.setItem('bocchi.progress.bass', '{not json')
    expect(loadProgress('bass')).toEqual(emptyProgress())
  })
})
