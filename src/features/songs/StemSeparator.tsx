import { useState, useCallback, useEffect, useRef } from 'react'
import { withAuth } from '@/lib/audiochord'

const API_BASE = '/api/v1'
const STEM_ORDER = ['bass', 'drums', 'vocals', 'other'] as const
type StemKey = typeof STEM_ORDER[number]

const STEM_LABELS: Record<StemKey, { label: string; color: string }> = {
  bass:   { label: 'Bass',   color: 'var(--neon-cyan)' },
  drums:  { label: 'Drums',  color: 'var(--neon-pink)' },
  vocals: { label: 'Vocals', color: 'var(--neon-green)' },
  other:  { label: 'Other',  color: 'var(--neon-yellow)' },
}

type Phase = 'idle' | 'ingesting' | 'separating' | 'done' | 'error'

interface Result {
  file_id: string
  stems: Record<string, string>
  elapsed_sec: number
  cached: boolean
}

const fmtTime = (s: number) => {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function StemSeparator() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!url.trim()) return
    setError(null)
    setResult(null)

    try {
      setPhase('ingesting')
      const ingestForm = new FormData()
      ingestForm.append('url', url.trim())
      const ingestRes = await fetch(`${API_BASE}/ingest/youtube`, {
        method: 'POST',
        body: ingestForm,
        headers: withAuth(),
      })
      if (!ingestRes.ok) throw new Error(`Ingest failed: HTTP ${ingestRes.status}`)
      const ingest = await ingestRes.json()

      setPhase('separating')
      const sepForm = new FormData()
      sepForm.append('file_id', ingest.file_id)
      sepForm.append('model', 'htdemucs')
      const sepRes = await fetch(`${API_BASE}/separate`, {
        method: 'POST',
        body: sepForm,
        headers: withAuth(),
      })
      if (!sepRes.ok) throw new Error(`Separate failed: HTTP ${sepRes.status}`)
      const sep = await sepRes.json()

      setResult({
        file_id: sep.file_id,
        stems: sep.stems,
        elapsed_sec: sep.elapsed_sec,
        cached: ingest.cached,
      })
      setPhase('done')
    } catch (e) {
      setError(String(e))
      setPhase('error')
    }
  }, [url])

  const statusText = () => {
    switch (phase) {
      case 'ingesting':  return 'Downloading YouTube audio...'
      case 'separating': return 'Separating stems on GPU (~30s–2min)...'
      case 'done':       return result?.cached ? 'Done (cached)' : `Done in ${result?.elapsed_sec.toFixed(1)}s`
      case 'error':      return `Error: ${error}`
      default:           return null
    }
  }

  const busy = phase === 'ingesting' || phase === 'separating'

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-surface-hover)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono font-bold" style={{ color: 'var(--neon-purple)' }}>
          🎛 Stem Separator
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          YouTube URL → AudioChord (Demucs GPU) → mix-and-mute 4 stems
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !busy && handleSubmit()}
          placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)"
          className="flex-1 px-3 py-2 rounded text-xs font-mono outline-none"
          style={{
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bg-surface-hover)',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={busy || !url.trim()}
          className="px-4 py-2 rounded text-xs font-mono font-bold transition-all"
          style={{
            background: busy ? 'var(--bg-surface)' : 'var(--neon-purple)20',
            color: busy ? 'var(--text-muted)' : 'var(--neon-purple)',
            border: `1px solid ${busy ? 'transparent' : 'var(--neon-purple)60'}`,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? '...' : 'Separate'}
        </button>
      </div>

      {phase !== 'idle' && (
        <div className="text-[10px] font-mono mb-3" style={{
          color: phase === 'error' ? 'var(--neon-pink)' : phase === 'done' ? 'var(--neon-green)' : 'var(--neon-yellow)',
        }}>
          {busy && <span className="inline-block animate-pulse mr-1">●</span>}
          {statusText()}
        </div>
      )}

      {phase === 'done' && result && <StemMixer stems={result.stems} />}
    </div>
  )
}

// ─── Stem Mixer ─────────────────────────────────────────────

interface MixerProps {
  stems: Record<string, string>
}

function StemMixer({ stems }: MixerProps) {
  const refs = useRef<Record<string, HTMLAudioElement | null>>({})
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState<Record<string, boolean>>({
    bass: false, drums: false, vocals: false, other: false,
  })
  const [soloed, setSoloed] = useState<string | null>(null)
  const [volume, setVolume] = useState<Record<string, number>>({
    bass: 1, drums: 1, vocals: 1, other: 1,
  })

  // Pick first available stem as master (drives time/duration)
  const masterKey = STEM_ORDER.find(k => stems[k]) ?? 'bass'

  // Effective mute — solo overrides per-stem mute
  const isEffMuted = (key: string) =>
    soloed ? soloed !== key : (muted[key] ?? false)

  // Apply mute/volume to each audio element on state change
  useEffect(() => {
    Object.entries(refs.current).forEach(([key, el]) => {
      if (!el) return
      el.muted = isEffMuted(key)
      el.volume = volume[key] ?? 1
    })
  }, [muted, soloed, volume])

  // Periodic drift correction — slave non-master stems to master.currentTime.
  // Dual threshold: small drift uses gentle playbackRate nudge (no audible
  // click), large drift hard-snaps. Tighter loop than v1 (150 ms vs 250 ms).
  useEffect(() => {
    if (!playing) return
    const SOFT_S = 0.04   // 40 ms — start rate nudge
    const HARD_S = 0.15   // 150 ms — hard snap
    const id = setInterval(() => {
      const master = refs.current[masterKey]
      if (!master) return
      const t = master.currentTime
      Object.entries(refs.current).forEach(([key, el]) => {
        if (!el || key === masterKey) return
        const diff = el.currentTime - t  // positive = ahead
        const absDiff = Math.abs(diff)
        if (absDiff > HARD_S) {
          el.currentTime = t
          if (el.playbackRate !== 1) el.playbackRate = 1
        } else if (absDiff > SOFT_S) {
          // Slight nudge — gentle catch-up without audible click
          el.playbackRate = diff > 0 ? 0.98 : 1.02
        } else if (el.playbackRate !== 1) {
          el.playbackRate = 1
        }
      })
    }, 150)
    return () => clearInterval(id)
  }, [playing, masterKey])

  const handleTogglePlay = useCallback(async () => {
    const elements = Object.values(refs.current).filter((el): el is HTMLAudioElement => !!el)
    if (playing) {
      elements.forEach(el => el.pause())
      setPlaying(false)
    } else {
      // Snap others to master before play to start in sync
      const master = refs.current[masterKey]
      if (master) {
        elements.forEach(el => { if (el !== master) el.currentTime = master.currentTime })
      }
      try {
        await Promise.all(elements.map(el => el.play()))
        setPlaying(true)
      } catch (e) {
        console.error('play failed', e)
      }
    }
  }, [playing, masterKey])

  const handleSeek = useCallback((newTime: number) => {
    Object.values(refs.current).forEach(el => {
      if (el) el.currentTime = newTime
    })
    setTime(newTime)
  }, [])

  const handleEnded = useCallback(() => {
    setPlaying(false)
  }, [])

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-hover)' }}>
      {/* Hidden audio elements */}
      {STEM_ORDER.map(key => stems[key] && (
        <audio
          key={key}
          ref={el => { refs.current[key] = el }}
          src={stems[key]}
          preload="auto"
          onLoadedMetadata={key === masterKey ? (e => setDuration((e.target as HTMLAudioElement).duration)) : undefined}
          onTimeUpdate={key === masterKey ? (e => setTime((e.target as HTMLAudioElement).currentTime)) : undefined}
          onEnded={key === masterKey ? handleEnded : undefined}
        />
      ))}

      {/* Transport controls */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={handleTogglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all"
          style={{
            background: playing ? 'var(--neon-pink)20' : 'var(--neon-green)20',
            color: playing ? 'var(--neon-pink)' : 'var(--neon-green)',
            border: `1px solid ${playing ? 'var(--neon-pink)' : 'var(--neon-green)'}60`,
          }}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '❚❚' : '▶'}
        </button>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={time}
          onChange={e => handleSeek(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: 'var(--neon-purple)' }}
        />

        <span className="text-[10px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {fmtTime(time)} / {fmtTime(duration)}
        </span>

        {/* Bass-learning quick presets (R4 — one-click toggles) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSoloed('bass')
              setMuted({ bass: false, drums: false, vocals: false, other: false })
            }}
            className="text-[10px] font-mono px-2 py-1 rounded transition-all"
            style={{
              background: soloed === 'bass' ? 'rgba(251,188,0,0.18)' : '#181818',
              color: soloed === 'bass' ? '#fbbc00' : '#aaa',
              border: `1px solid ${soloed === 'bass' ? 'rgba(251,188,0,0.5)' : '#333'}`,
            }}
            title="베이스만 듣기 (Stage 1·2 학습 시)"
          >
            🎸 Bass only
          </button>
          <button
            onClick={() => {
              setSoloed(null)
              setMuted({ bass: true, drums: false, vocals: false, other: false })
            }}
            className="text-[10px] font-mono px-2 py-1 rounded transition-all"
            style={{
              background:
                !soloed && muted.bass && !muted.drums && !muted.vocals
                  ? 'rgba(251,188,0,0.18)'
                  : '#181818',
              color:
                !soloed && muted.bass && !muted.drums && !muted.vocals
                  ? '#fbbc00'
                  : '#aaa',
              border: `1px solid ${
                !soloed && muted.bass && !muted.drums && !muted.vocals
                  ? 'rgba(251,188,0,0.5)'
                  : '#333'
              }`,
            }}
            title="베이스 빼고 합주 (베이스 파트로 직접 연주)"
          >
            🎸 Bass off
          </button>
          <button
            onClick={() => {
              setSoloed(null)
              setMuted({ bass: false, drums: false, vocals: false, other: false })
            }}
            className="text-[10px] font-mono px-2 py-1 rounded transition-all"
            style={{
              background: '#181818',
              color: '#888',
              border: '1px solid #333',
            }}
            title="모두 재생"
          >
            All
          </button>
        </div>

        {soloed && soloed !== 'bass' && (
          <button
            onClick={() => setSoloed(null)}
            className="text-[10px] font-mono px-2 py-1 rounded"
            style={{
              background: 'var(--neon-yellow)20',
              color: 'var(--neon-yellow)',
              border: '1px solid var(--neon-yellow)60',
            }}
          >
            Clear solo
          </button>
        )}
      </div>

      {/* Stem rows */}
      <div className="flex flex-col gap-2">
        {STEM_ORDER.map(key => {
          const stemUrl = stems[key]
          if (!stemUrl) return null
          const { label, color } = STEM_LABELS[key]
          const m = muted[key] ?? false
          const s = soloed === key
          const effMuted = isEffMuted(key)
          return (
            <div
              key={key}
              className="flex items-center gap-3 px-3 py-2 rounded"
              style={{
                background: effMuted ? 'var(--bg-surface)' : 'var(--bg-secondary)',
                border: `1px solid ${effMuted ? 'transparent' : color + '40'}`,
                opacity: effMuted ? 0.55 : 1,
                transition: 'all 0.15s',
              }}
            >
              <span
                className="text-xs font-mono font-bold w-16 flex-shrink-0"
                style={{ color: effMuted ? 'var(--text-muted)' : color }}
              >
                {label}
              </span>

              <button
                onClick={() => setMuted(prev => ({ ...prev, [key]: !prev[key] }))}
                disabled={!!soloed}
                className="text-[10px] font-mono px-2 py-1 rounded w-10 flex-shrink-0"
                style={{
                  background: m && !soloed ? 'var(--neon-pink)20' : 'var(--bg-surface)',
                  color: m && !soloed ? 'var(--neon-pink)' : 'var(--text-muted)',
                  border: `1px solid ${m && !soloed ? 'var(--neon-pink)60' : 'transparent'}`,
                  cursor: soloed ? 'not-allowed' : 'pointer',
                }}
                title={soloed ? 'Disabled while solo active' : 'Mute'}
              >
                M
              </button>

              <button
                onClick={() => setSoloed(prev => prev === key ? null : key)}
                className="text-[10px] font-mono px-2 py-1 rounded w-10 flex-shrink-0"
                style={{
                  background: s ? 'var(--neon-yellow)20' : 'var(--bg-surface)',
                  color: s ? 'var(--neon-yellow)' : 'var(--text-muted)',
                  border: `1px solid ${s ? 'var(--neon-yellow)60' : 'transparent'}`,
                }}
                title="Solo (only this stem)"
              >
                S
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume[key] ?? 1}
                onChange={e => setVolume(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                className="flex-1"
                style={{ accentColor: color }}
                title={`Volume: ${Math.round((volume[key] ?? 1) * 100)}%`}
              />

              <span
                className="text-[10px] font-mono tabular-nums w-8 text-right flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                {Math.round((volume[key] ?? 1) * 100)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="text-[10px] font-mono mt-3 px-1" style={{ color: 'var(--text-muted)' }}>
        💡 Bass 연습 시: Bass 'M' 누르고 나머지로 합주 / Bass 'S'로 베이스만 듣기
      </div>
    </div>
  )
}
