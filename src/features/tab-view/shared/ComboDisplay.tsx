/**
 * Combo counter + accuracy display.
 * Shows during playback with scoring active.
 */

interface Props {
  combo: number
  maxCombo: number
  accuracy: number
  score: number
}

export function ComboDisplay({ combo, maxCombo, accuracy, score }: Props) {
  const comboColor = combo >= 20 ? 'var(--neon-pink)' : combo >= 10 ? 'var(--neon-cyan)' : 'var(--neon-green)'
  const comboScale = combo >= 20 ? 1.3 : combo >= 10 ? 1.15 : 1

  return (
    <div className="flex items-center gap-6 px-4 py-2 rounded-lg"
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Combo */}
      <div className="text-center">
        <div
          className="text-2xl font-black font-mono transition-all"
          style={{
            color: comboColor,
            textShadow: combo >= 10 ? `0 0 10px ${comboColor}80` : 'none',
            transform: `scale(${comboScale})`,
          }}
        >
          {combo}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>COMBO</div>
      </div>

      {/* Max Combo */}
      <div className="text-center">
        <div className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
          {maxCombo}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>MAX</div>
      </div>

      {/* Accuracy */}
      <div className="text-center">
        <div className="text-sm font-mono" style={{ color: 'var(--neon-green)' }}>
          {(accuracy * 100).toFixed(1)}%
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ACC</div>
      </div>

      {/* Score */}
      <div className="text-center">
        <div className="text-sm font-mono font-bold" style={{ color: 'var(--neon-cyan)' }}>
          {score}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>SCORE</div>
      </div>
    </div>
  )
}
