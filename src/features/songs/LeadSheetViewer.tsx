/**
 * LeadSheetViewer — AudioChord(:8220) /transcribe/leadsheet viewer.
 *
 * On-demand "Generate lead sheet" button → POST /transcribe/leadsheet
 * (melody MIDI + chord symbols → MusicXML + SVG, built on Herta CPU).
 * The returned SVG is fetched through acFetch (X-AC-Key) into a blob URL —
 * a plain <img src> can't carry the auth header.
 *
 * Failure split mirrors ChordTimeline/useChordAnalysis:
 *   - 'unreachable' = ACRequestError (server down / auth / timeout) → Retry
 *   - 'error'       = HTTP error (404 melody MIDI missing, 503 GPU worker
 *                     down, ...) shown with a hint → Retry
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  transcribeLeadsheet,
  acFetch,
  ACRequestError,
  AudioChordError,
  type LeadSheetResult,
} from '@/lib/audiochord'
import { C } from './chordDisplay'

type Phase = 'idle' | 'building' | 'ready' | 'error' | 'unreachable'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25

function detailText(detail: unknown): string {
  if (detail && typeof detail === 'object' && 'detail' in detail) {
    const d = (detail as { detail: unknown }).detail
    if (typeof d === 'string') return d
  }
  return ''
}

function errorMessage(e: unknown): string {
  if (e instanceof AudioChordError) {
    const hint =
      e.status === 404
        ? '멜로디 MIDI가 없습니다 — AudioChord에서 pitch-to-midi 분석을 먼저 실행하세요.'
        : e.status === 503
          ? 'GPU 워커(누스)가 내려가 있어 코드 분석을 못 했습니다.'
          : detailText(e.detail).slice(0, 160)
    return hint ? `HTTP ${e.status} · ${hint}` : `HTTP ${e.status}`
  }
  return String(e)
}

const btnStyle = (active = true): React.CSSProperties => ({
  background: active ? C.amberDim : 'transparent',
  color: active ? C.amber : C.textSec,
  border: active ? `1px solid ${C.amber}60` : '1px solid rgba(255,255,255,0.15)',
  cursor: 'pointer',
  minHeight: 44,
})

export function LeadSheetViewer({ fileId, title }: { fileId: string | null; title?: string }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<LeadSheetResult | null>(null)
  const [svgBlobUrl, setSvgBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [zoom, setZoom] = useState(1)
  const abortRef = useRef<AbortController | null>(null)

  // Reset on song switch (blob URL revocation handled by the effect below).
  useEffect(() => {
    abortRef.current?.abort()
    setPhase('idle')
    setResult(null)
    setError(null)
    setZoom(1)
    setSvgBlobUrl(null)
  }, [fileId])

  // Revoke the previous SVG object URL whenever it changes / on unmount.
  useEffect(() => () => { if (svgBlobUrl) URL.revokeObjectURL(svgBlobUrl) }, [svgBlobUrl])

  // Abort an in-flight build when the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), [])

  // Elapsed-seconds clock while building (cache-miss chords go to the GPU).
  useEffect(() => {
    if (phase !== 'building') return
    setElapsedSec(0)
    const startedAt = Date.now()
    const id = window.setInterval(
      () => setElapsedSec(Math.round((Date.now() - startedAt) / 1000)),
      1000,
    )
    return () => window.clearInterval(id)
  }, [phase])

  const runBuild = useCallback(async () => {
    if (!fileId) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      setError(null)
      setPhase('building')
      const res = await transcribeLeadsheet({ file_id: fileId }, { signal: ctrl.signal })
      let blobUrl: string | null = null
      if (res.svg_url) {
        const svgRes = await acFetch(res.svg_url, {}, { timeoutMs: 30_000, signal: ctrl.signal })
        if (svgRes.ok) blobUrl = URL.createObjectURL(await svgRes.blob())
      }
      setResult(res)
      setSvgBlobUrl(blobUrl)
      setZoom(1)
      setPhase('ready')
    } catch (e) {
      if (ctrl.signal.aborted || (e instanceof ACRequestError && e.kind === 'aborted')) {
        // User cancel / song switch — back to the Generate button.
        setError(null)
        setPhase('idle')
        return
      }
      if (e instanceof ACRequestError) {
        setError(e.userMessage)
        setPhase('unreachable')
        return
      }
      setError(errorMessage(e))
      setPhase('error')
    } finally {
      abortRef.current = null
    }
  }, [fileId])

  const cancelBuild = useCallback(() => abortRef.current?.abort(), [])

  const safeName = (title ?? fileId ?? 'leadsheet')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .slice(0, 48)

  // Fallback when the server produced MusicXML but no SVG render.
  const downloadMusicXml = useCallback(async () => {
    if (!result) return
    try {
      const r = await acFetch(result.musicxml_url, {}, { timeoutMs: 30_000 })
      if (!r.ok) throw new AudioChordError(r.status, 'leadsheet musicxml')
      const url = URL.createObjectURL(await r.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeName}-leadsheet.musicxml`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      setError(e instanceof ACRequestError ? e.userMessage : errorMessage(e))
    }
  }, [result, safeName])

  if (!fileId) return null

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
          ♪ Lead Sheet
        </span>
        <span className="text-[10px] font-mono" style={{ color: C.textMut }}>
          {phase === 'ready' && result
            ? `melody (${result.instrument_hint}) + ${result.chord_count} chords · ${result.measure_count} measures · ${result.note_count} notes`
              + `${result.key ? ` · ${result.key}` : ''} · ${result.time_signature} · ${Math.round(result.song_bpm)}bpm`
            : 'AudioChord 멜로디+코드 악보 (Real Book style)'}
        </span>
        <div className="flex-1" />

        {phase === 'idle' && (
          <button
            onClick={runBuild}
            className="text-[10px] font-mono px-3 py-1 rounded transition-all"
            style={btnStyle()}
          >
            Generate lead sheet
          </button>
        )}

        {phase === 'building' && (
          <>
            <span className="text-[10px] font-mono" style={{ color: C.amber }}>
              <span className="inline-block animate-pulse mr-1">●</span>
              Building lead sheet... {elapsedSec}s
            </span>
            <button
              onClick={cancelBuild}
              className="text-[10px] font-mono px-3 py-1 rounded transition-all"
              style={btnStyle(false)}
              title="생성 취소"
            >
              ✕ Cancel
            </button>
          </>
        )}

        {phase === 'ready' && (
          <>
            {svgBlobUrl && (
              <>
                <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                    className="text-[10px] font-mono px-3 py-1 transition-all"
                    style={{ background: 'transparent', color: C.textSec, minHeight: 44 }}
                    title="축소"
                  >
                    −
                  </button>
                  <span className="text-[10px] font-mono px-2" style={{ color: C.textSec }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                    className="text-[10px] font-mono px-3 py-1 transition-all"
                    style={{ background: 'transparent', color: C.textSec, minHeight: 44 }}
                    title="확대"
                  >
                    +
                  </button>
                </div>
                <a
                  href={svgBlobUrl}
                  download={`${safeName}-leadsheet.svg`}
                  className="text-[10px] font-mono px-3 py-1 rounded transition-all inline-flex items-center"
                  style={btnStyle()}
                  title="SVG 다운로드"
                >
                  ⬇ SVG
                </a>
              </>
            )}
            <button
              onClick={runBuild}
              className="text-[10px] font-mono px-3 py-1 rounded transition-all"
              style={btnStyle(false)}
              title="다시 생성"
            >
              ↻ Rebuild
            </button>
          </>
        )}

        {(phase === 'error' || phase === 'unreachable') && (
          <>
            <span className="text-[10px] font-mono" style={{ color: C.rose }}>
              {error}
            </span>
            <button
              onClick={runBuild}
              className="text-[10px] font-mono px-3 py-1 rounded transition-all"
              style={btnStyle()}
            >
              Retry
            </button>
          </>
        )}
      </div>

      {phase === 'idle' && (
        <div className="text-[11px] font-mono py-3" style={{ color: C.textSec }}>
          멜로디(pitch-to-midi)와 코드 분석을 합쳐 한 장짜리 리드시트를 만듭니다.{' '}
          <span style={{ color: C.amber }}>Generate</span> 클릭 (캐시 miss 시 GPU 분석 포함).
        </div>
      )}

      {phase === 'ready' && svgBlobUrl && (
        <div
          className="overflow-auto rounded-xl"
          style={{ background: '#fdfdf8', maxHeight: 560 }}
        >
          <img
            src={svgBlobUrl}
            alt={`Lead sheet${title ? ` — ${title}` : ''}`}
            style={{ width: `${zoom * 100}%`, display: 'block' }}
          />
        </div>
      )}

      {phase === 'ready' && !svgBlobUrl && (
        <div className="text-[11px] font-mono py-3 flex items-center gap-3 flex-wrap" style={{ color: C.textSec }}>
          SVG 렌더가 생성되지 않았습니다 (서버 Verovio 확인) — MusicXML은 받을 수 있습니다.
          <button
            onClick={downloadMusicXml}
            className="text-[10px] font-mono px-3 py-1 rounded transition-all"
            style={btnStyle()}
          >
            ⬇ MusicXML
          </button>
          {error && <span style={{ color: C.rose }}>{error}</span>}
        </div>
      )}
    </div>
  )
}
