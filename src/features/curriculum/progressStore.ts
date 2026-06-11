/**
 * Curriculum progress store — single read/write surface for the
 * `bocchi.progress.{instrument}` localStorage keys.
 *
 * Readers: CurriculumScreen (XP bar, completed ✓, level gates).
 * Writers: App (drill completion on natural play-through end) and
 * sessionEngine.awardCurriculumXP (session minutes → XP; it re-saves the
 * parsed object, so fields owned here survive round-trips).
 */

import { GUITAR_CURRICULUM, BASS_CURRICULUM, type Drill, type Lesson } from '../../data/curriculum'

export type Instrument = 'guitar' | 'bass'

export interface ProgressSnapshot {
  xp: number
  completedLessons: string[]
  completedDrills: string[]
  /** Per-date session XP ledger (written by sessionEngine) — preserved on save. */
  sessionXpByDate?: Record<string, number>
}

const PROGRESS_KEY_PREFIX = 'bocchi.progress.'

export function emptyProgress(): ProgressSnapshot {
  return { xp: 0, completedLessons: [], completedDrills: [] }
}

export function loadProgress(instrument: Instrument): ProgressSnapshot {
  if (typeof localStorage === 'undefined') return emptyProgress()
  try {
    const raw = localStorage.getItem(PROGRESS_KEY_PREFIX + instrument)
    if (!raw) return emptyProgress()
    const p = JSON.parse(raw)
    return {
      xp: typeof p.xp === 'number' ? p.xp : 0,
      completedLessons: Array.isArray(p.completedLessons) ? p.completedLessons : [],
      completedDrills: Array.isArray(p.completedDrills) ? p.completedDrills : [],
      sessionXpByDate:
        p.sessionXpByDate && typeof p.sessionXpByDate === 'object' ? p.sessionXpByDate : undefined,
    }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(instrument: Instrument, progress: ProgressSnapshot): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PROGRESS_KEY_PREFIX + instrument, JSON.stringify(progress))
  } catch { /* localStorage unavailable */ }
}

function curriculumFor(instrument: Instrument) {
  return instrument === 'guitar' ? GUITAR_CURRICULUM : BASS_CURRICULUM
}

export interface DrillCompletionResult {
  progress: ProgressSnapshot
  drill: Drill
  lesson: Lesson
  xpGained: number
  lessonCompleted: boolean
}

/**
 * Pure core (unit-testable): next snapshot after completing `drillId`.
 * Returns null when the drill is unknown or already completed — completing
 * the same drill twice never double-credits XP. The lesson bonus XP is
 * granted exactly once, when the lesson's last remaining drill completes.
 */
export function applyDrillCompletion(
  progress: ProgressSnapshot,
  instrument: Instrument,
  drillId: string,
): DrillCompletionResult | null {
  if (progress.completedDrills.includes(drillId)) return null

  let found: { drill: Drill; lesson: Lesson } | null = null
  for (const level of curriculumFor(instrument).levels) {
    for (const lesson of level.lessons) {
      const drill = lesson.drills.find(d => d.id === drillId)
      if (drill) { found = { drill, lesson }; break }
    }
    if (found) break
  }
  if (!found) return null

  const { drill, lesson } = found
  const completedDrills = [...progress.completedDrills, drillId]
  const lessonCompleted =
    !progress.completedLessons.includes(lesson.id) &&
    lesson.drills.every(d => completedDrills.includes(d.id))
  const completedLessons = lessonCompleted
    ? [...progress.completedLessons, lesson.id]
    : progress.completedLessons
  const xpGained = drill.xpReward + (lessonCompleted ? lesson.xpReward : 0)

  return {
    progress: { ...progress, xp: progress.xp + xpGained, completedDrills, completedLessons },
    drill,
    lesson,
    xpGained,
    lessonCompleted,
  }
}

/** Load → apply → persist. Returns null when nothing changed. */
export function markDrillComplete(
  instrument: Instrument,
  drillId: string,
): DrillCompletionResult | null {
  const result = applyDrillCompletion(loadProgress(instrument), instrument, drillId)
  if (result) saveProgress(instrument, result.progress)
  return result
}
