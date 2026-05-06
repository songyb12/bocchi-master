// SignalChainDiagram — 5-stage bass tone signal pipeline.
// Click a stage to highlight; hover shows tooltip.

import { useState } from 'react'

interface Stage {
  id: string
  label: string
  sub: string
  detail: string
}

const STAGES: Stage[] = [
  { id: 'attack',   label: '손가락/픽',   sub: 'input waveform',   detail: '입력 파형의 모양을 결정. 어택 트랜지언트, 임펄스 응답, 노이즈 floor — 이후 모든 단의 source 신호.' },
  { id: 'string',   label: '현 + 우드',  sub: 'resonance',        detail: '현 텐션·게이지, 넥/바디 우드의 1차 공명. 동일 주파수라도 sustain·하모닉 분포가 달라짐.' },
  { id: 'pickup',   label: '픽업 위치',  sub: 'sampling point',   detail: '현의 어느 지점에서 측정하느냐 = 어느 하모닉이 강하게 잡히느냐. Neck=warm, Bridge=bright.' },
  { id: 'onboard',  label: '본체 EQ',    sub: 'onboard circuit',  detail: '능동/수동 베이스 회로. 패시브는 톤 컷만, 액티브는 부스트도 가능. 미드 노브 유무가 핵심 차이.' },
  { id: 'rig',      label: '시그널 체인', sub: 'comp / od / amp',  detail: '컴프 → 오버드라이브 → 앰프 EQ → 캐비넷 → 마이크. 비선형 단(클리핑)과 선형 단(EQ)이 직렬.' },
]

export function SignalChainDiagram() {
  const [active, setActive] = useState<string>('pickup')
  const current = STAGES.find(s => s.id === active)!

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch overflow-x-auto pb-2">
        <div className="flex items-stretch gap-0 min-w-max">
          {STAGES.map((s, i) => {
            const isActive = s.id === active
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => setActive(s.id)}
                  className="flex flex-col items-center justify-center transition-all px-4 py-3"
                  style={{
                    width: 140,
                    minHeight: 86,
                    borderRadius: 12,
                    background: isActive ? 'rgba(251,188,0,0.12)' : '#141414',
                    border: `1px solid ${isActive ? 'rgba(251,188,0,0.5)' : '#222'}`,
                    boxShadow: isActive ? '0 0 16px rgba(251,188,0,0.25)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div className="font-mono text-[10px]" style={{ color: '#666' }}>
                    [{i + 1}]
                  </div>
                  <div
                    className="font-serif italic mt-1"
                    style={{ color: isActive ? '#fbbc00' : '#ddd', fontSize: 15 }}
                  >
                    {s.label}
                  </div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: '#777' }}>
                    {s.sub}
                  </div>
                </button>
                {i < STAGES.length - 1 && (
                  <div className="flex items-center px-2" style={{ color: '#444' }}>
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                      <path d="M2 7h14m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: '#101010', border: '1px solid rgba(251,188,0,0.15)' }}
      >
        <div className="font-mono text-[10px] mb-1" style={{ color: '#fbbc00' }}>
          STAGE [{STAGES.findIndex(s => s.id === active) + 1}/5] · {current.sub}
        </div>
        <div className="font-serif italic mb-2" style={{ color: '#fbbc00', fontSize: 18 }}>
          {current.label}
        </div>
        <div style={{ color: '#bbb', fontSize: 13, lineHeight: 1.6 }}>
          {current.detail}
        </div>
      </div>
    </div>
  )
}
