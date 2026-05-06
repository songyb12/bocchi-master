// SessionView — 30-min practice session UI driven by sessionEngine.
//
// Top: streak / total / per-kind dwell totals + settings drawer (stage / songs / minutes).
// Body: 5 numbered blocks (warmup → metacog) with checklists and "complete" buttons.
// Footer: principle reminders (deliberate, spaced, interleaving, retrieval, metacog).

import { useEffect, useMemo, useState } from 'react'
import {
  buildSessionPlan,
  loadLog,
  loadSettings,
  recordSession,
  saveSettings,
  todayISO,
  type BlockKind,
  type SessionLog,
  type SessionPlan,
  type SessionSettings,
} from './sessionEngine'
import { STAGES, type StageId } from '@/features/songs/stages'

const KIND_LABELS: Record<BlockKind, string> = {
  warmup: 'WARMUP',
  stage: 'STAGE DRILL',
  song: 'SONG APPLY',
  retrieval: 'RETRIEVAL',
  metacog: 'METACOG',
}

const KIND_ICONS: Record<BlockKind, string> = {
  warmup: '🔥',
  stage: '◆',
  song: '🎵',
  retrieval: '🔁',
  metacog: '🪞',
}

export function SessionView() {
  const [settings, setSettings] = useState<SessionSettings>(() => loadSettings())
  const [log, setLog] = useState<SessionLog>(() => loadLog())
  const [done, setDone] = useState<Set<BlockKind>>(new Set())
  const [showSettings, setShowSettings] = useState(false)

  // Rebuild plan whenever settings change (date stays "today" — refresh at midnight by reload)
  const plan: SessionPlan = useMemo(() => buildSessionPlan(settings), [settings])

  // If today's session already logged, prefill done blocks
  useEffect(() => {
    const todayEntry = log.entries.find((e) => e.date === todayISO())
    if (todayEntry) {
      setDone(new Set(todayEntry.doneBlocks))
    } else {
      setDone(new Set())
    }
  }, [log])

  const updateSettings = (patch: Partial<SessionSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  const toggleBlock = (kind: BlockKind) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const finalize = () => {
    const newLog = recordSession(plan, Array.from(done))
    setLog(newLog)
  }

  const totalDoneMin = plan.blocks
    .filter((b) => done.has(b.kind))
    .reduce((s, b) => s + b.minutes, 0)
  const isAllDone = done.size === plan.blocks.length

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto px-6 py-8 flex flex-col gap-6" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            BOCCHI · SESSION
          </div>
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h1
              className="font-serif italic"
              style={{ color: '#fff', fontSize: 36, fontWeight: 400, lineHeight: 1.1 }}
            >
              Today's Practice
            </h1>
            <div className="flex items-center gap-4 font-mono text-xs">
              <Stat label="STREAK" value={`${log.streakDays} day${log.streakDays === 1 ? '' : 's'}`} accent="#fbbc00" />
              <Stat label="TOTAL" value={`${log.totalMinutes} min`} />
              <Stat label="TODAY" value={`${totalDoneMin} / ${plan.totalMinutes} min`} accent={isAllDone ? '#7eff8b' : undefined} />
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="px-3 py-1.5 rounded font-mono text-[10px]"
                style={{
                  background: showSettings ? 'rgba(251,188,0,0.15)' : '#181818',
                  color: showSettings ? '#fbbc00' : '#aaa',
                  border: `1px solid ${showSettings ? 'rgba(251,188,0,0.5)' : '#333'}`,
                }}
              >
                {showSettings ? '× Close' : '⚙ Tune'}
              </button>
            </div>
          </div>
          <p style={{ color: '#999', fontSize: 13, lineHeight: 1.6, maxWidth: 720 }}>
            5-block evidence-based 베이스 연습 세션. 각 블록에 deliberate practice / spaced
            repetition / interleaving / retrieval / metacognition 중 하나가 적용됨. 체크박스로
            진행률 추적, 다 마치면 streak 자동 +1.
          </p>
        </header>

        {/* Settings drawer */}
        {showSettings && (
          <SettingsDrawer settings={settings} onChange={updateSettings} />
        )}

        {/* Plan blocks */}
        <div className="flex flex-col gap-3">
          {plan.blocks.map((b, idx) => (
            <BlockCard
              key={b.kind}
              index={idx}
              block={b}
              done={done.has(b.kind)}
              onToggle={() => toggleBlock(b.kind)}
            />
          ))}
        </div>

        {/* Finalize */}
        <div
          className="rounded-lg p-4 flex items-center justify-between"
          style={{
            background: isAllDone ? 'rgba(126,255,139,0.06)' : '#101010',
            border: `1px solid ${isAllDone ? 'rgba(126,255,139,0.4)' : '#222'}`,
          }}
        >
          <div>
            <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
              {isAllDone ? 'COMPLETE' : 'IN PROGRESS'}
            </div>
            <div style={{ color: '#ddd', fontSize: 14 }}>
              {done.size} / {plan.blocks.length} blocks · {totalDoneMin} min logged
            </div>
          </div>
          <button
            onClick={finalize}
            disabled={done.size === 0}
            className="px-5 py-2 rounded font-mono text-xs transition-all"
            style={{
              background: done.size === 0 ? '#222' : 'rgba(126,255,139,0.18)',
              color: done.size === 0 ? '#555' : '#7eff8b',
              border: `1px solid ${done.size === 0 ? '#333' : 'rgba(126,255,139,0.5)'}`,
              cursor: done.size === 0 ? 'not-allowed' : 'pointer',
            }}
            title="오늘의 세션 기록 (streak / 누적 시간 갱신)"
          >
            ✓ Save Session
          </button>
        </div>

        {/* Per-kind dwell + recent log */}
        <ByKindStats log={log} />
        <RecentEntries log={log} />

        <footer
          className="pt-6 pb-12"
          style={{ borderTop: '1px solid #1a1a1a', color: '#666', fontSize: 11, lineHeight: 1.8 }}
        >
          <div className="font-mono text-[10px] mb-2" style={{ color: '#fbbc00' }}>
            PRINCIPLES (per block)
          </div>
          <div>🔥 warmup · interleaving + retrieval (12-key 회전)</div>
          <div>◆ stage · deliberate practice (구체 목표 + 노력 영역)</div>
          <div>🎵 song · transfer (어제 / 오늘 곡 교차 = interleaving)</div>
          <div>🔁 retrieval · 보지 않고 회상 → 장기 기억 ↑↑</div>
          <div>🪞 metacog · 녹음 → 자기 평가 → 내일 계획</div>
        </footer>
      </div>
    </div>
  )
}

function Stat({ label, value, accent = '#ddd' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-[9px]" style={{ color: '#666' }}>{label}</span>
      <span className="font-mono" style={{ color: accent }}>{value}</span>
    </div>
  )
}

function BlockCard({
  index,
  block,
  done,
  onToggle,
}: {
  index: number
  block: SessionPlan['blocks'][number]
  done: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="rounded-lg p-4 transition-all"
      style={{
        background: done ? 'rgba(126,255,139,0.04)' : '#101010',
        border: `1px solid ${done ? 'rgba(126,255,139,0.3)' : '#222'}`,
        opacity: done ? 0.85 : 1,
      }}
    >
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[10px]" style={{ color: '#fbbc0099' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 16 }}>{KIND_ICONS[block.kind]}</span>
        <span
          className="font-mono text-[10px]"
          style={{ color: done ? '#7eff8b' : '#fbbc00', letterSpacing: '0.1em' }}
        >
          {KIND_LABELS[block.kind]}
        </span>
        <span
          className="font-serif italic flex-1"
          style={{ color: done ? '#7eff8b' : '#fff', fontSize: 16 }}
        >
          {block.title}
        </span>
        <span className="font-mono text-[11px]" style={{ color: '#888' }}>
          {block.minutes} min
        </span>
        <button
          onClick={onToggle}
          className="px-3 py-1 rounded font-mono text-[10px] transition-all"
          style={{
            background: done ? 'rgba(126,255,139,0.18)' : '#181818',
            color: done ? '#7eff8b' : '#aaa',
            border: `1px solid ${done ? 'rgba(126,255,139,0.5)' : '#333'}`,
          }}
        >
          {done ? '✓ Done' : '○ Mark'}
        </button>
      </div>

      {block.principle && (
        <div
          className="font-mono text-[9px] mb-2"
          style={{ color: '#666', letterSpacing: '0.05em' }}
        >
          ≈ {block.principle}
        </div>
      )}

      <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
        {block.steps.map((step, si) => (
          <li
            key={si}
            className="flex items-baseline gap-2"
            style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5 }}
          >
            <span
              className="font-mono"
              style={{
                color: '#fbbc0066',
                fontSize: 10,
                flexShrink: 0,
                width: 12,
              }}
            >
              ▸
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SettingsDrawer({
  settings,
  onChange,
}: {
  settings: SessionSettings
  onChange: (patch: Partial<SessionSettings>) => void
}) {
  return (
    <div
      className="rounded-lg p-4 grid gap-4"
      style={{
        background: '#101010',
        border: '1px solid rgba(251,188,0,0.2)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
          STAGE
        </label>
        <select
          value={settings.stage}
          onChange={(e) => onChange({ stage: e.target.value as StageId })}
          className="bg-black/40 border rounded px-2 py-1.5 text-sm"
          style={{ borderColor: '#333', color: '#ddd' }}
        >
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              Stage {s.order} — {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
          PRIMARY SONG
        </label>
        <input
          type="text"
          value={settings.primarySong}
          onChange={(e) => onChange({ primarySong: e.target.value })}
          className="bg-black/40 border rounded px-2 py-1.5 text-sm"
          style={{ borderColor: '#333', color: '#ddd' }}
          placeholder="예: KICK BACK"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
          INTERLEAVE PARTNER
        </label>
        <input
          type="text"
          value={settings.altSong}
          onChange={(e) => onChange({ altSong: e.target.value })}
          className="bg-black/40 border rounded px-2 py-1.5 text-sm"
          style={{ borderColor: '#333', color: '#ddd' }}
          placeholder="예: ただ君に晴れ"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
          DURATION ({settings.totalMinutes} min)
        </label>
        <input
          type="range"
          min={15}
          max={60}
          step={5}
          value={settings.totalMinutes}
          onChange={(e) => onChange({ totalMinutes: parseInt(e.target.value, 10) })}
          className="accent-amber-300"
        />
      </div>
    </div>
  )
}

function ByKindStats({ log }: { log: SessionLog }) {
  const total = Object.values(log.byKind).reduce((s, v) => s + v, 0)
  if (total === 0) return null
  const order: BlockKind[] = ['warmup', 'stage', 'song', 'retrieval', 'metacog']
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
    >
      <div className="font-mono text-[10px] mb-3" style={{ color: '#fbbc00' }}>
        TIME BY AREA · cumulative
      </div>
      <div className="flex items-end gap-2" style={{ height: 36 }}>
        {order.map((k) => {
          const pct = total === 0 ? 0 : (log.byKind[k] / total) * 100
          return (
            <div key={k} className="flex flex-col items-center" style={{ flex: 1 }}>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(2, pct)}%`,
                  background: 'linear-gradient(180deg, #fbbc0066 0%, #fbbc00cc 100%)',
                  borderRadius: 2,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 mt-1">
        {order.map((k) => (
          <div
            key={k}
            className="font-mono text-[9px] text-center flex flex-col"
            style={{ flex: 1, color: '#888' }}
          >
            <span>{KIND_LABELS[k]}</span>
            <span style={{ color: '#fbbc00' }}>{log.byKind[k]}m</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentEntries({ log }: { log: SessionLog }) {
  if (log.entries.length === 0) return null
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
    >
      <div className="font-mono text-[10px] mb-3" style={{ color: '#fbbc00' }}>
        RECENT SESSIONS · last {Math.min(log.entries.length, 7)}
      </div>
      <div className="flex flex-col gap-1">
        {log.entries.slice(0, 7).map((e) => (
          <div
            key={e.date}
            className="flex items-center gap-3 font-mono text-[11px]"
            style={{ color: '#bbb' }}
          >
            <span style={{ color: '#666', width: 88 }}>{e.date}</span>
            <span style={{ color: e.completed ? '#7eff8b' : '#fbbc00', width: 64 }}>
              {e.completed ? '✓ complete' : '○ partial'}
            </span>
            <span style={{ color: '#888', width: 60 }}>{e.totalMinutes}m</span>
            <span style={{ color: '#888' }}>Stage {STAGES.find((s) => s.id === e.stage)?.order ?? '?'}</span>
            <span style={{ color: '#666', flex: 1, textAlign: 'right' }}>
              {e.doneBlocks.map((k) => KIND_ICONS[k]).join(' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
