import { usePlayback } from '@/hooks/usePlayback'

export function PlaybackControls() {
  const { status, bpm, track, currentMeasure, togglePlay, stop, setBpm } = usePlayback()

  const totalMeasures = track?.measures.length ?? 0

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg"
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Play/Pause */}
      {/* 44px touch targets below (w-11/h-11) — iPad-friendly (Apple HIG) */}
      <button
        onClick={togglePlay}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105"
        style={{
          background: status === 'playing' ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
          color: 'var(--bg-primary)',
          boxShadow: status === 'playing' ? 'var(--glow-yellow)' : 'var(--glow-cyan)',
        }}
        title={status === 'playing' ? 'Pause (Space)' : status === 'paused' ? 'Resume (Space)' : 'Play (Space)'}
      >
        {status === 'playing' ? (
          // Pause icon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="4,2 14,8 4,14" />
          </svg>
        )}
      </button>

      {/* Stop (only when playing or paused) */}
      {status !== 'stopped' && (
        <button
          onClick={stop}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: 'var(--neon-red)',
            color: 'var(--bg-primary)',
            boxShadow: 'var(--glow-pink)',
          }}
          title="Stop"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="1" width="10" height="10" rx="1" />
          </svg>
        </button>
      )}

      {/* BPM Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBpm(Math.max(30, bpm - 5))}
          className="w-11 h-11 rounded flex items-center justify-center text-lg"
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
          className="w-11 h-11 rounded flex items-center justify-center text-lg"
          style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
        >
          +
        </button>
      </div>

      {/* Half/Double quick toggles (R10 — bass learning, half-time grooves) */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setBpm(Math.max(30, Math.round(bpm / 2)))}
          className="px-2 py-1 min-w-11 min-h-11 rounded font-mono text-[10px] transition-all"
          style={{
            background: '#181818',
            color: '#aaa',
            border: '1px solid #333',
          }}
          title="Half-time (BPM ÷ 2). 베이스 그루브 슬로다운 학습."
        >
          ½×
        </button>
        <button
          onClick={() =>
            setBpm(track?.bpm ? Math.min(300, Math.round(track.bpm)) : bpm)
          }
          className="px-2 py-1 min-w-11 min-h-11 rounded font-mono text-[10px] transition-all"
          style={{
            background: '#181818',
            color: '#aaa',
            border: '1px solid #333',
          }}
          title={track?.bpm ? `원본 BPM (${Math.round(track.bpm)}) 복원` : '원본 BPM 정보 없음'}
        >
          1×
        </button>
        <button
          onClick={() => setBpm(Math.min(300, Math.round(bpm * 2)))}
          className="px-2 py-1 min-w-11 min-h-11 rounded font-mono text-[10px] transition-all"
          style={{
            background: '#181818',
            color: '#aaa',
            border: '1px solid #333',
          }}
          title="Double-time (BPM × 2). 박자 분할 학습 시 유용."
        >
          2×
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

      {/* Progress + Status */}
      <div className="flex items-center gap-2">
        {status === 'paused' && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded animate-pulse"
            style={{ background: 'var(--neon-yellow)20', color: 'var(--neon-yellow)' }}
          >
            PAUSED
          </span>
        )}
        {totalMeasures > 0 && (
          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {currentMeasure + 1}/{totalMeasures}
          </div>
        )}
      </div>
    </div>
  )
}
