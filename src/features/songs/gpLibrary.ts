/**
 * GP tab library — validates `POST /api/parse/tab` (server :8081) responses
 * into playable Tracks and persists them in localStorage.
 *
 * Storage key `bocchi.gp.library`, newest first. Re-parsing the same
 * file/track replaces its entry (dedupe by fileName + sourceTrackName).
 * Size guards: max 12 entries and ~2.5MB serialized (localStorage quota
 * is ~5MB); oldest entries are evicted first.
 */

import type { Track, NoteEvent, MeasureMeta } from '@/core/note/types'
import type { Note, NoteName } from '@/types/music'

export interface GpLibraryEntry {
  track: Track
  fileName: string
  artist: string | null
  sourceTrackName: string | null
  savedAt: string // ISO
}

export interface GpParsedFileTrack {
  index: number
  name: string
  stringCount: number
}

export interface NormalizedGpTrack {
  track: Track
  artist: string | null
  sourceTrackName: string | null
  /** All tracks inside the GP file — lets the UI offer re-parse with ?track=N. */
  allTracks: GpParsedFileTrack[]
}

const KEY = 'bocchi.gp.library'
const MAX_ENTRIES = 12
const MAX_TOTAL_CHARS = 2_500_000

const NOTE_NAMES: readonly string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function toNote(raw: unknown): Note | null {
  if (!raw || typeof raw !== 'object') return null
  const n = raw as { name?: unknown; octave?: unknown; midiNumber?: unknown }
  if (typeof n.midiNumber !== 'number' || !Number.isFinite(n.midiNumber)) return null
  const midi = Math.round(n.midiNumber)
  const name = typeof n.name === 'string' && NOTE_NAMES.includes(n.name)
    ? (n.name as NoteName)
    : (NOTE_NAMES[((midi % 12) + 12) % 12] as NoteName)
  const octave = typeof n.octave === 'number' && Number.isFinite(n.octave)
    ? n.octave
    : Math.floor(midi / 12) - 1
  return { name, octave, midiNumber: midi }
}

/**
 * Validate/coerce a tab-parser response into a Track. Returns null when the
 * payload is structurally unusable (bad tuning, no measures derivable).
 * Invalid events are dropped individually rather than failing the whole file.
 */
export function normalizeParsedTrack(raw: unknown): NormalizedGpTrack | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  // Tuning — required; everything else has fallbacks
  const t = r.tuning as Record<string, unknown> | undefined
  if (!t || typeof t !== 'object' || !Array.isArray(t.tuning)) return null
  const notes = (t.tuning as unknown[]).map(toNote)
  if (notes.some((n) => n === null) || notes.length === 0) return null
  const stringCount = notes.length
  const tuning = {
    type: (t.type === 'guitar' || t.type === 'bass' ? t.type : stringCount <= 5 ? 'bass' : 'guitar') as 'guitar' | 'bass',
    name: typeof t.name === 'string' ? t.name : 'Imported tuning',
    stringCount,
    fretCount: typeof t.fretCount === 'number' && Number.isFinite(t.fretCount) ? Math.round(t.fretCount) : 24,
    tuning: notes as Note[],
  }

  const ts = Array.isArray(r.timeSignature) ? r.timeSignature : null
  const timeSignature: [number, number] =
    ts && ts.length === 2 && Number.isFinite(Number(ts[0])) && Number(ts[0]) > 0 && Number.isFinite(Number(ts[1])) && Number(ts[1]) > 0
      ? [Math.round(Number(ts[0])), Math.round(Number(ts[1]))]
      : [4, 4]

  const bpmRaw = typeof r.bpm === 'number' && Number.isFinite(r.bpm) ? r.bpm : 120
  const bpm = Math.max(30, Math.min(300, Math.round(bpmRaw)))

  const events: NoteEvent[] = (Array.isArray(r.events) ? r.events : [])
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .filter((e) =>
      Number.isFinite(e.time as number) && (e.time as number) >= 0 &&
      Number.isFinite(e.duration as number) && (e.duration as number) > 0 &&
      Number.isInteger(e.string as number) && (e.string as number) >= 0 && (e.string as number) < stringCount &&
      Number.isFinite(e.fret as number) &&
      Number.isFinite(e.midi as number),
    )
    .map((e, i) => ({
      id: typeof e.id === 'string' ? e.id : `gp-n${i}`,
      time: e.time as number,
      duration: e.duration as number,
      string: e.string as number,
      fret: e.fret as number,
      midi: e.midi as number,
      ...(typeof e.technique === 'string' ? { technique: e.technique as NoteEvent['technique'] } : {}),
      ...(e.accent === true ? { accent: true } : {}),
    }))

  let measures: MeasureMeta[] = (Array.isArray(r.measures) ? r.measures : [])
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .filter((m) => Number.isFinite(m.startBeat as number))
    .map((m, i) => ({
      index: typeof m.index === 'number' ? (m.index as number) : i,
      startBeat: m.startBeat as number,
    }))
  if (measures.length === 0) {
    // Derive a measure grid from the event span so the playback engine has a length.
    const lastBeat = events.reduce((max, e) => Math.max(max, e.time + e.duration), 0)
    const count = Math.max(1, Math.ceil(lastBeat / timeSignature[0]))
    if (events.length === 0) return null // nothing playable at all
    measures = Array.from({ length: count }, (_, i) => ({ index: i, startBeat: i * timeSignature[0] }))
  }

  const meta = (r.metadata && typeof r.metadata === 'object' ? r.metadata : {}) as Record<string, unknown>
  const allTracks: GpParsedFileTrack[] = (Array.isArray(meta.allTracks) ? meta.allTracks : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      index: typeof x.index === 'number' ? x.index : 0,
      name: typeof x.name === 'string' ? x.name : `Track ${x.index}`,
      stringCount: typeof x.stringCount === 'number' ? x.stringCount : 0,
    }))

  const track: Track = {
    id: typeof r.id === 'string' && r.id ? r.id : `gp-${Math.random().toString(36).slice(2, 10)}`,
    title: typeof r.title === 'string' && r.title ? r.title : 'GP Import',
    bpm,
    timeSignature,
    tuning,
    events,
    measures,
  }

  return {
    track,
    artist: typeof r.artist === 'string' ? r.artist : null,
    sourceTrackName: typeof meta.selectedTrack === 'string' ? meta.selectedTrack : null,
    allTracks,
  }
}

// ─── localStorage persistence ─────────────────────────────────────────────

export function loadGpLibrary(): GpLibraryEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is GpLibraryEntry =>
        !!e && typeof e === 'object' &&
        !!(e as GpLibraryEntry).track && typeof (e as GpLibraryEntry).track === 'object' &&
        typeof (e as GpLibraryEntry).track.id === 'string' &&
        Array.isArray((e as GpLibraryEntry).track.events),
    )
  } catch {
    return []
  }
}

/** Pure: dedupe key for replace-on-reimport. */
function entryKey(e: GpLibraryEntry): string {
  return `${e.fileName}::${e.sourceTrackName ?? ''}`
}

/** Pure: cap entry count and serialized size, dropping oldest first. */
export function fitLibrary(entries: GpLibraryEntry[]): GpLibraryEntry[] {
  let next = entries.slice(0, MAX_ENTRIES)
  while (next.length > 1 && JSON.stringify(next).length > MAX_TOTAL_CHARS) {
    next = next.slice(0, -1)
  }
  return next
}

export function saveGpEntry(entry: GpLibraryEntry): GpLibraryEntry[] {
  const next = fitLibrary([entry, ...loadGpLibrary().filter((e) => entryKey(e) !== entryKey(entry))])
  if (typeof localStorage === 'undefined') return next
  // QuotaExceeded → keep dropping the oldest entry until the write fits.
  let candidate = next
  while (candidate.length > 0) {
    try {
      localStorage.setItem(KEY, JSON.stringify(candidate))
      return candidate
    } catch {
      candidate = candidate.slice(0, -1)
    }
  }
  return []
}

export function removeGpEntry(trackId: string): GpLibraryEntry[] {
  const next = loadGpLibrary().filter((e) => e.track.id !== trackId)
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* */ }
  return next
}
