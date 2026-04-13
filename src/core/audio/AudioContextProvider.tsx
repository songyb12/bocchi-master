import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react'

const AudioCtx = createContext<AudioContext | null>(null)

export function AudioContextProvider({ children }: { children: ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null)

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  return (
    <AudioCtxProvider.Provider value={getContext}>
      {children}
    </AudioCtxProvider.Provider>
  )
}

// Separate context for the getter function
const AudioCtxProvider = createContext<() => AudioContext>(() => { throw new Error('AudioContextProvider not found') })

export function useAudioContext(): () => AudioContext {
  return useContext(AudioCtxProvider)
}

export { AudioCtx }
