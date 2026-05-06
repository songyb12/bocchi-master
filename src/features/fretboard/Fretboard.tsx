/**
 * SVG Fretboard with neon glow
 *
 * Displays current note positions and optional guide overlay (scale/chord).
 */

import { useMemo } from 'react'
import type { InstrumentConfig } from '@/types/music'
import type { NoteEvent, GuideOverlay } from '@/core/note/types'
import { CHROMATIC_SCALE } from '@/data/notes'

interface Props {
  tuning: InstrumentConfig
  activeNotes: NoteEvent[]
  guide?: GuideOverlay
  visibleFrets?: number
  /**
   * Bass-learning hint: root note names ("E", "A♯", "F♯", etc.) — every
   * matching position within `visibleFrets` is dimly marked. Useful when
   * ChordTimeline pipes the active chord's root, so the player can see all
   * the playable spots without configuring a full GuideOverlay.
   */
  bassRootHints?: string[]
}

const FRET_COUNT = 15
const STRING_SPACING = 28
const MARGIN_LEFT = 40
const MARGIN_TOP = 25
const NUT_WIDTH = 6

export function Fretboard({ tuning, activeNotes, guide, visibleFrets = FRET_COUNT, bassRootHints }: Props) {
  const stringCount = tuning.stringCount
  const svgHeight = MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 30
  const svgWidth = 800

  // Fret positions using equal temperament formula
  const fretPositions = useMemo(() => {
    const scaleLength = svgWidth - MARGIN_LEFT - 20
    return Array.from({ length: visibleFrets + 1 }, (_, i) =>
      MARGIN_LEFT + scaleLength * (1 - 1 / Math.pow(2, i / 12))
    )
  }, [svgWidth, visibleFrets])

  // Fret dot positions (3, 5, 7, 9, 12, 15)
  const dotFrets = [3, 5, 7, 9, 12, 15].filter(f => f <= visibleFrets)
  const doubleDotFrets = [12].filter(f => f <= visibleFrets)

  const fretMidX = (fret: number): number => {
    if (fret === 0) return MARGIN_LEFT - 15
    return (fretPositions[fret - 1] + fretPositions[fret]) / 2
  }

  const stringY = (index: number): number => {
    return MARGIN_TOP + (stringCount - 1 - index) * STRING_SPACING
  }

  return (
    <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="select-none">
      {/* Nut */}
      <rect
        x={MARGIN_LEFT - NUT_WIDTH}
        y={MARGIN_TOP - 5}
        width={NUT_WIDTH}
        height={(stringCount - 1) * STRING_SPACING + 10}
        fill="#555566"
        rx={1}
      />

      {/* Fret lines */}
      {fretPositions.slice(1).map((x, i) => (
        <line
          key={`fret-${i}`}
          x1={x}
          y1={MARGIN_TOP - 5}
          x2={x}
          y2={MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 5}
          stroke="var(--fret-color)"
          strokeWidth={i === 11 ? 2 : 1} // 12th fret thicker
        />
      ))}

      {/* Fret dots */}
      {dotFrets.map(f => {
        const cx = fretMidX(f)
        const cy = MARGIN_TOP + ((stringCount - 1) * STRING_SPACING) / 2
        if (doubleDotFrets.includes(f)) {
          return (
            <g key={`dot-${f}`}>
              <circle cx={cx} cy={cy - STRING_SPACING} r={4} fill="var(--fret-color)" opacity={0.5} />
              <circle cx={cx} cy={cy + STRING_SPACING} r={4} fill="var(--fret-color)" opacity={0.5} />
            </g>
          )
        }
        return <circle key={`dot-${f}`} cx={cx} cy={cy} r={4} fill="var(--fret-color)" opacity={0.5} />
      })}

      {/* Fret numbers */}
      {[1, 3, 5, 7, 9, 12, 15].filter(f => f <= visibleFrets).map(f => (
        <text
          key={`fn-${f}`}
          x={fretMidX(f)}
          y={svgHeight - 5}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize={9}
          fontFamily="monospace"
        >
          {f}
        </text>
      ))}

      {/* Strings */}
      {Array.from({ length: stringCount }, (_, i) => {
        const y = stringY(i)
        const thickness = 1 + (stringCount - 1 - i) * 0.3 // thicker for lower strings
        return (
          <line
            key={`s-${i}`}
            x1={MARGIN_LEFT}
            y1={y}
            x2={fretPositions[visibleFrets] || svgWidth - 20}
            y2={y}
            stroke="var(--string-color)"
            strokeWidth={thickness}
            opacity={0.6}
          />
        )
      })}

      {/* String names */}
      {tuning.tuning.map((note, i) => (
        <text
          key={`sn-${i}`}
          x={MARGIN_LEFT - NUT_WIDTH - 10}
          y={stringY(i) + 4}
          textAnchor="end"
          fill="var(--text-muted)"
          fontSize={11}
          fontFamily="monospace"
        >
          {note.name}
        </text>
      ))}

      {/* Bass root hints (R5) — every fret position whose pitch class matches */}
      {bassRootHints && bassRootHints.length > 0 && Array.from({ length: stringCount }, (_, sIdx) => {
        const openMidi = tuning.tuning[sIdx].midiNumber
        const targets = bassRootHints
          .map(h => h.replace(/♯/g, '#').replace(/♭/g, 'b'))
        const matches: number[] = []
        for (let f = 0; f <= visibleFrets; f++) {
          const noteName = CHROMATIC_SCALE[(openMidi + f) % 12]
          if (targets.includes(noteName)) matches.push(f)
        }
        return matches.map(f => (
          <circle
            key={`bass-hint-${sIdx}-${f}`}
            cx={fretMidX(f)}
            cy={stringY(sIdx)}
            r={6}
            fill="none"
            stroke="#7eff8b"
            strokeWidth={1.2}
            opacity={0.55}
            strokeDasharray="2,2"
          />
        ))
      })}

      {/* Guide overlay (scale/chord positions) */}
      {guide?.positions?.filter(pos =>
        pos.fret >= 0 && pos.fret <= visibleFrets &&
        pos.string >= 0 && pos.string < stringCount
      ).map((pos, i) => {
        const midi = tuning.tuning[pos.string].midiNumber + pos.fret
        const noteName = CHROMATIC_SCALE[midi % 12]
        const isRoot = guide.rootNote === noteName
        return (
          <g key={`guide-${i}`}>
            <circle
              cx={fretMidX(pos.fret)}
              cy={stringY(pos.string)}
              r={isRoot ? 10 : 7}
              fill={isRoot ? 'var(--neon-pink)' : 'var(--neon-purple)'}
              opacity={isRoot ? 0.5 : 0.3}
              stroke={isRoot ? 'var(--neon-pink)' : 'var(--neon-purple)'}
              strokeWidth={isRoot ? 1.5 : 0.5}
            />
            {isRoot && (
              <text
                x={fretMidX(pos.fret)}
                y={stringY(pos.string) + 3.5}
                textAnchor="middle"
                fill="white"
                fontSize={8}
                fontWeight="bold"
                fontFamily="monospace"
              >
                R
              </text>
            )}
          </g>
        )
      })}

      {/* Active notes */}
      {activeNotes.filter(note =>
        Number.isFinite(note.fret) && note.fret >= 0 && note.fret <= visibleFrets &&
        Number.isFinite(note.string) && note.string >= 0 && note.string < stringCount
      ).map(note => (
        <g key={`active-${note.id}`} filter="url(#fret-glow)">
          <circle
            cx={fretMidX(note.fret)}
            cy={stringY(note.string)}
            r={10}
            fill="var(--neon-cyan)"
            opacity={0.9}
          />
          <text
            x={fretMidX(note.fret)}
            y={stringY(note.string) + 4}
            textAnchor="middle"
            fill="var(--bg-primary)"
            fontSize={11}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {note.fret}
          </text>
        </g>
      ))}

      {/* Glow filter */}
      <defs>
        <filter id="fret-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
