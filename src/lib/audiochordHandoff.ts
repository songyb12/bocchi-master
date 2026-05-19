import type { Track, MeasureMeta } from '@/core/note/types'
import type { ChordSegment } from '@/features/songs/chordQuantize'
import { STANDARD_BASS } from '@/data/tunings'

export interface AudioChordPracticeHandoff {
  version: number
  source: 'audiochord'
  title: string
  fileId?: string | null
  bpm?: number | null
  key?: string | null
  durationSec?: number | null
  model?: string | null
  truncated?: boolean
  chords: ChordSegment[]
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value))
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function findHandoffToken(hash: string): string | null {
  const body = hash.startsWith('#') ? hash.slice(1) : hash
  const match = body.match(/(?:^|[?&])audiochord=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function asFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function sanitizeChord(raw: unknown): ChordSegment | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const start = asFiniteNumber(obj.start)
  const end = asFiniteNumber(obj.end)
  if (start == null || end == null || end <= start) return null
  const label = String(obj.label || 'N').slice(0, 32)
  const confidence = clamp(asFiniteNumber(obj.confidence) ?? 0, 0, 1)
  return {
    start: Number(start.toFixed(3)),
    end: Number(end.toFixed(3)),
    label,
    confidence: Number(confidence.toFixed(3)),
  }
}

export function parseAudioChordHandoffFromHash(hash = window.location.hash): AudioChordPracticeHandoff | null {
  const token = findHandoffToken(hash)
  if (!token) return null

  try {
    const raw = JSON.parse(decodeBase64Url(token)) as Record<string, unknown>
    if (raw.source !== 'audiochord') return null

    const chords = Array.isArray(raw.chords)
      ? raw.chords.map(sanitizeChord).filter((seg): seg is ChordSegment => !!seg).slice(0, 220)
      : []
    if (chords.length === 0) return null

    const durationSec = asFiniteNumber(raw.durationSec)
    const bpm = asFiniteNumber(raw.bpm)
    const title = String(raw.title || 'AudioChord practice').slice(0, 120)
    const key = typeof raw.key === 'string' ? raw.key.trim().slice(0, 16) : ''

    return {
      version: asFiniteNumber(raw.version) ?? 1,
      source: 'audiochord',
      title,
      fileId: raw.fileId ? String(raw.fileId).slice(0, 80) : null,
      bpm: bpm && bpm >= 30 && bpm <= 260 ? Number(bpm.toFixed(1)) : null,
      key: key || null,
      durationSec: durationSec && durationSec > 0 ? Number(durationSec.toFixed(2)) : null,
      model: raw.model ? String(raw.model).slice(0, 80) : null,
      truncated: Boolean(raw.truncated),
      chords,
    }
  } catch {
    return null
  }
}

export function createAudioChordPracticeTrack(handoff: AudioChordPracticeHandoff): Track {
  const bpm = handoff.bpm ?? 100
  const durationSec = handoff.durationSec
    ?? Math.max(16, ...handoff.chords.map((seg) => seg.end))
  const beatsPerMeasure = 4
  const totalBeats = Math.max(beatsPerMeasure, Math.ceil((durationSec * bpm) / 60))
  const measureCount = clamp(Math.ceil(totalBeats / beatsPerMeasure), 1, 400)
  const measures: MeasureMeta[] = Array.from({ length: measureCount }, (_, index) => ({
    index,
    startBeat: index * beatsPerMeasure,
  }))
  const safeId = (handoff.fileId || handoff.title).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 48)

  return {
    id: `audiochord-${safeId || 'handoff'}`,
    title: `${handoff.title} (AudioChord)`,
    bpm,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS,
    events: [],
    measures,
  }
}
