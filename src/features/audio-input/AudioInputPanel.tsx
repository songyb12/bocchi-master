/**
 * Audio input panel — mic toggle + real-time pitch display.
 */

import { useAudioInput } from '@/hooks/useAudioInput'

export function AudioInputPanel() {
  const { isListening, pitch, start, stop } = useAudioInput()

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg"
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Mic Toggle */}
      <button
        onClick={isListening ? stop : start}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
        style={{
          background: isListening ? 'var(--neon-green)20' : 'var(--bg-surface-hover)',
          color: isListening ? 'var(--neon-green)' : 'var(--text-secondary)',
          border: `1px solid ${isListening ? 'var(--neon-green)' : 'var(--fret-color)'}40`,
        }}
      >
        <span className="text-lg">{isListening ? '\u{1F3A4}' : '\u{1F507}'}</span>
        {isListening ? 'Listening' : 'Mic Off'}
      </button>

      {/* Pitch Display */}
      {isListening && (
        <div className="flex items-center gap-3">
          <div className="text-center min-w-[50px]">
            <div
              className="text-2xl font-mono font-bold"
              style={{ color: 'var(--neon-cyan)' }}
            >
              {pitch.noteName}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {pitch.frequency ? `${Math.round(pitch.frequency)} Hz` : '---'}
            </div>
          </div>

          {/* Cents indicator */}
          <div className="w-24 h-3 rounded-full relative overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}
          >
            <div
              className="absolute top-0 h-full w-1 rounded-full transition-all duration-75"
              style={{
                left: `${50 + (pitch.cents / 50) * 50}%`,
                background: Math.abs(pitch.cents) < 10 ? 'var(--neon-green)' : 'var(--neon-yellow)',
                boxShadow: Math.abs(pitch.cents) < 10 ? 'var(--glow-green)' : 'none',
              }}
            />
            {/* Center mark */}
            <div className="absolute top-0 left-1/2 h-full w-px"
              style={{ background: 'var(--text-muted)' }}
            />
          </div>

          {/* MIDI number */}
          <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            MIDI: {pitch.midi ?? '--'}
          </div>
        </div>
      )}
    </div>
  )
}
