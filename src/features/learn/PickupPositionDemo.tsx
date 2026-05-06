// PickupPositionDemo — bass body SVG with pickup position toggle.
// Hover/click pickup to see tone description.

import { useState } from 'react'

type Selection = 'neck' | 'both' | 'bridge'

interface PickupInfo {
  name: string
  tone: string
  reason: string
  examples: string
}

const INFO: Record<Selection, PickupInfo> = {
  neck: {
    name: 'Neck Pickup',
    tone: 'fat, warm, full',
    reason: '현 진폭이 최대인 지점 → 기본 주파수(fundamental) 강하게 잡힘. 고차 하모닉 비중 낮음.',
    examples: 'P-Bass 단일 픽업, J-Bass의 앞쪽 픽업',
  },
  both: {
    name: 'Both Blended',
    tone: 'mid-scooped, complex',
    reason: '두 픽업 사이의 위상 간섭으로 중역 일부가 상쇄됨. Jazz Bass 시그니처 사운드의 정체.',
    examples: 'J-Bass 두 픽업 동량 — Marcus Miller, Geddy Lee',
  },
  bridge: {
    name: 'Bridge Pickup',
    tone: 'bright, thin, punchy',
    reason: '진폭 작지만 고차 하모닉이 상대적으로 강함 → growl + 어택감.',
    examples: 'J-Bass 뒤쪽 픽업, 슬랩/펑크 톤의 핵심',
  },
}

export function PickupPositionDemo() {
  const [sel, setSel] = useState<Selection>('both')
  const info = INFO[sel]

  const neckActive = sel === 'neck' || sel === 'both'
  const bridgeActive = sel === 'bridge' || sel === 'both'

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(300px, 1fr) minmax(220px, 1fr)' }}>
      {/* Bass body SVG */}
      <div
        className="rounded-lg p-4 flex flex-col gap-3"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        <div className="font-mono text-[10px]" style={{ color: '#666' }}>
          jazz bass body · top-down
        </div>

        <svg viewBox="0 0 400 140" width="100%" style={{ height: 140 }}>
          {/* Body silhouette (simplified J-Bass) */}
          <path
            d="M 30 70 Q 30 30 70 25 L 280 25 Q 350 25 360 50 Q 370 70 360 90 Q 350 115 280 115 L 70 115 Q 30 110 30 70 Z"
            fill="#1a1410"
            stroke="#3a2a14"
            strokeWidth={1}
          />
          {/* Strings (4) */}
          {[58, 66, 74, 82].map(y => (
            <line key={y} x1={20} y1={y} x2={380} y2={y} stroke="#444" strokeWidth={0.6} />
          ))}
          {/* Neck pickup */}
          <g
            onClick={() => setSel('neck')}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={140} y={48} width={50} height={44} rx={2}
              fill={neckActive ? '#fbbc00' : '#222'}
              stroke={neckActive ? '#fbbc00' : '#444'}
              strokeWidth={1.5}
              opacity={neckActive ? 0.85 : 1}
            />
            <text x={165} y={104} textAnchor="middle" fontSize={9} fontFamily="monospace" fill={neckActive ? '#fbbc00' : '#666'}>
              NECK
            </text>
            {neckActive && (
              <circle cx={165} cy={70} r={28} fill="none" stroke="#fbbc00" strokeWidth={0.8} opacity={0.4}>
                <animate attributeName="r" values="22;30;22" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
          {/* Bridge pickup */}
          <g
            onClick={() => setSel('bridge')}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={250} y={48} width={50} height={44} rx={2}
              fill={bridgeActive ? '#fbbc00' : '#222'}
              stroke={bridgeActive ? '#fbbc00' : '#444'}
              strokeWidth={1.5}
              opacity={bridgeActive ? 0.85 : 1}
            />
            <text x={275} y={104} textAnchor="middle" fontSize={9} fontFamily="monospace" fill={bridgeActive ? '#fbbc00' : '#666'}>
              BRIDGE
            </text>
            {bridgeActive && (
              <circle cx={275} cy={70} r={28} fill="none" stroke="#fbbc00" strokeWidth={0.8} opacity={0.4}>
                <animate attributeName="r" values="22;30;22" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
          {/* Bridge hardware */}
          <rect x={340} y={55} width={14} height={30} rx={1} fill="#3a3a3a" />
          {/* Neck pocket */}
          <rect x={5} y={62} width={28} height={16} fill="#2a1a08" />
        </svg>

        {/* Selector buttons */}
        <div className="flex gap-2 mt-1">
          {(['neck', 'both', 'bridge'] as const).map(opt => {
            const isActive = sel === opt
            return (
              <button
                key={opt}
                onClick={() => setSel(opt)}
                className="flex-1 py-2 rounded-md text-xs font-mono transition-all capitalize"
                style={{
                  background: isActive ? 'rgba(251,188,0,0.15)' : '#141414',
                  color: isActive ? '#fbbc00' : '#888',
                  border: `1px solid ${isActive ? 'rgba(251,188,0,0.5)' : '#222'}`,
                  cursor: 'pointer',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Description card */}
      <div
        className="rounded-lg p-4 flex flex-col gap-3"
        style={{ background: '#101010', border: '1px solid rgba(251,188,0,0.15)' }}
      >
        <div>
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            PICKUP · {sel.toUpperCase()}
          </div>
          <div className="font-serif italic mt-1" style={{ color: '#fbbc00', fontSize: 18 }}>
            {info.name}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] mb-1" style={{ color: '#666' }}>TONE</div>
          <div style={{ color: '#ddd', fontSize: 13 }}>{info.tone}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] mb-1" style={{ color: '#666' }}>WHY</div>
          <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5 }}>{info.reason}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] mb-1" style={{ color: '#666' }}>EXAMPLES</div>
          <div style={{ color: '#bbb', fontSize: 12 }}>{info.examples}</div>
        </div>
      </div>
    </div>
  )
}
