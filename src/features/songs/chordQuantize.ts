/**
 * Chord segment → measure grid quantization.
 *
 * Pure function module. Given AudioChord's variable-duration chord segments
 * plus a BPM/time-signature, produce one cell per musical measure with the
 * dominant chord (time-weighted majority) for that measure.
 *
 * Why BPM-based and not beat-detected: AudioChord's `/analyze/beats` endpoint
 * is currently 500-erroring server-side (cross-project, can't fix here). Our
 * SongEntry already carries BPM + timeSignature for every track, so a
 * deterministic constant-tempo grid is correct enough for v1. Once beats API
 * recovers, swap `measureBoundariesFromBpm` with `measureBoundariesFromBeats`
 * — the rest of the pipeline is signature-compatible.
 */

export interface ChordSegment {
  start: number
  end: number
  label: string
  confidence: number
}

export interface MeasureCell {
  /** 0-based measure index from song start */
  index: number
  /** Start time in seconds */
  start: number
  /** End time in seconds (exclusive) */
  end: number
  /** Dominant chord label for this measure ('N' if silence/no-chord) */
  label: string
  /** Average confidence across the dominant label's contribution */
  confidence: number
  /** All chords that touched this measure with their durations within it */
  contributions: { label: string; durationInMeasure: number; confidence: number }[]
}

/**
 * Produce constant-tempo measure boundaries [t0, t1, t2, ...] up to `duration`.
 * boundaries.length === measureCount + 1.
 */
export function measureBoundariesFromBpm(
  bpm: number,
  beatsPerMeasure: number,
  duration: number,
): number[] {
  if (bpm <= 0 || beatsPerMeasure <= 0 || duration <= 0) return [0]
  const secPerBeat = 60 / bpm
  const secPerMeasure = secPerBeat * beatsPerMeasure
  const count = Math.max(1, Math.ceil(duration / secPerMeasure))
  const out = new Array(count + 1)
  for (let i = 0; i <= count; i++) out[i] = i * secPerMeasure
  return out
}

/**
 * Quantize chord segments onto a fixed measure grid.
 *
 * For each measure, slice every overlapping chord segment by the measure
 * boundaries, sum the durations per label, and pick the label with the longest
 * coverage as the cell's dominant chord. Confidence is the duration-weighted
 * average for that label across the cell.
 *
 * Stable, O(measures × overlapping_chords). Accepts unsorted segments but
 * pre-sort for predictable performance.
 */
export function quantizeToMeasures(
  chords: ChordSegment[],
  boundaries: number[],
): MeasureCell[] {
  if (boundaries.length < 2) return []
  const sorted = [...chords].sort((a, b) => a.start - b.start)
  const cells: MeasureCell[] = []

  let cursor = 0 // index into sorted; segments before cursor are guaranteed to end before measure start
  for (let m = 0; m < boundaries.length - 1; m++) {
    const mStart = boundaries[m]
    const mEnd = boundaries[m + 1]

    // Advance cursor past segments that ended before this measure started
    while (cursor < sorted.length && sorted[cursor].end <= mStart) cursor++

    // Collect every segment that intersects [mStart, mEnd)
    const buckets = new Map<string, { dur: number; confSum: number }>()
    let totalCoverage = 0
    for (let i = cursor; i < sorted.length; i++) {
      const seg = sorted[i]
      if (seg.start >= mEnd) break // segments are sorted, none beyond will overlap
      const overlap = Math.max(0, Math.min(seg.end, mEnd) - Math.max(seg.start, mStart))
      if (overlap <= 0) continue
      const prev = buckets.get(seg.label) ?? { dur: 0, confSum: 0 }
      prev.dur += overlap
      prev.confSum += seg.confidence * overlap
      buckets.set(seg.label, prev)
      totalCoverage += overlap
    }

    const contributions = Array.from(buckets.entries())
      .map(([label, v]) => ({
        label,
        durationInMeasure: v.dur,
        confidence: v.dur > 0 ? v.confSum / v.dur : 0,
      }))
      .sort((a, b) => b.durationInMeasure - a.durationInMeasure)

    // Dominant: longest non-'N' if there's any chord coverage; else 'N'
    const nonSilence = contributions.find(c => c.label !== 'N' && c.label !== 'X')
    const dominant = nonSilence ?? contributions[0] ?? { label: 'N', confidence: 0 }

    cells.push({
      index: m,
      start: mStart,
      end: mEnd,
      label: dominant.label,
      confidence: dominant.confidence,
      contributions,
    })

    // Coverage check (silently swallowed if measure mostly empty)
    void totalCoverage
  }

  return cells
}

/**
 * Trim leading/trailing silence-dominant ('N') measures for cleaner display.
 * Returns slice indices [first, last+1) so caller can re-anchor.
 */
export function trimSilenceCells(cells: MeasureCell[]): { lo: number; hi: number } {
  if (cells.length === 0) return { lo: 0, hi: 0 }
  let lo = 0, hi = cells.length - 1
  while (lo < hi && cells[lo].label === 'N') lo++
  while (hi > lo && cells[hi].label === 'N') hi--
  return { lo, hi: hi + 1 }
}
