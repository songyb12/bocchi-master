// Sidebar row for a recent AudioChord import. Extracted verbatim from
// SongsViewV2's renderImportRow — isActive/onSelect are computed by the caller.
import type { AudioChordPracticeHandoff } from '@/lib/audiochordHandoff'
import { C } from './theme'

export function ImportRow({
  handoff,
  isActive,
  onSelect,
}: {
  handoff: AudioChordPracticeHandoff
  isActive: boolean
  onSelect: () => void
}) {
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
          background: isActive ? C.amber : C.green,
          opacity: isActive ? 1 : 0.7,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? C.amber : C.textPri,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {handoff.title}
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            color: C.textMut,
            marginTop: 2,
          }}
        >
          {handoff.chords.length} chords · {handoff.fileId ?? 'audio'}
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
        <div>{handoff.key ?? 'AUTO'}</div>
        <div>{handoff.bpm ?? '-'}<span style={{ opacity: 0.6 }}>bpm</span></div>
      </div>
    </button>
  )
}
