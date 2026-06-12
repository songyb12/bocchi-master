// Sidebar row for a catalog song. Extracted verbatim from SongsViewV2's
// renderSongRow — isActive/hasPlayableTab are computed by the caller (they
// depend on selection state and getSongTrack), badge/accent are derived here.
import type { SongEntry } from '@/core/note/SongTracks'
import { C } from './theme'

export type SongRowVariant = 'default' | 'recent' | 'ready'

export function SongRow({
  song,
  variant = 'default',
  isActive,
  hasPlayableTab,
  instrument,
  onSelect,
}: {
  song: SongEntry
  variant?: SongRowVariant
  isActive: boolean
  hasPlayableTab: boolean
  instrument: 'bass' | 'guitar'
  onSelect: () => void
}) {
  const badge = hasPlayableTab ? (instrument === 'bass' ? 'BASS TAB' : 'TAB') : 'ROOTS'
  const rowAccent = variant === 'recent' ? C.green : variant === 'ready' ? C.rose : C.amber

  return (
    <button
      onClick={onSelect}
      className="w-full text-left transition-all"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: isActive ? C.amberDim : 'transparent',
        borderLeft: isActive ? `3px solid ${C.amber}` : '3px solid transparent',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isActive ? C.amber : rowAccent,
          opacity: isActive ? 1 : 0.65,
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: isActive ? 'Georgia, "Times New Roman", serif' : 'inherit',
            fontStyle: isActive ? 'italic' : 'normal',
            fontSize: '0.85rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? C.amber : C.textPri,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {song.title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            color: C.textMut,
            marginTop: 2,
            minWidth: 0,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {song.artist}
          </span>
          <span
            style={{
              color: hasPlayableTab ? C.green : C.textMut,
              border: `1px solid ${hasPlayableTab ? C.greenBd : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 999,
              padding: '1px 5px',
              fontSize: '0.55rem',
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        </div>
      </div>

      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.62rem',
          color: isActive ? C.amber : C.textMut,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        <div>{song.key}</div>
        <div>{song.bpm}<span style={{ opacity: 0.6 }}>bpm</span></div>
      </div>
    </button>
  )
}
