/**
 * SongsViewV2 — "Amplified Underground" redesign
 *
 * Visual language from Stitch design:
 *   - Background: #0a0a0a (near-black)
 *   - Surface cards: #1c1b1b / #131313
 *   - Primary accent: amber #fbbc00 (active row, highlights)
 *   - Secondary accent: rose #ffb2be
 *   - Serif italic display font for brand/headers
 *   - Monospace for data (bpm, key, time)
 *   - Generous padding, rounded-2xl cards, subtle inset shadows
 *
 * Layout:
 *   Top bar: BocchiMaster brand (serif italic) + Stage Mode button
 *   Body: two-column
 *     Left (~30%): song list grouped by category
 *     Right (~70%): YouTube → sync bar → TabView → Fretboard → StemSeparator
 */
import { useState, useCallback, useRef, useMemo } from 'react'
import { usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { TabView } from '@/features/tab-view/TabView'
import { Fretboard } from '@/features/fretboard/Fretboard'
import { CountInOverlay } from '@/features/tab-view/shared/CountInOverlay'
import { SONG_CATEGORIES, type SongEntry } from '@/core/note/SongTracks'
import { useYouTubePlayer, YT_STATE, type YouTubeSync } from '@/hooks/useYouTubePlayer'
import { StemSeparator } from '../StemSeparator'
import { StageMode } from '../StageMode'
import { ChordTimeline } from '../ChordTimeline'
import { StagesPanel } from '../StagesPanel'

// ── Color tokens (Amplified Underground) ─────────────────────────────────────
const C = {
  bg:        '#0a0a0a',
  surface:   '#1c1b1b',
  surface2:  '#131313',
  card:      '#161616',
  amber:     '#fbbc00',
  amberDim:  'rgba(251,188,0,0.12)',
  amberBd:   'rgba(251,188,0,0.3)',
  rose:      '#ffb2be',
  roseDim:   'rgba(255,178,190,0.12)',
  roseBd:    'rgba(255,178,190,0.3)',
  green:     '#71dc8f',
  greenDim:  'rgba(113,220,143,0.12)',
  greenBd:   'rgba(113,220,143,0.3)',
  textPri:   '#f0f0f0',
  textSec:   '#888888',
  textMut:   '#555555',
  inset:     'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

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
        width: 24,
        height: 24,
        borderRadius: 6,
        background: C.surface,
        color: C.textSec,
        border: `1px solid rgba(255,255,255,0.08)`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function SongsViewV2() {
  const { track, currentBeat, status, bpm } = usePlaybackState()
  const dispatch = usePlaybackDispatch()

  const [selectedSong, setSelectedSong] = useState<SongEntry | null>(null)
  const [instrument, setInstrument] = useState<'bass' | 'guitar'>('bass')
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [offsetSec, setOffsetSec] = useState(0)
  const [stageMode, setStageMode] = useState(false)
  const [activeChordRoot, setActiveChordRoot] = useState<string | null>(null)

  const ytContainerRef = useRef<HTMLDivElement>(null)

  // Stable ref to avoid stale closures in sync callback
  const syncRef = useRef({ enabled: syncEnabled, offset: offsetSec, bpm, track })
  syncRef.current = { enabled: syncEnabled, offset: offsetSec, bpm, track }

  const allTracks = useMemo(() => SONG_CATEGORIES.flatMap(c => c.tracks), [])

  // YouTube sync callback — called every animation frame by the hook
  const handleSync = useCallback((sync: YouTubeSync) => {
    const { enabled, offset, bpm: curBpm, track: curTrack } = syncRef.current
    if (!enabled || !curTrack) return

    const adjustedTime = sync.currentTime - offset
    if (adjustedTime < 0) {
      dispatch({ type: 'TICK', beat: 0, measure: 0 })
      if (sync.isPlaying) dispatch({ type: 'SET_STATUS', status: 'playing' })
      return
    }

    const beat = (adjustedTime * curBpm) / 60
    const bpMeasure = curTrack.timeSignature[0]
    const totalBeats = curTrack.measures.length * bpMeasure
    const clampedBeat = Math.min(beat, totalBeats - 0.01)
    const measure = Math.floor(clampedBeat / bpMeasure)

    dispatch({ type: 'TICK', beat: clampedBeat, measure })
    if (sync.isPlaying) {
      dispatch({ type: 'SET_STATUS', status: 'playing' })
    } else {
      dispatch({ type: 'SET_STATUS', status: 'paused' })
    }
  }, [dispatch])

  const { state: ytState, currentTime: ytTime, seekTo: ytSeek } = useYouTubePlayer(
    ytContainerRef,
    selectedSong?.youtubeId ?? null,
    { onSync: handleSync },
  )

  const handleSongSelect = useCallback((song: SongEntry) => {
    setSelectedSong(song)
    setOffsetSec(0)
    dispatch({ type: 'SET_STATUS', status: 'stopped' })
    dispatch({ type: 'TICK', beat: 0, measure: 0 })
    const trackId = instrument === 'bass' ? song.bassTrackId : song.guitarTrackId
    const t = allTracks.find(tr => tr.id === trackId)
    if (t) dispatch({ type: 'SET_TRACK', track: t })
  }, [instrument, allTracks, dispatch])

  const handleInstrumentToggle = useCallback((inst: 'guitar' | 'bass') => {
    setInstrument(inst)
    if (selectedSong) {
      const trackId = inst === 'bass' ? selectedSong.bassTrackId : selectedSong.guitarTrackId
      const t = allTracks.find(tr => tr.id === trackId)
      if (t) dispatch({ type: 'SET_TRACK', track: t })
    }
  }, [selectedSong, allTracks, dispatch])

  const activeNotes = track && status !== 'stopped'
    ? track.events.filter(e => currentBeat >= e.time && currentBeat < e.time + e.duration)
    : []

  const isYTPlaying = ytState === YT_STATE.PLAYING

  if (stageMode) {
    return <StageMode onExit={() => setStageMode(false)} />
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: C.bg, color: C.textPri }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{
          background: C.surface2,
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          boxShadow: '0 1px 0 rgba(0,0,0,0.5)',
        }}
      >
        {/* Brand */}
        <div className="flex items-baseline gap-3">
          <span
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: C.amber,
              letterSpacing: '-0.01em',
            }}
          >
            BocchiMaster
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: C.textMut,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Practice
          </span>
        </div>

        {/* Stage Mode button */}
        <button
          onClick={() => setStageMode(true)}
          className="flex items-center gap-2 transition-all"
          style={{
            background: C.amberDim,
            border: `1px solid ${C.amberBd}`,
            color: C.amber,
            borderRadius: 10,
            padding: '6px 16px',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          <span style={{ fontSize: '0.65rem' }}>▶</span>
          Stage Mode
        </button>
      </header>

      {/* ── Body: two columns ────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-0 min-h-0">

        {/* ── LEFT: Song List ─────────────────────────────────────────────────── */}
        <aside
          className="flex flex-col"
          style={{
            width: '300px',
            minWidth: '220px',
            maxWidth: '320px',
            background: C.surface2,
            borderRight: `1px solid rgba(255,255,255,0.06)`,
            flexShrink: 0,
          }}
        >
          {/* Instrument toggle */}
          <div
            className="flex gap-2 p-4"
            style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}
          >
            <button
              onClick={() => handleInstrumentToggle('bass')}
              className="flex-1 transition-all"
              style={{
                background: instrument === 'bass' ? C.amberDim : 'rgba(255,255,255,0.04)',
                border: `1px solid ${instrument === 'bass' ? C.amberBd : 'rgba(255,255,255,0.07)'}`,
                color: instrument === 'bass' ? C.amber : C.textSec,
                borderRadius: 8,
                padding: '6px 0',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Bass
            </button>
            <button
              onClick={() => handleInstrumentToggle('guitar')}
              className="flex-1 transition-all"
              style={{
                background: instrument === 'guitar' ? C.roseDim : 'rgba(255,255,255,0.04)',
                border: `1px solid ${instrument === 'guitar' ? C.roseBd : 'rgba(255,255,255,0.07)'}`,
                color: instrument === 'guitar' ? C.rose : C.textSec,
                borderRadius: 8,
                padding: '6px 0',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Guitar
            </button>
          </div>

          {/* Song list header */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
          >
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: C.amber,
              }}
            >
              Song Selection
            </span>
            <p style={{ margin: '2px 0 0', fontFamily: 'monospace', fontSize: '0.65rem', color: C.textMut }}>
              Pick your next rehearsal track
            </p>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 16 }}>
            {SONG_CATEGORIES.map(cat => (
              <div key={cat.name}>
                {/* Category label */}
                <div
                  className="px-4 py-2"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    color: C.textMut,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    marginTop: 8,
                  }}
                >
                  {cat.name}
                </div>

                {/* Song rows */}
                {cat.songs.map(song => {
                  const isActive = selectedSong?.title === song.title
                  return (
                    <button
                      key={song.title}
                      onClick={() => handleSongSelect(song)}
                      className="w-full text-left transition-all"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        background: isActive ? C.amberDim : 'transparent',
                        borderLeft: isActive ? `3px solid ${C.amber}` : '3px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Active indicator dot */}
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isActive ? C.amber : C.textMut,
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: isActive
                              ? 'Georgia, "Times New Roman", serif'
                              : 'inherit',
                            fontStyle: isActive ? 'italic' : 'normal',
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? C.amber : C.textPri,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {song.title}
                        </div>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.65rem',
                            color: C.textMut,
                            marginTop: 2,
                          }}
                        >
                          {song.artist}
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.62rem',
                          color: isActive ? C.amber : C.textMut,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        <div>{song.key}</div>
                        <div>{song.bpm}<span style={{ opacity: 0.6 }}>bpm</span></div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT: Main practice area ────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0">

          {selectedSong ? (
            <>
              {/* Song meta banner */}
              <div
                className="flex items-center justify-between rounded-2xl px-6 py-4"
                style={{
                  background: C.surface,
                  boxShadow: C.inset,
                }}
              >
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.textMut, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Now Practicing
                  </div>
                  <div
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontStyle: 'italic',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: C.textPri,
                      marginTop: 2,
                    }}
                  >
                    {selectedSong.title}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: C.textSec, marginTop: 2 }}>
                    {selectedSong.artist}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.textMut, letterSpacing: '0.1em' }}>BPM</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: C.amber }}>{selectedSong.bpm}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.textMut, letterSpacing: '0.1em' }}>KEY</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: C.rose }}>{selectedSong.key}</div>
                  </div>
                </div>
              </div>

              {/* YouTube embed card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#000',
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6)`,
                  aspectRatio: '16 / 9',
                }}
              >
                <div ref={ytContainerRef} className="w-full h-full" />
              </div>

              {/* Sync controls bar */}
              <div
                className="flex items-center gap-4 rounded-2xl px-5 py-3"
                style={{
                  background: C.surface,
                  boxShadow: C.inset,
                }}
              >
                {/* Sync toggle */}
                <button
                  onClick={() => setSyncEnabled(!syncEnabled)}
                  className="flex items-center gap-2 transition-all"
                  style={{
                    background: syncEnabled ? C.greenDim : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${syncEnabled ? C.greenBd : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8,
                    padding: '5px 12px',
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
                  <OffsetBtn label="-" onClick={() => setOffsetSec(o => Math.max(-10, o - 0.5))} />
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
                  <OffsetBtn label="+" onClick={() => setOffsetSec(o => Math.min(60, o + 0.5))} />
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
            </>
          ) : (
            /* Empty state */
            <div
              className="flex flex-col items-center justify-center rounded-2xl"
              style={{
                background: C.surface,
                minHeight: 280,
                border: `1px dashed rgba(255,255,255,0.1)`,
              }}
            >
              <div
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '1.2rem',
                  color: C.amber,
                  marginBottom: 8,
                }}
              >
                Select a track to begin
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: C.textMut }}>
                Choose a song from the list on the left
              </div>
            </div>
          )}

          {/* ── Stage selector (PR-2: UI only; PR-3 wires generators) ───────────── */}
          {selectedSong && <StagesPanel />}

          {/* ── Chord Timeline (AudioChord) ────────────────────────────────────── */}
          {selectedSong && (
            <ChordTimeline
              youtubeId={selectedSong.youtubeId ?? null}
              currentTime={ytTime}
              onSeek={ytSeek}
              bpm={selectedSong.bpm}
              timeSignature={track?.timeSignature ?? [4, 4]}
              onActiveRootChange={setActiveChordRoot}
            />
          )}

          {/* ── TabView card ───────────────────────────────────────────────────── */}
          {track && (
            <>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: C.surface,
                  boxShadow: C.inset,
                  padding: '4px',
                }}
              >
                <div className="relative">
                  <TabView />
                  <CountInOverlay />
                </div>
              </div>

              {/* ── Fretboard card ─────────────────────────────────────────────── */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: C.surface2,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.06)`,
                }}
              >
                <Fretboard
                  tuning={track.tuning}
                  activeNotes={activeNotes}
                  guide={track.guide}
                  bassRootHints={
                    instrument === 'bass' && activeChordRoot
                      ? [activeChordRoot]
                      : undefined
                  }
                />
              </div>
            </>
          )}

          {/* ── Stem Separator (collapsed at bottom) ────────────────────────────── */}
          <StemSeparator />
        </main>
      </div>
    </div>
  )
}
