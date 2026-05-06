/**
 * Playback Engine for Tab View
 *
 * Adapted from v1 AudioScheduler. Drives beat-by-beat playback,
 * fires callbacks for UI updates and metronome clicks.
 * Uses lookahead scheduling for sample-accurate audio timing.
 */

const LOOKAHEAD = 0.1       // seconds ahead to schedule
const SCHEDULE_INTERVAL = 25 // ms between scheduling checks

export interface PlaybackCallbacks {
  onBeat: (beat: number, measure: number, time: number) => void
  onEnd: () => void
  onCountIn?: (remaining: number) => void
}

export class PlaybackEngine {
  private audioContext: AudioContext
  private bpm: number
  private beatsPerMeasure: number
  private totalBeats: number
  private nextNoteTime = 0
  private currentBeat = 0
  private timerId: number | null = null
  private _isPlaying = false
  private callbacks: PlaybackCallbacks
  private volume = 0.6
  private countInBeats = 0
  private loopStartBeat: number | null = null
  private loopEndBeat: number | null = null

  constructor(
    audioContext: AudioContext,
    bpm: number,
    beatsPerMeasure: number,
    totalBeats: number,
    callbacks: PlaybackCallbacks,
  ) {
    this.audioContext = audioContext
    this.bpm = bpm
    this.beatsPerMeasure = beatsPerMeasure
    this.totalBeats = totalBeats
    this.callbacks = callbacks
  }

  get isPlaying() { return this._isPlaying }

  start(countInBars = 1, fromBeat?: number): void {
    if (this._isPlaying) return
    this._isPlaying = true
    this.currentBeat = fromBeat ?? 0
    this.countInBeats = fromBeat !== undefined ? 0 : countInBars * this.beatsPerMeasure
    this.nextNoteTime = this.audioContext.currentTime + 0.05

    this.timerId = window.setInterval(this.scheduler, SCHEDULE_INTERVAL)
  }

  stop(): void {
    if (!this._isPlaying) return
    this._isPlaying = false
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.currentBeat = 0
  }

  pause(): number {
    const beat = this.currentBeat
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this._isPlaying = false
    return beat
  }

  setBpm(bpm: number): void { this.bpm = bpm }
  setVolume(vol: number): void { this.volume = Math.max(0, Math.min(1, vol)) }
  setLoop(startBeat: number | null, endBeat: number | null): void {
    this.loopStartBeat = startBeat
    this.loopEndBeat = endBeat
  }

  private scheduler = (): void => {
    while (this.nextNoteTime < this.audioContext.currentTime + LOOKAHEAD) {
      if (this.countInBeats > 0) {
        this.scheduleClick(this.nextNoteTime, true)
        const remaining = this.countInBeats
        const delayMs = Math.max(0, (this.nextNoteTime - this.audioContext.currentTime) * 1000)
        setTimeout(() => {
          this.callbacks.onCountIn?.(remaining)
        }, delayMs)
        this.nextNoteTime += 60.0 / this.bpm
        this.countInBeats--
        continue
      }

      // Loop: jump back to loop start when reaching loop end
      if (this.loopStartBeat !== null && this.loopEndBeat !== null
          && this.currentBeat >= this.loopEndBeat) {
        this.currentBeat = this.loopStartBeat
      }

      // Check if we've reached the end
      if (this.currentBeat >= this.totalBeats) {
        this.stop()
        this.callbacks.onEnd()
        return
      }

      const measure = Math.floor(this.currentBeat / this.beatsPerMeasure)
      const isDownbeat = this.currentBeat % this.beatsPerMeasure === 0

      this.scheduleClick(this.nextNoteTime, false, isDownbeat)

      // Fire UI callback at actual beat time
      const beat = this.currentBeat
      const delayMs = Math.max(0, (this.nextNoteTime - this.audioContext.currentTime) * 1000)
      setTimeout(() => {
        if (this._isPlaying) {
          this.callbacks.onBeat(beat, measure, this.nextNoteTime)
        }
      }, delayMs)

      this.currentBeat++
      this.nextNoteTime += 60.0 / this.bpm
    }
  }

  private scheduleClick(time: number, isCountIn: boolean, isDownbeat = false): void {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    if (isCountIn) {
      osc.frequency.value = 1200
      gain.gain.setValueAtTime(this.volume * 0.8, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
      osc.start(time)
      osc.stop(time + 0.05)
    } else {
      osc.frequency.value = isDownbeat ? 1000 : 800
      const vol = isDownbeat ? this.volume : this.volume * 0.7
      gain.gain.setValueAtTime(vol, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
      osc.start(time)
      osc.stop(time + 0.08)
    }

    osc.onended = () => { osc.disconnect(); gain.disconnect() }
  }
}
