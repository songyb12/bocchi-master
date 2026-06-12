// IMPORT SETTINGS bar for AudioChord handoffs — BPM/KEY override inputs +
// Apply + optional "use catalog values" shortcut when the import matches a
// known song. Extracted verbatim from SongsViewV2; clamping/normalization
// stays in the parent's applyImportedSettings.
import type { SongEntry } from '@/core/note/SongTracks'
import { C } from './theme'

export function ImportSettingsBar({
  bpmInput,
  keyInput,
  onBpmInputChange,
  onKeyInputChange,
  onApply,
  matchedSong,
}: {
  bpmInput: string
  keyInput: string
  onBpmInputChange: (value: string) => void
  onKeyInputChange: (value: string) => void
  onApply: (preset?: { bpm?: number; key?: string | null }) => void
  matchedSong: SongEntry | null
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-3 flex-wrap"
      style={{
        background: C.surface,
        boxShadow: C.inset,
        border: `1px solid rgba(113,220,143,0.16)`,
      }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: C.green, fontWeight: 700 }}>
        IMPORT SETTINGS
      </span>
      <label className="flex items-center gap-2" style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: C.textSec }}>
        BPM
        <input
          value={bpmInput}
          onChange={(event) => onBpmInputChange(event.target.value)}
          inputMode="decimal"
          style={{
            width: 76,
            height: 30,
            borderRadius: 7,
            border: `1px solid rgba(255,255,255,0.1)`,
            background: C.surface2,
            color: C.textPri,
            padding: '0 8px',
          }}
        />
      </label>
      <label className="flex items-center gap-2" style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: C.textSec }}>
        KEY
        <input
          value={keyInput}
          onChange={(event) => onKeyInputChange(event.target.value)}
          placeholder="Em"
          style={{
            width: 70,
            height: 30,
            borderRadius: 7,
            border: `1px solid rgba(255,255,255,0.1)`,
            background: C.surface2,
            color: C.textPri,
            padding: '0 8px',
          }}
        />
      </label>
      <button
        onClick={() => onApply()}
        style={{
          minHeight: 30,
          borderRadius: 7,
          border: `1px solid ${C.greenBd}`,
          background: C.greenDim,
          color: C.green,
          fontFamily: 'monospace',
          fontSize: '0.68rem',
          fontWeight: 700,
          padding: '0 10px',
        }}
      >
        Apply
      </button>
      {matchedSong && (
        <button
          onClick={() => onApply({ bpm: matchedSong.bpm, key: matchedSong.key })}
          style={{
            minHeight: 30,
            borderRadius: 7,
            border: `1px solid ${C.amberBd}`,
            background: C.amberDim,
            color: C.amber,
            fontFamily: 'monospace',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0 10px',
          }}
        >
          Use catalog {matchedSong.bpm}bpm / {matchedSong.key}
        </button>
      )}
    </div>
  )
}
