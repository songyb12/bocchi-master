// WarmupExercises — 5종 보컬 워밍업 카드 + 시간 권장.

interface Exercise {
  id: string
  name: string
  ko: string
  duration: string  // 분
  steps: string[]
  why: string
}

const EXERCISES: Exercise[] = [
  {
    id: 'lip-trill',
    name: 'Lip Trill (Lip Roll)',
    ko: '립 트릴',
    duration: '2 min',
    steps: [
      '입술을 가볍게 다물고 진동시켜 "Brrrr" 소리',
      '낮은 음에서 시작 → 음정 위로 슬라이드',
      '낮은→높은 옥타브 1.5 정도 왕복',
      '복식 호흡 유지, 입술 긴장 없이',
    ],
    why: 'SOVT (Semi-Occluded Vocal Tract) 효과. 성대 부담 ↓, 호흡 + 발성 균형 잡힘. 워밍업의 70%가 이거면 충분.',
  },
  {
    id: 'siren',
    name: 'Siren (Glissando)',
    ko: '사이렌',
    duration: '2 min',
    steps: [
      '"우~" 또는 "응~" 으로 사이렌 소리',
      '최저음 → 최고음 → 최저음 부드럽게 슬라이드',
      'passaggio (E4, A4) 부근 끊김 없이 통과',
      '5회 반복, 점차 음역 확장',
    ],
    why: 'Chest → Mix → Head voice 부드러운 연결 훈련. passaggio 부담 줄임. 음역대 매핑 + 자기 한계 인지.',
  },
  {
    id: 'straw',
    name: 'Straw Phonation',
    ko: '빨대 발성',
    duration: '3 min',
    steps: [
      '얇은 빨대를 입에 물고 "우~" 소리',
      '빨대 끝을 손가락으로 살짝 막으면 백 프레셔 ↑',
      '낮은음 → 사이렌 → 멜로디 순',
      '목 사용된 느낌 없이 부드럽게',
    ],
    why: '의학적 검증. 성대 충돌 ↓ + 발성 효율 ↑. 음악치료사 / 팝스타 모두 사용. 피로한 목 회복에도 효과.',
  },
  {
    id: 'humming',
    name: 'Humming (Mmm)',
    ko: '허밍',
    duration: '2 min',
    steps: [
      '입을 가볍게 닫고 "음~" 허밍',
      '코 / 입 부근 진동 느끼기 (mask resonance)',
      '음계 5도 아래 → 위 (do-re-mi-fa-so)',
      '부드럽게, 큰 음량 X',
    ],
    why: '비강 공명(nasal resonance) 인식 + 톤 풍부. mask placement 익히는 데 가장 단순한 방법.',
  },
  {
    id: 'scales',
    name: 'Vowel Scales (모음 스케일)',
    ko: '모음 스케일',
    duration: '5 min',
    steps: [
      'AH (아) / EE (이) / OO (우) / OH (오) / EH (에) 5 모음',
      '5도 또는 옥타브 스케일로 (do-mi-so-mi-do)',
      '각 모음 입 모양 의식적으로',
      '음정 정확 + 입 모양 일관성',
    ],
    why: '모음별 입 모양 + 자세 습관화. 발음 / 가사 노래 시 모음 길이가 핵심. 12 키 회전이 더 강함.',
  },
]

export function WarmupExercises() {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-lg p-3"
        style={{ background: '#0a0a0a', border: '1px dashed #2a2a2a' }}
      >
        <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
          DAILY ROUTINE · ~14 min
        </div>
        <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
          5분 lip trill → 2분 siren → 3분 straw → 2분 humming → 2분 vowel scales. 노래 전에 항상.
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {EXERCISES.map((ex, i) => (
          <div
            key={ex.id}
            className="rounded-lg p-4"
            style={{ background: '#101010', border: '1px solid #222' }}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-mono text-[10px]" style={{ color: '#fbbc0099' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-serif italic" style={{ color: '#fbbc00', fontSize: 16 }}>
                {ex.name}
              </span>
              <span className="font-mono text-[9px] flex-1" style={{ color: '#666' }}>
                {ex.ko}
              </span>
              <span className="font-mono text-[9px]" style={{ color: '#7eff8b' }}>
                {ex.duration}
              </span>
            </div>
            <ol className="list-none p-0 m-0 flex flex-col gap-1 mb-3">
              {ex.steps.map((s, si) => (
                <li
                  key={si}
                  className="flex items-baseline gap-2"
                  style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5 }}
                >
                  <span
                    className="font-mono"
                    style={{ color: '#fbbc0066', fontSize: 10, flexShrink: 0, width: 14 }}
                  >
                    {si + 1}.
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div
              className="font-mono text-[10px] pt-2"
              style={{ color: '#888', borderTop: '1px solid #1c1c1c', lineHeight: 1.5 }}
            >
              ≈ {ex.why}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
