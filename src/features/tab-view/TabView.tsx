import { useCallback, useState } from 'react'
import { usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { BModeRenderer } from './BMode/BModeRenderer'
import { AModeRenderer } from './AMode/AModeRenderer'
import { PlaybackControls } from './shared/PlaybackControls'

export function TabView() {
  const { track, currentBeat, currentMeasure, status, mode, loopStart, loopEnd } = usePlaybackState()
  const dispatch = usePlaybackDispatch()
  const [loopFirstClick, setLoopFirstClick] = useState<number | null>(null)

  const handleMeasureClick = useCallback((measureIndex: number) => {
    if (!track) return
    const beatsPerMeasure = track.timeSignature[0]

    // If loop is already active, clear it
    if (loopStart !== null && loopEnd !== null) {
      dispatch({ type: 'SET_LOOP', start: null, end: null })
      setLoopFirstClick(null)
      return
    }

    if (loopFirstClick === null) {
      // First click — remember the measure
      setLoopFirstClick(measureIndex)
    } else {
      // Second click — set loop range
      const a = loopFirstClick
      const b = measureIndex
      const start = Math.min(a, b)
      const end = Math.max(a, b) + 1 // inclusive end measure → beat after last measure
      dispatch({ type: 'SET_LOOP', start: start * beatsPerMeasure, end: end * beatsPerMeasure })
      setLoopFirstClick(null)
    }
  }, [track, loopStart, loopEnd, loopFirstClick, dispatch])

  const clearLoop = useCallback(() => {
    dispatch({ type: 'SET_LOOP', start: null, end: null })
    setLoopFirstClick(null)
  }, [dispatch])

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

  const hasLoop = loopStart !== null && loopEnd !== null
  const beatsPerMeasure = track.timeSignature[0]

  return (
    <div className="flex flex-col gap-3">
      {/* Track title + mode toggle + loop indicator */}
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
          {hasLoop && (
            <button
              onClick={clearLoop}
              className="text-xs px-2 py-0.5 rounded-full transition-all hover:opacity-80"
              style={{ background: 'var(--neon-green)15', color: 'var(--neon-green)', border: '1px solid var(--neon-green)40' }}
            >
              Loop {loopStart! / beatsPerMeasure + 1}-{loopEnd! / beatsPerMeasure} ✕
            </button>
          )}
          {loopFirstClick !== null && !hasLoop && (
            <span className="text-xs px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: 'var(--neon-yellow)15', color: 'var(--neon-yellow)', border: '1px solid var(--neon-yellow)40' }}
            >
              Select end measure...
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
            loopStart={loopStart}
            loopEnd={loopEnd}
            onMeasureClick={handleMeasureClick}
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
