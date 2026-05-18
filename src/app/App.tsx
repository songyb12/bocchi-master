import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlaybackProvider, usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { AudioContextProvider } from '@/core/audio/AudioContextProvider'
import { TabView } from '@/features/tab-view/TabView'
import { Fretboard } from '@/features/fretboard/Fretboard'
import { AudioInputPanel } from '@/features/audio-input/AudioInputPanel'
import { CurriculumScreen } from '@/features/curriculum/CurriculumScreen'
import { SongsView } from '@/features/songs/SongsView'
import { LearnView } from '@/features/learn/LearnView'
import { SessionView } from '@/features/session/SessionView'
import { VocalView } from '@/features/vocal/VocalView'
import { RoutineView } from '@/features/routine/RoutineView'
import { ComboDisplay } from '@/features/tab-view/shared/ComboDisplay'
import { SessionResults } from '@/features/tab-view/shared/SessionResults'
import { HitFeedbackOverlay, useHitFeedback } from '@/features/tab-view/shared/HitFeedback'
import { CountInOverlay } from '@/features/tab-view/shared/CountInOverlay'
import { DEMO_TRACKS, CAGED_TRACKS, drillToTrack } from '@/core/note/TrackLoader'
import { usePlayback } from '@/hooks/usePlayback'
import { useAudioInput } from '@/hooks/useAudioInput'
import { useScoring } from '@/hooks/useScoring'
import type { Drill, Lesson } from '@/data/curriculum'
import { AppRail } from './AppRail'
import { BackToDashboard } from './BackToDashboard'
import { PracticeHome } from './PracticeHome'

type View = 'home' | 'play' | 'songs' | 'curriculum' | 'learn' | 'session' | 'vocal' | 'routine' | 'results'

function AppContent() {
  const { track, currentBeat, status, bpm, mode } = usePlaybackState()
  const dispatch = usePlaybackDispatch()
  const { togglePlay, play, stop, setLoop } = usePlayback()
  const { isListening, pitch } = useAudioInput()
  const scoring = useScoring(track)
  const { items: feedbackItems, showFeedback } = useHitFeedback()
  const [view, setView] = useState<View>('home')
  const [instrument] = useState<'guitar' | 'bass'>('guitar')
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  useEffect(() => {
    if (window.location.hash.includes('audiochord=')) setView('songs')
  }, [])

  // Active notes for fretboard (show during playing AND paused)
  const activeNotes = useMemo(() => {
    if (!track || status === 'stopped') return []
    return track.events.filter(e =>
      currentBeat >= e.time && currentBeat < e.time + e.duration
    )
  }, [track, currentBeat, status])

  // Scoring: evaluate on each beat tick when mic is active
  useEffect(() => {
    if (status !== 'playing' || !isListening || !track) return
    const rating = scoring.evaluate(currentBeat, pitch.midi, bpm)
    if (rating) showFeedback(rating)
  }, [currentBeat, status, isListening, pitch.midi, bpm, track, scoring, showFeedback])

  // When playback ends, show results if mic was active
  useEffect(() => {
    if (status === 'stopped' && scoring.results.length > 0 && view === 'play') {
      setView('results')
    }
  }, [status, scoring.results.length, view])

  // Reset scoring when track changes or playback starts
  useEffect(() => {
    if (status === 'playing') scoring.reset()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view === 'results') return
      const playable = view === 'play' || view === 'songs'
      if (e.code === 'Space' && playable) {
        e.preventDefault()
        togglePlay()
      }
      if (e.code === 'ArrowUp' && playable) {
        e.preventDefault()
        dispatch({ type: 'SET_BPM', bpm: Math.min(300, bpm + 5) })
      }
      if (e.code === 'ArrowDown' && playable) {
        e.preventDefault()
        dispatch({ type: 'SET_BPM', bpm: Math.max(30, bpm - 5) })
      }
      if (e.code === 'KeyM' && playable) {
        dispatch({ type: 'SET_MODE', mode: mode === 'b-mode' ? 'a-mode' : 'b-mode' })
      }
      if (e.code === 'KeyL' && playable) {
        setLoop(null, null) // clear loop
      }
      if (e.code === 'KeyR' && playable) {
        stop()
        setTimeout(() => play(), 50)
      }
      if (e.code === 'Escape' && playable) {
        stop()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, play, stop, setLoop, view, dispatch, bpm, mode])

  const allTracks = useMemo(() => [
    ...DEMO_TRACKS,
    ...CAGED_TRACKS,
  ], [])

  const selectTrack = useCallback((trackId: string) => {
    const t = allTracks.find(t => t.id === trackId)
    if (t) dispatch({ type: 'SET_TRACK', track: t })
    setView('play')
  }, [allTracks, dispatch])

  const handleDrillSelect = useCallback((drill: Drill, _lesson: Lesson) => {
    const t = drillToTrack(drill, instrument)
    dispatch({ type: 'SET_TRACK', track: t })
    setView('play')
  }, [dispatch, instrument])

  const handleRetry = useCallback(() => {
    scoring.reset()
    setView('play')
    setTimeout(() => play(), 100)
  }, [scoring, play])

  const handleCloseResults = useCallback(() => {
    scoring.reset()
    setView('play')
  }, [scoring])

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a' }}>
      <BackToDashboard />
      <AppRail
        active={view}
        onSelect={(id) => { setView(id); if (id !== 'play') scoring.reset() }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-4 p-6 w-full relative min-w-0">
        {view === 'results' && track ? (
          <SessionResults
            results={scoring.results}
            score={scoring.score}
            maxCombo={scoring.maxCombo}
            accuracy={scoring.accuracy}
            trackTitle={track.title}
            onRetry={handleRetry}
            onClose={handleCloseResults}
          />
        ) : view === 'home' ? (
          <PracticeHome
            onQuickStart={() => selectTrack(DEMO_TRACKS[0]?.id ?? '')}
            onOpen={(next) => setView(next)}
          />
        ) : view === 'songs' ? (
          <SongsView />
        ) : view === 'learn' ? (
          <LearnView />
        ) : view === 'session' ? (
          <SessionView />
        ) : view === 'vocal' ? (
          <VocalView />
        ) : view === 'routine' ? (
          <RoutineView />
        ) : view === 'curriculum' ? (
          <CurriculumScreen onSelectDrill={handleDrillSelect} />
        ) : (
          <>
            {/* Track Selector — kiosk amber theme */}
            <div className="flex gap-2 flex-wrap items-center">
              {(['practice', 'caged'] as const).map(cat => {
                const isOpen = openCategory === cat
                const hasSelected = cat === 'caged' && CAGED_TRACKS.some(t => t.id === track?.id)
                const active = isOpen || hasSelected
                return (
                  <button
                    key={cat}
                    onClick={() => setOpenCategory(isOpen ? null : cat)}
                    className="px-3 py-1.5 rounded-md text-xs font-mono transition-all"
                    style={{
                      background: active ? 'rgba(251,188,0,0.12)' : '#1c1b1b',
                      color: active ? '#fbbc00' : '#888',
                      border: `1px solid ${active ? 'rgba(251,188,0,0.4)' : 'transparent'}`,
                    }}
                  >
                    {cat === 'practice' ? 'Practice' : 'CAGED'} {isOpen ? '▾' : '▸'}
                  </button>
                )
              })}
            </div>
            {/* Expanded track list */}
            {openCategory && (
              <div className="flex gap-2 flex-wrap px-1">
                {(openCategory === 'practice' ? DEMO_TRACKS : openCategory === 'caged' ? CAGED_TRACKS : []).map(t => {
                  const isSelected = track?.id === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => { selectTrack(t.id); setOpenCategory(null) }}
                      className="px-3 py-1.5 rounded-md text-xs transition-all"
                      style={{
                        background: isSelected ? 'rgba(251,188,0,0.18)' : '#131313',
                        color: isSelected ? '#fbbc00' : '#aaa',
                        border: `1px solid ${isSelected ? 'rgba(251,188,0,0.4)' : 'transparent'}`,
                      }}
                    >
                      {t.title}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Tab View with overlays */}
            <div className="relative">
              <TabView />
              <HitFeedbackOverlay items={feedbackItems} />
              <CountInOverlay />
            </div>

            {/* Combo Display (during playback with mic) */}
            {status === 'playing' && isListening && (
              <ComboDisplay
                combo={scoring.combo}
                maxCombo={scoring.maxCombo}
                accuracy={scoring.accuracy}
                score={scoring.score}
              />
            )}

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

