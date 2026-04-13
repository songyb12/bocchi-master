/**
 * B Mode Tab Renderer
 *
 * Fixed 4-measure tab notation with a moving cursor.
 * Guitar Pro / Songsterr style — tab stays still, playhead moves right.
 */

import { useMemo } from 'react'
import type { Track, NoteEvent } from '@/core/note/types'

interface Props {
  track: Track
  currentBeat: number
  currentMeasure: number
  isPlaying: boolean
}

// Layout constants
const MARGIN_LEFT = 60
const MARGIN_TOP = 30
const STRING_SPACING = 22
const BEAT_WIDTH = 60
const MEASURE_GAP = 20

export function BModeRenderer({ track, currentBeat, currentMeasure, isPlaying }: Props) {
  const { tuning, events, measures, timeSignature } = track
  const stringCount = tuning.stringCount
  const beatsPerMeasure = timeSignature[0]

  // Show 4 measures at a time, starting from the page that contains currentMeasure
  const pageStart = Math.floor(currentMeasure / 4) * 4
  const visibleMeasures = measures.slice(pageStart, pageStart + 4)

  const svgWidth = MARGIN_LEFT + visibleMeasures.length * (beatsPerMeasure * BEAT_WIDTH + MEASURE_GAP) + 20
  const svgHeight = MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 40

  // Filter events that belong to visible measures
  const visibleEvents = useMemo(() => {
    if (visibleMeasures.length === 0) return []
    const startBeat = visibleMeasures[0].startBeat
    const endBeat = startBeat + visibleMeasures.length * beatsPerMeasure
    return events.filter(e => e.time >= startBeat && e.time < endBeat)
  }, [events, visibleMeasures, beatsPerMeasure])

  // Calculate X position for a beat within visible measures
  const beatToX = (beat: number): number => {
    const firstBeat = visibleMeasures[0]?.startBeat ?? 0
    const relativeBeat = beat - firstBeat
    const measureIndex = Math.floor(relativeBeat / beatsPerMeasure)
    const beatInMeasure = relativeBeat % beatsPerMeasure
    return MARGIN_LEFT + measureIndex * (beatsPerMeasure * BEAT_WIDTH + MEASURE_GAP) + beatInMeasure * BEAT_WIDTH + BEAT_WIDTH / 2
  }

  // String Y position (0 = lowest, displayed at bottom like real tab — inverted)
  const stringToY = (stringIndex: number): number => {
    return MARGIN_TOP + (stringCount - 1 - stringIndex) * STRING_SPACING
  }

  // Cursor X position
  const cursorX = visibleMeasures.length > 0 ? beatToX(currentBeat) : MARGIN_LEFT

  // String names (displayed from high to low, top to bottom)
  const stringNames = [...tuning.tuning].reverse().map(n => n.name)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="select-none"
    >
      {/* Background */}
      <rect width={svgWidth} height={svgHeight} fill="transparent" />

      {/* String labels */}
      {stringNames.map((name, i) => (
        <text
          key={`label-${i}`}
          x={MARGIN_LEFT - 25}
          y={MARGIN_TOP + i * STRING_SPACING + 5}
          fill="var(--text-muted)"
          fontSize={12}
          fontFamily="monospace"
          textAnchor="end"
        >
          {name}
        </text>
      ))}

      {/* Strings (horizontal lines) */}
      {Array.from({ length: stringCount }, (_, i) => {
        const y = MARGIN_TOP + i * STRING_SPACING
        return (
          <line
            key={`string-${i}`}
            x1={MARGIN_LEFT}
            y1={y}
            x2={svgWidth - 10}
            y2={y}
            stroke="var(--string-color)"
            strokeWidth={1}
            opacity={0.5}
          />
        )
      })}

      {/* Measure bar lines */}
      {visibleMeasures.map((m, i) => {
        const x = MARGIN_LEFT + i * (beatsPerMeasure * BEAT_WIDTH + MEASURE_GAP)
        return (
          <g key={`bar-${m.index}`}>
            <line
              x1={x}
              y1={MARGIN_TOP - 5}
              x2={x}
              y2={MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 5}
              stroke="var(--fret-color)"
              strokeWidth={2}
            />
            {/* Measure number */}
            <text
              x={x + 5}
              y={MARGIN_TOP - 12}
              fill="var(--text-muted)"
              fontSize={10}
              fontFamily="monospace"
            >
              {m.index + 1}
            </text>
            {/* Measure label */}
            {m.label && (
              <text
                x={x + 5}
                y={MARGIN_TOP - 22}
                fill="var(--neon-cyan)"
                fontSize={11}
              >
                {m.label}
              </text>
            )}
          </g>
        )
      })}

      {/* End bar line */}
      {visibleMeasures.length > 0 && (
        <line
          x1={MARGIN_LEFT + visibleMeasures.length * (beatsPerMeasure * BEAT_WIDTH + MEASURE_GAP)}
          y1={MARGIN_TOP - 5}
          x2={MARGIN_LEFT + visibleMeasures.length * (beatsPerMeasure * BEAT_WIDTH + MEASURE_GAP)}
          y2={MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 5}
          stroke="var(--fret-color)"
          strokeWidth={2}
        />
      )}

      {/* Beat grid (vertical dotted lines) */}
      {visibleMeasures.map((_m, mi) =>
        Array.from({ length: beatsPerMeasure }, (_, bi) => {
          if (bi === 0) return null // skip downbeat (already has bar line)
          const x = MARGIN_LEFT + mi * (beatsPerMeasure * BEAT_WIDTH + MEASURE_GAP) + bi * BEAT_WIDTH
          return (
            <line
              key={`grid-${mi}-${bi}`}
              x1={x}
              y1={MARGIN_TOP}
              x2={x}
              y2={MARGIN_TOP + (stringCount - 1) * STRING_SPACING}
              stroke="var(--fret-color)"
              strokeWidth={0.5}
              strokeDasharray="3,4"
              opacity={0.3}
            />
          )
        })
      )}

      {/* Notes */}
      {visibleEvents.map(note => (
        <NoteGlyph
          key={note.id}
          note={note}
          x={beatToX(note.time)}
          y={stringToY(note.string)}
          isActive={isPlaying && Math.abs(note.time - currentBeat) < 0.01}
          isPast={note.time < currentBeat}
        />
      ))}

      {/* Playback cursor */}
      {isPlaying && currentBeat >= (visibleMeasures[0]?.startBeat ?? 0) && (
        <g>
          <line
            x1={cursorX}
            y1={MARGIN_TOP - 10}
            x2={cursorX}
            y2={MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 10}
            stroke="var(--cursor-color)"
            strokeWidth={2}
            opacity={0.9}
          />
          {/* Glow effect */}
          <line
            x1={cursorX}
            y1={MARGIN_TOP - 10}
            x2={cursorX}
            y2={MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 10}
            stroke="var(--cursor-color)"
            strokeWidth={6}
            opacity={0.2}
            filter="url(#cursor-glow)"
          />
        </g>
      )}

      {/* SVG Filters */}
      <defs>
        <filter id="cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="note-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

// ─── Note Glyph ──────────────────────────────────────────

interface NoteGlyphProps {
  note: NoteEvent
  x: number
  y: number
  isActive: boolean
  isPast: boolean
}

function NoteGlyph({ note, x, y, isActive, isPast }: NoteGlyphProps) {
  const text = note.fret === -1 ? 'x' : String(note.fret)
  const fill = isActive
    ? 'var(--neon-cyan)'
    : isPast
    ? 'var(--text-muted)'
    : 'var(--text-primary)'

  return (
    <g filter={isActive ? 'url(#note-glow)' : undefined}>
      {/* Background rect to hide string line */}
      <rect
        x={x - 10}
        y={y - 10}
        width={20}
        height={20}
        fill="var(--bg-primary)"
        rx={3}
      />
      {/* Fret number */}
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fill={fill}
        fontSize={14}
        fontFamily="monospace"
        fontWeight={isActive ? 'bold' : 'normal'}
      >
        {text}
      </text>
      {/* Technique indicator */}
      {note.technique && (
        <text
          x={x}
          y={y - 13}
          textAnchor="middle"
          fill="var(--neon-pink)"
          fontSize={9}
          fontFamily="monospace"
        >
          {note.technique}
        </text>
      )}
      {/* Accent marker */}
      {note.accent && (
        <text
          x={x + 12}
          y={y - 5}
          fill="var(--neon-yellow)"
          fontSize={10}
        >
          &gt;
        </text>
      )}
    </g>
  )
}
