// BreathingDiagram — 흉식 vs 복식 호흡 비교 SVG.
// 사용자가 토글하면 두 자세의 차이를 보여줌.

import { useState } from 'react'

type Mode = 'chest' | 'diaphragm'

export function BreathingDiagram() {
  const [mode, setMode] = useState<Mode>('diaphragm')
  const isDia = mode === 'diaphragm'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('chest')}
          className="px-3 py-1.5 rounded-md font-mono text-[10px] transition-all"
          style={{
            background: !isDia ? 'rgba(255,117,117,0.18)' : '#141414',
            color: !isDia ? '#ff7575' : '#888',
            border: `1px solid ${!isDia ? 'rgba(255,117,117,0.5)' : '#222'}`,
            cursor: 'pointer',
          }}
        >
          Chest (흉식 — 잘못된 호흡)
        </button>
        <button
          onClick={() => setMode('diaphragm')}
          className="px-3 py-1.5 rounded-md font-mono text-[10px] transition-all"
          style={{
            background: isDia ? 'rgba(126,255,139,0.18)' : '#141414',
            color: isDia ? '#7eff8b' : '#888',
            border: `1px solid ${isDia ? 'rgba(126,255,139,0.5)' : '#222'}`,
            cursor: 'pointer',
          }}
        >
          Diaphragm (복식 — 올바른 호흡)
        </button>
      </div>

      <div
        className="rounded-lg p-4 grid gap-4"
        style={{
          background: '#0d0d0d',
          border: '1px solid #1c1c1c',
          gridTemplateColumns: 'minmax(220px, 1fr) 1fr',
        }}
      >
        <svg viewBox="0 0 200 280" width="100%" style={{ height: 280 }}>
          {/* Body silhouette */}
          <path
            d="M 80 30 Q 80 15 100 15 Q 120 15 120 30 L 120 50 Q 145 55 150 80 L 150 180 Q 145 200 130 220 L 130 270 L 70 270 L 70 220 Q 55 200 50 180 L 50 80 Q 55 55 80 50 Z"
            fill="#1a1a1a"
            stroke="#333"
            strokeWidth={1.2}
          />
          {/* Chest area */}
          <ellipse
            cx={100}
            cy={110}
            rx={isDia ? 30 : 38}
            ry={isDia ? 24 : 30}
            fill={!isDia ? 'rgba(255,117,117,0.3)' : 'rgba(255,255,255,0.04)'}
            stroke={!isDia ? '#ff7575' : '#444'}
            strokeWidth={1.5}
          >
            {!isDia && (
              <animate attributeName="ry" values="28;32;28" dur="2.5s" repeatCount="indefinite" />
            )}
          </ellipse>
          {/* Diaphragm line */}
          <line
            x1={55}
            y1={isDia ? 175 : 155}
            x2={145}
            y2={isDia ? 175 : 155}
            stroke={isDia ? '#7eff8b' : '#666'}
            strokeWidth={1.5}
            strokeDasharray="4,2"
          >
            {isDia && (
              <animate attributeName="y1" values="170;180;170" dur="3s" repeatCount="indefinite" />
            )}
          </line>
          {/* Belly area */}
          <ellipse
            cx={100}
            cy={195}
            rx={isDia ? 38 : 28}
            ry={isDia ? 28 : 22}
            fill={isDia ? 'rgba(126,255,139,0.3)' : 'rgba(255,255,255,0.04)'}
            stroke={isDia ? '#7eff8b' : '#444'}
            strokeWidth={1.5}
          >
            {isDia && (
              <animate attributeName="rx" values="34;42;34" dur="3s" repeatCount="indefinite" />
            )}
          </ellipse>
          {/* Shoulders */}
          <line
            x1={50}
            y1={isDia ? 65 : 50}
            x2={150}
            y2={isDia ? 65 : 50}
            stroke={!isDia ? '#ff7575' : '#7eff8b88'}
            strokeWidth={2}
          />
          {/* Labels */}
          <text x={100} y={110} fontSize={9} textAnchor="middle" fill={!isDia ? '#ff7575' : '#666'} fontFamily="monospace">
            CHEST
          </text>
          <text x={100} y={195} fontSize={9} textAnchor="middle" fill={isDia ? '#7eff8b' : '#666'} fontFamily="monospace">
            BELLY
          </text>
        </svg>

        <div className="flex flex-col gap-2">
          <div className="font-serif italic" style={{ color: isDia ? '#7eff8b' : '#ff7575', fontSize: 18 }}>
            {isDia ? '복식 (Diaphragmatic)' : '흉식 (Chest / Clavicular)'}
          </div>
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5" style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5 }}>
            {isDia ? (
              <>
                <li><span style={{ color: '#7eff8b66' }}>▸</span> 들이쉴 때 <strong style={{ color: '#fff' }}>배가 앞으로 나옴</strong>, 어깨 안 올라감</li>
                <li><span style={{ color: '#7eff8b66' }}>▸</span> 횡격막이 아래로 내려가며 폐 아래쪽까지 공기 채움</li>
                <li><span style={{ color: '#7eff8b66' }}>▸</span> 음량/지속/표현력 모두 향상 — 가창의 기본</li>
                <li><span style={{ color: '#7eff8b66' }}>▸</span> 누워서 책을 배 위에 올리고 호흡 연습 (책이 위아래)</li>
              </>
            ) : (
              <>
                <li><span style={{ color: '#ff757566' }}>▸</span> <strong style={{ color: '#fff' }}>어깨 / 가슴이 위로</strong> 올라감 (잘못)</li>
                <li><span style={{ color: '#ff757566' }}>▸</span> 폐 윗부분만 사용 → 짧고 얕은 호흡</li>
                <li><span style={{ color: '#ff757566' }}>▸</span> 목/어깨 긴장 → 음정 떨림 + 빠른 피로</li>
                <li><span style={{ color: '#ff757566' }}>▸</span> 일상 호흡엔 OK, 가창엔 부족</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
