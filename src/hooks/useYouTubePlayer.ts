import { useRef, useEffect, useCallback, useState } from 'react'

// YouTube player states
export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

// Minimal YT types
interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead?: boolean): void
  getCurrentTime(): number
  getPlayerState(): number
  getDuration(): number
  destroy(): void
  loadVideoById(videoId: string): void
  cueVideoById(videoId: string): void
}

// Global API load management
let apiReady = false
const waiters: (() => void)[] = []

function ensureYTAPI(): Promise<void> {
  if (apiReady) return Promise.resolve()
  return new Promise(resolve => {
    waiters.push(resolve)
    if (waiters.length > 1) return // already loading
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    ;(window as any).onYouTubeIframeAPIReady = () => {
      apiReady = true
      waiters.forEach(fn => fn())
      waiters.length = 0
    }
    document.head.appendChild(script)
  })
}

export interface YouTubeSync {
  currentTime: number
  isPlaying: boolean
}

interface Options {
  onSync?: (sync: YouTubeSync) => void
}

export function useYouTubePlayer(containerRef: React.RefObject<HTMLDivElement | null>, videoId: string | null, options?: Options) {
  const playerRef = useRef<YTPlayer | null>(null)
  const rafRef = useRef<number>(0)
  const [state, setState] = useState<number>(YT_STATE.UNSTARTED)
  const [currentTime, setCurrentTime] = useState(0)
  const onSyncRef = useRef(options?.onSync)
  onSyncRef.current = options?.onSync
  const activeVideoRef = useRef<string | null>(null)

  // Polling loop — runs continuously while player exists
  const pollLoop = useCallback(() => {
    const p = playerRef.current
    if (p) {
      try {
        const st = p.getPlayerState()
        const t = p.getCurrentTime()
        setState(st)
        setCurrentTime(t)
        if (st === YT_STATE.PLAYING) {
          onSyncRef.current?.({ currentTime: t, isPlaying: true })
        } else {
          onSyncRef.current?.({ currentTime: t, isPlaying: false })
        }
      } catch {
        // player might be destroyed
      }
    }
    rafRef.current = requestAnimationFrame(pollLoop)
  }, [])

  // Initialize player once, then use loadVideoById for changes
  useEffect(() => {
    if (!videoId || !containerRef.current) return

    let destroyed = false

    const init = async () => {
      await ensureYTAPI()
      if (destroyed || !containerRef.current) return

      const YT = (window as any).YT
      if (!YT?.Player) return

      // If player already exists, just load new video
      if (playerRef.current && activeVideoRef.current) {
        playerRef.current.cueVideoById(videoId)
        activeVideoRef.current = videoId
        return
      }

      // Create a child div for YT to replace (so our ref div stays intact)
      const wrapper = document.createElement('div')
      wrapper.id = 'yt-inner-' + Date.now()
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(wrapper)

      playerRef.current = new YT.Player(wrapper.id, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!destroyed) {
              activeVideoRef.current = videoId
              // Start polling
              rafRef.current = requestAnimationFrame(pollLoop)
            }
          },
        },
      })
    }

    init()

    return () => {
      destroyed = true
    }
  }, [videoId, containerRef, pollLoop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch { /* ignore */ }
        playerRef.current = null
        activeVideoRef.current = null
      }
    }
  }, [])

  const seekTo = useCallback((sec: number) => {
    playerRef.current?.seekTo(sec, true)
  }, [])

  return { state, currentTime, seekTo }
}
