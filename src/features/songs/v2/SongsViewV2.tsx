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
 *     Left (~30%): SongListSidebar (instrument toggle + GP tabs + song list)
 *     Right (~70%): YouTube → SyncControlBar → ChordTimeline → TabView →
 *                   Fretboard → StemSeparator
 *
 * Split modules (pure extractions — state/sync logic all lives here):
 *   theme.ts · recentStore.ts · SongRow.tsx · ImportRow.tsx ·
 *   SyncControlBar.tsx · ImportSettingsBar.tsx · SongListSidebar.tsx
 */
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { TabView } from '@/features/tab-view/TabView'
import { Fretboard } from '@/features/fretboard/Fretboard'
import { CountInOverlay } from '@/features/tab-view/shared/CountInOverlay'
import { SONG_CATEGORIES, type SongEntry } from '@/core/note/SongTracks'
import { useYouTubePlayer, YT_STATE, type YouTubeSync } from '@/hooks/useYouTubePlayer'
import {
  createAudioChordPracticeTrack,
  parseAudioChordHandoffFromHash,
  type AudioChordPracticeHandoff,
} from '@/lib/audiochordHandoff'
import { StemSeparator } from '../StemSeparator'
import { StageMode } from '../StageMode'
import { ChordTimeline } from '../ChordTimeline'
import { LeadSheetViewer } from '../LeadSheetViewer'
import { StagesPanel } from '../StagesPanel'
import type { GpLibraryEntry } from '../gpLibrary'
import { C } from './theme'
import {
  songKey,
  loadRecentSongKeys,
  saveRecentSong,
  loadRecentImports,
  saveRecentImport,
} from './recentStore'
import { SongListSidebar } from './SongListSidebar'
import { SyncControlBar } from './SyncControlBar'
import { ImportSettingsBar } from './ImportSettingsBar'

// ── Helpers ───────────────────────────────────────────────────────────────────
function clampBpm(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(30, Math.min(260, Number(n.toFixed(1))))
}

function normalizeKey(value: string): string | null {
  const key = value.trim().slice(0, 16)
  return key || null
}

// ── Main component ────────────────────────────────────────────────────────────
export function SongsViewV2() {
  const { track, currentBeat, status, bpm } = usePlaybackState()
  const dispatch = usePlaybackDispatch()

  const [selectedSong, setSelectedSong] = useState<SongEntry | null>(null)
  const [importedPractice, setImportedPractice] = useState<AudioChordPracticeHandoff | null>(null)
  const [instrument, setInstrument] = useState<'bass' | 'guitar'>('bass')
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [offsetSec, setOffsetSec] = useState(0)
  const [stageMode, setStageMode] = useState(false)
  const [activeChordRoot, setActiveChordRoot] = useState<string | null>(null)
  const [showTab, setShowTab] = useState(true)
  const [recentSongKeys, setRecentSongKeys] = useState<string[]>(() => loadRecentSongKeys())
  const [recentImports, setRecentImports] = useState<AudioChordPracticeHandoff[]>(() => loadRecentImports())
  const [importBpmInput, setImportBpmInput] = useState('')
  const [importKeyInput, setImportKeyInput] = useState('')
  const [selectedGp, setSelectedGp] = useState<GpLibraryEntry | null>(null)

  // Per-song offset persistence — sync drift differs per video upload
  const offsetKey = selectedSong?.youtubeId ? `bocchi.offset.${selectedSong.youtubeId}` : null
  useEffect(() => {
    if (!offsetKey) return
    try {
      const raw = localStorage.getItem(offsetKey)
      if (raw != null) {
        const v = parseFloat(raw)
        if (Number.isFinite(v)) setOffsetSec(v)
        else setOffsetSec(0)
      } else {
        setOffsetSec(0)
      }
    } catch { setOffsetSec(0) }
  }, [offsetKey])

  useEffect(() => {
    if (!offsetKey) return
    try { localStorage.setItem(offsetKey, String(offsetSec)) } catch { /* */ }
  }, [offsetKey, offsetSec])

  // Auto-collapse tab when current track has no events (chord-only practice)
  const trackHasEvents = (track?.events.length ?? 0) > 0
  useEffect(() => {
    setShowTab(trackHasEvents)
  }, [trackHasEvents, selectedSong?.youtubeId, importedPractice?.title])

  const ytContainerRef = useRef<HTMLDivElement>(null)
  const handoffConsumedRef = useRef(false)

  // Stable ref to avoid stale closures in sync callback
  const syncRef = useRef({ enabled: syncEnabled, offset: offsetSec, bpm, track })
  syncRef.current = { enabled: syncEnabled, offset: offsetSec, bpm, track }

  const allTracks = useMemo(() => SONG_CATEGORIES.flatMap(c => c.tracks), [])
  const allSongs = useMemo(() => SONG_CATEGORIES.flatMap(c => c.songs), [])
  const trackById = useMemo(() => new Map(allTracks.map(t => [t.id, t])), [allTracks])

  const recentSongs = useMemo(
    () => recentSongKeys
      .map(key => allSongs.find(song => songKey(song) === key))
      .filter((song): song is SongEntry => !!song),
    [allSongs, recentSongKeys],
  )

  const matchedImportSong = useMemo(() => {
    if (!importedPractice) return null
    return allSongs.find((song) => {
      if (importedPractice.fileId === `yt_${song.youtubeId}`) return true
      const title = importedPractice.title.toLowerCase()
      return title.includes(song.title.toLowerCase())
    }) ?? null
  }, [allSongs, importedPractice])

  const bassReadySongs = useMemo(
    () => allSongs
      .filter(song => (trackById.get(song.bassTrackId)?.events.length ?? 0) > 0)
      .slice(0, 6),
    [allSongs, trackById],
  )

  const getSongTrack = useCallback((song: SongEntry, inst = instrument) => {
    const trackId = inst === 'bass' ? song.bassTrackId : song.guitarTrackId
    return trackById.get(trackId) ?? null
  }, [instrument, trackById])

  const loadImportedPractice = useCallback((handoff: AudioChordPracticeHandoff) => {
    const bpmValue = clampBpm(handoff.bpm) ?? 100
    const keyValue = normalizeKey(handoff.key ?? '') ?? null
    const normalized = { ...handoff, bpm: bpmValue, key: keyValue }
    const importedTrack = createAudioChordPracticeTrack(normalized)

    setImportedPractice(normalized)
    setSelectedSong(null)
    setSelectedGp(null)
    setInstrument('bass')
    setSyncEnabled(false)
    setOffsetSec(0)
    setImportBpmInput(String(bpmValue))
    setImportKeyInput(keyValue ?? '')
    setRecentImports(saveRecentImport(normalized))
    dispatch({ type: 'SET_STATUS', status: 'stopped' })
    dispatch({ type: 'TICK', beat: 0, measure: 0 })
    dispatch({ type: 'SET_TRACK', track: importedTrack })
  }, [dispatch])

  useEffect(() => {
    if (handoffConsumedRef.current) return
    const handoff = parseAudioChordHandoffFromHash()
    if (!handoff) return
    handoffConsumedRef.current = true
    loadImportedPractice(handoff)
  }, [loadImportedPractice])

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
    setImportedPractice(null)
    setSelectedGp(null)
    setSelectedSong(song)
    setRecentSongKeys(saveRecentSong(song))
    setSyncEnabled(true)
    setOffsetSec(0)
    dispatch({ type: 'SET_STATUS', status: 'stopped' })
    dispatch({ type: 'TICK', beat: 0, measure: 0 })
    const t = getSongTrack(song)
    if (t) dispatch({ type: 'SET_TRACK', track: t })
  }, [dispatch, getSongTrack])

  // GP tab from the local library — pure TabView practice (no YouTube/chords).
  const handleGpSelect = useCallback((entry: GpLibraryEntry) => {
    setSelectedSong(null)
    setImportedPractice(null)
    setSelectedGp(entry)
    setSyncEnabled(false)
    dispatch({ type: 'SET_STATUS', status: 'stopped' })
    dispatch({ type: 'TICK', beat: 0, measure: 0 })
    dispatch({ type: 'SET_TRACK', track: entry.track })
  }, [dispatch])

  const handleInstrumentToggle = useCallback((inst: 'guitar' | 'bass') => {
    setInstrument(inst)
    if (selectedSong) {
      const t = getSongTrack(selectedSong, inst)
      if (t) dispatch({ type: 'SET_TRACK', track: t })
    }
  }, [selectedSong, dispatch, getSongTrack])

  const activeNotes = track && status !== 'stopped'
    ? track.events.filter(e => currentBeat >= e.time && currentBeat < e.time + e.duration)
    : []

  const isYTPlaying = ytState === YT_STATE.PLAYING
  const hasPractice = !!selectedSong || !!importedPractice || !!selectedGp
  const practiceBpm = importedPractice?.bpm ?? selectedSong?.bpm ?? bpm
  const practiceKey = selectedSong?.key ?? importedPractice?.key ?? (selectedGp ? 'TAB' : 'AUTO')
  const practiceCurrentTime = importedPractice
    ? Math.max(0, (currentBeat * 60) / Math.max(1, practiceBpm))
    : Math.max(0, ytTime - offsetSec)

  const handleTimelineSeek = useCallback((audioSec: number) => {
    if (importedPractice) {
      const nextBeat = Math.max(0, (audioSec * practiceBpm) / 60)
      dispatch({ type: 'TICK', beat: nextBeat, measure: Math.floor(nextBeat / 4) })
      return
    }
    ytSeek(audioSec + offsetSec)
  }, [dispatch, importedPractice, offsetSec, practiceBpm, ytSeek])

  const applyImportedSettings = useCallback((preset?: { bpm?: number; key?: string | null }) => {
    if (!importedPractice) return
    const bpmValue = clampBpm(preset?.bpm ?? importBpmInput) ?? importedPractice.bpm ?? 100
    const keyValue = normalizeKey(preset?.key ?? importKeyInput)
    const updated = { ...importedPractice, bpm: bpmValue, key: keyValue }
    const seconds = practiceCurrentTime
    const importedTrack = createAudioChordPracticeTrack(updated)

    setImportedPractice(updated)
    setImportBpmInput(String(bpmValue))
    setImportKeyInput(keyValue ?? '')
    setRecentImports(saveRecentImport(updated))
    dispatch({ type: 'SET_TRACK', track: importedTrack })
    dispatch({ type: 'TICK', beat: Math.max(0, (seconds * bpmValue) / 60), measure: Math.floor(Math.max(0, (seconds * bpmValue) / 60) / 4) })
  }, [dispatch, importBpmInput, importKeyInput, importedPractice, practiceCurrentTime])

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
            minHeight: 44,
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
      <div className="bocchi-songs-body flex flex-1 gap-0 min-h-0">

        {/* ── LEFT: Song List ─────────────────────────────────────────────────── */}
        <SongListSidebar
          instrument={instrument}
          selectedSong={selectedSong}
          importedPractice={importedPractice}
          selectedGpTrackId={selectedGp?.track.id ?? null}
          practiceBpm={practiceBpm}
          recentSongs={recentSongs}
          recentImports={recentImports}
          bassReadySongs={bassReadySongs}
          getSongTrack={getSongTrack}
          onToggleInstrument={handleInstrumentToggle}
          onSelectSong={handleSongSelect}
          onSelectImport={loadImportedPractice}
          onSelectGp={handleGpSelect}
        />

        {/* ── RIGHT: Main practice area ────────────────────────────────────────── */}
        <main className="bocchi-song-main flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0">

          {hasPractice ? (
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
                    {selectedSong ? 'Now Practicing' : importedPractice ? 'AudioChord Import' : 'GP Tab'}
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
                    {selectedSong?.title ?? importedPractice?.title ?? selectedGp?.track.title}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: C.textSec, marginTop: 2 }}>
                    {selectedSong?.artist
                      ?? (importedPractice ? `${importedPractice.chords.length} chord segments from AudioChord` : null)
                      ?? (selectedGp ? `${selectedGp.artist ?? selectedGp.fileName} · ${selectedGp.track.events.length} notes` : null)}
                    {importedPractice?.truncated ? ' · trimmed for quick handoff' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.textMut, letterSpacing: '0.1em' }}>BPM</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: C.amber }}>{practiceBpm}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.textMut, letterSpacing: '0.1em' }}>KEY</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: C.rose }}>{practiceKey}</div>
                  </div>
                </div>
              </div>

              {importedPractice && (
                <ImportSettingsBar
                  bpmInput={importBpmInput}
                  keyInput={importKeyInput}
                  onBpmInputChange={setImportBpmInput}
                  onKeyInputChange={setImportKeyInput}
                  onApply={applyImportedSettings}
                  matchedSong={matchedImportSong}
                />
              )}

              {/* YouTube embed card */}
              {selectedSong && (
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
              )}

              {/* Sync controls bar */}
              {selectedSong ? (
                <SyncControlBar
                  syncEnabled={syncEnabled}
                  onToggleSync={() => setSyncEnabled(!syncEnabled)}
                  offsetSec={offsetSec}
                  onOffsetDelta={(delta) =>
                    setOffsetSec(o => delta < 0 ? Math.max(-10, o + delta) : Math.min(60, o + delta))
                  }
                  ytTime={ytTime}
                  currentBeat={currentBeat}
                  isYTPlaying={isYTPlaying}
                />
              ) : (
                <div
                  className="rounded-2xl px-5 py-3"
                  style={{
                    background: C.surface,
                    boxShadow: C.inset,
                    color: C.textSec,
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                  }}
                >
                  Space로 Bocchi 재생 타임라인을 움직이고, 아래 코드 블록을 누르면 해당 위치로 이동합니다.
                </div>
              )}
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

          {/* ── Chord Timeline (AudioChord) — not for GP tabs (no chord source) ── */}
          {(selectedSong || importedPractice) && (
            <ChordTimeline
              youtubeId={selectedSong?.youtubeId ?? null}
              currentTime={practiceCurrentTime}
              onSeek={handleTimelineSeek}
              bpm={practiceBpm}
              timeSignature={track?.timeSignature ?? [4, 4]}
              onActiveRootChange={setActiveChordRoot}
              externalChords={importedPractice?.chords}
              externalDurationSec={importedPractice?.durationSec ?? undefined}
              externalTitle={importedPractice?.title}
            />
          )}

          {/* ── Lead Sheet (AudioChord /transcribe/leadsheet) — needs a library
                file_id, so GP tabs are excluded like the chord timeline ─────── */}
          {(selectedSong || importedPractice) && (
            <LeadSheetViewer
              fileId={selectedSong ? `yt_${selectedSong.youtubeId}` : importedPractice?.fileId ?? null}
              title={selectedSong?.title ?? importedPractice?.title}
            />
          )}

          {/* ── TabView card ───────────────────────────────────────────────────── */}
          {track && (
            <>
              {/* TabView toggle — auto-hidden when track has no events,
                  user can force-show via the small toggle. */}
              <div className="flex items-center justify-between gap-3">
                <div
                  className="font-mono text-[10px]"
                  style={{ color: trackHasEvents ? '#7eff8b' : '#666', letterSpacing: '0.1em' }}
                >
                  {trackHasEvents
                    ? `TAB · ${track.events.length} events`
                    : 'TAB · empty (chord-timeline 학습 권장)'}
                </div>
                <button
                  onClick={() => setShowTab((v) => !v)}
                  className="px-3 py-1 rounded font-mono text-[10px] transition-all"
                  style={{
                    background: showTab ? 'rgba(251,188,0,0.15)' : '#181818',
                    color: showTab ? '#fbbc00' : '#888',
                    border: `1px solid ${showTab ? 'rgba(251,188,0,0.4)' : '#333'}`,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {showTab ? '▼ TAB hide' : '▸ TAB show'}
                </button>
              </div>
              {showTab && (
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
              )}

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
