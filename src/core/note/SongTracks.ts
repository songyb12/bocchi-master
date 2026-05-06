/**
 * J-Pop/J-Rock Song Tracks — Guitar & Bass
 *
 * Each song has guitar + bass versions as separate Track objects.
 * Tabs are based on well-known arrangements of popular songs.
 * Sections are typically intro/verse/chorus excerpts (not full songs).
 */

import type { Track, NoteEvent, MeasureMeta } from './types'
import { STANDARD_GUITAR, STANDARD_BASS } from '@/data/tunings'

let _id = 1000
function nid(): string { return `s${_id++}` }

function measures(count: number, bpm: number = 4): MeasureMeta[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    startBeat: i * bpm,
  }))
}

// Helper: create a note event
function n(
  time: number, duration: number, string: number, fret: number,
  midi: number, opts?: { technique?: NoteEvent['technique']; accent?: boolean }
): NoteEvent {
  return { id: nid(), time, duration, string, fret, midi, ...opts }
}

// Guitar MIDI helper: string index 0=E2(40), 1=A2(45), 2=D3(50), 3=G3(55), 4=B3(59), 5=E4(64)
const G = [40, 45, 50, 55, 59, 64]

// ═══════════════════════════════════════════════════════════
// 1. ソラニン — ASIAN KUNG-FU GENERATION
// Key: G major, BPM: 162
// ═══════════════════════════════════════════════════════════

function solaninGuitar(): Track {
  const ev: NoteEvent[] = []
  // Intro: clean arpeggiated G - Cadd9 - Em7 - Dsus4 (8 measures)
  // G chord arpeggio pattern
  const chords = [
    { label: 'G',     frets: [3, 2, 0, 0, 3, 3], beats: 8 },
    { label: 'Cadd9', frets: [-1, 3, 2, 0, 3, 0], beats: 8 },
    { label: 'Em7',   frets: [0, 2, 2, 0, 3, 0], beats: 8 },
    { label: 'Dsus4', frets: [-1, -1, 0, 2, 3, 3], beats: 8 },
  ]

  let t = 0
  for (const chord of chords) {
    // Arpeggio pattern: bass note → middle → high → middle (repeated)
    for (let rep = 0; rep < 4; rep++) {
      // Find playable strings
      const playable = chord.frets.map((f, s) => ({ s, f })).filter(x => x.f >= 0)
      const bass = playable[0]
      const mid = playable[Math.floor(playable.length / 2)]
      const high = playable[playable.length - 1]

      ev.push(n(t, 0.5, bass.s, bass.f, G[bass.s] + bass.f))
      ev.push(n(t + 0.5, 0.5, mid.s, mid.f, G[mid.s] + mid.f))
      ev.push(n(t + 1, 0.5, high.s, high.f, G[high.s] + high.f))
      ev.push(n(t + 1.5, 0.5, mid.s, mid.f, G[mid.s] + mid.f))
      t += 2
    }
  }

  // Verse strumming: G - D - Em - C (8 measures)
  const verseChords = [
    { frets: [3, 2, 0, 0, 3, 3] },   // G
    { frets: [-1, -1, 0, 2, 3, 2] },  // D
    { frets: [0, 2, 2, 0, 0, 0] },    // Em
    { frets: [-1, 3, 2, 0, 1, 0] },   // C
  ]
  for (const chord of verseChords) {
    for (let beat = 0; beat < 8; beat++) {
      for (let s = 0; s < 6; s++) {
        const f = chord.frets[s]
        if (f < 0) continue
        ev.push(n(t + beat, 1, s, f, G[s] + f, {
          technique: beat % 4 === 0 ? 'strum-down' : undefined,
          accent: beat % 4 === 0,
        }))
      }
    }
    t += 8
  }

  const ms = measures(16, 4)
  ms[0].label = 'Intro'
  ms[8].label = 'Verse'

  return {
    id: 'song-solanin-guitar', title: 'ソラニン (Guitar)', bpm: 162,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function solaninBass(): Track {
  // Auto-extracted from audio: ソラニン
  // 298 notes, 62 measures, 90.4s
  return {
    id: 'song-solanin-bass', title: 'ソラニン (Bass)', bpm: 162.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(62),
  }
}

// ═══════════════════════════════════════════════════════════
// 2. ただ君に晴れ — ヨルシカ
// Key: E major, BPM: 138
// ═══════════════════════════════════════════════════════════

function tadaKimiGuitar(): Track {
  const ev: NoteEvent[] = []

  // Intro riff: iconic clean arpeggio E - B - C#m - A
  // E: 0-2-2-1-0-0, B: x-2-4-4-4-2, C#m: x-4-6-6-5-4, A: x-0-2-2-2-0
  const introChords = [
    { frets: [0, 2, 2, 1, 0, 0] },   // E
    { frets: [-1, 2, 4, 4, 4, 2] },   // B
    { frets: [-1, 4, 6, 6, 5, 4] },   // C#m
    { frets: [-1, 0, 2, 2, 2, 0] },   // A
  ]

  let t = 0
  for (const chord of introChords) {
    // Arpeggio: 6th→4th→3rd→2nd→1st→2nd→3rd→4th (8th notes)
    const strings = chord.frets.map((f, s) => ({ s, f })).filter(x => x.f >= 0)
    const pattern = [0, 2, 3, 4, Math.min(5, strings.length - 1), 4, 3, 2]
    for (let i = 0; i < 8; i++) {
      const idx = Math.min(pattern[i], strings.length - 1)
      const { s, f } = strings[idx]
      ev.push(n(t + i * 0.5, 0.5, s, f, G[s] + f))
    }
    t += 4
  }

  // Verse: same progression, strumming style
  for (const chord of introChords) {
    for (let beat = 0; beat < 4; beat++) {
      for (let s = 0; s < 6; s++) {
        const f = chord.frets[s]
        if (f < 0) continue
        ev.push(n(t + beat, 1, s, f, G[s] + f, {
          technique: beat === 0 ? 'strum-down' : beat === 2 ? 'strum-down' : undefined,
          accent: beat === 0,
        }))
      }
    }
    t += 4
  }

  // Chorus: power chord driven E5 - B5 - C#5 - A5
  const powerChords = [
    { str: 0, fret: 0 },  // E5
    { str: 1, fret: 2 },  // B5
    { str: 1, fret: 4 },  // C#5
    { str: 0, fret: 5 },  // A5 (from 6th string)
  ]
  for (const pc of powerChords) {
    for (let beat = 0; beat < 4; beat++) {
      // Root
      ev.push(n(t + beat, 1, pc.str, pc.fret, G[pc.str] + pc.fret, {
        technique: 'strum-down', accent: beat === 0,
      }))
      // Fifth (2 frets up, next string)
      ev.push(n(t + beat, 1, pc.str + 1, pc.fret + 2, G[pc.str + 1] + pc.fret + 2))
      // Octave
      ev.push(n(t + beat, 1, pc.str + 2, pc.fret + 2, G[pc.str + 2] + pc.fret + 2))
    }
    t += 4
  }

  const ms = measures(12, 4)
  ms[0].label = 'Intro'
  ms[4].label = 'Verse'
  ms[8].label = 'Chorus'

  return {
    id: 'song-tadakimi-guitar', title: 'ただ君に晴れ (Guitar)', bpm: 138,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function tadaKimiBass(): Track {
  // Auto-extracted from audio: ただ君に晴れ
  // 153 notes, 53 measures, 90.4s
  return {
    id: 'song-tadakimi-bass', title: 'ただ君に晴れ (Bass)', bpm: 138.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(53),
  }
}

// ═══════════════════════════════════════════════════════════
// 3. 青春コンプレックス — 結束バンド (Bocchi the Rock!)
// Key: E major, BPM: 175
// ═══════════════════════════════════════════════════════════

function seishunGuitar(): Track {
  const ev: NoteEvent[] = []

  // Intro: fast power chord riff E5-D#5-C#5-B5-A5
  const riff = [
    { str: 0, fret: 0, dur: 1 },   // E5
    { str: 0, fret: 0, dur: 0.5 },
    { str: 1, fret: 6, dur: 0.5 }, // D#5
    { str: 1, fret: 4, dur: 1 },   // C#5
    { str: 1, fret: 2, dur: 1 },   // B5
    { str: 1, fret: 0, dur: 0.5 }, // A5 (open A)
    { str: 1, fret: 2, dur: 0.5 }, // back to B5
  ]

  let t = 0
  // 2 repetitions of intro riff
  for (let rep = 0; rep < 4; rep++) {
    for (const note of riff) {
      // Root
      ev.push(n(t, note.dur, note.str, note.fret, G[note.str] + note.fret, {
        technique: 'strum-down', accent: t % 4 === 0,
      }))
      // Fifth
      ev.push(n(t, note.dur, note.str + 1, note.fret + 2, G[note.str + 1] + note.fret + 2))
      t += note.dur
    }
  }

  // Verse: palm-muted 8ths on E5 with chord hits
  const versePCs = [
    { str: 0, fret: 0, beats: 4 }, // E5
    { str: 1, fret: 2, beats: 4 }, // B5
    { str: 1, fret: 4, beats: 4 }, // C#5
    { str: 1, fret: 0, beats: 4 }, // A5
  ]
  for (const pc of versePCs) {
    for (let i = 0; i < pc.beats * 2; i++) {
      ev.push(n(t + i * 0.5, 0.5, pc.str, pc.fret, G[pc.str] + pc.fret, {
        technique: i % 4 === 0 ? 'strum-down' : undefined,
        accent: i % 8 === 0,
      }))
    }
    t += pc.beats
  }

  const ms = measures(12, 4)
  ms[0].label = 'Intro'
  ms[4].label = 'Verse'

  return {
    id: 'song-seishun-guitar', title: '青春コンプレックス (Guitar)', bpm: 175,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function seishunBass(): Track {
  // Auto-extracted from audio: 青春コンプレックス
  // 87 notes, 66 measures, 89.3s
  return {
    id: 'song-seishun-bass', title: '青春コンプレックス (Bass)', bpm: 175.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(66),
  }
}

// ═══════════════════════════════════════════════════════════
// 4. KICK BACK — 米津玄師 (Kenshi Yonezu)
// Key: Em, BPM: 150. Bass line is THE star of this song.
// ═══════════════════════════════════════════════════════════

function kickbackGuitar(): Track {
  const ev: NoteEvent[] = []

  // Main riff: funky muted strums + chord stabs
  // Em - Am - B7 - Em groove
  const chords = [
    { frets: [0, 2, 2, 0, 0, 0] },    // Em
    { frets: [-1, 0, 2, 2, 1, 0] },   // Am
    { frets: [-1, 2, 1, 2, 0, 2] },   // B7
    { frets: [0, 2, 2, 0, 0, 0] },    // Em
  ]

  let t = 0
  for (let rep = 0; rep < 2; rep++) {
    for (const chord of chords) {
      // Funky rhythm: hit - rest - hit - hit-hit
      const rhythm = [0, 1.5, 2, 3, 3.5]
      for (const r of rhythm) {
        for (let s = 0; s < 6; s++) {
          const f = chord.frets[s]
          if (f < 0) continue
          ev.push(n(t + r, 0.5, s, f, G[s] + f, {
            technique: 'strum-down',
            accent: r === 0,
          }))
        }
      }
      t += 4
    }
  }

  const ms = measures(8, 4)
  ms[0].label = 'Main Riff'

  return {
    id: 'song-kickback-guitar', title: 'KICK BACK (Guitar)', bpm: 150,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function kickbackBass(): Track {
  // Auto-extracted (Demucs AI): KICK BACK
  // 133 notes, 56 measures, 90.0s
  return {
    id: 'song-kickback-bass', title: 'KICK BACK (Bass)', bpm: 150.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(56),
  }
}

// ═══════════════════════════════════════════════════════════
// 5. リライト (Rewrite) — ASIAN KUNG-FU GENERATION
// Key: Em, BPM: 167
// ═══════════════════════════════════════════════════════════

function rewriteGuitar(): Track {
  const ev: NoteEvent[] = []

  // Iconic intro riff on high strings
  // E5 → D5 → C5 → D5 repeating, with octave melody
  const riff = [
    // Bar 1-2: E power chord gallop
    { s: 0, f: 0, t: 0, d: 0.5 }, { s: 0, f: 0, t: 0.5, d: 0.25 }, { s: 0, f: 0, t: 0.75, d: 0.25 },
    { s: 0, f: 0, t: 1, d: 0.5 }, { s: 1, f: 2, t: 1.5, d: 0.5 },
    { s: 0, f: 0, t: 2, d: 0.5 }, { s: 0, f: 0, t: 2.5, d: 0.25 }, { s: 0, f: 0, t: 2.75, d: 0.25 },
    { s: 0, f: 3, t: 3, d: 0.5 }, { s: 0, f: 0, t: 3.5, d: 0.5 },
    // Bar 3-4: D → C → D
    { s: 1, f: 5, t: 4, d: 1 }, { s: 1, f: 3, t: 5, d: 1 },
    { s: 1, f: 5, t: 6, d: 0.5 }, { s: 0, f: 3, t: 6.5, d: 0.5 },
    { s: 0, f: 0, t: 7, d: 1 },
  ]

  let t = 0
  for (let rep = 0; rep < 4; rep++) {
    for (const note of riff) {
      ev.push(n(t + note.t, note.d, note.s, note.f, G[note.s] + note.f, {
        technique: note.t === 0 ? 'strum-down' : undefined,
        accent: note.t === 0,
      }))
      // Add 5th for power chord feel
      ev.push(n(t + note.t, note.d, note.s + 1, note.f + 2, G[note.s + 1] + note.f + 2))
    }
    t += 8
  }

  const ms = measures(16, 4)
  ms[0].label = 'Intro Riff'

  return {
    id: 'song-rewrite-guitar', title: 'リライト (Guitar)', bpm: 167,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function rewriteBass(): Track {
  // Auto-extracted from audio: リライト
  // 230 notes, 62 measures, 88.3s
  return {
    id: 'song-rewrite-bass', title: 'リライト (Bass)', bpm: 167.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(62),
  }
}

// ═══════════════════════════════════════════════════════════
// 6. 天体観測 — BUMP OF CHICKEN
// Key: Bm, BPM: 165
// ═══════════════════════════════════════════════════════════

function tentaiGuitar(): Track {
  const ev: NoteEvent[] = []

  // Iconic intro: delay guitar arpeggio Bm - D - A - E
  const introNotes = [
    // Bm arpeggio
    { s: 1, f: 2, t: 0 }, { s: 2, f: 4, t: 0.5 }, { s: 3, f: 4, t: 1 }, { s: 4, f: 3, t: 1.5 },
    { s: 3, f: 4, t: 2 }, { s: 2, f: 4, t: 2.5 }, { s: 1, f: 2, t: 3 }, { s: 2, f: 4, t: 3.5 },
    // D arpeggio
    { s: 2, f: 0, t: 4 }, { s: 3, f: 2, t: 4.5 }, { s: 4, f: 3, t: 5 }, { s: 5, f: 2, t: 5.5 },
    { s: 4, f: 3, t: 6 }, { s: 3, f: 2, t: 6.5 }, { s: 2, f: 0, t: 7 }, { s: 3, f: 2, t: 7.5 },
    // A arpeggio
    { s: 1, f: 0, t: 8 }, { s: 2, f: 2, t: 8.5 }, { s: 3, f: 2, t: 9 }, { s: 4, f: 2, t: 9.5 },
    { s: 3, f: 2, t: 10 }, { s: 2, f: 2, t: 10.5 }, { s: 1, f: 0, t: 11 }, { s: 2, f: 2, t: 11.5 },
    // E arpeggio
    { s: 0, f: 0, t: 12 }, { s: 1, f: 2, t: 12.5 }, { s: 2, f: 2, t: 13 }, { s: 3, f: 1, t: 13.5 },
    { s: 2, f: 2, t: 14 }, { s: 1, f: 2, t: 14.5 }, { s: 0, f: 0, t: 15 }, { s: 1, f: 2, t: 15.5 },
  ]

  for (const note of introNotes) {
    ev.push(n(note.t, 0.5, note.s, note.f, G[note.s] + note.f))
  }

  // Chorus power chords
  let t = 16
  const chorusPC = [
    { str: 1, fret: 2, beats: 4 },  // Bm(B5)
    { str: 2, fret: 0, beats: 4 },  // D5
    { str: 1, fret: 0, beats: 4 },  // A5
    { str: 0, fret: 0, beats: 4 },  // E5
  ]
  for (const pc of chorusPC) {
    for (let beat = 0; beat < pc.beats; beat++) {
      ev.push(n(t + beat, 1, pc.str, pc.fret, G[pc.str] + pc.fret, {
        technique: 'strum-down', accent: beat === 0,
      }))
      ev.push(n(t + beat, 1, pc.str + 1, pc.fret + 2, G[pc.str + 1] + pc.fret + 2))
    }
    t += pc.beats
  }

  const ms = measures(8, 4)
  ms[0].label = 'Intro (Delay)'
  ms[4].label = 'Chorus'

  return {
    id: 'song-tentai-guitar', title: '天体観測 (Guitar)', bpm: 165,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function tentaiBass(): Track {
  // Auto-extracted from audio: 天体観測
  // 95 notes, 63 measures, 90.4s
  return {
    id: 'song-tentai-bass', title: '天体観測 (Bass)', bpm: 165.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(63),
  }
}

// ═══════════════════════════════════════════════════════════
// 7. 夜に駆ける — YOASOBI
// Key: Cm, BPM: 130
// ═══════════════════════════════════════════════════════════

function yoruNiGuitar(): Track {
  const ev: NoteEvent[] = []

  // Synth-like guitar part: Cm - Ab - Eb - Bb
  const chords = [
    { frets: [-1, 3, 5, 5, 4, 3] }, // Cm
    { frets: [-1, -1, 6, 5, 4, 4] }, // Ab (partial)
    { frets: [-1, -1, 1, 3, 4, 3] }, // Eb
    { frets: [-1, 1, 3, 3, 3, 1] },  // Bb
  ]

  let t = 0
  for (let rep = 0; rep < 2; rep++) {
    for (const chord of chords) {
      // Syncopated rhythm: 8th note arpeggios
      const playable = chord.frets.map((f, s) => ({ s, f })).filter(x => x.f >= 0)
      for (let i = 0; i < 8; i++) {
        const idx = i % playable.length
        const { s, f } = playable[idx]
        ev.push(n(t + i * 0.5, 0.5, s, f, G[s] + f))
      }
      t += 4
    }
  }

  const ms = measures(8, 4)
  ms[0].label = 'Intro'

  return {
    id: 'song-yoruni-guitar', title: '夜に駆ける (Guitar)', bpm: 130,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function yoruNiBass(): Track {
  // Auto-extracted from audio: 夜に駆ける
  // 416 notes, 49 measures, 90.3s
  return {
    id: 'song-yoruni-bass', title: '夜に駆ける (Bass)', bpm: 130.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(49),
  }
}

// ═══════════════════════════════════════════════════════════
// 8. Pretender — Official髭男dism
// Key: Ab major, BPM: 92
// ═══════════════════════════════════════════════════════════

function pretenderGuitar(): Track {
  const ev: NoteEvent[] = []

  // Intro: Ab - Eb/G - Fm - Db (capo 1 = G shapes)
  // Played with capo 1, represented as actual frets
  const chords = [
    { frets: [4, 6, 6, 5, 4, 4] },  // Ab barre
    { frets: [3, 6, 5, 4, 3, 3] },  // Eb/G
    { frets: [1, 3, 3, 1, 1, 1] },  // Fm barre
    { frets: [-1, 4, 6, 6, 6, 4] }, // Db
  ]

  let t = 0
  for (let rep = 0; rep < 2; rep++) {
    for (const chord of chords) {
      // Smooth strumming pattern
      const playable = chord.frets.map((f, s) => ({ s, f })).filter(x => x.f >= 0)
      // Beat 1: full strum
      for (const { s, f } of playable) {
        ev.push(n(t, 2, s, f, G[s] + f, { technique: s === playable[0].s ? 'strum-down' : undefined, accent: true }))
      }
      // Beat 3: lighter strum
      for (const { s, f } of playable) {
        ev.push(n(t + 2, 2, s, f, G[s] + f))
      }
      t += 4
    }
  }

  const ms = measures(8, 4)
  ms[0].label = 'Intro'

  return {
    id: 'song-pretender-guitar', title: 'Pretender (Guitar)', bpm: 92,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function pretenderBass(): Track {
  // Auto-extracted from audio: Pretender
  // 203 notes, 35 measures, 90.2s
  return {
    id: 'song-pretender-bass', title: 'Pretender (Bass)', bpm: 92.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(35),
  }
}

// ═══════════════════════════════════════════════════════════
// 9. Lemon — 米津玄師
// Key: G#m, BPM: 87
// ═══════════════════════════════════════════════════════════

function lemonGuitar(): Track {
  const ev: NoteEvent[] = []

  // Intro arpeggio: G#m - E - B - F#
  const chords = [
    { frets: [4, 6, 6, 4, 4, 4] },  // G#m
    { frets: [0, 2, 2, 1, 0, 0] },  // E
    { frets: [-1, 2, 4, 4, 4, 2] }, // B
    { frets: [2, 4, 4, 3, 2, 2] },  // F#
  ]

  let t = 0
  for (const chord of chords) {
    const playable = chord.frets.map((f, s) => ({ s, f })).filter(x => x.f >= 0)
    // Fingerpicking pattern
    for (let i = 0; i < 8; i++) {
      const idx = [0, 3, 2, 4, 1, 4, 2, 3][i] % playable.length
      const { s, f } = playable[idx]
      ev.push(n(t + i * 0.5, 0.5, s, f, G[s] + f))
    }
    t += 4
  }

  // Verse: gentle strumming
  for (const chord of chords) {
    const playable = chord.frets.map((f, s) => ({ s, f })).filter(x => x.f >= 0)
    for (let beat = 0; beat < 4; beat++) {
      for (const { s, f } of playable) {
        ev.push(n(t + beat, 1, s, f, G[s] + f, {
          technique: beat === 0 ? 'strum-down' : undefined,
          accent: beat === 0,
        }))
      }
    }
    t += 4
  }

  const ms = measures(8, 4)
  ms[0].label = 'Intro'
  ms[4].label = 'Verse'

  return {
    id: 'song-lemon-guitar', title: 'Lemon (Guitar)', bpm: 87,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function lemonBass(): Track {
  // Auto-extracted from audio: Lemon
  // 227 notes, 33 measures, 90.3s
  return {
    id: 'song-lemon-bass', title: 'Lemon (Bass)', bpm: 87.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(33),
  }
}

// ═══════════════════════════════════════════════════════════
// 10. 前前前世 — RADWIMPS
// Key: D major, BPM: 190
// ═══════════════════════════════════════════════════════════

function zenzenzenseGuitar(): Track {
  const ev: NoteEvent[] = []

  // Intro/Chorus: high-energy D - Bm - G - A
  const chords = [
    { frets: [-1, -1, 0, 2, 3, 2] }, // D
    { frets: [-1, 2, 4, 4, 3, 2] },  // Bm
    { frets: [3, 2, 0, 0, 3, 3] },   // G
    { frets: [-1, 0, 2, 2, 2, 0] },  // A
  ]

  let t = 0
  for (let rep = 0; rep < 2; rep++) {
    for (const chord of chords) {
      // Fast punk-rock strumming: all downstrokes
      for (let beat = 0; beat < 4; beat++) {
        for (let s = 0; s < 6; s++) {
          const f = chord.frets[s]
          if (f < 0) continue
          ev.push(n(t + beat, 0.5, s, f, G[s] + f, {
            technique: 'strum-down',
            accent: beat === 0,
          }))
        }
        // And strum
        for (let s = 0; s < 6; s++) {
          const f = chord.frets[s]
          if (f < 0) continue
          ev.push(n(t + beat + 0.5, 0.5, s, f, G[s] + f))
        }
      }
      t += 4
    }
  }

  const ms = measures(8, 4)
  ms[0].label = 'Chorus'

  return {
    id: 'song-zenzenzense-guitar', title: '前前前世 (Guitar)', bpm: 190,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function zenzenzenseBass(): Track {
  // Auto-extracted from audio: 前前前世
  // 147 notes, 71 measures, 89.1s
  return {
    id: 'song-zenzenzense-bass', title: '前前前世 (Bass)', bpm: 190.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(71),
  }
}

// ═══════════════════════════════════════════════════════════
// 11. unravel — TK from 凛として時雨
// Key: Cm, BPM: 135
// ═══════════════════════════════════════════════════════════

function unravelGuitar(): Track {
  const ev: NoteEvent[] = []

  // Iconic intro arpeggio
  // Cm: 8-10-10-8-8-8 → Am-ish shape moved up
  const introPattern = [
    // Cm arpeggio (gentle, clean tone)
    { s: 4, f: 4, t: 0 }, { s: 3, f: 5, t: 0.5 }, { s: 2, f: 5, t: 1 }, { s: 1, f: 3, t: 1.5 },
    { s: 2, f: 5, t: 2 }, { s: 3, f: 5, t: 2.5 }, { s: 4, f: 4, t: 3 }, { s: 5, f: 3, t: 3.5 },
    // Ab
    { s: 4, f: 1, t: 4 }, { s: 3, f: 1, t: 4.5 }, { s: 2, f: 1, t: 5 }, { s: 1, f: 1, t: 5.5 },
    { s: 2, f: 1, t: 6 }, { s: 3, f: 1, t: 6.5 }, { s: 4, f: 1, t: 7 }, { s: 5, f: 4, t: 7.5 },
    // Eb
    { s: 1, f: 6, t: 8 }, { s: 2, f: 8, t: 8.5 }, { s: 3, f: 8, t: 9 }, { s: 4, f: 8, t: 9.5 },
    { s: 3, f: 8, t: 10 }, { s: 2, f: 8, t: 10.5 }, { s: 1, f: 6, t: 11 }, { s: 2, f: 8, t: 11.5 },
    // Bb
    { s: 1, f: 1, t: 12 }, { s: 2, f: 3, t: 12.5 }, { s: 3, f: 3, t: 13 }, { s: 4, f: 3, t: 13.5 },
    { s: 3, f: 3, t: 14 }, { s: 2, f: 3, t: 14.5 }, { s: 1, f: 1, t: 15 }, { s: 2, f: 3, t: 15.5 },
  ]

  for (let rep = 0; rep < 2; rep++) {
    for (const note of introPattern) {
      ev.push(n(note.t + rep * 16, 0.5, note.s, note.f, G[note.s] + note.f))
    }
  }

  const ms = measures(8, 4)
  ms[0].label = 'Intro'

  return {
    id: 'song-unravel-guitar', title: 'unravel (Guitar)', bpm: 135,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function unravelBass(): Track {
  // Auto-extracted from audio: unravel
  // 107 notes, 51 measures, 90.2s
  return {
    id: 'song-unravel-bass', title: 'unravel (Bass)', bpm: 135.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(51),
  }
}

// ═══════════════════════════════════════════════════════════
// 12. ギターと孤独と蒼い惑星 — 結束バンド (Bocchi the Rock!)
// Key: Am, BPM: 195
// ═══════════════════════════════════════════════════════════

function guitarKodokuGuitar(): Track {
  const ev: NoteEvent[] = []

  // Intro riff: fast single-note melody on high strings
  const riff = [
    { s: 5, f: 5, d: 0.25 }, { s: 5, f: 8, d: 0.25 }, { s: 5, f: 5, d: 0.25 }, { s: 4, f: 5, d: 0.25 },
    { s: 5, f: 5, d: 0.5 }, { s: 5, f: 3, d: 0.5 },
    { s: 5, f: 5, d: 0.25 }, { s: 5, f: 8, d: 0.25 }, { s: 5, f: 5, d: 0.25 }, { s: 5, f: 10, d: 0.25 },
    { s: 5, f: 8, d: 0.5 }, { s: 5, f: 5, d: 0.5 },
  ]

  let t = 0
  for (let rep = 0; rep < 4; rep++) {
    for (const note of riff) {
      ev.push(n(t, note.d, note.s, note.f, G[note.s] + note.f, {
        accent: t % 4 < 0.01,
      }))
      t += note.d
    }
  }

  // Verse: Am - F - C - G power chords
  const versePCs = [
    { str: 1, fret: 0 },  // Am (A5)
    { str: 0, fret: 1 },  // F5
    { str: 1, fret: 3 },  // C5
    { str: 0, fret: 3 },  // G5
  ]
  for (const pc of versePCs) {
    for (let i = 0; i < 8; i++) {
      ev.push(n(t + i * 0.5, 0.5, pc.str, pc.fret, G[pc.str] + pc.fret, {
        technique: i % 4 === 0 ? 'strum-down' : undefined,
        accent: i === 0,
      }))
      ev.push(n(t + i * 0.5, 0.5, pc.str + 1, pc.fret + 2, G[pc.str + 1] + pc.fret + 2))
    }
    t += 4
  }

  const totalBeats = Math.ceil(t)
  const ms = measures(Math.ceil(totalBeats / 4), 4)
  ms[0].label = 'Intro Riff'
  const verseStart = Math.floor((totalBeats - 16) / 4)
  if (ms[verseStart]) ms[verseStart].label = 'Verse'

  return {
    id: 'song-kodoku-guitar', title: 'ギターと孤独と蒼い惑星 (Guitar)', bpm: 195,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function guitarKodokuBass(): Track {
  // Auto-extracted from audio: ギターと孤独と蒼い惑星
  // 124 notes, 61 measures, 87.1s
  return {
    id: 'song-guitar-kodoku-bass', title: 'ギターと孤独と蒼い惑星 (Bass)', bpm: 168.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(61),
  }
}

// ═══════════════════════════════════════════════════════════
// 13. 星座になれたら — 結束バンド (Bocchi the Rock!)
// Key: C major, BPM: 160
// ═══════════════════════════════════════════════════════════

function seizaGuitar(): Track {
  const ev: NoteEvent[] = []

  // Intro: clean arpeggiated C - Am - F - G
  const chords = [
    { frets: [-1, 3, 2, 0, 1, 0] },  // C
    { frets: [-1, 0, 2, 2, 1, 0] },  // Am
    { frets: [-1, -1, 3, 2, 1, 1] }, // F
    { frets: [3, 2, 0, 0, 3, 3] },   // G
  ]

  let t = 0
  // Intro arpeggios (2 rounds)
  for (let rep = 0; rep < 2; rep++) {
    for (const chord of chords) {
      const playable = chord.frets.map((f, s) => ({ s, f })).filter(x => x.f >= 0)
      const pattern = [0, 2, 3, 4, 3, 2, 0, 1]
      for (let i = 0; i < 8; i++) {
        const idx = pattern[i] % playable.length
        const { s, f } = playable[idx]
        ev.push(n(t + i * 0.5, 0.5, s, f, G[s] + f))
      }
      t += 4
    }
  }

  // Chorus: power chord energy
  const chorusPCs = [
    { str: 1, fret: 3, beats: 4 },  // C5
    { str: 0, fret: 5, beats: 4 },  // A5
    { str: 0, fret: 1, beats: 4 },  // F5
    { str: 0, fret: 3, beats: 4 },  // G5
  ]
  for (const pc of chorusPCs) {
    for (let beat = 0; beat < pc.beats; beat++) {
      ev.push(n(t + beat, 0.5, pc.str, pc.fret, G[pc.str] + pc.fret, {
        technique: 'strum-down', accent: beat === 0,
      }))
      ev.push(n(t + beat, 0.5, pc.str + 1, pc.fret + 2, G[pc.str + 1] + pc.fret + 2))
      ev.push(n(t + beat + 0.5, 0.5, pc.str, pc.fret, G[pc.str] + pc.fret))
      ev.push(n(t + beat + 0.5, 0.5, pc.str + 1, pc.fret + 2, G[pc.str + 1] + pc.fret + 2))
    }
    t += pc.beats
  }

  const ms = measures(16, 4)
  ms[0].label = 'Intro'
  ms[8].label = 'Chorus'

  return {
    id: 'song-seiza-guitar', title: '星座になれたら (Guitar)', bpm: 160,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: ev, measures: ms,
  }
}

function seizaBass(): Track {
  // Auto-extracted from audio: 星座になれたら
  // 187 notes, 61 measures, 90.3s
  return {
    id: 'song-seiza-bass', title: '星座になれたら (Bass)', bpm: 160.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(61),
  }
}

// ═══════════════════════════════════════════════════════════
// 14. Don't say "lazy" — 桜高軽音部 (K-ON!)
// Key: Em, BPM: 140 — chord-only entry (ChordTimeline drives practice)
// ═══════════════════════════════════════════════════════════

function dontSayLazyGuitar(): Track {
  return {
    id: 'song-dontsaylazy-guitar', title: 'Don\'t say "lazy" (Guitar)', bpm: 140.0,
    timeSignature: [4, 4],
    tuning: STANDARD_GUITAR, events: [], measures: measures(64),
  }
}

function dontSayLazyBass(): Track {
  return {
    id: 'song-dontsaylazy-bass', title: 'Don\'t say "lazy" (Bass)', bpm: 140.0,
    timeSignature: [4, 4],
    tuning: STANDARD_BASS, events: [], measures: measures(64),
  }
}

// ═══════════════════════════════════════════════════════════
// ヨルシカ — additional tracks (events: [], chord timeline drives the practice)
// ═══════════════════════════════════════════════════════════

function hanaNiBoureiGuitar(): Track {
  return {
    id: 'song-hana-bourei-guitar', title: '花に亡霊 (Guitar)', bpm: 90,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: [], measures: measures(90),
  }
}
function hanaNiBoureiBass(): Track {
  return {
    id: 'song-hana-bourei-bass', title: '花に亡霊 (Bass)', bpm: 90,
    timeSignature: [4, 4], tuning: STANDARD_BASS, events: [], measures: measures(90),
  }
}

function haruDorobouGuitar(): Track {
  return {
    id: 'song-haru-dorobou-guitar', title: '春泥棒 (Guitar)', bpm: 155,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: [], measures: measures(110),
  }
}
function haruDorobouBass(): Track {
  return {
    id: 'song-haru-dorobou-bass', title: '春泥棒 (Bass)', bpm: 155,
    timeSignature: [4, 4], tuning: STANDARD_BASS, events: [], measures: measures(110),
  }
}

function haruGuitar(): Track {
  return {
    id: 'song-haru-guitar', title: '晴る (Guitar)', bpm: 100,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: [], measures: measures(80),
  }
}
function haruBass(): Track {
  return {
    id: 'song-haru-bass', title: '晴る (Bass)', bpm: 100,
    timeSignature: [4, 4], tuning: STANDARD_BASS, events: [], measures: measures(80),
  }
}

function dakaraBokuGuitar(): Track {
  return {
    id: 'song-dakara-boku-guitar', title: 'だから僕は音楽を辞めた (Guitar)', bpm: 125,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: [], measures: measures(125),
  }
}
function dakaraBokuBass(): Track {
  return {
    id: 'song-dakara-boku-bass', title: 'だから僕は音楽を辞めた (Bass)', bpm: 125,
    timeSignature: [4, 4], tuning: STANDARD_BASS, events: [], measures: measures(125),
  }
}

function shisouhanGuitar(): Track {
  return {
    id: 'song-shisouhan-guitar', title: '思想犯 (Guitar)', bpm: 138,
    timeSignature: [4, 4], tuning: STANDARD_GUITAR, events: [], measures: measures(140),
  }
}
function shisouhanBass(): Track {
  return {
    id: 'song-shisouhan-bass', title: '思想犯 (Bass)', bpm: 138,
    timeSignature: [4, 4], tuning: STANDARD_BASS, events: [], measures: measures(140),
  }
}

// ═══════════════════════════════════════════════════════════
// Export all song tracks
// ═══════════════════════════════════════════════════════════

export interface SongEntry {
  title: string
  artist: string
  youtubeId: string
  bpm: number
  key: string
  guitarTrackId: string
  bassTrackId: string
}

export interface SongCategory {
  name: string
  tracks: Track[]
  songs: SongEntry[]
}

export const SONG_CATEGORIES: SongCategory[] = [
  {
    name: 'ボッチ・ザ・ロック!',
    tracks: [
      seishunGuitar(), seishunBass(),
      guitarKodokuGuitar(), guitarKodokuBass(),
      seizaGuitar(), seizaBass(),
    ],
    songs: [
      { title: '青春コンプレックス', artist: '結束バンド', youtubeId: 'Yd8kUoB72xU', bpm: 175, key: 'E', guitarTrackId: 'song-seishun-guitar', bassTrackId: 'song-seishun-bass' },
      { title: 'ギターと孤独と蒼い惑星', artist: '結束バンド', youtubeId: 'B7BxrAAXl94', bpm: 168, key: 'E', guitarTrackId: 'song-guitar-kodoku-guitar', bassTrackId: 'song-guitar-kodoku-bass' },
      { title: '星座になれたら', artist: '結束バンド', youtubeId: 'wSTbdqo-j74', bpm: 160, key: 'G', guitarTrackId: 'song-seiza-guitar', bassTrackId: 'song-seiza-bass' },
    ],
  },
  {
    name: '桜高軽音部 (K-ON!)',
    tracks: [dontSayLazyGuitar(), dontSayLazyBass()],
    songs: [
      { title: 'Don\'t say "lazy"', artist: '桜高軽音部', youtubeId: '5CSNv9MNEC4', bpm: 140, key: 'Em', guitarTrackId: 'song-dontsaylazy-guitar', bassTrackId: 'song-dontsaylazy-bass' },
    ],
  },
  {
    name: 'ヨルシカ',
    tracks: [
      tadaKimiGuitar(), tadaKimiBass(),
      hanaNiBoureiGuitar(), hanaNiBoureiBass(),
      haruDorobouGuitar(), haruDorobouBass(),
      haruGuitar(), haruBass(),
      dakaraBokuGuitar(), dakaraBokuBass(),
      shisouhanGuitar(), shisouhanBass(),
    ],
    songs: [
      { title: 'ただ君に晴れ', artist: 'ヨルシカ', youtubeId: 'yRhiO4dfTlQ', bpm: 138, key: 'A', guitarTrackId: 'song-tadakimi-guitar', bassTrackId: 'song-tadakimi-bass' },
      { title: '花に亡霊', artist: 'ヨルシカ', youtubeId: 'KIQ59G9nIbM', bpm: 90, key: 'E', guitarTrackId: 'song-hana-bourei-guitar', bassTrackId: 'song-hana-bourei-bass' },
      { title: '春泥棒', artist: 'ヨルシカ', youtubeId: 'ttIYXlXjK6c', bpm: 155, key: 'E', guitarTrackId: 'song-haru-dorobou-guitar', bassTrackId: 'song-haru-dorobou-bass' },
      { title: '晴る', artist: 'ヨルシカ', youtubeId: 'E0d2uEQJbXs', bpm: 100, key: 'Bm', guitarTrackId: 'song-haru-guitar', bassTrackId: 'song-haru-bass' },
      { title: 'だから僕は音楽を辞めた', artist: 'ヨルシカ', youtubeId: 'KTZ-y85Erus', bpm: 125, key: 'E', guitarTrackId: 'song-dakara-boku-guitar', bassTrackId: 'song-dakara-boku-bass' },
      { title: '思想犯', artist: 'ヨルシカ', youtubeId: '4F7D__a-1Pw', bpm: 138, key: 'Am', guitarTrackId: 'song-shisouhan-guitar', bassTrackId: 'song-shisouhan-bass' },
    ],
  },
  {
    name: '米津玄師',
    tracks: [kickbackGuitar(), kickbackBass(), lemonGuitar(), lemonBass()],
    songs: [
      { title: 'KICK BACK', artist: '米津玄師', youtubeId: 'M2cckDmNLMI', bpm: 150, key: 'Cm', guitarTrackId: 'song-kickback-guitar', bassTrackId: 'song-kickback-bass' },
      { title: 'Lemon', artist: '米津玄師', youtubeId: 'SX_ViT4Ra7k', bpm: 87, key: 'G#m', guitarTrackId: 'song-lemon-guitar', bassTrackId: 'song-lemon-bass' },
    ],
  },
  {
    name: 'ASIAN KUNG-FU GENERATION',
    tracks: [solaninGuitar(), solaninBass(), rewriteGuitar(), rewriteBass()],
    songs: [
      { title: 'ソラニン', artist: 'ASIAN KUNG-FU GENERATION', youtubeId: 'xZD1B1TskXs', bpm: 162, key: 'G', guitarTrackId: 'song-solanin-guitar', bassTrackId: 'song-solanin-bass' },
      { title: 'リライト', artist: 'ASIAN KUNG-FU GENERATION', youtubeId: 'ZmeudwRMrsU', bpm: 167, key: 'E', guitarTrackId: 'song-rewrite-guitar', bassTrackId: 'song-rewrite-bass' },
    ],
  },
  {
    name: 'BUMP OF CHICKEN',
    tracks: [tentaiGuitar(), tentaiBass()],
    songs: [
      { title: '天体観測', artist: 'BUMP OF CHICKEN', youtubeId: 'j7CDb610Bg0', bpm: 165, key: 'D', guitarTrackId: 'song-tentai-guitar', bassTrackId: 'song-tentai-bass' },
    ],
  },
  {
    name: 'YOASOBI',
    tracks: [yoruNiGuitar(), yoruNiBass()],
    songs: [
      { title: '夜に駆ける', artist: 'YOASOBI', youtubeId: 'by4SYYWlhEs', bpm: 130, key: 'Cm', guitarTrackId: 'song-yoruni-guitar', bassTrackId: 'song-yoruni-bass' },
    ],
  },
  {
    name: 'Official髭男dism',
    tracks: [pretenderGuitar(), pretenderBass()],
    songs: [
      { title: 'Pretender', artist: 'Official髭男dism', youtubeId: 'TQ8WlA2GXbk', bpm: 92, key: 'Ab', guitarTrackId: 'song-pretender-guitar', bassTrackId: 'song-pretender-bass' },
    ],
  },
  {
    name: 'RADWIMPS',
    tracks: [zenzenzenseGuitar(), zenzenzenseBass()],
    songs: [
      { title: '前前前世', artist: 'RADWIMPS', youtubeId: 'PDSkFeMVNFs', bpm: 190, key: 'D', guitarTrackId: 'song-zenzenzense-guitar', bassTrackId: 'song-zenzenzense-bass' },
    ],
  },
  {
    name: 'TK from 凛として時雨',
    tracks: [unravelGuitar(), unravelBass()],
    songs: [
      { title: 'unravel', artist: 'TK from 凛として時雨', youtubeId: 'Fve_lHIPa-I', bpm: 135, key: 'Dm', guitarTrackId: 'song-unravel-guitar', bassTrackId: 'song-unravel-bass' },
    ],
  },
]

export const ALL_SONG_TRACKS: Track[] = SONG_CATEGORIES.flatMap(c => c.tracks)
