import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  normalizeParsedTrack,
  fitLibrary,
  loadGpLibrary,
  saveGpEntry,
  removeGpEntry,
  type GpLibraryEntry,
} from './gpLibrary'

// Mimics server/tab_parser.py parse_gp_file() output
function serverResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'gp-abc123def456',
    title: 'Test Song',
    artist: 'Test Artist',
    bpm: 142,
    timeSignature: [4, 4],
    tuning: {
      type: 'bass',
      name: 'Standard Bass (4-string)',
      stringCount: 4,
      fretCount: 24,
      tuning: [
        { name: 'E', octave: 1, midiNumber: 28 },
        { name: 'A', octave: 1, midiNumber: 33 },
        { name: 'D', octave: 2, midiNumber: 38 },
        { name: 'G', octave: 2, midiNumber: 43 },
      ],
    },
    events: [
      { id: 'e1', time: 0, duration: 0.5, string: 0, fret: 0, midi: 28 },
      { id: 'e2', time: 0.5, duration: 0.5, string: 1, fret: 2, midi: 35, technique: 'H', accent: true },
    ],
    measures: [
      { index: 0, startBeat: 0, bpm: 142, timeSignature: [4, 4] },
      { index: 1, startBeat: 4, bpm: 142, timeSignature: [4, 4] },
    ],
    metadata: {
      title: 'Test Song',
      artist: 'Test Artist',
      allTracks: [
        { index: 0, name: 'Guitar', channel: 0, stringCount: 6 },
        { index: 1, name: 'Bass', channel: 1, stringCount: 4 },
      ],
      selectedTrack: 'Bass',
    },
    ...overrides,
  }
}

describe('normalizeParsedTrack', () => {
  it('converts a tab-parser response into a playable Track', () => {
    const norm = normalizeParsedTrack(serverResponse())
    expect(norm).not.toBeNull()
    expect(norm!.track.id).toBe('gp-abc123def456')
    expect(norm!.track.bpm).toBe(142)
    expect(norm!.track.tuning.stringCount).toBe(4)
    expect(norm!.track.events).toHaveLength(2)
    expect(norm!.track.events[1].technique).toBe('H')
    expect(norm!.track.measures).toEqual([
      { index: 0, startBeat: 0 },
      { index: 1, startBeat: 4 },
    ])
    expect(norm!.artist).toBe('Test Artist')
    expect(norm!.sourceTrackName).toBe('Bass')
    expect(norm!.allTracks).toHaveLength(2)
  })

  it('drops individually invalid events instead of failing the file', () => {
    const norm = normalizeParsedTrack(serverResponse({
      events: [
        { id: 'ok', time: 0, duration: 1, string: 0, fret: 0, midi: 28 },
        { id: 'bad-string', time: 0, duration: 1, string: 9, fret: 0, midi: 28 },
        { id: 'bad-duration', time: 1, duration: 0, string: 0, fret: 0, midi: 28 },
        { id: 'bad-time', time: -1, duration: 1, string: 0, fret: 0, midi: 28 },
      ],
    }))
    expect(norm!.track.events.map((e) => e.id)).toEqual(['ok'])
  })

  it('derives a measure grid from events when measures are missing', () => {
    const norm = normalizeParsedTrack(serverResponse({ measures: [] }))
    expect(norm).not.toBeNull()
    // last event ends at beat 1 → 1 measure of 4/4
    expect(norm!.track.measures).toEqual([{ index: 0, startBeat: 0 }])
  })

  it('returns null when tuning is unusable or nothing is playable', () => {
    expect(normalizeParsedTrack(serverResponse({ tuning: { tuning: 'nope' } }))).toBeNull()
    expect(normalizeParsedTrack(serverResponse({ events: [], measures: [] }))).toBeNull()
    expect(normalizeParsedTrack('not an object')).toBeNull()
  })
})

describe('library persistence', () => {
  function stubLocalStorage() {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, String(v)) },
      removeItem: (k: string) => { store.delete(k) },
      clear: () => store.clear(),
    })
  }

  function entry(id: string, fileName: string, sourceTrackName: string | null = null): GpLibraryEntry {
    const norm = normalizeParsedTrack(serverResponse({ id }))!
    return { track: norm.track, fileName, artist: null, sourceTrackName, savedAt: '2026-06-11T00:00:00Z' }
  }

  beforeEach(stubLocalStorage)
  afterEach(() => vi.unstubAllGlobals())

  it('re-importing the same file/track replaces its entry (no duplicates)', () => {
    saveGpEntry(entry('gp-1', 'song.gp5', 'Bass'))
    const after = saveGpEntry(entry('gp-2', 'song.gp5', 'Bass'))
    expect(after).toHaveLength(1)
    expect(after[0].track.id).toBe('gp-2')
    expect(loadGpLibrary()).toHaveLength(1)
  })

  it('caps the library at 12 entries, evicting the oldest', () => {
    let lib: GpLibraryEntry[] = []
    for (let i = 0; i < 14; i++) lib = saveGpEntry(entry(`gp-${i}`, `file-${i}.gp5`))
    expect(lib).toHaveLength(12)
    expect(lib[0].track.id).toBe('gp-13') // newest first
    expect(lib.some((e) => e.track.id === 'gp-0')).toBe(false)
  })

  it('removeGpEntry deletes by track id and tolerates corrupt storage on load', () => {
    saveGpEntry(entry('gp-1', 'a.gp5'))
    expect(removeGpEntry('gp-1')).toHaveLength(0)

    localStorage.setItem('bocchi.gp.library', '{broken')
    expect(loadGpLibrary()).toEqual([])
  })
})

describe('fitLibrary (pure)', () => {
  it('drops oldest entries while serialized size exceeds the budget', () => {
    const big = normalizeParsedTrack(serverResponse())!
    // Inflate each entry to ~700KB so 4 entries exceed the 2.5MB budget
    const pad = 'x'.repeat(700_000)
    const entries: GpLibraryEntry[] = Array.from({ length: 4 }, (_, i) => ({
      track: { ...big.track, id: `gp-${i}`, title: pad },
      fileName: `f${i}.gp5`,
      artist: null,
      sourceTrackName: null,
      savedAt: '2026-06-11T00:00:00Z',
    }))
    const fitted = fitLibrary(entries)
    expect(fitted.length).toBeLessThan(4)
    expect(fitted.length).toBeGreaterThanOrEqual(1)
    expect(fitted[0].track.id).toBe('gp-0') // newest kept
  })
})
