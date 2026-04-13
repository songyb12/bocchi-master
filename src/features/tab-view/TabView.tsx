import { usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { BModeRenderer } from './BMode/BModeRenderer'
import { AModeRenderer } from './AMode/AModeRenderer'
import { PlaybackControls } from './shared/PlaybackControls'

export function TabView() {
  const { track, currentBeat, currentMeasure, status, mode } = usePlaybackState()
  const dispatch = usePlaybackDispatch()

  if (!track) {
    return (
      <div className="flex items-center justify-center h-64"
        style={{ color: 'var(--text-muted)' }}
      >
        Select a track to start
      </div>
    )
  }

  const toggleMode = () => {
    dispatch({ type: 'SET_MODE', mode: mode === 'b-mode' ? 'a-mode' : 'b-mode' })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Track title + mode toggle */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--neon-cyan)' }}>
            {track.title}
          </h2>
          {track.guide && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--neon-purple)20', color: 'var(--neon-purple)', border: '1px solid var(--neon-purple)40' }}
            >
              {track.guide.label}
            </span>
          )}
        </div>
        <button
          onClick={toggleMode}
          className="px-3 py-1 rounded text-xs font-mono transition-all"
          style={{
            background: 'var(--bg-surface-hover)',
            color: mode === 'b-mode' ? 'var(--neon-cyan)' : 'var(--neon-pink)',
            border: `1px solid ${mode === 'b-mode' ? 'var(--neon-cyan)' : 'var(--neon-pink)'}40`,
          }}
        >
          {mode === 'b-mode' ? 'B: Cursor Mode' : 'A: Scroll Mode'}
        </button>
      </div>

      {/* Tab notation */}
      <div className="rounded-lg overflow-hidden neon-border relative"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {mode === 'b-mode' ? (
          <BModeRenderer
            track={track}
            currentBeat={currentBeat}
            currentMeasure={currentMeasure}
            isPlaying={status === 'playing'}
          />
        ) : (
          <AModeRenderer
            track={track}
            currentBeat={currentBeat}
            isPlaying={status === 'playing'}
          />
        )}
      </div>

      {/* Controls */}
      <PlaybackControls />
    </div>
  )
}
