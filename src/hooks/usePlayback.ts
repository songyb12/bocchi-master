import { useRef, useCallback } from 'react'
import { PlaybackEngine } from '@/core/audio/PlaybackEngine'
import { usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { useAudioContext } from '@/core/audio/AudioContextProvider'

export function usePlayback() {
  const state = usePlaybackState()
  const dispatch = usePlaybackDispatch()
  const getAudioContext = useAudioContext()
  const engineRef = useRef<PlaybackEngine | null>(null)

  const play = useCallback(() => {
    if (!state.track) return

    const ctx = getAudioContext()
    const beatsPerMeasure = state.track.timeSignature[0]
    const totalBeats = state.track.measures.length * beatsPerMeasure

    const engine = new PlaybackEngine(ctx, state.bpm, beatsPerMeasure, totalBeats, {
      onBeat: (beat, measure) => {
        dispatch({ type: 'TICK', beat, measure })
      },
      onEnd: () => {
        dispatch({ type: 'SET_STATUS', status: 'stopped' })
      },
    })

    engine.setBpm(state.bpm)
    engineRef.current = engine
    engine.start(1) // 1 bar count-in
    dispatch({ type: 'SET_STATUS', status: 'playing' })
  }, [state.track, state.bpm, getAudioContext, dispatch])

  const stop = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    dispatch({ type: 'SET_STATUS', status: 'stopped' })
    dispatch({ type: 'TICK', beat: 0, measure: 0 })
  }, [dispatch])

  const togglePlay = useCallback(() => {
    if (state.status === 'playing') {
      stop()
    } else {
      play()
    }
  }, [state.status, play, stop])

  const setBpm = useCallback((bpm: number) => {
    dispatch({ type: 'SET_BPM', bpm })
    engineRef.current?.setBpm(bpm)
  }, [dispatch])

  return { ...state, play, stop, togglePlay, setBpm }
}
