// Session harness — evidence-based 30-min practice block.
//
// Pulls together: deliberate practice, spaced repetition, interleaving,
// retrieval practice, metacognition. Reads current Stage (R1) + recent songs
// + completed lessons (R19), emits a 5-block session with concrete tasks.
//
// localStorage state (single key `bocchi.session.log`) tracks streak, total
// minutes practiced, last-N session entries, and per-skill area dwell time.

import { STAGES, type StageId } from '@/features/songs/stages'

export type BlockKind = 'warmup' | 'stage' | 'song' | 'retrieval' | 'metacog'

export interface SessionBlock {
  kind: BlockKind
  title: string
  minutes: number
  /** Bullet-list checklist; user ticks them off mentally / via UI */
  steps: string[]
  /** Optional learning-science principle this block exercises */
  principle?: string
}

export interface SessionPlan {
  date: string                  // ISO yyyy-mm-dd
  totalMinutes: number
  stage: StageId
  primarySong: string | null    // song title (free-form, comes from settings)
  altSong: string | null        // interleave partner
  blocks: SessionBlock[]
}

export interface SessionLogEntry {
  date: string
  totalMinutes: number
  stage: StageId
  completed: boolean
  /** which blocks were ticked off */
  doneBlocks: BlockKind[]
}

export interface SessionLog {
  streakDays: number
  lastDate: string | null       // most recent completed date
  totalMinutes: number          // cumulative
  byKind: Record<BlockKind, number>  // minutes per area
  entries: SessionLogEntry[]    // newest first, capped at 60
}

const LOG_KEY = 'bocchi.session.log'
const SETTINGS_KEY = 'bocchi.session.settings'

export interface SessionSettings {
  stage: StageId
  primarySong: string
  altSong: string
  totalMinutes: number          // 25..60 typical
}

const DEFAULT_SETTINGS: SessionSettings = {
  stage: 'roots',
  primarySong: 'KICK BACK',
  altSong: 'ただ君に晴れ',
  totalMinutes: 30,
}

export function loadSettings(): SessionSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const p = JSON.parse(raw)
    return {
      stage: STAGES.some(s => s.id === p.stage) ? p.stage : DEFAULT_SETTINGS.stage,
      primarySong: typeof p.primarySong === 'string' ? p.primarySong : DEFAULT_SETTINGS.primarySong,
      altSong: typeof p.altSong === 'string' ? p.altSong : DEFAULT_SETTINGS.altSong,
      totalMinutes:
        typeof p.totalMinutes === 'number' && p.totalMinutes >= 10 && p.totalMinutes <= 120
          ? p.totalMinutes
          : DEFAULT_SETTINGS.totalMinutes,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: SessionSettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch { /* */ }
}

const EMPTY_LOG: SessionLog = {
  streakDays: 0,
  lastDate: null,
  totalMinutes: 0,
  byKind: { warmup: 0, stage: 0, song: 0, retrieval: 0, metacog: 0 },
  entries: [],
}

export function loadLog(): SessionLog {
  if (typeof window === 'undefined') return EMPTY_LOG
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return EMPTY_LOG
    const p = JSON.parse(raw)
    return {
      streakDays: typeof p.streakDays === 'number' ? p.streakDays : 0,
      lastDate: typeof p.lastDate === 'string' ? p.lastDate : null,
      totalMinutes: typeof p.totalMinutes === 'number' ? p.totalMinutes : 0,
      byKind: { ...EMPTY_LOG.byKind, ...(p.byKind ?? {}) },
      entries: Array.isArray(p.entries) ? p.entries.slice(0, 60) : [],
    }
  } catch {
    return EMPTY_LOG
  }
}

function writeLog(log: SessionLog): void {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log)) } catch { /* */ }
}

// Compute number of days between two yyyy-mm-dd strings (b - a in days).
function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function recordSession(plan: SessionPlan, doneBlocks: BlockKind[]): SessionLog {
  const log = loadLog()
  const date = plan.date
  const minutesDone = plan.blocks
    .filter(b => doneBlocks.includes(b.kind))
    .reduce((s, b) => s + b.minutes, 0)
  const previousToday = log.entries[0]?.date === date ? log.entries[0] : null
  const previousMinutes = previousToday?.totalMinutes ?? 0

  // Streak update: if today already logged, replace last entry; else compute streak from gap
  let newStreak: number
  if (log.lastDate === date) {
    newStreak = log.streakDays
  } else if (log.lastDate && daysBetween(log.lastDate, date) === 1) {
    newStreak = log.streakDays + 1
  } else {
    newStreak = 1
  }

  // Per-kind dwell
  const byKind = { ...log.byKind }
  if (previousToday) {
    for (const b of plan.blocks) {
      if (previousToday.doneBlocks.includes(b.kind)) {
        byKind[b.kind] = Math.max(0, byKind[b.kind] - b.minutes)
      }
    }
  }
  for (const b of plan.blocks) {
    if (doneBlocks.includes(b.kind)) byKind[b.kind] += b.minutes
  }

  const entry: SessionLogEntry = {
    date,
    totalMinutes: minutesDone,
    stage: plan.stage,
    completed: doneBlocks.length === plan.blocks.length,
    doneBlocks,
  }

  // Replace if same date already at head
  const entries =
    log.entries[0]?.date === date
      ? [entry, ...log.entries.slice(1)]
      : [entry, ...log.entries]

  const newLog: SessionLog = {
    streakDays: newStreak,
    lastDate: date,
    totalMinutes: Math.max(0, log.totalMinutes - previousMinutes + minutesDone),
    byKind,
    entries: entries.slice(0, 60),
  }
  writeLog(newLog)

  // Awarded XP to the bass Curriculum (Session is bass-centric).
  // 1 min of completed practice → 1 XP. Same date re-saves the delta so
  // adding blocks later only credits new minutes.
  awardCurriculumXP('bass', date, minutesDone)
  return newLog
}

// ─── Curriculum XP integration ────────────────────────────────────────────

const PROGRESS_KEY_PREFIX = 'bocchi.progress.'

interface ProgressSnapshot {
  xp: number
  completedLessons: string[]
  completedDrills: string[]
  // Internal: per-date awarded XP so re-saving the same day's session
  // only credits the delta, not double-counts.
  sessionXpByDate?: Record<string, number>
}

function awardCurriculumXP(instrument: 'bass' | 'guitar', date: string, minutesDone: number): void {
  if (typeof window === 'undefined') return
  const key = PROGRESS_KEY_PREFIX + instrument
  try {
    const raw = localStorage.getItem(key)
    const p: ProgressSnapshot = raw ? JSON.parse(raw) : { xp: 0, completedLessons: [], completedDrills: [] }
    p.xp = typeof p.xp === 'number' ? p.xp : 0
    p.completedLessons = Array.isArray(p.completedLessons) ? p.completedLessons : []
    p.completedDrills = Array.isArray(p.completedDrills) ? p.completedDrills : []
    p.sessionXpByDate = (p.sessionXpByDate && typeof p.sessionXpByDate === 'object') ? p.sessionXpByDate : {}

    const previouslyAwarded = p.sessionXpByDate[date] ?? 0
    const delta = minutesDone - previouslyAwarded
    if (delta > 0) {
      p.xp += delta
      p.sessionXpByDate[date] = minutesDone
      localStorage.setItem(key, JSON.stringify(p))
    } else if (delta < 0) {
      // Shouldn't happen (Save Session is additive), but stay defensive.
      p.sessionXpByDate[date] = minutesDone
      localStorage.setItem(key, JSON.stringify(p))
    }
  } catch { /* localStorage unavailable */ }
}

// ─── Plan builder ─────────────────────────────────────────────────────────

const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]))

/**
 * Build a 5-block plan. Time budget split (default 30min):
 *   warmup    17%   ~5min
 *   stage     23%   ~7min
 *   song      33%   ~10min
 *   retrieval 17%   ~5min
 *   metacog   10%   ~3min
 */
export function buildSessionPlan(settings: SessionSettings = loadSettings()): SessionPlan {
  const total = settings.totalMinutes
  const split = (frac: number) => Math.max(2, Math.round(total * frac))
  const m = {
    warmup: split(0.17),
    stage: split(0.23),
    song: split(0.33),
    retrieval: split(0.17),
    metacog: Math.max(2, total - (split(0.17) + split(0.23) + split(0.33) + split(0.17))),
  }
  const stageDef = STAGE_BY_ID[settings.stage] ?? STAGES[0]
  const songA = settings.primarySong || 'KICK BACK'
  const songB = settings.altSong || 'ただ君に晴れ'

  const blocks: SessionBlock[] = [
    {
      kind: 'warmup',
      title: 'Warmup — 핑거 + 12-key 회전',
      minutes: m.warmup,
      principle: 'interleaving · retrieval',
      steps: [
        'i-m 교대 피킹 (BPM 60) — E/A/D/G 4현 순회',
        '1st position에서 음 이름을 입으로 말하며 짚기 (active retrieval)',
        '12 키 회전: C → G → D → A → E → B → F♯ → C♯ → A♭ → E♭ → B♭ → F (한 키 1마디씩)',
      ],
    },
    {
      kind: 'stage',
      title: `Stage 드릴 — ${stageDef.label} (Stage ${stageDef.order})`,
      minutes: m.stage,
      principle: 'deliberate practice',
      steps: [
        `${stageDef.summary}`,
        '대표 진행 회전 (interleaving): Em → Am → Dm → G',
        'BPM 80에서 시작 → 5씩 올리며 클린한 영역에서만 머물기',
        '느린 BPM에서 박자감/음정이 안정되면 다음 BPM',
      ],
    },
    {
      kind: 'song',
      title: `곡 적용 — ${songA}`,
      minutes: m.song,
      principle: 'transfer',
      steps: [
        `Stem Mixer "🎸 Bass off" → 베이스 파트를 직접 연주 (자기 평가 가능)`,
        `오늘 ${songA}, 어제는 ${songB}였다면 두 곡 사이 5분 단위 교차 권장 (interleaving)`,
        `현재 Stage 패턴(${stageDef.label})을 곡 진행에 그대로 적용`,
        `못 짚은 마디 메모 → 내일 warmup에 그 키로 넣기`,
      ],
    },
    {
      kind: 'retrieval',
      title: 'Retrieval — 코드 차트 가리고 연주',
      minutes: m.retrieval,
      principle: 'retrieval practice',
      steps: [
        `${songA}의 한 섹션(verse 또는 chorus) 선택`,
        'ChordTimeline 화면을 가리거나 다른 탭으로 전환',
        '외워서 한 번 끝까지 — 막히면 그 마디만 살짝 보고 다시 처음부터',
        '효과: 보면서 연주보다 5배 강한 장기 기억',
      ],
    },
    {
      kind: 'metacog',
      title: 'Metacognition — 녹음 듣기 + 내일 계획',
      minutes: m.metacog,
      principle: 'metacognition',
      steps: [
        '오늘 세션 중 한 구간을 폰/내장 마이크로 녹음 후 재생',
        '체크: 박자가 꾸준한지 / 음 끊김이 일정한지 / mute 잘 됐는지',
        '내일 보강할 영역 1개 메모 (BPM·키·마디 번호)',
      ],
    },
  ]

  return {
    date: todayISO(),
    totalMinutes: blocks.reduce((s, b) => s + b.minutes, 0),
    stage: settings.stage,
    primarySong: songA,
    altSong: songB,
    blocks,
  }
}
