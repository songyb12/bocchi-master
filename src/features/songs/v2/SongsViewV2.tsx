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
import { StagesPanel } from '../StagesPanel'
import { GpTabPanel } from '../GpTabPanel'
import type { GpLibraryEntry } from '../gpLibrary'

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

const RECENT_SONGS_KEY = 'bocchi.songs.recent'
const RECENT_IMPORTS_KEY = 'bocchi.audiochord.recent'
const MAX_RECENT_SONGS = 5
const MAX_RECENT_IMPORTS = 4

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function songKey(song: SongEntry): string {
  return `${song.artist}::${song.title}`
}

function handoffKey(handoff: AudioChordPracticeHandoff): string {
  return handoff.fileId || `${handoff.title}::${handoff.durationSec ?? 0}`
}

function clampBpm(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(30, Math.min(260, Number(n.toFixed(1))))
}

function normalizeKey(value: string): string | null {
  const key = value.trim().slice(0, 16)
  return key || null
}

function isStoredHandoff(value: unknown): value is AudioChordPracticeHandoff {
  if (!value || typeof value !== 'object') return false
  const handoff = value as AudioChordPracticeHandoff
  return handoff.source === 'audiochord'
    && typeof handoff.title === 'string'
    && Array.isArray(handoff.chords)
    && handoff.chords.length > 0
}

function loadRecentSongKeys(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SONGS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function saveRecentSong(song: SongEntry): string[] {
  const next = [songKey(song), ...loadRecentSongKeys().filter(key => key !== songKey(song))]
    .slice(0, MAX_RECENT_SONGS)
  try { localStorage.setItem(RECENT_SONGS_KEY, JSON.stringify(next)) } catch { /* */ }
  return next
}

function loadRecentImports(): AudioChordPracticeHandoff[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_IMPORTS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isStoredHandoff).slice(0, MAX_RECENT_IMPORTS) : []
  } catch {
    return []
  }
}

function saveRecentImport(handoff: AudioChordPracticeHandoff): AudioChordPracticeHandoff[] {
  const next = [handoff, ...loadRecentImports().filter(item => handoffKey(item) !== handoffKey(handoff))]
    .slice(0, MAX_RECENT_IMPORTS)
  try { localStorage.setItem(RECENT_IMPORTS_KEY, JSON.stringify(next)) } catch { /* */ }
  return next
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

  const renderImportRow = (handoff: AudioChordPracticeHandoff) => {
    const isActive = importedPractice && handoffKey(importedPractice) === handoffKey(handoff)
    return (
      <button
        key={`import-${handoffKey(handoff)}`}
        onClick={() => loadImportedPractice(handoff)}
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
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isActive ? C.amber : C.green,
            opacity: isActive ? 1 : 0.7,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? C.amber : C.textPri,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {handoff.title}
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.65rem',
              color: C.textMut,
              marginTop: 2,
            }}
          >
            {handoff.chords.length} chords · {handoff.fileId ?? 'audio'}
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
          <div>{handoff.key ?? 'AUTO'}</div>
          <div>{handoff.bpm ?? '-'}<span style={{ opacity: 0.6 }}>bpm</span></div>
        </div>
      </button>
    )
  }

  const renderSongRow = (song: SongEntry, variant: 'default' | 'recent' | 'ready' = 'default') => {
    const isActive = selectedSong?.title === song.title
    const practiceTrack = getSongTrack(song)
    const hasPlayableTab = (practiceTrack?.events.length ?? 0) > 0
    const badge = hasPlayableTab ? (instrument === 'bass' ? 'BASS TAB' : 'TAB') : 'ROOTS'
    const rowAccent = variant === 'recent' ? C.green : variant === 'ready' ? C.rose : C.amber

    return (
      <button
        key={`${variant}-${songKey(song)}`}
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
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isActive ? C.amber : rowAccent,
            opacity: isActive ? 1 : 0.65,
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: isActive ? 'Georgia, "Times New Roman", serif' : 'inherit',
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'monospace',
              fontSize: '0.65rem',
              color: C.textMut,
              marginTop: 2,
              minWidth: 0,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {song.artist}
            </span>
            <span
              style={{
                color: hasPlayableTab ? C.green : C.textMut,
                border: `1px solid ${hasPlayableTab ? C.greenBd : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 999,
                padding: '1px 5px',
                fontSize: '0.55rem',
                flexShrink: 0,
              }}
            >
              {badge}
            </span>
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
  }

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
      <div className="bocchi-songs-body flex flex-1 gap-0 min-h-0">

        {/* ── LEFT: Song List ─────────────────────────────────────────────────── */}
        <aside
          className="bocchi-song-rail flex flex-col"
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
            {recentImports.length > 0 && (
              <div>
                <div
                  className="px-4 py-2"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    color: C.green,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    marginTop: 8,
                  }}
                >
                  Recent AudioChord
                </div>
                {recentImports.map(renderImportRow)}
              </div>
            )}
            {importedPractice && (
              <div>
                <div
                  className="px-4 py-2"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    color: C.amber,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    marginTop: 8,
                  }}
                >
                  AudioChord Import
                </div>
                <button
                  className="w-full text-left"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: C.amberDim,
                    borderLeft: `3px solid ${C.amber}`,
                    cursor: 'default',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: C.amber,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontStyle: 'italic',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: C.amber,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {importedPractice.title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        color: C.textMut,
                        marginTop: 2,
                      }}
                    >
                      {importedPractice.chords.length} chord segments
                      {importedPractice.truncated ? ' · trimmed' : ''}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.62rem',
                      color: C.amber,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    <div>AUTO</div>
                    <div>{practiceBpm}<span style={{ opacity: 0.6 }}>bpm</span></div>
                  </div>
                </button>
              </div>
            )}
            <GpTabPanel
              activeTrackId={selectedGp?.track.id ?? null}
              onSelect={handleGpSelect}
            />
            {recentSongs.length > 0 && (
              <div>
                <div
                  className="px-4 py-2"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    color: C.green,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    marginTop: 8,
                  }}
                >
                  Recent Practice
                </div>
                {recentSongs.map(song => renderSongRow(song, 'recent'))}
              </div>
            )}
            {bassReadySongs.length > 0 && (
              <div>
                <div
                  className="px-4 py-2"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    color: C.rose,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    marginTop: 8,
                  }}
                >
                  Bass-ready Tabs
                </div>
                {bassReadySongs.map(song => renderSongRow(song, 'ready'))}
              </div>
            )}
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
                {cat.songs.map(song => renderSongRow(song))}
              </div>
            ))}
          </div>
        </aside>

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
                <div
                  className="flex items-center gap-3 rounded-2xl px-5 py-3 flex-wrap"
                  style={{
                    background: C.surface,
                    boxShadow: C.inset,
                    border: `1px solid rgba(113,220,143,0.16)`,
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: C.green, fontWeight: 700 }}>
                    IMPORT SETTINGS
                  </span>
                  <label className="flex items-center gap-2" style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: C.textSec }}>
                    BPM
                    <input
                      value={importBpmInput}
                      onChange={(event) => setImportBpmInput(event.target.value)}
                      inputMode="decimal"
                      style={{
                        width: 76,
                        height: 30,
                        borderRadius: 7,
                        border: `1px solid rgba(255,255,255,0.1)`,
                        background: C.surface2,
                        color: C.textPri,
                        padding: '0 8px',
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-2" style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: C.textSec }}>
                    KEY
                    <input
                      value={importKeyInput}
                      onChange={(event) => setImportKeyInput(event.target.value)}
                      placeholder="Em"
                      style={{
                        width: 70,
                        height: 30,
                        borderRadius: 7,
                        border: `1px solid rgba(255,255,255,0.1)`,
                        background: C.surface2,
                        color: C.textPri,
                        padding: '0 8px',
                      }}
                    />
                  </label>
                  <button
                    onClick={() => applyImportedSettings()}
                    style={{
                      minHeight: 30,
                      borderRadius: 7,
                      border: `1px solid ${C.greenBd}`,
                      background: C.greenDim,
                      color: C.green,
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0 10px',
                    }}
                  >
                    Apply
                  </button>
                  {matchedImportSong && (
                    <button
                      onClick={() => applyImportedSettings({ bpm: matchedImportSong.bpm, key: matchedImportSong.key })}
                      style={{
                        minHeight: 30,
                        borderRadius: 7,
                        border: `1px solid ${C.amberBd}`,
                        background: C.amberDim,
                        color: C.amber,
                        fontFamily: 'monospace',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0 10px',
                      }}
                    >
                      Use catalog {matchedImportSong.bpm}bpm / {matchedImportSong.key}
                    </button>
                  )}
                </div>
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
                  className="px-2 py-1 rounded font-mono text-[10px] transition-all"
                  style={{
                    background: showTab ? 'rgba(251,188,0,0.15)' : '#181818',
                    color: showTab ? '#fbbc00' : '#888',
                    border: `1px solid ${showTab ? 'rgba(251,188,0,0.4)' : '#333'}`,
                    cursor: 'pointer',
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
