/**
 * Bass learning Stages — 6-step pedagogy curriculum.
 *
 * PR-2 (this file) provides the data + UI scaffolding only. PR-3 will
 * attach a `generate(chord, beatIdx)` function to each stage so the
 * Fretboard/TabView can render the actual notes.
 *
 * Pedagogy reference: docs/bass-learning-research.md §B (TalkingBass /
 * StudyBass / BassBuzz on root → octave → 5th → arpeggio progression).
 *
 * Why an enum + array of records: a switch on stage id ages poorly. Each
 * stage carries its own metadata so future PRs can drop in generators,
 * difficulty levels, and progress flags without touching call sites.
 */

export type StageId = 'roots' | 'octaves' | 'fifths' | 'arpeggios' | 'passing' | 'walking'

export interface StageDef {
  id: StageId
  /** 1-based ordinal for display */
  order: number
  /** Short Korean label for the toggle button */
  label: string
  /** One-line summary shown next to the active stage */
  summary: string
  /** Detailed explanation in the help panel */
  detail: string
  /** Difficulty marker: 1 (beginner) – 3 (advanced) */
  difficulty: 1 | 2 | 3
  /**
   * Example pattern for an Em chord across one bar (4/4). 4 beats × 4 strings,
   * fret number or '-' for rest. Read top-to-bottom: G/D/A/E (string 4 = lowest E).
   */
  examplePattern: {
    chord: string
    beats: Array<Array<number | '-'>>  // [[g,d,a,e], ...] x4 beats
    note: string  // brief tip per pattern
  }
  /** Reserved for PR-3 — note generator. Currently null in all stages. */
  generator: null
}

export const STAGES: StageDef[] = [
  {
    id: 'roots',
    order: 1,
    label: '루트',
    summary: '각 마디 첫 박에 루트 한 음',
    detail:
      '각 마디의 코드 루트 음을 첫 박에만 4분음표로. 박자감과 코드 변화 인지가 목표. ' +
      '예) Em → 1번현 7프렛(또는 4번현 0프렛 E), Am → 1번현 5프렛(또는 4번현 0프렛 A옥타브 위).',
    difficulty: 1,
    examplePattern: {
      chord: 'Em',
      beats: [
        ['-', '-', '-', 0],
        ['-', '-', '-', '-'],
        ['-', '-', '-', '-'],
        ['-', '-', '-', '-'],
      ],
      note: '1박에만 E (4번현 0프렛). 나머지 3박은 침묵 또는 sustain.',
    },
    generator: null,
  },
  {
    id: 'octaves',
    order: 2,
    label: '루트+옥타브',
    summary: '루트–옥타브–루트–옥타브 (1·3박 vs 2·4박)',
    detail:
      '루트와 옥타브 위 음을 번갈아 짚기. 옥타브 = 한 현 위, 두 프렛 위. ' +
      '왼손 손가락 stretch와 옥타브 거리감을 체화. 1990년대 시티팝/디스코 베이스의 기본기.',
    difficulty: 1,
    examplePattern: {
      chord: 'Em',
      beats: [
        ['-', '-', '-', 0],   // 1: E root
        ['-', 2, '-', '-'],   // 2: E octave (D현 2프렛)
        ['-', '-', '-', 0],   // 3: E root
        ['-', 2, '-', '-'],   // 4: E octave
      ],
      note: '옥타브 = 한 현 위 + 두 프렛 위. E0 → D2. 손가락은 1번 + 4번.',
    },
    generator: null,
  },
  {
    id: 'fifths',
    order: 3,
    label: '루트+5도',
    summary: '루트–5도–루트–5도 (블루스/록 기본)',
    detail:
      '루트와 완전 5도 음을 번갈아. 5도 = 한 현 위, 같은 프렛(또는 두 프렛 위, 같은 현). ' +
      '컨트리/블루스/하드록의 50% 이상이 이 패턴. 코드의 메이저/마이너에 무관해 안전.',
    difficulty: 2,
    examplePattern: {
      chord: 'Em',
      beats: [
        ['-', '-', '-', 0],   // 1: E root
        ['-', '-', 2, '-'],   // 2: B (5도, A현 2프렛)
        ['-', '-', '-', 0],   // 3: E root
        ['-', '-', 2, '-'],   // 4: B (5도)
      ],
      note: '5도 = 한 현 위, 같은 손가락. E0 → A2. 메이저/마이너 무관.',
    },
    generator: null,
  },
  {
    id: 'arpeggios',
    order: 4,
    label: '아르페지오',
    summary: '루트–3도–5도–8도 (코드 톤 펼치기)',
    detail:
      '코드 구성음을 1·3·5·8도로 펼침. 메이저는 장3도(4프렛), 마이너는 단3도(3프렛). ' +
      '재즈/펑크/J-Pop의 기본기. 처음에는 코드 변화 시 가장 가까운 다음 루트로 이동.',
    difficulty: 2,
    examplePattern: {
      chord: 'Em',
      beats: [
        ['-', '-', '-', 0],   // 1: E (root)
        ['-', '-', '-', 3],   // 2: G (단3도, E현 3프렛)
        ['-', '-', 2, '-'],   // 3: B (5도, A현 2프렛)
        ['-', 2, '-', '-'],   // 4: E (8도, D현 2프렛)
      ],
      note: 'Em = E-G-B-E. 메이저면 3도가 4프렛. 코드 토닝의 핵심.',
    },
    generator: null,
  },
  {
    id: 'passing',
    order: 5,
    label: '통과음',
    summary: '아르페지오 + 사이 통과음 (반음/온음)',
    detail:
      '코드 톤 사이를 반음 또는 온음 통과음으로 잇기. 다음 코드 루트로 부드럽게 접근. ' +
      '재즈 워킹 베이스의 초입. 통과음은 약박에 위치.',
    difficulty: 3,
    examplePattern: {
      chord: 'Em → Am',
      beats: [
        ['-', '-', '-', 0],   // 1: E (root)
        ['-', '-', '-', 3],   // 2: G (3도)
        ['-', '-', '-', 4],   // 3: G♯ (반음 통과)
        ['-', '-', 0, '-'],   // 4: A (다음 코드 root)
      ],
      note: '약박(2·4)에 통과음. 다음 코드 루트로 반음 또는 온음 접근.',
    },
    generator: null,
  },
  {
    id: 'walking',
    order: 6,
    label: '워킹',
    summary: '4분음 워킹 라인 (코드별 4음 패턴)',
    detail:
      '마디당 4음(루트–코드톤–통과음–다음 코드 어프로치). 재즈 / 블루스의 핵심 베이스 라인. ' +
      'Stage 4·5의 종합. PR-3에서 해석 가능한 자동 생성기 첨부 예정.',
    difficulty: 3,
    examplePattern: {
      chord: 'Em → Am',
      beats: [
        ['-', '-', '-', 0],   // 1: E root
        ['-', '-', 2, '-'],   // 2: B (5도)
        ['-', '-', '-', 3],   // 3: G (3도)
        ['-', '-', 0, '-'],   // 4: A (다음 코드 어프로치)
      ],
      note: '루트→코드톤→코드톤→다음 어프로치. 4분음 끊김 없이.',
    },
    generator: null,
  },
]

/** Lookup helper. Returns the first stage if id is invalid (defensive). */
export function getStage(id: StageId): StageDef {
  return STAGES.find(s => s.id === id) ?? STAGES[0]
}

/**
 * Recommended bass tone preset per stage (R15 — bridges Learn/Section 06 recipe).
 * Used as a hint label; users still tweak the actual signal chain manually.
 */
export const STAGE_TONE_PRESETS: Record<StageId, { name: string; recipe: string }> = {
  roots:    { name: 'Warm thump',    recipe: '핑거 + flatwound · 100Hz +2dB · 4kHz roll-off' },
  octaves:  { name: 'Round + clear', recipe: '핑거 + roundwound · neck pickup · 미세 컴프' },
  fifths:   { name: 'Punchy mid',    recipe: 'P-Bass + 핑거 · 800Hz +2dB · 컴프 약간' },
  arpeggios:{ name: 'Bright J-tone', recipe: 'J-Bass 양 픽업 · 미드 700Hz +3dB · NAM light OD' },
  passing:  { name: 'Growl',         recipe: 'J-Bass bridge picky · NAM Drive 10시 · 4-6kHz +2dB' },
  walking:  { name: 'Jazz upright',  recipe: 'flatwound + 핑거 1개 · 100Hz +3dB · 2kHz roll-off' },
}

/** Persistence key for selected stage (single global setting; per-song deferred). */
export const STAGE_STORAGE_KEY = 'bocchi.stage'
