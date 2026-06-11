import { useRef, useCallback } from 'react'
import { PlaybackEngine } from '@/core/audio/PlaybackEngine'
import { usePlaybackState, usePlaybackDispatch } from '@/contexts/PlaybackContext'
import { useAudioContext } from '@/core/audio/AudioContextProvider'

export function usePlayback() {
  const state = usePlaybackState()
  const dispatch = usePlaybackDispatch()
  const getAudioContext = useAudioContext()
  const engineRef = useRef<PlaybackEngine | null>(null)
  const pausedBeatRef = useRef<number | null>(null)

  const startEngine = useCallback((fromBeat?: number) => {
    if (!state.track) return

    const ctx = getAudioContext()
    const beatsPerMeasure = state.track.timeSignature[0]
    const totalBeats = state.track.measures.length * beatsPerMeasure

    const engine = new PlaybackEngine(ctx, state.bpm, beatsPerMeasure, totalBeats, {
      onBeat: (beat, measure) => {
        dispatch({ type: 'SET_COUNT_IN', remaining: null })
        dispatch({ type: 'TICK', beat, measure })
      },
      onEnd: () => {
        // Natural play-through end — distinguishable from manual stop so
        // listeners (e.g. drill completion) can react to a full run.
        dispatch({ type: 'TRACK_ENDED' })
      },
      onCountIn: (remaining) => {
        dispatch({ type: 'SET_COUNT_IN', remaining })
      },
    })

    engine.setBpm(state.bpm)
    if (state.loopStart !== null && state.loopEnd !== null) {
      engine.setLoop(state.loopStart, state.loopEnd)
    }
    engineRef.current = engine
    engine.start(fromBeat !== undefined ? 0 : 1, fromBeat)
    dispatch({ type: 'SET_STATUS', status: 'playing' })
  }, [state.track, state.bpm, state.loopStart, state.loopEnd, getAudioContext, dispatch])

  const play = useCallback(() => {
    pausedBeatRef.current = null
    startEngine()
  }, [startEngine])

  const stop = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    pausedBeatRef.current = null
    dispatch({ type: 'SET_STATUS', status: 'stopped' })
    dispatch({ type: 'TICK', beat: 0, measure: 0 })
  }, [dispatch])

  const pause = useCallback(() => {
    if (!engineRef.current) return
    const beat = engineRef.current.pause()
    pausedBeatRef.current = beat
    engineRef.current = null
    dispatch({ type: 'SET_STATUS', status: 'paused' })
  }, [dispatch])

  const resume = useCallback(() => {
    if (pausedBeatRef.current === null) return
    startEngine(pausedBeatRef.current)
    pausedBeatRef.current = null
  }, [startEngine])

  const togglePlay = useCallback(() => {
    if (state.status === 'playing') {
      pause()
    } else if (state.status === 'paused') {
      resume()
    } else {
      play()
    }
  }, [state.status, play, pause, resume])

  const setBpm = useCallback((bpm: number) => {
    dispatch({ type: 'SET_BPM', bpm })
    engineRef.current?.setBpm(bpm)
  }, [dispatch])

  const setLoop = useCallback((start: number | null, end: number | null) => {
    dispatch({ type: 'SET_LOOP', start, end })
    engineRef.current?.setLoop(start, end)
  }, [dispatch])

  return { ...state, play, stop, pause, resume, togglePlay, setBpm, setLoop }
}
