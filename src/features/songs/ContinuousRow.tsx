// Continuous-mode renderer — variable-width chord boxes proportional to
// segment duration. Extracted verbatim from ChordTimeline; active-index and
// auto-scroll (via scrollRef + data-seg-idx) stay with the host.
import type { RefObject } from 'react'
import type { ChordSegment } from './chordQuantize'
import { C, extractRoot, normalizeLabel } from './chordDisplay'

export function ContinuousRow({
  chords,
  visibleChords,
  activeIdx,
  onSeek,
  scrollRef,
}: {
  /** Full segment list — needed to map a visible segment back to its original index. */
  chords: ChordSegment[]
  visibleChords: ChordSegment[]
  activeIdx: number
  onSeek?: (sec: number) => void
  scrollRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto"
      style={{ paddingBottom: 4 }}
    >
      <div className="flex items-stretch gap-1" style={{ minHeight: 56 }}>
        {visibleChords.map((seg, i) => {
          const origIdx = chords.indexOf(seg)
          const isActive = origIdx === activeIdx
          const isNoChord = seg.label === 'N'
          const dur = Math.max(0.5, seg.end - seg.start)
          // px scaling: 28px per second, min 44px, max 240px
          const width = Math.max(44, Math.min(240, dur * 28))
          const conf = seg.confidence
          const dimByConf = 0.4 + Math.min(1, conf) * 0.6 // 0.4–1.0
          return (
            <div
              key={`${seg.start}-${i}`}
              data-seg-idx={origIdx}
              onClick={() => onSeek?.(seg.start)}
              className="rounded flex flex-col items-center justify-center flex-shrink-0 transition-all"
              style={{
                width,
                background: isActive ? C.amber : isNoChord ? C.surface2 : '#222',
                color: isActive ? '#000' : isNoChord ? C.textMut : C.textPri,
                border: isActive ? `1px solid ${C.amber}` : `1px solid rgba(255,255,255,0.06)`,
                boxShadow: isActive ? `0 0 12px ${C.amber}80` : 'none',
                opacity: isActive ? 1 : isNoChord ? 0.5 : dimByConf,
                cursor: onSeek ? 'pointer' : 'default',
                fontFamily: 'monospace',
                padding: '6px 4px',
              }}
              title={`${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s · conf ${conf.toFixed(2)}`}
            >
              <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>
                {normalizeLabel(seg.label)}
              </span>
              {!isNoChord && extractRoot(seg.label) && width > 50 && (
                <span
                  style={{
                    fontSize: 9,
                    marginTop: 2,
                    color: isActive ? '#000' : '#7eff8b',
                    opacity: isActive ? 0.7 : 0.85,
                    fontWeight: 600,
                  }}
                >
                  ♭{extractRoot(seg.label)}
                </span>
              )}
              <span style={{ fontSize: 9, opacity: 0.65, marginTop: 2 }}>
                {dur.toFixed(1)}s
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
