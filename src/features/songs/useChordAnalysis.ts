/**
 * useChordAnalysis — AudioChord fetch/phase state machine for ChordTimeline.
 *
 * Extracted verbatim from ChordTimeline. Owns: cached-result lookup (with
 * server-down/auth/timeout classification via acFetch), the cancellable
 * ingest+analyze pipeline (AbortController, per-stage deadlines), the
 * elapsed-seconds clock, and the retry nonce for failed cache checks.
 * Rendering concerns (mode, quantization, auto-scroll) stay in the component.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { acFetch, ACRequestError } from '@/lib/audiochord'
import type { ChordSegment } from './chordQuantize'

const API_BASE = '/api/v1'

interface ChordsResponse {
  file_id: string
  elapsed_sec: number
  duration_sec: number
  model: string
  chords?: ChordSegment[]
  segments?: ChordSegment[]
}

// 'unavailable' = reachable but no cached analysis (normal → Analyze button)
// 'unreachable' = cache check itself failed (server down / auth / timeout)
export type Phase = 'idle' | 'checking' | 'fetching' | 'ingesting' | 'analyzing' | 'ready' | 'unavailable' | 'unreachable' | 'error'

export function useChordAnalysis({
  youtubeId,
  fileId,
  hasExternalChords,
  externalChords,
  externalDurationSec,
}: {
  youtubeId: string | null
  fileId: string | null
  hasExternalChords: boolean
  externalChords?: ChordSegment[]
  externalDurationSec?: number
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [chords, setChords] = useState<ChordSegment[]>([])
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

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

  // Re-run the cache check after an 'unreachable' failure.
  const retryCacheCheck = useCallback(() => setRetryNonce((n) => n + 1), [])

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

  return {
    phase,
    chords,
    duration,
    error,
    elapsedSec,
    analysisActive,
    runAnalysis,
    cancelAnalysis,
    retryCacheCheck,
  }
}
