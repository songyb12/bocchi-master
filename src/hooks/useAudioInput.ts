/**
 * Hook for microphone audio input + pitch detection.
 * Uses AudioWorklet for off-main-thread processing.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAudioContext } from '@/core/audio/AudioContextProvider'

interface PitchData {
  frequency: number | null
  midi: number | null
  cents: number
  noteName: string
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function frequencyToNote(freq: number): { midi: number; cents: number; name: string } {
  const midiFloat = 12 * Math.log2(freq / 440) + 69
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)
  const name = NOTE_NAMES[midi % 12] ?? '?'
  return { midi, cents, name }
}

export function useAudioInput() {
  const getAudioContext = useAudioContext()
  const [isListening, setIsListening] = useState(false)
  const [pitch, setPitch] = useState<PitchData>({ frequency: null, midi: null, cents: 0, noteName: '-' })
  const streamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  const start = useCallback(async () => {
    try {
      const ctx = getAudioContext()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      streamRef.current = stream

      // Try AudioWorklet, fall back to AnalyserNode
      try {
        await ctx.audioWorklet.addModule('/worklets/pitch-worklet.js')
        const worklet = new AudioWorkletNode(ctx, 'pitch-worklet')
        worklet.port.onmessage = (e) => {
          if (e.data.type === 'pitch') {
            const freq = e.data.frequency
            if (freq && freq > 50 && freq < 2000) {
              const note = frequencyToNote(freq)
              setPitch({ frequency: freq, midi: note.midi, cents: note.cents, noteName: note.name })
            } else {
              setPitch({ frequency: null, midi: null, cents: 0, noteName: '-' })
            }
          }
        }
        const source = ctx.createMediaStreamSource(stream)
        source.connect(worklet)
        workletRef.current = worklet
        sourceRef.current = source
      } catch {
        // Fallback: use main-thread pitch detection (import from pitchDetector)
        console.warn('AudioWorklet not available, using main-thread fallback')
        const { detectPitch, frequencyToNote: freqToNote } = await import('@/core/audio/pitchDetector')
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        source.connect(analyser)
        sourceRef.current = source

        const buffer = new Float32Array(analyser.fftSize)
        const poll = () => {
          if (!streamRef.current) return
          analyser.getFloatTimeDomainData(buffer)
          const freq = detectPitch(buffer, ctx.sampleRate)
          if (freq && freq > 50 && freq < 2000) {
            const note = freqToNote(freq)
            const name = NOTE_NAMES[note.midi % 12] ?? '?'
            setPitch({ frequency: freq, midi: note.midi, cents: note.cents, noteName: name })
          } else {
            setPitch({ frequency: null, midi: null, cents: 0, noteName: '-' })
          }
          requestAnimationFrame(poll)
        }
        poll()
      }

      setIsListening(true)
    } catch (err) {
      console.error('Mic access failed:', err)
    }
  }, [getAudioContext])

  const stop = useCallback(() => {
    workletRef.current?.disconnect()
    sourceRef.current?.disconnect()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    workletRef.current = null
    sourceRef.current = null
    setIsListening(false)
    setPitch({ frequency: null, midi: null, cents: 0, noteName: '-' })
  }, [])

  // Cleanup on unmount
  useEffect(() => { return () => { stop() } }, [stop])

  return { isListening, pitch, start, stop }
}
