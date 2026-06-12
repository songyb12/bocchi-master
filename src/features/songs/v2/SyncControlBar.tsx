// YouTube sync control bar — SYNC toggle + per-song offset nudge + time/beat
// readout. Extracted verbatim from SongsViewV2 (incl. SyncDot / OffsetBtn /
// formatTime). Offset clamping stays with the state owner (parent).
import { C } from './theme'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function SyncDot({ active, playing }: { active: boolean; playing: boolean }) {
  const color = active && playing ? C.green : active ? C.amber : C.textMut
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        boxShadow: active && playing ? `0 0 6px ${C.green}` : 'none',
        flexShrink: 0,
      }}
    />
  )
}

function OffsetBtn({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="transition-all"
      style={{
        // 44px — iPad touch target (Apple HIG minimum)
        width: 44,
        height: 44,
        borderRadius: 10,
        background: C.surface,
        color: C.textSec,
        border: `1px solid rgba(255,255,255,0.08)`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  )
}

export function SyncControlBar({
  syncEnabled,
  onToggleSync,
  offsetSec,
  onOffsetDelta,
  ytTime,
  currentBeat,
  isYTPlaying,
}: {
  syncEnabled: boolean
  onToggleSync: () => void
  offsetSec: number
  /** ±0.5s nudges — parent applies the −10..+60 clamp. */
  onOffsetDelta: (delta: number) => void
  ytTime: number
  currentBeat: number
  isYTPlaying: boolean
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-3"
      style={{
        background: C.surface,
        boxShadow: C.inset,
      }}
    >
      {/* Sync toggle */}
      <button
        onClick={onToggleSync}
        className="flex items-center gap-2 transition-all"
        style={{
          background: syncEnabled ? C.greenDim : 'rgba(255,255,255,0.04)',
          border: `1px solid ${syncEnabled ? C.greenBd : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 8,
          padding: '5px 12px',
          minHeight: 44,
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: syncEnabled ? C.green : C.textMut,
          cursor: 'pointer',
          gap: 6,
        }}
      >
        <SyncDot active={syncEnabled} playing={isYTPlaying} />
        SYNC
      </button>

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

      {/* Offset control */}
      <div className="flex items-center gap-2">
        <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.textMut }}>OFFSET</span>
        <OffsetBtn label="-" onClick={() => onOffsetDelta(-0.5)} />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: C.amber,
            minWidth: '4ch',
            textAlign: 'center',
          }}
        >
          {offsetSec.toFixed(1)}s
        </span>
        <OffsetBtn label="+" onClick={() => onOffsetDelta(0.5)} />
      </div>

      {/* Time + beat display */}
      <div className="ml-auto flex items-center gap-4">
        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: C.textMut }}>
          {formatTime(ytTime)}
        </span>
        {syncEnabled && (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: isYTPlaying ? C.green : C.amber,
            }}
          >
            beat {currentBeat.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}
