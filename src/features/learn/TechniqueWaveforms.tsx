// TechniqueWaveforms — playing technique with input waveform visualization.
// Click a technique to render its time-domain signal shape.

import { useState } from 'react'

interface Tech {
  id: string
  label: string
  ko: string
  attack: string
  tone: string
  genres: string
  // waveform: array of (t, amp) sample points 0..1, 0..1
  wave: Array<[number, number]>
}

// Generate sample waveforms (0..1 time, -1..1 amplitude approximated to 0..1 centered at 0.5)
function gen(samples: number, fn: (t: number) => number): Array<[number, number]> {
  const arr: Array<[number, number]> = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    arr.push([t, 0.5 + 0.45 * fn(t)])
  }
  return arr
}

const TECHS: Tech[] = [
  {
    id: 'finger',
    label: 'Fingerstyle',
    ko: '핑거스타일',
    attack: '부드러운 라운드 어택',
    tone: 'warm, round',
    genres: '록, 팝, 재즈 일반',
    wave: gen(120, t => {
      // Gaussian-attack damped sinusoid
      const env = Math.exp(-Math.pow((t - 0.1) * 6, 2)) + Math.exp(-(t - 0.1) * 2.5) * 0.7
      return Math.sin(t * Math.PI * 2 * 8) * env
    }),
  },
  {
    id: 'pick',
    label: 'Pick',
    ko: '피크',
    attack: '날카로운 트랜지언트',
    tone: 'aggressive, percussive, bright',
    genres: '펑크록, 메탈, 모타운',
    wave: gen(120, t => {
      // Near-impulse + decaying high freq
      const env = t < 0.05 ? Math.exp(-t * 40) * 1.2 : Math.exp(-(t - 0.05) * 3) * 0.8
      return Math.sin(t * Math.PI * 2 * 14) * env
    }),
  },
  {
    id: 'slap',
    label: 'Slap',
    ko: '슬랩',
    attack: '"딱" + 저역 펀치',
    tone: '저역 펀치 + 고역 어택 동시',
    genres: '펑크(funk), 퓨전',
    wave: gen(120, t => {
      // Hard impulse + mid clipping + decay
      if (t < 0.04) return Math.sin(t * Math.PI * 2 * 18) * 1.0
      const env = Math.exp(-(t - 0.04) * 4)
      const sig = Math.sin(t * Math.PI * 2 * 6) * env
      return Math.tanh(sig * 1.6) * 0.9
    }),
  },
  {
    id: 'pop',
    label: 'Pop',
    ko: '팝',
    attack: '고역 스파이크',
    tone: '메탈릭, 피크보다 강한 트랜지언트',
    genres: '슬랩과 세트',
    wave: gen(120, t => {
      // Even sharper impulse, brighter
      if (t < 0.03) return Math.sin(t * Math.PI * 2 * 22) * 1.1
      const env = Math.exp(-(t - 0.03) * 5)
      return Math.sin(t * Math.PI * 2 * 10) * env * 0.6
    }),
  },
  {
    id: 'palm',
    label: 'Palm Mute',
    ko: '팜뮤트',
    attack: '어택 후 즉시 감쇠',
    tone: 'thump, 짧은 sustain',
    genres: '펑크록, 컨트리',
    wave: gen(120, t => {
      // Impulse + very short decay
      const env = Math.exp(-t * 12)
      return Math.sin(t * Math.PI * 2 * 7) * env
    }),
  },
  {
    id: 'tap',
    label: 'Tapping',
    ko: '태핑',
    attack: '클린 해머온',
    tone: '클린 + 노이즈 적음',
    genres: '프로그/퓨전',
    wave: gen(120, t => {
      // Clean exponential decay sinusoid, low noise
      const env = Math.exp(-t * 1.8)
      return Math.sin(t * Math.PI * 2 * 9) * env
    }),
  },
]

export function TechniqueWaveforms() {
  const [active, setActive] = useState<string>('finger')
  const current = TECHS.find(t => t.id === active)!

  // Render waveform as SVG polyline
  const W = 600
  const H = 140
  const points = current.wave.map(([t, a]) => `${t * W},${(1 - a) * H}`).join(' ')
  // Mirror line for visual symmetry (centered axis)
  const pointsMirror = current.wave.map(([t, a]) => `${t * W},${(1 - (1 - a)) * H}`).join(' ')

  return (
    <div className="flex flex-col gap-4">
      {/* Technique selector */}
      <div className="flex gap-2 flex-wrap">
        {TECHS.map(t => {
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="px-3 py-1.5 rounded-md text-xs font-mono transition-all"
              style={{
                background: isActive ? 'rgba(251,188,0,0.15)' : '#141414',
                color: isActive ? '#fbbc00' : '#888',
                border: `1px solid ${isActive ? 'rgba(251,188,0,0.5)' : '#222'}`,
                cursor: 'pointer',
              }}
            >
              {t.label} <span style={{ color: isActive ? '#fbbc00aa' : '#555' }}>{t.ko}</span>
            </button>
          )
        })}
      </div>

      {/* Waveform display */}
      <div
        className="rounded-lg p-4"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-serif italic" style={{ color: '#fbbc00', fontSize: 20 }}>
            {current.label}
          </div>
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            input waveform · time domain
          </div>
        </div>

        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 140 }}>
          {/* Center axis */}
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#222" strokeWidth={1} strokeDasharray="3,3" />
          {/* Grid */}
          {[0.25, 0.5, 0.75].map(g => (
            <line key={g} x1={g * W} y1={0} x2={g * W} y2={H} stroke="#1a1a1a" strokeWidth={1} />
          ))}
          {/* Waveform */}
          <polyline
            points={points}
            fill="none"
            stroke="#fbbc00"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <polyline
            points={pointsMirror}
            fill="none"
            stroke="#fbbc0033"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <Field label="ATTACK" value={current.attack} />
          <Field label="TONE" value={current.tone} />
          <Field label="GENRES" value={current.genres} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] mb-1" style={{ color: '#666' }}>
        {label}
      </div>
      <div style={{ color: '#ddd', fontSize: 12 }}>{value}</div>
    </div>
  )
}
