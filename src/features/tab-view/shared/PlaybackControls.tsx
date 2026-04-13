import { usePlayback } from '@/hooks/usePlayback'

export function PlaybackControls() {
  const { status, bpm, track, currentMeasure, togglePlay, setBpm } = usePlayback()

  const totalMeasures = track?.measures.length ?? 0

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg"
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Play/Stop */}
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
        style={{
          background: status === 'playing' ? 'var(--neon-red)' : 'var(--neon-cyan)',
          color: 'var(--bg-primary)',
          boxShadow: status === 'playing' ? 'var(--glow-pink)' : 'var(--glow-cyan)',
        }}
        title={status === 'playing' ? 'Stop (Space)' : 'Play (Space)'}
      >
        {status === 'playing' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="4,2 14,8 4,14" />
          </svg>
        )}
      </button>

      {/* BPM Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBpm(Math.max(30, bpm - 5))}
          className="w-7 h-7 rounded flex items-center justify-center text-sm"
          style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
        >
          -
        </button>
        <div className="text-center min-w-[70px]">
          <div className="text-lg font-mono font-bold" style={{ color: 'var(--neon-cyan)' }}>
            {bpm}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>BPM</div>
        </div>
        <button
          onClick={() => setBpm(Math.min(300, bpm + 5))}
          className="w-7 h-7 rounded flex items-center justify-center text-sm"
          style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
        >
          +
        </button>
      </div>

      {/* BPM Slider */}
      <input
        type="range"
        min={30}
        max={300}
        value={bpm}
        onChange={e => setBpm(Number(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: 'var(--neon-cyan)' }}
      />

      {/* Progress */}
      {totalMeasures > 0 && (
        <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          {currentMeasure + 1}/{totalMeasures}
        </div>
      )}
    </div>
  )
}
