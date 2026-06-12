// Measure-mode renderer — constant-width cells on the BPM grid with beat
// dots, dominant chord, bass-root pill, and ambiguity hint. Extracted
// verbatim from ChordTimeline; quantization and active-index stay with the
// host, cells arrive pre-trimmed (visibleMeasures).
import type { RefObject } from 'react'
import type { MeasureCell } from './chordQuantize'
import { C, extractRoot, normalizeLabel } from './chordDisplay'

export function MeasureGrid({
  visibleMeasures,
  activeIdx,
  beatsPerMeasure,
  trimLo,
  onSeek,
  scrollRef,
}: {
  visibleMeasures: MeasureCell[]
  activeIdx: number
  beatsPerMeasure: number
  /** First visible cell index — suppresses its bar-line accent. */
  trimLo: number
  onSeek?: (sec: number) => void
  scrollRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto"
      style={{ paddingBottom: 4 }}
    >
      <div className="flex items-stretch" style={{ minHeight: 56 }}>
        {visibleMeasures.map((cell) => {
          const isActive = cell.index === activeIdx
          const isNoChord = cell.label === 'N' || cell.label === 'X'
          const conf = cell.confidence
          const dimByConf = 0.4 + Math.min(1, conf) * 0.6
          const ambiguous = cell.contributions.length > 1 && cell.contributions[0].label !== 'N'
            && cell.contributions[1] && cell.contributions[1].label !== 'N'
            && cell.contributions[1].durationInMeasure / Math.max(0.001, cell.contributions[0].durationInMeasure) > 0.6
          return (
            <div
              key={cell.index}
              data-seg-idx={cell.index}
              onClick={() => onSeek?.(cell.start)}
              className="flex flex-col items-center justify-center flex-shrink-0 transition-all relative"
              style={{
                width: 88,
                background: isActive ? C.amber : isNoChord ? C.surface2 : '#222',
                color: isActive ? '#000' : isNoChord ? C.textMut : C.textPri,
                border: isActive ? `1px solid ${C.amber}` : `1px solid rgba(255,255,255,0.08)`,
                borderLeft: cell.index === trimLo
                  ? `1px solid rgba(255,255,255,0.08)`
                  : `2px solid rgba(255,255,255,0.18)`, // bar-line accent
                boxShadow: isActive ? `0 0 12px ${C.amber}80` : 'none',
                opacity: isActive ? 1 : isNoChord ? 0.4 : dimByConf,
                cursor: onSeek ? 'pointer' : 'default',
                fontFamily: 'monospace',
                padding: '8px 4px',
              }}
              title={
                `m.${cell.index + 1} · ${cell.start.toFixed(2)}s–${cell.end.toFixed(2)}s` +
                `\n${cell.contributions.slice(0, 3).map(c => `${c.label} ${c.durationInMeasure.toFixed(2)}s (${c.confidence.toFixed(2)})`).join(' · ')}`
              }
            >
              <span style={{
                fontSize: 9, opacity: 0.55, lineHeight: 1,
                color: isActive ? '#000' : C.textMut,
              }}>
                m.{cell.index + 1}
              </span>
              {/* R17 — beat dots inside the measure cell (1·2·3·4) */}
              <div className="flex gap-1 mt-1">
                {Array.from({ length: beatsPerMeasure }, (_, b) => (
                  <span
                    key={b}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isActive
                        ? b === 0 ? '#000' : 'rgba(0,0,0,0.45)'
                        : b === 0 ? '#fbbc00aa' : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>
                {normalizeLabel(cell.label)}
              </span>
              {!isNoChord && extractRoot(cell.label) && (
                <span
                  title="베이스 루트 노트 (Stage 1: 이 음만 짚기)"
                  style={{
                    fontSize: 10,
                    marginTop: 3,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: isActive
                      ? 'rgba(0,0,0,0.15)'
                      : 'rgba(126,255,139,0.12)',
                    color: isActive ? '#000' : '#7eff8b',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  ♭ {extractRoot(cell.label)}
                </span>
              )}
              {ambiguous && (
                <span style={{
                  fontSize: 9, opacity: 0.55, marginTop: 2,
                  color: isActive ? '#000' : C.textMut,
                }}>
                  / {normalizeLabel(cell.contributions[1].label)}?
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
