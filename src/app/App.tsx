import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlaybackProvider, usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { AudioContextProvider } from '@/core/audio/AudioContextProvider'
import { TabView } from '@/features/tab-view/TabView'
import { Fretboard } from '@/features/fretboard/Fretboard'
import { AudioInputPanel } from '@/features/audio-input/AudioInputPanel'
import { CurriculumScreen } from '@/features/curriculum/CurriculumScreen'
import { DEMO_TRACKS } from '@/core/note/TrackLoader'
import { usePlayback } from '@/hooks/usePlayback'
import type { Drill, Lesson } from '@/data/curriculum'

type View = 'play' | 'curriculum'

function AppContent() {
  const { track, currentBeat, status } = usePlaybackState()
  const dispatch = usePlaybackDispatch()
  const { togglePlay } = usePlayback()
  const [view, setView] = useState<View>('play')

  // Active notes for fretboard
  const activeNotes = useMemo(() => {
    if (!track || status !== 'playing') return []
    return track.events.filter(e =>
      currentBeat >= e.time && currentBeat < e.time + e.duration
    )
  }, [track, currentBeat, status])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && view === 'play') {
        e.preventDefault()
        togglePlay()
      }
      if (e.code === 'ArrowUp' && view === 'play') {
        e.preventDefault()
        dispatch({ type: 'SET_BPM', bpm: Math.min(300, (track?.bpm ?? 80) + 5) })
      }
      if (e.code === 'ArrowDown' && view === 'play') {
        e.preventDefault()
        dispatch({ type: 'SET_BPM', bpm: Math.max(30, (track?.bpm ?? 80) - 5) })
      }
      if (e.code === 'KeyM' && view === 'play') {
        const mode = document.querySelector('[data-mode]')?.getAttribute('data-mode')
        dispatch({ type: 'SET_MODE', mode: mode === 'b-mode' ? 'a-mode' : 'b-mode' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, view, dispatch, track])

  const selectTrack = useCallback((trackId: string) => {
    const t = DEMO_TRACKS.find(t => t.id === trackId)
    if (t) dispatch({ type: 'SET_TRACK', track: t })
  }, [dispatch])

  const handleDrillSelect = useCallback((_drill: Drill, _lesson: Lesson) => {
    // TODO: Convert drill to Track and load it
    // For now, load demo track as placeholder
    dispatch({ type: 'SET_TRACK', track: DEMO_TRACKS[0] })
    setView('play')
  }, [dispatch])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: 'var(--bg-surface)', background: 'var(--bg-secondary)' }}
      >
        <h1 className="text-xl font-bold tracking-wider glow-cyan cursor-pointer"
          onClick={() => setView('play')}
        >
          BOCCHI<span style={{ color: 'var(--neon-pink)' }}>MASTER</span>
        </h1>

        {/* Nav */}
        <nav className="flex gap-1">
          <button
            onClick={() => setView('play')}
            className="px-3 py-1.5 rounded text-xs font-mono transition-all"
            style={{
              background: view === 'play' ? 'var(--neon-cyan)15' : 'transparent',
              color: view === 'play' ? 'var(--neon-cyan)' : 'var(--text-muted)',
              border: view === 'play' ? '1px solid var(--neon-cyan)30' : '1px solid transparent',
            }}
          >
            Play
          </button>
          <button
            onClick={() => setView('curriculum')}
            className="px-3 py-1.5 rounded text-xs font-mono transition-all"
            style={{
              background: view === 'curriculum' ? 'var(--neon-cyan)15' : 'transparent',
              color: view === 'curriculum' ? 'var(--neon-cyan)' : 'var(--text-muted)',
              border: view === 'curriculum' ? '1px solid var(--neon-cyan)30' : '1px solid transparent',
            }}
          >
            Curriculum
          </button>
        </nav>

        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>v2.0-dev</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-4 p-6 max-w-5xl mx-auto w-full">
        {view === 'curriculum' ? (
          <CurriculumScreen onSelectDrill={handleDrillSelect} />
        ) : (
          <>
            {/* Track Selector */}
            <div className="flex gap-2 flex-wrap">
              {DEMO_TRACKS.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTrack(t.id)}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: track?.id === t.id ? 'var(--neon-cyan)15' : 'var(--bg-surface)',
                    color: track?.id === t.id ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                    border: track?.id === t.id ? '1px solid var(--neon-cyan)40' : '1px solid transparent',
                  }}
                >
                  {t.title}
                </button>
              ))}
            </div>

            {/* Tab View */}
            <TabView />

            {/* Fretboard */}
            {track && (
              <div className="rounded-lg overflow-hidden neon-border"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <Fretboard
                  tuning={track.tuning}
                  activeNotes={activeNotes}
                  guide={track.guide}
                />
              </div>
            )}

            {/* Audio Input */}
            <AudioInputPanel />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-2" style={{ color: 'var(--text-muted)' }}>
        <span className="text-xs font-mono">
          {view === 'play' ? 'Space: Play/Stop \u00B7 \u2191\u2193: BPM \u00B7 M: Mode' : 'Select a drill to start'}
        </span>
      </footer>
    </div>
  )
}

export function App() {
  return (
    <AudioContextProvider>
      <PlaybackProvider>
        <AppContent />
      </PlaybackProvider>
    </AudioContextProvider>
  )
}
