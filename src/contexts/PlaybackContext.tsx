import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Track } from '@/core/note/types'

export type PlaybackMode = 'b-mode' | 'a-mode'
export type PlaybackStatus = 'stopped' | 'playing' | 'paused'

interface PlaybackState {
  track: Track | null
  status: PlaybackStatus
  mode: PlaybackMode
  currentBeat: number
  currentMeasure: number
  bpm: number
  loopStart: number | null
  loopEnd: number | null
  countIn: number | null
  /** Increments on natural play-through end (engine onEnd) — never on manual stop. */
  endedCount: number
}

type PlaybackAction =
  | { type: 'SET_TRACK'; track: Track }
  | { type: 'SET_STATUS'; status: PlaybackStatus }
  | { type: 'SET_MODE'; mode: PlaybackMode }
  | { type: 'TICK'; beat: number; measure: number }
  | { type: 'SET_BPM'; bpm: number }
  | { type: 'SET_LOOP'; start: number | null; end: number | null }
  | { type: 'SET_COUNT_IN'; remaining: number | null }
  | { type: 'TRACK_ENDED' }
  | { type: 'RESET' }

const initialState: PlaybackState = {
  track: null,
  status: 'stopped',
  mode: 'b-mode',
  currentBeat: 0,
  currentMeasure: 0,
  bpm: 80,
  loopStart: null,
  loopEnd: null,
  countIn: null,
  endedCount: 0,
}

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'SET_TRACK':
      return { ...state, track: action.track, bpm: action.track.bpm, currentBeat: 0, currentMeasure: 0, status: 'stopped' }
    case 'SET_STATUS':
      return { ...state, status: action.status }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'TICK':
      return { ...state, currentBeat: action.beat, currentMeasure: action.measure }
    case 'SET_BPM':
      return { ...state, bpm: action.bpm }
    case 'SET_LOOP':
      return { ...state, loopStart: action.start, loopEnd: action.end }
    case 'SET_COUNT_IN':
      return { ...state, countIn: action.remaining }
    case 'TRACK_ENDED':
      return { ...state, status: 'stopped', endedCount: state.endedCount + 1 }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

const PlaybackStateContext = createContext<PlaybackState>(initialState)
const PlaybackDispatchContext = createContext<React.Dispatch<PlaybackAction>>(() => {})

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playbackReducer, initialState)
  return (
    <PlaybackStateContext.Provider value={state}>
      <PlaybackDispatchContext.Provider value={dispatch}>
        {children}
      </PlaybackDispatchContext.Provider>
    </PlaybackStateContext.Provider>
  )
}

export function usePlaybackState() { return useContext(PlaybackStateContext) }
export function usePlaybackDispatch() { return useContext(PlaybackDispatchContext) }
