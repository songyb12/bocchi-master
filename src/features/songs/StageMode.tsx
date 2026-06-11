/**
 * Stage Mode — 10-foot TV layout for bass/guitar practice.
 *
 * Why exist: SongsView is built for desk+mouse. This mode trades feature density
 * for huge type, generous spacing, and arrow-key navigation so the same UI works
 * with a TV remote (LG Magic Remote arrows + OK arrive as keyboard events) or a
 * wireless keyboard from the couch.
 *
 * Keymap (works for both TV remote and PC keyboard):
 *   ← / →  : prev / next measure (jumps playhead by one bar)
 *   ↑ / ↓  : prev / next song (in current category)
 *   Enter  : play / pause
 *   Esc    : exit Stage Mode
 *   m      : toggle song picker overlay
 *   b      : swap instrument bass <-> guitar
 *   , / .  : sync offset −/+0.5s (persisted per song, shared with SongsView)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { usePlayback } from '@/hooks/usePlayback'
import { TabView } from '@/features/tab-view/TabView'
import { Fretboard } from '@/features/fretboard/Fretboard'
import { CountInOverlay } from '@/features/tab-view/shared/CountInOverlay'
import { SONG_CATEGORIES, type SongEntry } from '@/core/note/SongTracks'
import { useYouTubePlayer, YT_STATE, type YouTubeSync } from '@/hooks/useYouTubePlayer'

interface StageModeProps {
  onExit: () => void
}

interface FlatSong {
  song: SongEntry
  category: string
  index: number
}

export function StageMode({ onExit }: StageModeProps) {
  const { track, currentBeat, currentMeasure, status, bpm } = usePlaybackState()
  const dispatch = usePlaybackDispatch()
  const { togglePlay } = usePlayback()
  const ytContainerRef = useRef<HTMLDivElement>(null)

  const allTracks = useMemo(() => SONG_CATEGORIES.flatMap(c => c.tracks), [])
  const flatSongs: FlatSong[] = useMemo(
    () => SONG_CATEGORIES.flatMap(c => c.songs.map((song, i) => ({ song, category: c.name, index: i }))),
    [],
  )

  const [songIdx, setSongIdx] = useState(0)
  const [instrument, setInstrument] = useState<'bass' | 'guitar'>('bass')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [syncEnabled] = useState(true)
  const [offsetSec, setOffsetSec] = useState(0)

  const currentSong = flatSongs[songIdx]?.song ?? null

  // Per-song sync offset — same `bocchi.offset.{youtubeId}` key as SongsView,
  // so a drift calibrated at the desk carries over to the stage (and back).
  const offsetKey = currentSong?.youtubeId ? `bocchi.offset.${currentSong.youtubeId}` : null
  useEffect(() => {
    if (!offsetKey) { setOffsetSec(0); return }
    try {
      const raw = localStorage.getItem(offsetKey)
      const v = raw != null ? parseFloat(raw) : NaN
      setOffsetSec(Number.isFinite(v) ? v : 0)
    } catch { setOffsetSec(0) }
  }, [offsetKey])

  useEffect(() => {
    if (!offsetKey) return
    try { localStorage.setItem(offsetKey, String(offsetSec)) } catch { /* */ }
  }, [offsetKey, offsetSec])

  const nudgeOffset = useCallback((delta: number) => {
    setOffsetSec(o => Math.max(-10, Math.min(60, Math.round((o + delta) * 10) / 10)))
  }, [])

  const loadSongTrack = useCallback((song: SongEntry, inst: 'bass' | 'guitar') => {
    const trackId = inst === 'bass' ? song.bassTrackId : song.guitarTrackId
    const t = allTracks.find(tr => tr.id === trackId)
    if (t) {
      dispatch({ type: 'SET_TRACK', track: t })
      dispatch({ type: 'SET_STATUS', status: 'stopped' })
      dispatch({ type: 'TICK', beat: 0, measure: 0 })
    }
  }, [allTracks, dispatch])

  // Load track whenever song or instrument changes
  useEffect(() => {
    if (currentSong) loadSongTrack(currentSong, instrument)
  }, [currentSong, instrument, loadSongTrack])

  // YouTube sync — same logic as SongsView
  const syncRef = useRef({ enabled: syncEnabled, offset: offsetSec, bpm, track })
  syncRef.current = { enabled: syncEnabled, offset: offsetSec, bpm, track }

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
    dispatch({ type: 'SET_STATUS', status: sync.isPlaying ? 'playing' : 'paused' })
  }, [dispatch])

  const { state: ytState, seekTo: ytSeek } = useYouTubePlayer(
    ytContainerRef,
    currentSong?.youtubeId ?? null,
    { onSync: handleSync },
  )

  // Active notes for fretboard
  const activeNotes = useMemo(() => {
    if (!track || status === 'stopped') return []
    return track.events.filter(e => currentBeat >= e.time && currentBeat < e.time + e.duration)
  }, [track, currentBeat, status])

  // Jump playhead by N measures (uses YouTube seek if available, else just dispatches)
  const jumpMeasures = useCallback((delta: number) => {
    if (!track) return
    const bpMeasure = track.timeSignature[0]
    const targetMeasure = Math.max(0, Math.min(track.measures.length - 1, currentMeasure + delta))
    const targetBeat = targetMeasure * bpMeasure
    if (currentSong) {
      const targetSec = (targetBeat * 60) / bpm + offsetSec
      try { ytSeek(Math.max(0, targetSec)) } catch {}
    }
    dispatch({ type: 'TICK', beat: targetBeat, measure: targetMeasure })
  }, [track, currentMeasure, currentSong, bpm, offsetSec, ytSeek, dispatch])

  const stepSong = useCallback((delta: number) => {
    setSongIdx(idx => {
      const next = idx + delta
      if (next < 0) return 0
      if (next >= flatSongs.length) return flatSongs.length - 1
      return next
    })
  }, [flatSongs.length])

  // Keyboard / TV-remote handler.
  // Capture-phase + stopImmediatePropagation so App.tsx's window keydown handler
  // (Space/ArrowUp/ArrowDown/M for BPM and tab-mode toggling) doesn't also fire.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const handled = (action: () => void) => {
        e.preventDefault()
        e.stopImmediatePropagation()
        action()
      }
      if (pickerOpen) {
        if (e.code === 'ArrowUp')   return handled(() => setSongIdx(i => Math.max(0, i - 1)))
        if (e.code === 'ArrowDown') return handled(() => setSongIdx(i => Math.min(flatSongs.length - 1, i + 1)))
        if (e.code === 'Enter')     return handled(() => setPickerOpen(false))
        if (e.code === 'Escape' || e.code === 'KeyM') return handled(() => setPickerOpen(false))
        return
      }
      if (e.code === 'ArrowLeft')  return handled(() => jumpMeasures(-1))
      if (e.code === 'ArrowRight') return handled(() => jumpMeasures(1))
      if (e.code === 'ArrowUp')    return handled(() => stepSong(-1))
      if (e.code === 'ArrowDown')  return handled(() => stepSong(1))
      if (e.code === 'Enter')      return handled(() => togglePlay())
      if (e.code === 'Space')      return handled(() => togglePlay())
      if (e.code === 'KeyM')       return handled(() => setPickerOpen(true))
      if (e.code === 'KeyB')       return handled(() => setInstrument(i => i === 'bass' ? 'guitar' : 'bass'))
      if (e.code === 'Comma')      return handled(() => nudgeOffset(-0.5))
      if (e.code === 'Period')     return handled(() => nudgeOffset(0.5))
      if (e.code === 'Escape')     return handled(() => onExit())
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [pickerOpen, flatSongs.length, jumpMeasures, stepSong, togglePlay, onExit, nudgeOffset])

  const isYTPlaying = ytState === YT_STATE.PLAYING
  const totalMeasures = track?.measures.length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col text-white"
      style={{ background: '#0a0a0a' }}
    >
      {/* Top header — song meta */}
      <header className="flex items-center justify-between px-10 py-4"
        style={{ background: '#131313' }}
      >
        <div className="flex items-baseline gap-4">
          <span className="text-2xl font-serif italic" style={{ color: '#fbbc00' }}>BocchiMaster</span>
          <span className="text-sm uppercase tracking-widest" style={{ color: '#888' }}>Stage</span>
        </div>
        {currentSong && (
          <div className="flex items-baseline gap-6 text-right">
            <div>
              <div className="text-2xl font-bold">{currentSong.title}</div>
              <div className="text-sm" style={{ color: '#aaa' }}>{currentSong.artist}</div>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm font-mono" style={{ color: '#fbbc00' }}>
              <span>{currentSong.bpm} BPM</span>
              <span>KEY {currentSong.key}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main split: 65% tab/fretboard / 35% video + controls */}
      <main className="flex-1 flex gap-6 px-10 py-6 min-h-0">
        {/* LEFT — measure indicator + TabView + Fretboard */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Big measure indicator */}
          <div className="flex items-center justify-between rounded-2xl px-8 py-6"
            style={{ background: '#1c1b1b' }}
          >
            <div>
              <div className="text-xs uppercase tracking-widest" style={{ color: '#888' }}>Current Measure</div>
              <div className="text-7xl font-serif font-bold" style={{ color: '#fbbc00' }}>
                {totalMeasures > 0 ? `${currentMeasure + 1}` : '—'}
                <span className="text-3xl" style={{ color: '#666' }}> / {totalMeasures}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest" style={{ color: '#888' }}>Beat</div>
              <div className="text-5xl font-mono" style={{ color: '#ffb2be' }}>
                {currentBeat.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Reuse TabView at larger scale via outer scaling. Wrapped in card. */}
          <div className="flex-1 rounded-2xl p-6 overflow-auto min-h-0"
            style={{ background: '#1c1b1b' }}
          >
            <div className="relative" style={{ fontSize: '1.25rem' }}>
              <TabView />
              <CountInOverlay />
            </div>
          </div>

          {/* Fretboard */}
          {track && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#131313' }}
            >
              <Fretboard
                tuning={track.tuning}
                activeNotes={activeNotes}
                guide={track.guide}
              />
            </div>
          )}
        </div>

        {/* RIGHT — YouTube + instrument toggle + status */}
        <aside className="w-[420px] flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#000', aspectRatio: '16 / 9' }}
          >
            <div ref={ytContainerRef} className="w-full h-full" />
          </div>

          {/* Big instrument toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setInstrument('bass')}
              className="rounded-xl py-4 text-xl font-bold transition-all"
              style={{
                background: instrument === 'bass' ? '#fbbc00' : '#2a2a2a',
                color: instrument === 'bass' ? '#000' : '#aaa',
              }}
            >Bass</button>
            <button
              onClick={() => setInstrument('guitar')}
              className="rounded-xl py-4 text-xl font-bold transition-all"
              style={{
                background: instrument === 'guitar' ? '#ffb2be' : '#2a2a2a',
                color: instrument === 'guitar' ? '#000' : '#aaa',
              }}
            >Guitar</button>
          </div>

          {/* Play/pause big button */}
          <button
            onClick={togglePlay}
            className="rounded-2xl py-8 text-3xl font-bold transition-all"
            style={{
              background: isYTPlaying ? '#ffb2be' : '#fbbc00',
              color: '#000',
            }}
          >
            {isYTPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          {/* Sync indicator */}
          <div className="rounded-xl px-4 py-3 text-sm font-mono"
            style={{ background: '#1c1b1b', color: syncEnabled && isYTPlaying ? '#71dc8f' : '#aaa' }}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-2"
              style={{
                background: syncEnabled && isYTPlaying ? '#71dc8f' : syncEnabled ? '#fbbc00' : '#666',
                boxShadow: syncEnabled && isYTPlaying ? '0 0 8px #71dc8f' : 'none',
              }}
            />
            Sync {syncEnabled ? 'ON' : 'OFF'} — {isYTPlaying ? 'playing' : 'paused'}
          </div>

          {/* Sync offset — big touch/pointer targets for the Magic Remote */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: '#1c1b1b' }}
          >
            <span className="text-xs uppercase tracking-widest" style={{ color: '#888' }}>Offset</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => nudgeOffset(-0.5)}
                className="rounded-lg px-5 py-2 text-2xl font-bold leading-none transition-all"
                style={{ background: '#2a2a2a', color: '#fbbc00' }}
              >−</button>
              <span className="font-mono text-xl" style={{ color: '#fbbc00', minWidth: '5ch', textAlign: 'center' }}>
                {offsetSec.toFixed(1)}s
              </span>
              <button
                onClick={() => nudgeOffset(0.5)}
                className="rounded-lg px-5 py-2 text-2xl font-bold leading-none transition-all"
                style={{ background: '#2a2a2a', color: '#fbbc00' }}
              >+</button>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom remote-control hint bar */}
      <footer className="px-10 py-4 flex items-center justify-between"
        style={{ background: '#131313' }}
      >
        <div className="flex items-center gap-6 text-sm" style={{ color: '#aaa' }}>
          <RemoteHint label="◀ ▶" desc="Measure" />
          <RemoteHint label="▲ ▼" desc="Song" />
          <RemoteHint label="OK" desc="Play / Pause" />
          <RemoteHint label="M" desc="Song List" />
          <RemoteHint label="B" desc="Bass / Guitar" />
          <RemoteHint label=", ." desc="Offset ±0.5s" />
          <RemoteHint label="Esc" desc="Exit Stage" />
        </div>
        <div className="text-xs font-mono" style={{ color: '#666' }}>
          Song {songIdx + 1} / {flatSongs.length}
        </div>
      </footer>

      {/* Song picker overlay (M) */}
      {pickerOpen && (
        <div className="absolute inset-0 z-10 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPickerOpen(false)}
        >
          <div className="w-[480px] h-full overflow-y-auto p-6 flex flex-col gap-2"
            style={{ background: '#131313' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest" style={{ color: '#888' }}>Song Selection</div>
                <h2 className="text-3xl font-serif italic" style={{ color: '#fbbc00' }}>Pick your track</h2>
              </div>
              <span className="text-xs font-mono" style={{ color: '#666' }}>▲▼ select • OK confirm</span>
            </div>
            {flatSongs.map((entry, i) => {
              const isSelected = i === songIdx
              return (
                <button
                  key={`${entry.category}-${entry.song.title}`}
                  onClick={() => { setSongIdx(i); setPickerOpen(false) }}
                  className="w-full text-left rounded-xl px-5 py-4 transition-all"
                  style={{
                    background: isSelected ? '#2a2a2a' : '#1c1b1b',
                    outline: isSelected ? '3px solid #fbbc00' : 'none',
                    outlineOffset: isSelected ? '-3px' : 0,
                  }}
                >
                  <div className="text-xs uppercase tracking-wider" style={{ color: '#888' }}>
                    {entry.category}
                  </div>
                  <div className="text-lg font-bold" style={{ color: isSelected ? '#fbbc00' : '#fff' }}>
                    {entry.song.title}
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono mt-1" style={{ color: '#aaa' }}>
                    <span>{entry.song.artist}</span>
                    <span>{entry.song.key} · {entry.song.bpm} BPM</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function RemoteHint({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded px-2.5 py-1 font-mono text-xs"
        style={{
          background: '#2a2a2a',
          color: '#fbbc00',
          boxShadow: 'inset 0 1px 0 #444, inset 0 -1px 0 #1a1a1a',
        }}
      >{label}</span>
      <span className="text-xs">{desc}</span>
    </div>
  )
}
