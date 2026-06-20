import { describe, it, expect } from 'vitest'
import { parseAudioChordHandoffFromHash } from './audiochordHandoff'

function encodeHandoff(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

describe('parseAudioChordHandoffFromHash', () => {
  it('returns null when the hash has no handoff token', () => {
    expect(parseAudioChordHandoffFromHash('#songs')).toBeNull()
  })

  it('returns null for malformed base64url or non-JSON payloads', () => {
    expect(parseAudioChordHandoffFromHash('#audiochord=%%%')).toBeNull()
    expect(parseAudioChordHandoffFromHash('#audiochord=bm90LWpzb24')).toBeNull()
  })

  it('rejects wrong-source and empty-chord payloads', () => {
    expect(parseAudioChordHandoffFromHash(`#audiochord=${encodeHandoff({ source: 'other', chords: [] })}`)).toBeNull()
    expect(parseAudioChordHandoffFromHash(`#audiochord=${encodeHandoff({ source: 'audiochord', chords: [] })}`)).toBeNull()
  })

  it('sanitizes numeric fields, chord ranges, labels, and confidence', () => {
    const token = encodeHandoff({
      version: '2',
      source: 'audiochord',
      title: 'Imported Song',
      fileId: 'abc123',
      bpm: '280',
      key: '  C#m  ',
      durationSec: '12.3456',
      chords: [
        { start: '0.1234', end: '1.9876', label: 'C'.repeat(40), confidence: 2 },
        { start: 2, end: 1, label: 'bad', confidence: 1 },
      ],
    })

    const parsed = parseAudioChordHandoffFromHash(`#route?audiochord=${token}&x=1`)
    expect(parsed).not.toBeNull()
    expect(parsed!.version).toBe(2)
    expect(parsed!.bpm).toBeNull()
    expect(parsed!.key).toBe('C#m')
    expect(parsed!.durationSec).toBe(12.35)
    expect(parsed!.chords).toEqual([
      {
        start: 0.123,
        end: 1.988,
        label: 'C'.repeat(32),
        confidence: 1,
      },
    ])
  })

  it('caps accepted chord payloads at 220 segments', () => {
    const token = encodeHandoff({
      source: 'audiochord',
      chords: Array.from({ length: 225 }, (_, index) => ({
        start: index,
        end: index + 0.5,
        label: 'C',
        confidence: 0.5,
      })),
    })

    expect(parseAudioChordHandoffFromHash(`#audiochord=${token}`)?.chords).toHaveLength(220)
  })
})
