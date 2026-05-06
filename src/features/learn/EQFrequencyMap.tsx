// EQFrequencyMap — log-scale frequency axis with 8 bands.
// Click a band to see boost/cut effect.

import { useState } from 'react'

interface Band {
  id: string
  label: string
  range: string
  fLow: number
  fHigh: number
  role: string
  boost: string
  cut: string
  color: string
  warn?: boolean
}

const BANDS: Band[] = [
  { id: 'sub',     label: '서브 럼블',  range: '20–40 Hz',     fLow: 20,   fHigh: 40,    role: '거의 안 들리는 진동', boost: '진동(잘 안 들림)',         cut: '깔끔. 보통 HPF 권장',     color: '#3b2a1a' },
  { id: 'fund',    label: '펀더멘털',  range: '40–80 Hz',     fLow: 40,   fHigh: 80,    role: 'E현 41Hz, B현 31Hz',  boost: '무겁고 깊음',              cut: '가벼움. 킥드럼 자리 양보',  color: '#5a3814' },
  { id: 'body',    label: '바디',      range: '80–200 Hz',    fLow: 80,   fHigh: 200,   role: '풀니스, 두께',         boost: '두툼함. 솔리드',           cut: '빈약',                     color: '#7a4818' },
  { id: 'mud',     label: '머디',      range: '200–300 Hz',   fLow: 200,  fHigh: 300,   role: '주의 영역',            boost: '답답, 박스 사운드',       cut: '명료해짐 (보통 -3dB)',     color: '#8a3a2a', warn: true },
  { id: 'punch',   label: '펀치',      range: '500–1k Hz',    fLow: 500,  fHigh: 1000,  role: '그라인드, 어택감',     boost: 'growl, 어택 강조',        cut: '부드러워짐',               color: '#a86420' },
  { id: 'edge',    label: '엣지',      range: '2 kHz',        fLow: 1500, fHigh: 2500,  role: '클랭크',              boost: '메탈릭 "딱딱"',            cut: '둥글어짐',                 color: '#c08028' },
  { id: 'pres',    label: '프레즌스',  range: '4–6 kHz',      fLow: 4000, fHigh: 6000,  role: '손가락 디테일',         boost: '존재감 살아남',            cut: '멀어짐',                   color: '#d8a030' },
  { id: 'sizzle',  label: '시즐',      range: '6 kHz↑',       fLow: 6000, fHigh: 12000, role: '슬랩 sizzle',          boost: '슬랩 필수',                cut: '클린',                     color: '#fbbc00' },
]

const F_MIN = 20
const F_MAX = 12000

function fToX(f: number) {
  // Log scale 20Hz..12kHz -> 0..100%
  return (Math.log(f) - Math.log(F_MIN)) / (Math.log(F_MAX) - Math.log(F_MIN)) * 100
}

const TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

export function EQFrequencyMap() {
  const [sel, setSel] = useState<string>('mud')
  const current = BANDS.find(b => b.id === sel)!

  return (
    <div className="flex flex-col gap-4">
      {/* Frequency bar */}
      <div
        className="rounded-lg p-4"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            FREQUENCY · log scale · 20Hz – 12kHz
          </div>
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            click band to inspect
          </div>
        </div>

        {/* Band visualization */}
        <div className="relative" style={{ height: 64 }}>
          {BANDS.map(b => {
            const x = fToX(b.fLow)
            const w = fToX(b.fHigh) - fToX(b.fLow)
            const isActive = b.id === sel
            return (
              <button
                key={b.id}
                onClick={() => setSel(b.id)}
                className="absolute transition-all"
                style={{
                  left: `${x}%`,
                  width: `${w}%`,
                  top: 0,
                  height: 56,
                  background: isActive ? b.color : `${b.color}88`,
                  border: `1px solid ${isActive ? '#fbbc00' : '#222'}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 0 12px rgba(251,188,0,0.4)' : 'none',
                  padding: 4,
                  textAlign: 'left',
                }}
              >
                <div className="font-mono text-[9px]" style={{ color: '#fff' }}>
                  {b.label}
                </div>
                <div className="font-mono text-[8px]" style={{ color: '#fffa' }}>
                  {b.range}
                </div>
                {b.warn && (
                  <div style={{ position: 'absolute', top: 2, right: 4, color: '#ff7575', fontSize: 10 }}>
                    !
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Frequency axis ticks */}
        <div className="relative mt-2" style={{ height: 16 }}>
          {TICKS.map(f => (
            <div
              key={f}
              className="font-mono text-[9px] absolute"
              style={{
                left: `${fToX(f)}%`,
                color: '#555',
                transform: 'translateX(-50%)',
              }}
            >
              {f >= 1000 ? `${f / 1000}k` : f}
            </div>
          ))}
        </div>
      </div>

      {/* Selected band detail */}
      <div
        className="rounded-lg p-4 grid gap-4"
        style={{
          background: '#101010',
          border: `1px solid ${current.warn ? 'rgba(255,117,117,0.3)' : 'rgba(251,188,0,0.15)'}`,
          gridTemplateColumns: 'minmax(180px, 1fr) 1fr 1fr',
        }}
      >
        <div>
          <div className="font-mono text-[10px]" style={{ color: current.warn ? '#ff7575' : '#fbbc00' }}>
            BAND · {current.range}
          </div>
          <div className="font-serif italic mt-1" style={{ color: current.warn ? '#ff7575' : '#fbbc00', fontSize: 18 }}>
            {current.label}
          </div>
          <div className="font-mono text-[10px] mt-2" style={{ color: '#888' }}>
            ROLE · {current.role}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span style={{ color: '#7eff8b', fontSize: 14 }}>▲</span>
            <span className="font-mono text-[10px]" style={{ color: '#7eff8b' }}>BOOST</span>
          </div>
          <div style={{ color: '#ddd', fontSize: 12 }}>{current.boost}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span style={{ color: '#ff7575', fontSize: 14 }}>▼</span>
            <span className="font-mono text-[10px]" style={{ color: '#ff7575' }}>CUT</span>
          </div>
          <div style={{ color: '#ddd', fontSize: 12 }}>{current.cut}</div>
        </div>
      </div>

      {/* Starter EQ template */}
      <div
        className="rounded-lg p-3"
        style={{ background: '#0a0a0a', border: '1px dashed #2a2a2a' }}
      >
        <div className="font-mono text-[10px] mb-2" style={{ color: '#fbbc00' }}>
          STARTER TEMPLATE
        </div>
        <div className="flex gap-3 flex-wrap font-mono text-[11px]" style={{ color: '#bbb' }}>
          <span>100Hz <span style={{ color: '#7eff8b' }}>+2~3dB</span></span>
          <span>· 300Hz <span style={{ color: '#ff7575' }}>-3dB</span></span>
          <span>· 800Hz <span style={{ color: '#7eff8b' }}>+1dB</span></span>
          <span>· 4–6kHz <span style={{ color: '#7eff8b' }}>+2dB</span></span>
          <span>· 7kHz↑ <span style={{ color: '#888' }}>roll-off</span></span>
        </div>
      </div>
    </div>
  )
}
