/**
 * AudioWorklet processor for YIN pitch detection.
 * Runs off the main thread to avoid audio glitches.
 */

const YIN_THRESHOLD = 0.15
const YIN_PROBABILITY_THRESHOLD = 0.3
const BUFFER_SIZE = 2048

class PitchWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = new Float32Array(BUFFER_SIZE)
    this._bufferIndex = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const channel = input[0]

    // Accumulate samples into buffer
    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._bufferIndex++] = channel[i]

      if (this._bufferIndex >= BUFFER_SIZE) {
        const freq = this._detectPitch(this._buffer, sampleRate)
        this.port.postMessage({ type: 'pitch', frequency: freq, time: currentTime })
        this._bufferIndex = 0
      }
    }

    return true
  }

  _detectPitch(buffer, sampleRate) {
    const halfLen = Math.floor(buffer.length / 2)

    // Step 1: Difference function
    const yinBuffer = new Float32Array(halfLen)
    for (let tau = 0; tau < halfLen; tau++) {
      let sum = 0
      for (let i = 0; i < halfLen; i++) {
        const delta = buffer[i] - buffer[i + tau]
        sum += delta * delta
      }
      yinBuffer[tau] = sum
    }

    // Step 2: Cumulative mean normalized difference
    yinBuffer[0] = 1
    let runningSum = 0
    for (let tau = 1; tau < halfLen; tau++) {
      runningSum += yinBuffer[tau]
      yinBuffer[tau] *= tau / runningSum
    }

    // Step 3: Absolute threshold
    let tauEstimate = -1
    for (let tau = 2; tau < halfLen; tau++) {
      if (yinBuffer[tau] < YIN_THRESHOLD) {
        while (tau + 1 < halfLen && yinBuffer[tau + 1] < yinBuffer[tau]) tau++
        tauEstimate = tau
        break
      }
    }

    if (tauEstimate === -1) return null
    if (yinBuffer[tauEstimate] >= YIN_PROBABILITY_THRESHOLD) return null

    // Step 4: Parabolic interpolation
    const s0 = tauEstimate > 0 ? yinBuffer[tauEstimate - 1] : yinBuffer[tauEstimate]
    const s1 = yinBuffer[tauEstimate]
    const s2 = tauEstimate + 1 < halfLen ? yinBuffer[tauEstimate + 1] : yinBuffer[tauEstimate]

    let betterTau = tauEstimate
    const denom = 2 * s1 - s2 - s0
    if (denom !== 0) betterTau = tauEstimate + (s0 - s2) / (2 * denom)

    return sampleRate / betterTau
  }
}

registerProcessor('pitch-worklet', PitchWorkletProcessor)
