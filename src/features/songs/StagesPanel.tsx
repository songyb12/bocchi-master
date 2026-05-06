/**
 * StagesPanel — Stage 1~6 toggle UI.
 *
 * PR-2 scope: pure UI + localStorage persistence + summary text.
 * PR-3 will wire each stage's `generator` into Fretboard/TabView.
 *
 * Mounted above ChordTimeline in SongsViewV2. Stays visible whenever a
 * song is selected, regardless of chord-analysis availability.
 */
import { useState, useEffect, useCallback } from 'react'
import { STAGES, STAGE_STORAGE_KEY, getStage, STAGE_TONE_PRESETS, type StageId } from './stages'

const C = {
  surface:  '#1c1b1b',
  amber:    '#fbbc00',
  amberDim: 'rgba(251,188,0,0.12)',
  amberBd:  'rgba(251,188,0,0.3)',
  textPri:  '#f0f0f0',
  textSec:  '#888888',
  textMut:  '#555555',
}

function loadStage(): StageId {
  try {
    const raw = localStorage.getItem(STAGE_STORAGE_KEY)
    if (raw && STAGES.some(s => s.id === raw)) return raw as StageId
  } catch { /* localStorage unavailable */ }
  return 'roots'
}

export function StagesPanel({
  onChange,
}: {
  onChange?: (id: StageId) => void
} = {}) {
  const [activeId, setActiveId] = useState<StageId>(() => loadStage())
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STAGE_STORAGE_KEY, activeId) } catch { /* */ }
    onChange?.(activeId)
  }, [activeId, onChange])

  const handleSelect = useCallback((id: StageId) => {
    setActiveId(id)
  }, [])

  const active = getStage(activeId)
  const difficultyDot = (level: 1 | 2 | 3) =>
    level === 1 ? '●○○' : level === 2 ? '●●○' : '●●●'

  return (
    <div
      className="rounded-2xl"
      style={{
        background: C.surface,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
        padding: '10px 16px',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-mono font-bold" style={{ color: C.amber }}>
          ◆ Stage
        </span>
        <span className="text-[10px] font-mono" style={{ color: C.textMut }}>
          베이스 학습 단계 — 루트→옥타브→5도→아르페지오→통과음→워킹
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setShowHelp(s => !s)}
          className="text-[10px] font-mono px-2 py-1 rounded transition-all"
          style={{
            background: showHelp ? C.amberDim : 'transparent',
            color: showHelp ? C.amber : C.textSec,
            border: `1px solid ${showHelp ? C.amberBd : 'rgba(255,255,255,0.1)'}`,
          }}
          title="Stage 설명 보기"
        >
          {showHelp ? '× Help' : '? Help'}
        </button>
      </div>

      {/* Stage buttons row */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGES.map(s => {
          const isActive = s.id === activeId
          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className="rounded transition-all flex flex-col items-center justify-center"
              style={{
                background: isActive ? C.amber : '#222',
                color: isActive ? '#000' : C.textPri,
                border: isActive ? `1px solid ${C.amber}` : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isActive ? `0 0 12px ${C.amber}80` : 'none',
                fontFamily: 'monospace',
                padding: '8px 14px',
                minWidth: 88,
              }}
              title={s.summary}
            >
              <span style={{
                fontSize: 9,
                opacity: isActive ? 0.8 : 0.5,
                lineHeight: 1,
                color: isActive ? '#000' : C.textMut,
              }}>
                Stage {s.order}
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.2,
                marginTop: 4,
              }}>
                {s.label}
              </span>
              <span style={{
                fontSize: 9,
                opacity: 0.6,
                lineHeight: 1,
                marginTop: 4,
                fontFamily: 'monospace',
                color: isActive ? '#000' : C.textMut,
              }}>
                {difficultyDot(s.difficulty)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active stage summary */}
      <div className="mt-3 text-[11px] font-mono" style={{ color: C.textPri }}>
        <span style={{ color: C.amber, fontWeight: 700 }}>Stage {active.order}.</span>{' '}
        {active.summary}
      </div>

      {/* Optional help panel */}
      {showHelp && (
        <div
          className="mt-3 rounded text-[11px]"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '10px 12px',
            color: C.textSec,
            lineHeight: 1.5,
          }}
        >
          <div style={{ color: C.amber, fontWeight: 700, marginBottom: 4 }}>
            {active.label} (난이도 {difficultyDot(active.difficulty)})
          </div>
          {active.detail}

          {/* Example pattern grid: 4 strings × 4 beats */}
          <div className="mt-3 flex items-start gap-3">
            <div style={{ minWidth: 200 }}>
              <div className="font-mono text-[9px]" style={{ color: C.textMut, marginBottom: 4 }}>
                예시 · {active.examplePattern.chord}
              </div>
              <PatternGrid beats={active.examplePattern.beats} />
            </div>
            <div className="flex-1 text-[10px] font-mono" style={{ color: C.textSec, lineHeight: 1.6 }}>
              {active.examplePattern.note}
            </div>
          </div>

          {/* Stage-specific recommended tone (R15) */}
          <div
            className="mt-3 rounded p-2 text-[10px] font-mono"
            style={{
              background: 'rgba(126,255,139,0.06)',
              border: '1px solid rgba(126,255,139,0.18)',
            }}
          >
            <span style={{ color: '#7eff8b', fontWeight: 700 }}>
              ♪ TONE · {STAGE_TONE_PRESETS[active.id].name}
            </span>
            <span style={{ color: C.textSec, marginLeft: 6 }}>
              {STAGE_TONE_PRESETS[active.id].recipe}
            </span>
          </div>

          <div style={{ marginTop: 8, color: C.textMut, fontSize: 10 }}>
            ※ 자동 가이드 라인 생성은 PR-3에서 추가 예정. 현재는 ChordTimeline의 코드를 보면서 직접 적용.
          </div>
        </div>
      )}
    </div>
  )
}

// PatternGrid — 4 strings (G/D/A/E top→bottom) × 4 beats. fret number or '-'.
function PatternGrid({ beats }: { beats: Array<Array<number | '-'>> }) {
  const STRING_LABELS = ['G', 'D', 'A', 'E']
  const cellW = 32
  const cellH = 18
  return (
    <div style={{ display: 'inline-block' }}>
      {/* Beat labels */}
      <div className="flex" style={{ marginLeft: 14 }}>
        {beats.map((_, i) => (
          <div
            key={i}
            className="font-mono text-[9px] text-center"
            style={{ width: cellW, color: '#fbbc0099' }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      {STRING_LABELS.map((label, sIdx) => (
        <div key={label} className="flex items-center" style={{ height: cellH }}>
          <div
            className="font-mono text-[9px]"
            style={{ width: 14, color: '#666' }}
          >
            {label}
          </div>
          {beats.map((beat, bIdx) => {
            const v = beat[sIdx]
            const hit = v !== '-'
            return (
              <div
                key={bIdx}
                className="flex items-center justify-center font-mono text-[10px]"
                style={{
                  width: cellW,
                  height: cellH,
                  background: hit ? 'rgba(251,188,0,0.2)' : 'transparent',
                  border: hit
                    ? '1px solid rgba(251,188,0,0.6)'
                    : '1px dashed rgba(255,255,255,0.06)',
                  color: hit ? '#fbbc00' : '#444',
                  borderRadius: 3,
                  marginRight: 2,
                  fontWeight: hit ? 700 : 400,
                }}
              >
                {hit ? v : '·'}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
