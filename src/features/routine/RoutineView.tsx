// RoutineView — 악기별 일일 루틴 (Bass / Guitar / Vocal / Drum).
//
// Session 탭이 "오늘의 30분 베이스 세션"이면 Routine 탭은 "각 악기 표준 일일 루틴"
// 참고용. Session은 자동 생성, Routine은 정적 가이드.

import { useState } from 'react'

type InstrumentId = 'bass' | 'guitar' | 'vocal' | 'drum'

interface Block {
  name: string
  duration: number  // minutes
  desc: string
  steps: string[]
  color: string
}

interface Routine {
  id: InstrumentId
  label: string
  ko: string
  icon: string
  totalMinutes: number
  description: string
  blocks: Block[]
  weekly: Array<{ day: string; focus: string }>
  source: string
}

const ROUTINES: Routine[] = [
  {
    id: 'bass',
    label: 'Bass',
    ko: '베이스',
    icon: '🎸',
    totalMinutes: 45,
    description:
      '매일 짧게 (15-45분) > 가끔 길게. 스케일 → 코드톤 → 곡 순. ' +
      '12 키 회전 (interleaving) + 메트로놈 필수.',
    blocks: [
      {
        name: 'Warmup',
        duration: 5,
        desc: '핑거 + 12-key 회전',
        color: '#ff8a4a',
        steps: [
          'i-m 교대 피킹 (BPM 60) — E/A/D/G 4현 순회',
          '1st position에서 음 이름 말하며 짚기 (active retrieval)',
          '12 키 회전: C → G → D → A → E → B → F♯ → C♯ → A♭ → E♭ → B♭ → F',
        ],
      },
      {
        name: 'Technique',
        duration: 10,
        desc: '핑거링 + 뮤트 + 정확한 어택',
        color: '#fbbc00',
        steps: [
          '한 손 한 손 분리 — 왼손만 / 오른손만 (rest stroke 의식)',
          '뮤트 연습: 사용 안 하는 줄에 손가락 가볍게 (잡음 차단)',
          'BPM 80 → 5씩 올리며 클린한 영역에서만 머물기',
        ],
      },
      {
        name: 'Stage drill',
        duration: 10,
        desc: 'Root → Octave → 5th → Arpeggio',
        color: '#7eff8b',
        steps: [
          '오늘의 Stage 1개 골라 코드 진행 회전 (Em → Am → Dm → G)',
          '메트로놈 강박(1·3박)에 어택 / 약박(2·4)에 mute 놓기',
          '느린 BPM에서 박자감/음정 안정 → 다음 BPM',
        ],
      },
      {
        name: 'Song apply',
        duration: 15,
        desc: '오늘 곡 + 어제 곡 교차 (interleaving)',
        color: '#71dcff',
        steps: [
          '오늘 곡 — Stem Mixer "Bass off" → 베이스 파트 직접 연주',
          '어제 곡 5분 → 오늘 곡 5분 → 어제 곡 5분 (교차)',
          '못 짚은 마디 메모 → 내일 warmup에 그 키 추가',
        ],
      },
      {
        name: 'Cooldown',
        duration: 5,
        desc: '녹음 + 자기 평가',
        color: '#ffb2be',
        steps: [
          '오늘 세션 한 구간 폰으로 녹음 후 재생',
          '체크: 박자 / 음정 / mute / 연결성 4가지',
          '내일 보강 영역 1개 메모',
        ],
      },
    ],
    weekly: [
      { day: 'Mon', focus: 'Stage 1 (루트) + 12-key 스케일' },
      { day: 'Tue', focus: 'Stage 2 (옥타브) + 아르페지오 (Em/Am)' },
      { day: 'Wed', focus: '곡 적용 — 한 곡 깊게 (verse + chorus)' },
      { day: 'Thu', focus: 'Stage 3 (5도) + 코드 진행 (Em→Am→Dm→G)' },
      { day: 'Fri', focus: 'Stage 4 (아르페지오) + 곡 교차' },
      { day: 'Sat', focus: '녹음 + 자기 평가 + 약점 보강' },
      { day: 'Sun', focus: '쉼 또는 짧은 maintenance (15분)' },
    ],
    source: 'TalkingBass · StudyBass · Berklee Online · BassBuzz',
  },
  {
    id: 'guitar',
    label: 'Guitar',
    ko: '기타',
    icon: '🎸',
    totalMinutes: 60,
    description:
      '5단계 표준 1시간 루틴 — Warmup + Technique + Theory/Ear + Repertoire + Creativity. ' +
      '느리고 정확하게 → 속도는 자연 따라옴.',
    blocks: [
      {
        name: 'Warmup',
        duration: 8,
        desc: '핑거 스트레칭 + 크로마틱',
        color: '#ff8a4a',
        steps: [
          '1-2-3-4 finger walk 6번현 → 1번현 → 6번현',
          '크로마틱 런 (1프렛 → 4프렛, 6번현 → 1번현)',
          '코드 전환 워밍업 (G → C → D → Em)',
        ],
      },
      {
        name: 'Technique',
        duration: 15,
        desc: '스케일 + 아르페지오 + 얼터네이트 피킹',
        color: '#fbbc00',
        steps: [
          'Minor pentatonic 5 포지션 — BPM 80, 메트로놈',
          '얼터네이트 피킹 (down-up-down-up 일정성)',
          '스케일 시퀀스 (1-3, 1-3-5, 1-2-3-4)',
        ],
      },
      {
        name: 'Theory + Ear',
        duration: 12,
        desc: '인터벌 + 코드 진행 청음',
        color: '#7eff8b',
        steps: [
          '좋아하는 곡 한 구간 → 코드 변화 위치 청음으로 찾기',
          '루트 음 흥얼거린 후 기타로 확인 (active retrieval)',
          '간단 코드 진행 (I-V-vi-IV) 다른 키로 옮기기',
        ],
      },
      {
        name: 'Repertoire',
        duration: 20,
        desc: '곡 학습 (좋아하는 곡)',
        color: '#71dcff',
        steps: [
          '곡의 어려운 1마디 → 4마디 → 한 섹션 chunking',
          'BPM 60% → 80% → 100% 단계적 상승',
          '못한 부분 메모 → 내일 warmup에 그 패턴',
        ],
      },
      {
        name: 'Creativity',
        duration: 5,
        desc: '즉흥 / 잼',
        color: '#ffb2be',
        steps: [
          '백킹트랙 켜고 minor pentatonic 즉흥',
          '의도적으로 어려운 영역 (다른 포지션, 비브라토)',
          '재미있게! 스트레스 X',
        ],
      },
    ],
    weekly: [
      { day: 'Mon', focus: '오픈 코드 + 기본 스트럼 (낯익은 곡)' },
      { day: 'Tue', focus: 'Pentatonic 5 포지션 + 얼터네이트 피킹' },
      { day: 'Wed', focus: '바레 코드 (F, B♭, B♭m 등) + 코드 전환' },
      { day: 'Thu', focus: '곡 한 곡 깊게 (verse + chorus)' },
      { day: 'Fri', focus: '7th 코드 + 재즈 진행 ii-V-I' },
      { day: 'Sat', focus: '즉흥 + 백킹트랙 잼' },
      { day: 'Sun', focus: '쉼 또는 새 곡 탐색 (15분)' },
    ],
    source: 'JustinGuitar · MI.edu · TheGuitarLesson · GuitarHabits · TrueFire',
  },
  {
    id: 'vocal',
    label: 'Vocal',
    ko: '보컬',
    icon: '🎤',
    totalMinutes: 30,
    description:
      '복식 호흡 + 워밍업 + 음역대 + 곡 + 녹음. 매일 짧게 (15-30분) — 무리 시 즉시 휴식.',
    blocks: [
      {
        name: 'Breathing',
        duration: 3,
        desc: '복식 호흡 5세트',
        color: '#ff8a4a',
        steps: [
          '4초 들이쉬고 (배 앞으로) → 4초 정지 → 6초 천천히 내쉬기',
          '5세트 반복 — 어깨 / 가슴 안 올라감 확인',
          '누워서 책을 배 위에 올리고 호흡 (책이 위아래)',
        ],
      },
      {
        name: 'Warmup',
        duration: 10,
        desc: 'Lip trill / Siren / Straw',
        color: '#fbbc00',
        steps: [
          '4분 lip trill (5도 → 옥타브 슬라이드)',
          '3분 sirens (최저 ↔ 최고, passaggio 부드럽게)',
          '3분 straw phonation (백 프레셔 + 멜로디)',
        ],
      },
      {
        name: 'Range work',
        duration: 7,
        desc: '음역대 확장 + passaggio',
        color: '#7eff8b',
        steps: [
          '5도 스케일 — 모음 5종 (AH/EH/EE/OH/OO) 회전',
          'passaggio (E4, A4) 부근 5번 통과 (mix voice 의식)',
          '한 반음씩 위로 → 무리되면 즉시 멈춤',
        ],
      },
      {
        name: 'Song',
        duration: 8,
        desc: '한 곡 — 한 섹션 깊게',
        color: '#71dcff',
        steps: [
          '곡 verse 또는 chorus 한 섹션 선택',
          '반주 없이 멜로디만 → 가사 → 반주 통합',
          '문제 마디 → 천천히 + 모음 길이 의식',
        ],
      },
      {
        name: 'Self eval',
        duration: 2,
        desc: '녹음 + 청취',
        color: '#ffb2be',
        steps: [
          '한 구간 폰으로 녹음 → 즉시 재생',
          '체크: 음정 / 호흡 / 모음 길이',
          '내일 보강 영역 1개 메모',
        ],
      },
    ],
    weekly: [
      { day: 'Mon', focus: '호흡 + lip trill 집중 (낮은 음역)' },
      { day: 'Tue', focus: 'passaggio (E4, A4) 부드러운 통과' },
      { day: 'Wed', focus: '곡 한 곡 — verse 깊게' },
      { day: 'Thu', focus: '음역대 확장 (반음씩, 무리 X)' },
      { day: 'Fri', focus: 'Mix voice + chest 균형' },
      { day: 'Sat', focus: '녹음 + 자기 평가 + 주간 변화 확인' },
      { day: 'Sun', focus: '쉼 (목 회복일) — 가벼운 humming만' },
    ],
    source: 'Musicians Institute · Forbrain · School of Rock · Berklee',
  },
  {
    id: 'drum',
    label: 'Drum',
    ko: '드럼',
    icon: '🥁',
    totalMinutes: 45,
    description:
      'Warmup + Rudiments + Independence + Groove + Song. 메트로놈은 항상 켜고. ' +
      '느린 BPM에서 정확함이 빠른 BPM에서의 정확함보다 100배 가치.',
    blocks: [
      {
        name: 'Warmup + Stretch',
        duration: 10,
        desc: '손목 / 어깨 / 발목',
        color: '#ff8a4a',
        steps: [
          '손목 회전 + 손가락 스트레칭 5분',
          'Single stroke (R-L-R-L) — BPM 60에서 8분음 1분',
          '어깨 / 발목 회전 — 부상 방지',
        ],
      },
      {
        name: 'Rudiments',
        duration: 15,
        desc: '40 standard rudiments 중 일부',
        color: '#fbbc00',
        steps: [
          'Single / Double / Paradiddle 3종 — 각 2분',
          'BPM 80 → 100 → 120 단계',
          '오른손 / 왼손 균등 ─ leading hand 바꿔보기',
        ],
      },
      {
        name: 'Independence',
        duration: 8,
        desc: '4-way coordination',
        color: '#7eff8b',
        steps: [
          'Hi-hat 8분 + snare 2·4박 + kick 1박 (basic rock)',
          'Hi-hat 풀고 → 8분 다른 손으로 → kick 변형',
          '느리게 BPM 70 → 정확함 우선',
        ],
      },
      {
        name: 'Groove + Fill',
        duration: 7,
        desc: '8-bar 패턴 + fill',
        color: '#71dcff',
        steps: [
          '8마디 = 7마디 groove + 1마디 fill',
          'fill는 simple 4분 → 8분 → 16분',
          '곡에 맞는 dynamics (verse 약, chorus 강)',
        ],
      },
      {
        name: 'Song',
        duration: 5,
        desc: '곡 한 곡 따라치기',
        color: '#ffb2be',
        steps: [
          '곡 verse 또는 chorus 한 섹션 따라치기',
          '문제 부분 → BPM 60% → 80% → 100% 단계',
          '메트로놈과 곡 맞춰져 있는지 확인',
        ],
      },
    ],
    weekly: [
      { day: 'Mon', focus: 'Rudiments — Single + Double 집중' },
      { day: 'Tue', focus: 'Paradiddle + 변형' },
      { day: 'Wed', focus: '4-way independence + basic rock' },
      { day: 'Thu', focus: '8-bar groove + simple fill' },
      { day: 'Fri', focus: '곡 한 곡 따라치기 (한 섹션 깊게)' },
      { day: 'Sat', focus: '느린 BPM에서 정확함 (BPM 60-80)' },
      { day: 'Sun', focus: '쉼 또는 짧은 maintenance (15분)' },
    ],
    source: 'Soundbrenner · Pirate · Vic Firth · DrumChannel',
  },
]

export function RoutineView() {
  const [active, setActive] = useState<InstrumentId>('bass')
  const r = ROUTINES.find((x) => x.id === active)!

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto px-6 py-8 flex flex-col gap-6" style={{ maxWidth: 1100 }}>
        <header className="flex flex-col gap-2">
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            BOCCHI · ROUTINE
          </div>
          <h1
            className="font-serif italic"
            style={{ color: '#fff', fontSize: 38, fontWeight: 400, lineHeight: 1.1 }}
          >
            Daily Practice Plans
          </h1>
          <p style={{ color: '#999', fontSize: 14, maxWidth: 720, lineHeight: 1.6 }}>
            악기별 표준 일일 루틴 — 시간 분할 + 단계별 체크리스트 + 주간 포커스. Session 탭이
            오늘의 자동 30분 베이스 세션이면, Routine 탭은 모든 악기의 정적 표준 가이드.
          </p>
        </header>

        {/* Instrument toggle */}
        <div className="flex gap-2 flex-wrap">
          {ROUTINES.map((rt) => {
            const isActive = rt.id === active
            return (
              <button
                key={rt.id}
                onClick={() => setActive(rt.id)}
                className="px-4 py-2 rounded-md font-mono text-xs transition-all flex items-center gap-2"
                style={{
                  background: isActive ? 'rgba(251,188,0,0.15)' : '#141414',
                  color: isActive ? '#fbbc00' : '#888',
                  border: `1px solid ${isActive ? 'rgba(251,188,0,0.5)' : '#222'}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14 }}>{rt.icon}</span>
                <span>{rt.label}</span>
                <span style={{ color: '#666' }}>· {rt.ko}</span>
                <span className="ml-1" style={{ color: isActive ? '#fbbc00aa' : '#666' }}>
                  {rt.totalMinutes}min
                </span>
              </button>
            )
          })}
        </div>

        {/* Description */}
        <div
          className="rounded-lg p-4"
          style={{ background: '#101010', border: '1px solid rgba(251,188,0,0.15)' }}
        >
          <div className="flex items-baseline gap-3 mb-2">
            <span style={{ fontSize: 24 }}>{r.icon}</span>
            <span className="font-serif italic" style={{ color: '#fff', fontSize: 22 }}>
              {r.label} · {r.ko}
            </span>
            <span className="font-mono text-xs" style={{ color: '#7eff8b' }}>
              {r.totalMinutes} min
            </span>
          </div>
          <p style={{ color: '#bbb', fontSize: 13, lineHeight: 1.6 }}>{r.description}</p>
        </div>

        {/* Time-split bar */}
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            TIME SPLIT · {r.totalMinutes}min total
          </div>
          <div className="flex h-8 rounded overflow-hidden" style={{ background: '#0d0d0d' }}>
            {r.blocks.map((b) => (
              <div
                key={b.name}
                className="flex items-center justify-center text-[10px] font-mono font-bold"
                style={{
                  flex: b.duration,
                  background: `${b.color}33`,
                  borderRight: '1px solid #0a0a0a',
                  color: b.color,
                }}
                title={`${b.name} · ${b.duration}min`}
              >
                {b.duration}m
              </div>
            ))}
          </div>
        </div>

        {/* Block cards */}
        <div className="flex flex-col gap-3">
          {r.blocks.map((b, i) => (
            <div
              key={b.name}
              className="rounded-lg p-4"
              style={{ background: '#101010', border: `1px solid ${b.color}33` }}
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-[10px]" style={{ color: `${b.color}99` }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="font-serif italic flex-1"
                  style={{ color: b.color, fontSize: 17 }}
                >
                  {b.name}
                </span>
                <span className="font-mono text-[11px]" style={{ color: '#888' }}>
                  {b.duration} min
                </span>
              </div>
              <div className="font-mono text-[10px] mb-2" style={{ color: '#666' }}>
                {b.desc}
              </div>
              <ul className="list-none p-0 m-0 flex flex-col gap-1">
                {b.steps.map((s, si) => (
                  <li
                    key={si}
                    className="flex items-baseline gap-2"
                    style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5 }}
                  >
                    <span
                      className="font-mono"
                      style={{ color: `${b.color}88`, fontSize: 10, flexShrink: 0, width: 12 }}
                    >
                      ▸
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Weekly schedule */}
        <div
          className="rounded-lg p-4"
          style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
        >
          <div className="font-mono text-[10px] mb-3" style={{ color: '#fbbc00' }}>
            WEEKLY FOCUS · {r.label}
          </div>
          <div className="flex flex-col gap-1">
            {r.weekly.map((w) => {
              const today = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
              const isToday = w.day === today
              return (
                <div
                  key={w.day}
                  className="flex items-baseline gap-3 py-1.5 px-2 rounded"
                  style={{
                    borderBottom: '1px solid #1a1a1a',
                    background: isToday ? 'rgba(126,255,139,0.06)' : 'transparent',
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      color: isToday ? '#7eff8b' : '#fbbc00',
                      fontSize: 11,
                      fontWeight: 700,
                      width: 36,
                    }}
                  >
                    {isToday ? `▸ ${w.day}` : w.day}
                  </span>
                  <span
                    style={{
                      color: isToday ? '#eaffea' : '#bbb',
                      fontSize: 12,
                      lineHeight: 1.5,
                      fontWeight: isToday ? 500 : 400,
                    }}
                  >
                    {w.focus}
                  </span>
                  {isToday && (
                    <span
                      className="font-mono text-[9px] ml-auto"
                      style={{ color: '#7eff8b88' }}
                    >
                      TODAY
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <footer
          className="pt-4 pb-12"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            sources · {r.source}
          </div>
        </footer>
      </div>
    </div>
  )
}
