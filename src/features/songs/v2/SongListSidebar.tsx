// Left sidebar of SongsViewV2 — instrument toggle, GP tab library, and the
// grouped song list (Recent AudioChord / active import / Recent Practice /
// Bass-ready / categories). Extracted verbatim from SongsViewV2; all selection
// state stays in the parent, this renders from props only.
import { SONG_CATEGORIES, type SongEntry } from '@/core/note/SongTracks'
import type { Track } from '@/core/note/types'
import type { AudioChordPracticeHandoff } from '@/lib/audiochordHandoff'
import { GpTabPanel } from '../GpTabPanel'
import type { GpLibraryEntry } from '../gpLibrary'
import { C } from './theme'
import { songKey, handoffKey } from './recentStore'
import { SongRow, type SongRowVariant } from './SongRow'
import { ImportRow } from './ImportRow'

export function SongListSidebar({
  instrument,
  selectedSong,
  importedPractice,
  selectedGpTrackId,
  practiceBpm,
  recentSongs,
  recentImports,
  bassReadySongs,
  getSongTrack,
  onToggleInstrument,
  onSelectSong,
  onSelectImport,
  onSelectGp,
}: {
  instrument: 'bass' | 'guitar'
  selectedSong: SongEntry | null
  importedPractice: AudioChordPracticeHandoff | null
  selectedGpTrackId: string | null
  practiceBpm: number
  recentSongs: SongEntry[]
  recentImports: AudioChordPracticeHandoff[]
  bassReadySongs: SongEntry[]
  getSongTrack: (song: SongEntry) => Track | null
  onToggleInstrument: (inst: 'guitar' | 'bass') => void
  onSelectSong: (song: SongEntry) => void
  onSelectImport: (handoff: AudioChordPracticeHandoff) => void
  onSelectGp: (entry: GpLibraryEntry) => void
}) {
  const renderImportRow = (handoff: AudioChordPracticeHandoff) => (
    <ImportRow
      key={`import-${handoffKey(handoff)}`}
      handoff={handoff}
      isActive={!!(importedPractice && handoffKey(importedPractice) === handoffKey(handoff))}
      onSelect={() => onSelectImport(handoff)}
    />
  )

  const renderSongRow = (song: SongEntry, variant: SongRowVariant = 'default') => (
    <SongRow
      key={`${variant}-${songKey(song)}`}
      song={song}
      variant={variant}
      isActive={selectedSong?.title === song.title}
      hasPlayableTab={(getSongTrack(song)?.events.length ?? 0) > 0}
      instrument={instrument}
      onSelect={() => onSelectSong(song)}
    />
  )

  return (
    <aside
      className="bocchi-song-rail flex flex-col"
      style={{
        width: '300px',
        minWidth: '220px',
        maxWidth: '320px',
        background: C.surface2,
        borderRight: `1px solid rgba(255,255,255,0.06)`,
        flexShrink: 0,
      }}
    >
      {/* Instrument toggle */}
      <div
        className="flex gap-2 p-4"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}
      >
        <button
          onClick={() => onToggleInstrument('bass')}
          className="flex-1 transition-all"
          style={{
            background: instrument === 'bass' ? C.amberDim : 'rgba(255,255,255,0.04)',
            border: `1px solid ${instrument === 'bass' ? C.amberBd : 'rgba(255,255,255,0.07)'}`,
            color: instrument === 'bass' ? C.amber : C.textSec,
            borderRadius: 8,
            padding: '6px 0',
            minHeight: 44,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Bass
        </button>
        <button
          onClick={() => onToggleInstrument('guitar')}
          className="flex-1 transition-all"
          style={{
            background: instrument === 'guitar' ? C.roseDim : 'rgba(255,255,255,0.04)',
            border: `1px solid ${instrument === 'guitar' ? C.roseBd : 'rgba(255,255,255,0.07)'}`,
            color: instrument === 'guitar' ? C.rose : C.textSec,
            borderRadius: 8,
            padding: '6px 0',
            minHeight: 44,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Guitar
        </button>
      </div>

      {/* Song list header */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
      >
        <span
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: C.amber,
          }}
        >
          Song Selection
        </span>
        <p style={{ margin: '2px 0 0', fontFamily: 'monospace', fontSize: '0.65rem', color: C.textMut }}>
          Pick your next rehearsal track
        </p>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 16 }}>
        {recentImports.length > 0 && (
          <div>
            <div
              className="px-4 py-2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                color: C.green,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                marginTop: 8,
              }}
            >
              Recent AudioChord
            </div>
            {recentImports.map(renderImportRow)}
          </div>
        )}
        {importedPractice && (
          <div>
            <div
              className="px-4 py-2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                color: C.amber,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                marginTop: 8,
              }}
            >
              AudioChord Import
            </div>
            <button
              className="w-full text-left"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: C.amberDim,
                borderLeft: `3px solid ${C.amber}`,
                cursor: 'default',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: C.amber,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: C.amber,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {importedPractice.title}
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.65rem',
                    color: C.textMut,
                    marginTop: 2,
                  }}
                >
                  {importedPractice.chords.length} chord segments
                  {importedPractice.truncated ? ' · trimmed' : ''}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.62rem',
                  color: C.amber,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                <div>AUTO</div>
                <div>{practiceBpm}<span style={{ opacity: 0.6 }}>bpm</span></div>
              </div>
            </button>
          </div>
        )}
        <GpTabPanel
          activeTrackId={selectedGpTrackId}
          onSelect={onSelectGp}
        />
        {recentSongs.length > 0 && (
          <div>
            <div
              className="px-4 py-2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                color: C.green,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                marginTop: 8,
              }}
            >
              Recent Practice
            </div>
            {recentSongs.map(song => renderSongRow(song, 'recent'))}
          </div>
        )}
        {bassReadySongs.length > 0 && (
          <div>
            <div
              className="px-4 py-2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                color: C.rose,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                marginTop: 8,
              }}
            >
              Bass-ready Tabs
            </div>
            {bassReadySongs.map(song => renderSongRow(song, 'ready'))}
          </div>
        )}
        {SONG_CATEGORIES.map(cat => (
          <div key={cat.name}>
            {/* Category label */}
            <div
              className="px-4 py-2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                color: C.textMut,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                marginTop: 8,
              }}
            >
              {cat.name}
            </div>

            {/* Song rows */}
            {cat.songs.map(song => renderSongRow(song))}
          </div>
        ))}
      </div>
    </aside>
  )
}
