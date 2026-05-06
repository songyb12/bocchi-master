// ClippingComparison — overdrive / distortion / fuzz waveform comparison.
// Shows how nonlinear stages reshape the input sine wave.

import { useState } from 'react'

type FxId = 'clean' | 'overdrive' | 'distortion' | 'fuzz'

interface Fx {
  id: FxId
  label: string
  ko: string
  desc: string
  example: string
  // amplitude shaping function: input signal -1..1 -> output -1..1
  shape: (x: number) => number
}

const FXS: Fx[] = [
  { id: 'clean',      label: 'Clean',      ko: '클린',      desc: '입력 그대로. 선형 게인.',           example: '재즈, 모타운',         shape: x => x },
  { id: 'overdrive',  label: 'Overdrive',  ko: '오버드라이브', desc: 'soft clip (tanh). 짝수+홀수 하모닉.', example: 'SansAmp, 록 90%',   shape: x => Math.tanh(x * 2.5) },
  { id: 'distortion', label: 'Distortion', ko: '디스토션',  desc: '강한 hard clip. 홀수 하모닉 위주.', example: '메탈, 펑크',           shape: x => Math.max(-0.7, Math.min(0.7, x * 2.5)) / 0.7 },
  { id: 'fuzz',       label: 'Fuzz',       ko: '퍼즈',     desc: '거의 사각파. 매우 거칠음.',         example: 'Big Muff, Royal Blood', shape: x => Math.tanh(x * 12) },
]

export function ClippingComparison() {
  const [active, setActive] = useState<FxId>('overdrive')
  const fx = FXS.find(f => f.id === active)!

  // Generate input sine + output shaped wave
  const W = 600
  const H = 120
  const samples = 200
  const inputPts: string[] = []
  const outputPts: string[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const x = Math.sin(t * Math.PI * 2 * 3)
    const y = fx.shape(x)
    inputPts.push(`${t * W},${(1 - (0.5 + 0.4 * x)) * H}`)
    outputPts.push(`${t * W},${(1 - (0.5 + 0.4 * y)) * H}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* FX selector */}
      <div className="flex gap-2 flex-wrap">
        {FXS.map(f => {
          const isActive = f.id === active
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className="px-3 py-1.5 rounded-md text-xs font-mono transition-all"
              style={{
                background: isActive ? 'rgba(251,188,0,0.15)' : '#141414',
                color: isActive ? '#fbbc00' : '#888',
                border: `1px solid ${isActive ? 'rgba(251,188,0,0.5)' : '#222'}`,
                cursor: 'pointer',
              }}
            >
              {f.label} <span style={{ color: isActive ? '#fbbc00aa' : '#555' }}>{f.ko}</span>
            </button>
          )
        })}
      </div>

      {/* Waveform comparison */}
      <div
        className="rounded-lg p-4"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-serif italic" style={{ color: '#fbbc00', fontSize: 18 }}>
            {fx.label}
          </div>
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            input → output · time domain
          </div>
        </div>

        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 120 }}>
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#222" strokeWidth={1} strokeDasharray="3,3" />
          <polyline
            points={inputPts.join(' ')}
            fill="none"
            stroke="#555"
            strokeWidth={1}
            strokeDasharray="2,3"
          />
          <polyline
            points={outputPts.join(' ')}
            fill="none"
            stroke="#fbbc00"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </svg>

        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
          <span style={{ color: '#555' }}>--- input sine</span>
          <span style={{ color: '#fbbc00' }}>━ output (shaped)</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <div className="font-mono text-[10px] mb-1" style={{ color: '#666' }}>SHAPE</div>
            <div style={{ color: '#ddd', fontSize: 12 }}>{fx.desc}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] mb-1" style={{ color: '#666' }}>EXAMPLES</div>
            <div style={{ color: '#ddd', fontSize: 12 }}>{fx.example}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
