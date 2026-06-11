/**
 * DrillContextBar — play-view header for the active curriculum drill.
 *
 * Shows which lesson the drill belongs to, its pass criteria (target BPM /
 * accuracy), and live completion state — previously the play view gave no
 * hint of what the learner was supposed to achieve. Self-hides for
 * non-drill tracks (demo/CAGED/songs/GP). Completion refreshes naturally:
 * TRACK_ENDED re-renders every PlaybackContext consumer, and we re-read
 * progress from localStorage on render.
 */

import { useMemo } from 'react'
import { usePlaybackState } from '@/contexts/PlaybackContext'
import { findDrill, loadProgress, type Instrument } from './progressStore'
import { formatPassCriteria } from './CurriculumScreen'

export function DrillContextBar() {
  const { track } = usePlaybackState()
  const drillId = track?.drillId ?? null
  const instrument: Instrument | null = track
    ? (track.tuning.stringCount === 4 ? 'bass' : 'guitar')
    : null

  const ctx = useMemo(
    () => (drillId && instrument ? findDrill(instrument, drillId) : null),
    [drillId, instrument],
  )
  if (!ctx || !instrument) return null

  const completed = loadProgress(instrument).completedDrills.includes(ctx.drill.id)
  const pass = formatPassCriteria(ctx.drill.passCriteria)

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg flex-wrap"
      style={{ background: '#141414', border: '1px solid rgba(251,188,0,0.25)' }}
    >
      <span className="font-mono text-[10px]" style={{ color: '#fbbc00', letterSpacing: '0.15em' }}>
        DRILL · {instrument.toUpperCase()}
      </span>
      <span className="font-serif italic text-sm" style={{ color: '#fbbc00' }}>
        {ctx.lesson.title}
      </span>
      <span style={{ color: '#555', fontSize: 12 }}>›</span>
      <span style={{ color: '#eee', fontSize: 13, fontWeight: 600 }}>{ctx.drill.title}</span>
      {pass && (
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#aaa', background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
          {pass}
        </span>
      )}
      <span className="font-mono text-[10px] ml-auto" style={{ color: '#7eff8b' }}>
        {completed ? '✓ done' : `+${ctx.drill.xpReward} XP — 끝까지 완주하면 기록`}
      </span>
    </div>
  )
}
