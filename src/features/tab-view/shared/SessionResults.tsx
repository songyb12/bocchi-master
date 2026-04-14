/**
 * Session results screen — shown after playback ends.
 * Displays accuracy, score, combo, and rating breakdown.
 */

import type { NoteResult } from '@/core/note/types'

interface Props {
  results: NoteResult[]
  score: number
  maxCombo: number
  accuracy: number
  trackTitle: string
  onRetry: () => void
  onClose: () => void
}

export function SessionResults({ results, score, maxCombo, accuracy, trackTitle, onRetry, onClose }: Props) {
  const perfect = results.filter(r => r.rating === 'perfect').length
  const good = results.filter(r => r.rating === 'good').length
  const ok = results.filter(r => r.rating === 'ok').length
  const miss = results.filter(r => r.rating === 'miss').length
  const total = results.length

  // Grade based on accuracy
  const grade = accuracy >= 0.95 ? 'S' : accuracy >= 0.85 ? 'A' : accuracy >= 0.7 ? 'B' : accuracy >= 0.5 ? 'C' : 'D'
  const gradeColor = grade === 'S' ? 'var(--neon-cyan)' : grade === 'A' ? 'var(--neon-green)' : grade === 'B' ? 'var(--neon-yellow)' : 'var(--neon-red)'

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-sm" style={{ color: 'var(--text-muted)' }}>SESSION COMPLETE</h2>
        <h3 className="text-xl font-bold" style={{ color: 'var(--neon-cyan)' }}>{trackTitle}</h3>
      </div>

      {/* Grade */}
      <div
        className="text-7xl font-black"
        style={{ color: gradeColor, textShadow: `0 0 30px ${gradeColor}80, 0 0 60px ${gradeColor}40` }}
      >
        {grade}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-2xl font-mono font-bold" style={{ color: 'var(--neon-cyan)' }}>{score}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>SCORE</div>
        </div>
        <div>
          <div className="text-2xl font-mono font-bold" style={{ color: 'var(--neon-green)' }}>
            {(accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>ACCURACY</div>
        </div>
        <div>
          <div className="text-2xl font-mono font-bold" style={{ color: 'var(--neon-pink)' }}>{maxCombo}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>MAX COMBO</div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="flex gap-4">
        <RatingBar label="PERFECT" count={perfect} total={total} color="var(--neon-cyan)" />
        <RatingBar label="GOOD" count={good} total={total} color="var(--neon-green)" />
        <RatingBar label="OK" count={ok} total={total} color="var(--neon-yellow)" />
        <RatingBar label="MISS" count={miss} total={total} color="var(--neon-red)" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-lg font-bold transition-all hover:scale-105"
          style={{
            background: 'var(--neon-cyan)',
            color: 'var(--bg-primary)',
            boxShadow: 'var(--glow-cyan)',
          }}
        >
          Retry
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg transition-all"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--bg-surface-hover)',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <div className="text-lg font-mono font-bold" style={{ color }}>{count}</div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}
