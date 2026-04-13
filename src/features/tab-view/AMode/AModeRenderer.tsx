/**
 * A Mode Tab Renderer
 *
 * Canvas-based scrolling tab — notes move left, judgment line fixed.
 * Rocksmith style. Uses requestAnimationFrame for smooth 60fps.
 */

import { useRef, useEffect, useCallback } from 'react'
import type { Track } from '@/core/note/types'

interface Props {
  track: Track
  currentBeat: number
  isPlaying: boolean
}

// Layout constants
const MARGIN_LEFT = 50
const MARGIN_TOP = 25
const STRING_SPACING = 22
const PIXELS_PER_BEAT = 80
const JUDGMENT_LINE_X = 200
const NOTE_RADIUS = 14

const COLORS = {
  bg: '#12121a',
  string: '#667788',
  fret: '#444455',
  note: '#e8e8f0',
  active: '#00f0ff',
  past: '#555570',
  judgment: '#00f0ff',
  judgmentGlow: 'rgba(0, 240, 255, 0.2)',
  technique: '#ff00aa',
}

export function AModeRenderer({ track, currentBeat, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { tuning, events, timeSignature } = track
  const stringCount = tuning.stringCount
  const beatsPerMeasure = timeSignature[0]
  const canvasHeight = MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 40

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, width, height)

    // Strings
    for (let i = 0; i < stringCount; i++) {
      const y = MARGIN_TOP + (stringCount - 1 - i) * STRING_SPACING
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.strokeStyle = COLORS.string
      ctx.lineWidth = 0.5 + (stringCount - 1 - i) * 0.2
      ctx.globalAlpha = 0.4
      ctx.stroke()
      ctx.globalAlpha = 1

      // String labels
      ctx.fillStyle = COLORS.fret
      ctx.font = '11px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(tuning.tuning[i].name, MARGIN_LEFT - 10, y + 4)
    }

    // Beat grid lines (vertical)
    const visibleBeats = Math.ceil(width / PIXELS_PER_BEAT) + 2
    const startBeat = Math.floor(currentBeat) - Math.ceil(JUDGMENT_LINE_X / PIXELS_PER_BEAT)
    for (let b = startBeat; b < startBeat + visibleBeats; b++) {
      const x = JUDGMENT_LINE_X + (b - currentBeat) * PIXELS_PER_BEAT
      if (x < MARGIN_LEFT || x > width) continue

      const isMeasureLine = b >= 0 && b % beatsPerMeasure === 0
      ctx.beginPath()
      ctx.moveTo(x, MARGIN_TOP - 5)
      ctx.lineTo(x, MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 5)
      ctx.strokeStyle = COLORS.fret
      ctx.lineWidth = isMeasureLine ? 1.5 : 0.5
      ctx.globalAlpha = isMeasureLine ? 0.6 : 0.2
      ctx.stroke()
      ctx.globalAlpha = 1

      // Measure numbers
      if (isMeasureLine && b >= 0) {
        ctx.fillStyle = COLORS.fret
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(Math.floor(b / beatsPerMeasure) + 1), x, MARGIN_TOP - 10)
      }
    }

    // Notes
    for (const note of events) {
      const x = JUDGMENT_LINE_X + (note.time - currentBeat) * PIXELS_PER_BEAT
      if (x < -30 || x > width + 30) continue

      const y = MARGIN_TOP + (stringCount - 1 - note.string) * STRING_SPACING
      const isActive = Math.abs(note.time - currentBeat) < 0.1
      const isPast = note.time < currentBeat - 0.1

      // Note background
      ctx.beginPath()
      ctx.roundRect(x - NOTE_RADIUS, y - 11, NOTE_RADIUS * 2, 22, 4)
      ctx.fillStyle = COLORS.bg
      ctx.fill()

      // Note glow (active)
      if (isActive) {
        ctx.shadowColor = COLORS.active
        ctx.shadowBlur = 12
      }

      // Note text
      ctx.fillStyle = isActive ? COLORS.active : isPast ? COLORS.past : COLORS.note
      ctx.font = `${isActive ? 'bold ' : ''}14px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(note.fret === -1 ? 'x' : String(note.fret), x, y)
      ctx.shadowBlur = 0

      // Technique
      if (note.technique) {
        ctx.fillStyle = COLORS.technique
        ctx.font = '9px monospace'
        ctx.fillText(note.technique, x, y - 15)
      }
    }

    // Judgment line
    ctx.beginPath()
    ctx.moveTo(JUDGMENT_LINE_X, MARGIN_TOP - 12)
    ctx.lineTo(JUDGMENT_LINE_X, MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 12)
    ctx.strokeStyle = COLORS.judgment
    ctx.lineWidth = 2
    ctx.stroke()

    // Judgment glow
    ctx.beginPath()
    ctx.moveTo(JUDGMENT_LINE_X, MARGIN_TOP - 12)
    ctx.lineTo(JUDGMENT_LINE_X, MARGIN_TOP + (stringCount - 1) * STRING_SPACING + 12)
    ctx.strokeStyle = COLORS.judgmentGlow
    ctx.lineWidth = 8
    ctx.stroke()
  }, [currentBeat, events, stringCount, tuning, beatsPerMeasure])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = canvasHeight * dpr
    ctx.scale(dpr, dpr)

    draw(ctx, rect.width, canvasHeight)
  }, [draw, canvasHeight])

  // Continuous redraw while playing
  useEffect(() => {
    if (!isPlaying) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    draw(ctx, rect.width, canvasHeight)
  })

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: canvasHeight, background: COLORS.bg }}
    />
  )
}
