import { usePlaybackState } from '@/contexts/PlaybackContext'

export function CountInOverlay() {
  const { countIn } = usePlaybackState()

  if (countIn === null) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div
        className="text-7xl font-mono font-bold animate-pulse"
        style={{
          color: 'var(--neon-yellow)',
          textShadow: '0 0 20px var(--neon-yellow), 0 0 40px var(--neon-yellow)',
        }}
      >
        {countIn}
      </div>
    </div>
  )
}
