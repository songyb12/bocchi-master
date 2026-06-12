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
 *
 * Split modules (pure extractions — quantization/active-index/auto-scroll
 * stay here): useChordAnalysis.ts (fetch/phase state machine) ·
 * chordDisplay.ts (labels + tokens) · ContinuousRow.tsx · MeasureGrid.tsx
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  type ChordSegment,
  type MeasureCell,
  measureBoundariesFromBpm,
  quantizeToMeasures,
  trimSilenceCells,
} from './chordQuantize'
import { useChordAnalysis } from './useChordAnalysis'
import { C, extractRoot, normalizeLabel } from './chordDisplay'
import { ContinuousRow } from './ContinuousRow'
import { MeasureGrid } from './MeasureGrid'

type ViewMode = 'continuous' | 'measures'

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
  const [mode, setMode] = useState<ViewMode>('measures')
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeIdxRef = useRef(-1)

  const hasExternalChords = (externalChords?.length ?? 0) > 0
  const fileId = !hasExternalChords && youtubeId ? `yt_${youtubeId}` : null
  const beatsPerMeasure = timeSignature?.[0] ?? 4
  const canQuantize = !!bpm && bpm > 0

  // Fetch/phase state machine (cache lookup, ingest+analyze, cancel, elapsed)
  const {
    phase,
    chords,
    duration,
    error,
    elapsedSec,
    analysisActive,
    runAnalysis,
    cancelAnalysis,
    retryCacheCheck,
  } = useChordAnalysis({ youtubeId, fileId, hasExternalChords, externalChords, externalDurationSec })

  // Reset auto-scroll memory whenever the chord set changes (song switch,
  // external handoff, fresh analysis) — was inline in the fetch effect before
  // the hook extraction.
  useEffect(() => { activeIdxRef.current = -1 }, [chords])

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
              onClick={retryCacheCheck}
              className="text-[10px] font-mono px-3 py-1 rounded transition-all"
              style={{ background: C.amberDim, color: C.amber, border: `1px solid ${C.amber}60`, cursor: 'pointer', minHeight: 44 }}
            >
              Retry
            </button>
          </>
        )}
      </div>

      {phase === 'ready' && mode === 'continuous' && visibleChords.length > 0 && (
        <ContinuousRow
          chords={chords}
          visibleChords={visibleChords}
          activeIdx={activeIdx}
          onSeek={onSeek}
          scrollRef={scrollRef}
        />
      )}

      {phase === 'ready' && mode === 'measures' && visibleMeasures.length > 0 && (
        <MeasureGrid
          visibleMeasures={visibleMeasures}
          activeIdx={activeIdx}
          beatsPerMeasure={beatsPerMeasure}
          trimLo={measureTrim.lo}
          onSeek={onSeek}
          scrollRef={scrollRef}
        />
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
