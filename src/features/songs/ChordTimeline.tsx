/**
 * ChordTimeline — AudioChord(:8220) chord analysis viewer.
 *
 * Hits `/api/v1/library/{file_id}/file/chords.json` for cached results.
 * Falls back to a "Analyze" button that does ingest + analyze when not cached.
 *
 * Two display modes:
 *   - Continuous: variable-width chord boxes proportional to segment duration.
 *   - Measures:   constant-tempo measure grid driven by BPM + time signature.
 *                 One cell per measure with the time-weighted dominant chord.
 *
 * Active cell (based on `currentTime`) is highlighted; auto-scrolls into view.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { acFetch, ACRequestError } from '@/lib/audiochord'
import {
  type ChordSegment,
  type MeasureCell,
  measureBoundariesFromBpm,
  quantizeToMeasures,
  trimSilenceCells,
} from './chordQuantize'

const API_BASE = '/api/v1'

interface ChordsResponse {
  file_id: string
  elapsed_sec: number
  duration_sec: number
  model: string
  chords?: ChordSegment[]
  segments?: ChordSegment[]
}

type ViewMode = 'continuous' | 'measures'

// 'unavailable' = reachable but no cached analysis (normal → Analyze button)
// 'unreachable' = cache check itself failed (server down / auth / timeout)
type Phase = 'idle' | 'checking' | 'fetching' | 'ingesting' | 'analyzing' | 'ready' | 'unavailable' | 'unreachable' | 'error'

/** Pull the root note (with sharps/flats Korean-rendered) from a Crema label. */
function extractRoot(raw: string): string {
  if (!raw || raw === 'N' || raw === 'X') return ''
  const [rootPart] = raw.split(':')
  return rootPart.replace(/#/g, '♯').replace(/b/g, '♭')
}

// Crema labels: "A#:maj", "F#:min7", "C:7", "G#:maj/3", "N" (no chord)
function normalizeLabel(raw: string): string {
  if (!raw || raw === 'N' || raw === 'X') return '—'
  const [rootPart, qualityPart = ''] = raw.split(':')
  const root = rootPart.replace(/#/g, '♯').replace(/b/g, '♭')
  const [quality, slash] = qualityPart.split('/')
  let suffix = ''
  switch (quality) {
    case 'maj':   suffix = ''; break
    case 'min':   suffix = 'm'; break
    case 'min7':  suffix = 'm7'; break
    case 'maj7':  suffix = 'maj7'; break
    case '7':     suffix = '7'; break
    case 'min6':  suffix = 'm6'; break
    case 'maj6':  suffix = '6'; break
    case 'dim':   suffix = '°'; break
    case 'aug':   suffix = '+'; break
    case 'sus4':  suffix = 'sus4'; break
    case 'sus2':  suffix = 'sus2'; break
    case 'min9':  suffix = 'm9'; break
    case 'maj9':  suffix = 'maj9'; break
    case '9':     suffix = '9'; break
    case '':      suffix = ''; break
    default:      suffix = quality
  }
  return slash ? `${root}${suffix}/${slash}` : `${root}${suffix}`
}

const C = {
  surface:  '#1c1b1b',
  surface2: '#131313',
  amber:    '#fbbc00',
  amberDim: 'rgba(251,188,0,0.12)',
  rose:     '#ffb2be',
  green:    '#71dc8f',
  textPri:  '#f0f0f0',
  textSec:  '#888888',
  textMut:  '#555555',
}

export function ChordTimeline({
  youtubeId,
  currentTime,
  onSeek,
  bpm,
  timeSignature,
  onActiveRootChange,
  externalChords,
  externalDurationSec,
  externalTitle,
}: {
  youtubeId: string | null
  currentTime: number
  onSeek?: (sec: number) => void
  /** Used for measure-grid quantization. If absent, mode falls back to continuous. */
  bpm?: number
  /** [beatsPerMeasure, beatUnit] — only beatsPerMeasure used here. Default [4, 4]. */
  timeSignature?: [number, number]
  /**
   * R5 wiring — fires whenever the currently-active chord's root note changes
   * (e.g. "A♯", "F", null when between chords). Parent can pipe to Fretboard
   * `bassRootHints` so the bass learner sees all valid root positions.
   */
  onActiveRootChange?: (root: string | null) => void
  /** Preloaded chord segments from an AudioChord handoff URL. */
  externalChords?: ChordSegment[]
  externalDurationSec?: number
  externalTitle?: string
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [chords, setChords] = useState<ChordSegment[]>([])
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ViewMode>('measures')
  const [retryNonce, setRetryNonce] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeIdxRef = useRef(-1)
  const abortRef = useRef<AbortController | null>(null)

  const hasExternalChords = (externalChords?.length ?? 0) > 0
  const fileId = !hasExternalChords && youtubeId ? `yt_${youtubeId}` : null
  const beatsPerMeasure = timeSignature?.[0] ?? 4
  const canQuantize = !!bpm && bpm > 0

  // Try to load cached chords.json for the current song.
  // 'cached' = loaded · 'no-cache' = reachable but not analyzed yet ·
  // ACRequestError = server down / auth / timeout (shown distinctly).
  const loadCached = useCallback(async (id: string): Promise<'cached' | 'no-cache' | ACRequestError> => {
    try {
      const metaRes = await acFetch(`${API_BASE}/library/${id}`, {}, { timeoutMs: 10_000 })
      if (!metaRes.ok) return 'no-cache'
      const meta = await metaRes.json()
      if (!meta.analyses?.includes('chords')) return 'no-cache'

      const fileRes = await acFetch(`${API_BASE}/library/${id}/file/chords.json`, {}, { timeoutMs: 10_000 })
      if (!fileRes.ok) return 'no-cache'
      const data: ChordsResponse = await fileRes.json()
      const segs = data.chords ?? data.segments ?? []
      setChords(segs)
      setDuration(data.duration_sec ?? 0)
      return 'cached'
    } catch (e) {
      return e instanceof ACRequestError ? e : 'no-cache'
    }
  }, [])

  // On youtubeId change, check for cached result
  useEffect(() => {
    if (hasExternalChords) {
      const segs = externalChords ?? []
      setPhase('ready')
      setError(null)
      setChords(segs)
      setDuration(
        externalDurationSec && externalDurationSec > 0
          ? externalDurationSec
          : Math.max(0, ...segs.map((seg) => seg.end)),
      )
      activeIdxRef.current = -1
      return
    }
    if (!fileId) {
      setPhase('idle')
      setChords([])
      return
    }
    let cancelled = false
    setPhase('checking')
    setError(null)
    setChords([])
    activeIdxRef.current = -1
    ;(async () => {
      const result = await loadCached(fileId)
      if (cancelled) return
      if (result === 'cached') {
        setPhase('ready')
      } else if (result === 'no-cache') {
        setPhase('unavailable')
      } else {
        setError(result.userMessage)
        setPhase('unreachable')
      }
    })()
    return () => { cancelled = true }
  }, [fileId, loadCached, hasExternalChords, externalChords, externalDurationSec, retryNonce])

  // Run analysis (ingest + analyze). Cancellable via the header ✕ button;
  // per-stage deadlines so a hung worker surfaces as 'timeout' instead of
  // waiting forever.
  const runAnalysis = useCallback(async () => {
    if (!youtubeId || !fileId) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      setError(null)
      setPhase('ingesting')
      const ingestForm = new FormData()
      ingestForm.append('url', `https://www.youtube.com/watch?v=${youtubeId}`)
      const ingestRes = await acFetch(`${API_BASE}/ingest/youtube`, {
        method: 'POST',
        body: ingestForm,
      }, { timeoutMs: 180_000, signal: ctrl.signal })
      if (!ingestRes.ok) throw new Error(`Ingest HTTP ${ingestRes.status}`)

      setPhase('analyzing')
      const sepForm = new FormData()
      sepForm.append('file_id', fileId)
      const anaRes = await acFetch(`${API_BASE}/analyze/chords`, {
        method: 'POST',
        body: sepForm,
      }, { timeoutMs: 120_000, signal: ctrl.signal })
      if (!anaRes.ok) {
        const detail = await anaRes.text().catch(() => '')
        throw new Error(`Analyze HTTP ${anaRes.status}: ${detail.slice(0, 120)}`)
      }
      const data: ChordsResponse = await anaRes.json()
      const segs = data.chords ?? data.segments ?? []
      setChords(segs)
      setDuration(data.duration_sec ?? 0)
      setPhase('ready')
    } catch (e) {
      if (e instanceof ACRequestError && e.kind === 'aborted') {
        // User cancel — back to the Analyze button, not an error state.
        setError(null)
        setPhase('unavailable')
        return
      }
      setError(e instanceof ACRequestError ? e.userMessage : String(e))
      setPhase('error')
    } finally {
      abortRef.current = null
    }
  }, [youtubeId, fileId])

  const cancelAnalysis = useCallback(() => abortRef.current?.abort(), [])

  // Abort any in-flight analysis when the component unmounts (song switch etc.)
  useEffect(() => () => abortRef.current?.abort(), [])

  // Elapsed seconds across ingest + analyze (one continuous clock)
  const analysisActive = phase === 'ingesting' || phase === 'analyzing'
  useEffect(() => {
    if (!analysisActive) return
    setElapsedSec(0)
    const startedAt = Date.now()
    const id = window.setInterval(
      () => setElapsedSec(Math.round((Date.now() - startedAt) / 1000)),
      1000,
    )
    return () => window.clearInterval(id)
  }, [analysisActive])

  // Continuous-mode active index (variable-width segment under playhead)
  const activeContinuousIdx = useMemo(() => {
    if (chords.length === 0) return -1
    for (let i = 0; i < chords.length; i++) {
      if (currentTime >= chords[i].start && currentTime < chords[i].end) return i
    }
    return -1
  }, [chords, currentTime])

  // Measure-mode quantization. Cached on chords + duration + tempo inputs.
  const measureCells = useMemo<MeasureCell[]>(() => {
    if (!canQuantize || chords.length === 0 || duration <= 0) return []
    const boundaries = measureBoundariesFromBpm(bpm!, beatsPerMeasure, duration)
    return quantizeToMeasures(chords, boundaries)
  }, [chords, duration, bpm, beatsPerMeasure, canQuantize])

  // Trim leading/trailing silence cells (return slice indices for re-anchoring)
  const measureTrim = useMemo(() => trimSilenceCells(measureCells), [measureCells])
  const visibleMeasures = useMemo(
    () => measureCells.slice(measureTrim.lo, measureTrim.hi),
    [measureCells, measureTrim],
  )

  // Measure-mode active index (cell containing playhead)
  const activeMeasureIdx = useMemo(() => {
    if (measureCells.length === 0) return -1
    // measureCells are contiguous, so binary-search-friendly; linear is fine
    for (let i = 0; i < measureCells.length; i++) {
      if (currentTime >= measureCells[i].start && currentTime < measureCells[i].end) return i
    }
    return -1
  }, [measureCells, currentTime])

  // Active index for whichever mode is rendered
  const activeIdx = mode === 'measures' ? activeMeasureIdx : activeContinuousIdx

  // Auto-scroll active cell into view (works for either mode)
  useEffect(() => {
    if (activeIdx < 0 || activeIdx === activeIdxRef.current) return
    activeIdxRef.current = activeIdx
    const container = scrollRef.current
    const el = container?.querySelector(`[data-seg-idx="${activeIdx}"]`) as HTMLElement | null
    if (container && el) {
      const left = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      container.scrollTo({ left, behavior: 'smooth' })
    }
  }, [activeIdx])

  // R5 wiring — emit active chord root for parent (Fretboard hints)
  useEffect(() => {
    if (!onActiveRootChange) return
    if (activeIdx < 0) {
      onActiveRootChange(null)
      return
    }
    const label =
      mode === 'measures'
        ? measureCells[activeIdx]?.label
        : chords[activeIdx]?.label
    onActiveRootChange(label ? extractRoot(label) || null : null)
  }, [activeIdx, mode, measureCells, chords, onActiveRootChange])

  // Continuous-mode trimmed segments
  const visibleChords = useMemo(() => {
    if (chords.length === 0) return []
    let lo = 0, hi = chords.length - 1
    while (lo < hi && chords[lo].label === 'N') lo++
    while (hi > lo && chords[hi].label === 'N') hi--
    return chords.slice(lo, hi + 1)
  }, [chords])

  // Chord distribution — time-weighted top labels for the header strip.
  // Helps learners spot which chord they spend most time on.
  const chordStats = useMemo(() => {
    if (chords.length === 0) return { top: [] as Array<{ label: string; sec: number; pct: number }>, total: 0 }
    const totals = new Map<string, number>()
    let grandTotal = 0
    for (const c of chords) {
      if (c.label === 'N' || c.label === 'X') continue
      const dur = Math.max(0, c.end - c.start)
      totals.set(c.label, (totals.get(c.label) ?? 0) + dur)
      grandTotal += dur
    }
    if (grandTotal === 0) return { top: [], total: 0 }
    const top = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, sec]) => ({ label, sec, pct: (sec / grandTotal) * 100 }))
    return { top, total: grandTotal }
  }, [chords])

  // Reset auto-scroll memory on mode switch
  useEffect(() => { activeIdxRef.current = -1 }, [mode])

  // If we can't quantize (no BPM), force continuous mode
  useEffect(() => {
    if (!canQuantize && mode === 'measures') setMode('continuous')
  }, [canQuantize, mode])

  if (!fileId && !hasExternalChords) return null

  const sourceLabel = hasExternalChords
    ? `AudioChord handoff${externalTitle ? ` · ${externalTitle}` : ''}`
    : 'AudioChord (Crema)'

  return (
    <div
      className="rounded-2xl"
      style={{
        background: C.surface,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
        padding: '12px 16px',
      }}
    >
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <span className="text-xs font-mono font-bold" style={{ color: C.amber }}>
          ♪ Chord Track
        </span>
        <span className="text-[10px] font-mono" style={{ color: C.textMut }}>
          {sourceLabel} · {chords.length} segments
          {mode === 'measures' && visibleMeasures.length > 0 && ` · ${visibleMeasures.length} measures @ ${bpm}bpm`}
        </span>
        {chordStats.top.length > 0 && (
          <div
            className="flex items-center gap-1.5 font-mono text-[10px]"
            style={{ color: C.textSec }}
            title={`Top chord coverage (time-weighted) · total ${chordStats.total.toFixed(1)}s`}
          >
            <span style={{ color: C.textMut }}>TOP</span>
            {chordStats.top.map((s, i) => (
              <span
                key={s.label}
                className="px-1.5 py-0.5 rounded"
                style={{
                  background: i === 0 ? 'rgba(251,188,0,0.15)' : '#1a1a1a',
                  color: i === 0 ? C.amber : C.textSec,
                  border: `1px solid ${i === 0 ? 'rgba(251,188,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  fontWeight: 600,
                }}
              >
                {normalizeLabel(s.label)} {s.pct.toFixed(0)}%
              </span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        {phase === 'ready' && canQuantize && (
          <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setMode('measures')}
              className="text-[10px] font-mono px-3 py-1 transition-all"
              style={{
                background: mode === 'measures' ? C.amberDim : 'transparent',
                color: mode === 'measures' ? C.amber : C.textSec,
                minHeight: 44,
              }}
              title="Quantize to measures (BPM grid)"
            >
              Measures
            </button>
            <button
              onClick={() => setMode('continuous')}
              className="text-[10px] font-mono px-3 py-1 transition-all"
              style={{
                background: mode === 'continuous' ? C.amberDim : 'transparent',
                color: mode === 'continuous' ? C.amber : C.textSec,
                minHeight: 44,
              }}
              title="Variable-width by detected segment duration"
            >
              Continuous
            </button>
          </div>
        )}
        {phase === 'unavailable' && !hasExternalChords && (
          <button
            onClick={runAnalysis}
            className="text-[10px] font-mono px-3 py-1 rounded transition-all"
            style={{
              background: C.amberDim,
              color: C.amber,
              border: `1px solid ${C.amber}60`,
              minHeight: 44,
            }}
          >
            Analyze chords
          </button>
        )}
        {(phase === 'ingesting' || phase === 'analyzing' || phase === 'checking') && (
          <span className="text-[10px] font-mono" style={{ color: C.amber }}>
            <span className="inline-block animate-pulse mr-1">●</span>
            {phase === 'checking' ? 'Checking cache...'
              : phase === 'ingesting' ? `Downloading audio... ${elapsedSec}s`
              : `Analyzing on GPU (~10s)... ${elapsedSec}s`}
          </span>
        )}
        {analysisActive && (
          <button
            onClick={cancelAnalysis}
            className="text-[10px] font-mono px-3 py-1 rounded transition-all"
            style={{
              background: 'transparent',
              color: C.textSec,
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              minHeight: 44,
            }}
            title="분석 취소"
          >
            ✕ Cancel
          </button>
        )}
        {phase === 'error' && (
          <>
            <span className="text-[10px] font-mono" style={{ color: C.rose }}>
              {error}
            </span>
            {!hasExternalChords && youtubeId && (
              <button
                onClick={runAnalysis}
                className="text-[10px] font-mono px-3 py-1 rounded transition-all"
                style={{ background: C.amberDim, color: C.amber, border: `1px solid ${C.amber}60`, cursor: 'pointer', minHeight: 44 }}
              >
                Retry
              </button>
            )}
          </>
        )}
        {phase === 'unreachable' && (
          <>
            <span className="text-[10px] font-mono" style={{ color: C.rose }}>
              {error}
            </span>
            <button
              onClick={() => setRetryNonce((n) => n + 1)}
              className="text-[10px] font-mono px-3 py-1 rounded transition-all"
              style={{ background: C.amberDim, color: C.amber, border: `1px solid ${C.amber}60`, cursor: 'pointer', minHeight: 44 }}
            >
              Retry
            </button>
          </>
        )}
      </div>

      {phase === 'ready' && mode === 'continuous' && visibleChords.length > 0 && (
        <div
          ref={scrollRef}
          className="overflow-x-auto"
          style={{ paddingBottom: 4 }}
        >
          <div className="flex items-stretch gap-1" style={{ minHeight: 56 }}>
            {visibleChords.map((seg, i) => {
              const origIdx = chords.indexOf(seg)
              const isActive = origIdx === activeIdx
              const isNoChord = seg.label === 'N'
              const dur = Math.max(0.5, seg.end - seg.start)
              // px scaling: 28px per second, min 44px, max 240px
              const width = Math.max(44, Math.min(240, dur * 28))
              const conf = seg.confidence
              const dimByConf = 0.4 + Math.min(1, conf) * 0.6 // 0.4–1.0
              return (
                <div
                  key={`${seg.start}-${i}`}
                  data-seg-idx={origIdx}
                  onClick={() => onSeek?.(seg.start)}
                  className="rounded flex flex-col items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    width,
                    background: isActive ? C.amber : isNoChord ? C.surface2 : '#222',
                    color: isActive ? '#000' : isNoChord ? C.textMut : C.textPri,
                    border: isActive ? `1px solid ${C.amber}` : `1px solid rgba(255,255,255,0.06)`,
                    boxShadow: isActive ? `0 0 12px ${C.amber}80` : 'none',
                    opacity: isActive ? 1 : isNoChord ? 0.5 : dimByConf,
                    cursor: onSeek ? 'pointer' : 'default',
                    fontFamily: 'monospace',
                    padding: '6px 4px',
                  }}
                  title={`${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s · conf ${conf.toFixed(2)}`}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>
                    {normalizeLabel(seg.label)}
                  </span>
                  {!isNoChord && extractRoot(seg.label) && width > 50 && (
                    <span
                      style={{
                        fontSize: 9,
                        marginTop: 2,
                        color: isActive ? '#000' : '#7eff8b',
                        opacity: isActive ? 0.7 : 0.85,
                        fontWeight: 600,
                      }}
                    >
                      ♭{extractRoot(seg.label)}
                    </span>
                  )}
                  <span style={{ fontSize: 9, opacity: 0.65, marginTop: 2 }}>
                    {dur.toFixed(1)}s
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'ready' && mode === 'measures' && visibleMeasures.length > 0 && (
        <div
          ref={scrollRef}
          className="overflow-x-auto"
          style={{ paddingBottom: 4 }}
        >
          <div className="flex items-stretch" style={{ minHeight: 56 }}>
            {visibleMeasures.map((cell) => {
              const isActive = cell.index === activeIdx
              const isNoChord = cell.label === 'N' || cell.label === 'X'
              const conf = cell.confidence
              const dimByConf = 0.4 + Math.min(1, conf) * 0.6
              const ambiguous = cell.contributions.length > 1 && cell.contributions[0].label !== 'N'
                && cell.contributions[1] && cell.contributions[1].label !== 'N'
                && cell.contributions[1].durationInMeasure / Math.max(0.001, cell.contributions[0].durationInMeasure) > 0.6
              return (
                <div
                  key={cell.index}
                  data-seg-idx={cell.index}
                  onClick={() => onSeek?.(cell.start)}
                  className="flex flex-col items-center justify-center flex-shrink-0 transition-all relative"
                  style={{
                    width: 88,
                    background: isActive ? C.amber : isNoChord ? C.surface2 : '#222',
                    color: isActive ? '#000' : isNoChord ? C.textMut : C.textPri,
                    border: isActive ? `1px solid ${C.amber}` : `1px solid rgba(255,255,255,0.08)`,
                    borderLeft: cell.index === measureTrim.lo
                      ? `1px solid rgba(255,255,255,0.08)`
                      : `2px solid rgba(255,255,255,0.18)`, // bar-line accent
                    boxShadow: isActive ? `0 0 12px ${C.amber}80` : 'none',
                    opacity: isActive ? 1 : isNoChord ? 0.4 : dimByConf,
                    cursor: onSeek ? 'pointer' : 'default',
                    fontFamily: 'monospace',
                    padding: '8px 4px',
                  }}
                  title={
                    `m.${cell.index + 1} · ${cell.start.toFixed(2)}s–${cell.end.toFixed(2)}s` +
                    `\n${cell.contributions.slice(0, 3).map(c => `${c.label} ${c.durationInMeasure.toFixed(2)}s (${c.confidence.toFixed(2)})`).join(' · ')}`
                  }
                >
                  <span style={{
                    fontSize: 9, opacity: 0.55, lineHeight: 1,
                    color: isActive ? '#000' : C.textMut,
                  }}>
                    m.{cell.index + 1}
                  </span>
                  {/* R17 — beat dots inside the measure cell (1·2·3·4) */}
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: beatsPerMeasure }, (_, b) => (
                      <span
                        key={b}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: isActive
                            ? b === 0 ? '#000' : 'rgba(0,0,0,0.45)'
                            : b === 0 ? '#fbbc00aa' : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>
                    {normalizeLabel(cell.label)}
                  </span>
                  {!isNoChord && extractRoot(cell.label) && (
                    <span
                      title="베이스 루트 노트 (Stage 1: 이 음만 짚기)"
                      style={{
                        fontSize: 10,
                        marginTop: 3,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: isActive
                          ? 'rgba(0,0,0,0.15)'
                          : 'rgba(126,255,139,0.12)',
                        color: isActive ? '#000' : '#7eff8b',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                      }}
                    >
                      ♭ {extractRoot(cell.label)}
                    </span>
                  )}
                  {ambiguous && (
                    <span style={{
                      fontSize: 9, opacity: 0.55, marginTop: 2,
                      color: isActive ? '#000' : C.textMut,
                    }}>
                      / {normalizeLabel(cell.contributions[1].label)}?
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'unavailable' && (
        <div className="text-[11px] font-mono py-3" style={{ color: C.textSec }}>
          코드 분석이 아직 실행되지 않았습니다. <span style={{ color: C.amber }}>Analyze</span> 클릭 (GPU 약 10초).
        </div>
      )}

      {phase === 'ready' && visibleChords.length === 0 && (
        <div className="text-[11px] font-mono py-3" style={{ color: C.textSec }}>
          분석 결과에 코드가 없습니다.
        </div>
      )}

      {duration > 0 && phase === 'ready' && (
        <div className="text-[10px] font-mono mt-2" style={{ color: C.textMut }}>
          {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          {mode === 'continuous' && activeIdx >= 0 && chords[activeIdx] &&
            ` · now: ${normalizeLabel(chords[activeIdx].label)} (conf ${chords[activeIdx].confidence.toFixed(2)})`}
          {mode === 'measures' && activeIdx >= 0 && measureCells[activeIdx] &&
            ` · m.${measureCells[activeIdx].index + 1}: ${normalizeLabel(measureCells[activeIdx].label)} (conf ${measureCells[activeIdx].confidence.toFixed(2)})`}
        </div>
      )}
    </div>
  )
}
