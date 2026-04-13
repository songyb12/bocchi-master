/**
 * Hit/Miss feedback popup overlay.
 * Shows PERFECT / GOOD / OK / MISS with neon colors and fade animation.
 */

import { useEffect, useState } from 'react'
import type { RhythmRating } from '@/core/note/types'

interface FeedbackItem {
  id: number
  rating: RhythmRating
  timestamp: number
}

const RATING_CONFIG: Record<RhythmRating, { label: string; color: string; glow: string }> = {
  perfect: { label: 'PERFECT', color: 'var(--neon-cyan)', glow: 'var(--glow-cyan)' },
  good: { label: 'GOOD', color: 'var(--neon-green)', glow: 'var(--glow-green)' },
  ok: { label: 'OK', color: 'var(--neon-yellow)', glow: '0 0 8px #ffee0080' },
  miss: { label: 'MISS', color: 'var(--neon-red)', glow: '0 0 8px #ff335580' },
}

let nextId = 0

export function useHitFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([])

  const showFeedback = (rating: RhythmRating) => {
    const item: FeedbackItem = { id: nextId++, rating, timestamp: Date.now() }
    setItems(prev => [...prev, item])
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== item.id))
    }, 800)
  }

  return { items, showFeedback }
}

interface Props {
  items: FeedbackItem[]
}

export function HitFeedbackOverlay({ items }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {items.map(item => (
        <FeedbackPopup key={item.id} item={item} />
      ))}
    </div>
  )
}

function FeedbackPopup({ item }: { item: FeedbackItem }) {
  const config = RATING_CONFIG[item.rating]
  const [opacity, setOpacity] = useState(1)
  const [scale, setScale] = useState(1.5)

  useEffect(() => {
    requestAnimationFrame(() => {
      setOpacity(0)
      setScale(1)
    })
  }, [])

  return (
    <div
      className="absolute text-3xl font-black tracking-widest"
      style={{
        color: config.color,
        textShadow: config.glow,
        opacity,
        transform: `scale(${scale})`,
        transition: 'all 0.6s ease-out',
      }}
    >
      {config.label}
    </div>
  )
}
