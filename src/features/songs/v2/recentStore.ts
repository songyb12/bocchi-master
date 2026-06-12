// Recent-practice persistence for SongsViewV2 — localStorage-backed lists of
// recently played songs (keys only) and recent AudioChord imports (full
// handoff payloads). Extracted verbatim from SongsViewV2.
import type { SongEntry } from '@/core/note/SongTracks'
import type { AudioChordPracticeHandoff } from '@/lib/audiochordHandoff'

const RECENT_SONGS_KEY = 'bocchi.songs.recent'
const RECENT_IMPORTS_KEY = 'bocchi.audiochord.recent'
const MAX_RECENT_SONGS = 5
const MAX_RECENT_IMPORTS = 4

export function songKey(song: SongEntry): string {
  return `${song.artist}::${song.title}`
}

export function handoffKey(handoff: AudioChordPracticeHandoff): string {
  return handoff.fileId || `${handoff.title}::${handoff.durationSec ?? 0}`
}

function isStoredHandoff(value: unknown): value is AudioChordPracticeHandoff {
  if (!value || typeof value !== 'object') return false
  const handoff = value as AudioChordPracticeHandoff
  return handoff.source === 'audiochord'
    && typeof handoff.title === 'string'
    && Array.isArray(handoff.chords)
    && handoff.chords.length > 0
}

export function loadRecentSongKeys(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SONGS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function saveRecentSong(song: SongEntry): string[] {
  const next = [songKey(song), ...loadRecentSongKeys().filter(key => key !== songKey(song))]
    .slice(0, MAX_RECENT_SONGS)
  try { localStorage.setItem(RECENT_SONGS_KEY, JSON.stringify(next)) } catch { /* */ }
  return next
}

export function loadRecentImports(): AudioChordPracticeHandoff[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_IMPORTS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isStoredHandoff).slice(0, MAX_RECENT_IMPORTS) : []
  } catch {
    return []
  }
}

export function saveRecentImport(handoff: AudioChordPracticeHandoff): AudioChordPracticeHandoff[] {
  const next = [handoff, ...loadRecentImports().filter(item => handoffKey(item) !== handoffKey(handoff))]
    .slice(0, MAX_RECENT_IMPORTS)
  try { localStorage.setItem(RECENT_IMPORTS_KEY, JSON.stringify(next)) } catch { /* */ }
  return next
}
