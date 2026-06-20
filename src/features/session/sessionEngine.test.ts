import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { recordSession, type SessionPlan } from './sessionEngine'

// recordSession reads/writes localStorage and guards on `typeof window`,
// so stub both with an in-memory store. Dates are injectable via plan.date.
function stubBrowserGlobals() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => store.clear(),
  })
  vi.stubGlobal('window', {})
}

function plan(date: string, minutes = 10): SessionPlan {
  return {
    date,
    totalMinutes: minutes,
    stage: 'roots',
    primarySong: 'KICK BACK',
    altSong: 'ただ君に晴れ',
    blocks: [{ kind: 'warmup', title: 'w', minutes, steps: [] }],
  }
}

beforeEach(stubBrowserGlobals)
afterEach(() => vi.unstubAllGlobals())

describe('recordSession streak', () => {
  it('starts at 1 and increments on consecutive days', () => {
    expect(recordSession(plan('2026-06-09'), ['warmup']).streakDays).toBe(1)
    expect(recordSession(plan('2026-06-10'), ['warmup']).streakDays).toBe(2)
  })

  it('increments across month and year date boundaries', () => {
    expect(recordSession(plan('2026-06-30'), ['warmup']).streakDays).toBe(1)
    expect(recordSession(plan('2026-07-01'), ['warmup']).streakDays).toBe(2)
    expect(recordSession(plan('2026-12-31'), ['warmup']).streakDays).toBe(1)
    expect(recordSession(plan('2027-01-01'), ['warmup']).streakDays).toBe(2)
  })

  it('resets to 1 after a gap of more than one day', () => {
    recordSession(plan('2026-06-01'), ['warmup'])
    expect(recordSession(plan('2026-06-05'), ['warmup']).streakDays).toBe(1)
  })

  it('same-day re-save keeps the streak and does not double-count minutes or XP', () => {
    recordSession(plan('2026-06-10', 10), ['warmup'])
    const log = recordSession(plan('2026-06-10', 10), ['warmup'])

    expect(log.streakDays).toBe(1)
    expect(log.totalMinutes).toBe(10) // replaced, not 20
    expect(log.entries).toHaveLength(1)

    // awardCurriculumXP ledger: same-day delta is 0 → XP stays at 10
    const progress = JSON.parse(localStorage.getItem('bocchi.progress.bass')!)
    expect(progress.xp).toBe(10)
    expect(progress.sessionXpByDate['2026-06-10']).toBe(10)
  })

  it('caps entries at the newest 60 sessions', () => {
    for (let index = 0; index < 61; index++) {
      const date = new Date(Date.UTC(2026, 4, 1 + index)).toISOString().slice(0, 10)
      recordSession(plan(date, 1), ['warmup'])
    }

    const log = recordSession(plan('2026-07-01', 1), ['warmup'])
    expect(log.entries).toHaveLength(60)
    expect(log.entries[0].date).toBe('2026-07-01')
    expect(log.entries.at(-1)?.date).toBe('2026-05-03')
  })

  it('awards only newly added minutes when a same-day session expands', () => {
    recordSession(plan('2026-06-10', 10), ['warmup'])
    recordSession(plan('2026-06-10', 15), ['warmup'])

    const progress = JSON.parse(localStorage.getItem('bocchi.progress.bass')!)
    expect(progress.xp).toBe(15)
    expect(progress.sessionXpByDate['2026-06-10']).toBe(15)
  })
})
