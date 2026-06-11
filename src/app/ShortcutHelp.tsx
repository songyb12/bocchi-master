/**
 * ShortcutHelp — floating '?' button + overlay listing the play/songs-view
 * keyboard shortcuts. They were entirely undiscoverable before (no UI hint
 * anywhere), including the two-click measure loop in the B-mode tab.
 *
 * Toggle: button click or Shift+/ ('?'). Esc closes — captured with
 * stopImmediatePropagation so it doesn't reach the app-level Esc=stop
 * handler while the overlay is open. Ignores keystrokes inside inputs.
 */

import { useEffect, useState } from 'react'

const SHORTCUTS: Array<[string, string]> = [
  ['Space', '재생 / 일시정지'],
  ['↑ / ↓', 'BPM +5 / −5'],
  ['M', '탭 모드 전환 (B 커서 ↔ A 스크롤)'],
  ['R', '처음부터 다시 재생'],
  ['L', '루프 해제'],
  ['Esc', '정지'],
  ['마디 2클릭', 'B 모드 탭보에서 구간 루프 설정 — 루프 중 마디 클릭 = 해제'],
  ['?', '이 도움말 열기 / 닫기'],
]

function isTypingTarget(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement | null)?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function ShortcutHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e)) return
      if (e.key === '?') {
        e.preventDefault()
        setOpen(o => !o)
        return
      }
      if (open && e.code === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="키보드 단축키 도움말"
        title="키보드 단축키 (?)"
        className="transition-all"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: open ? 'rgba(251,188,0,0.2)' : '#161616',
          color: open ? '#fbbc00' : '#777',
          border: `1px solid ${open ? 'rgba(251,188,0,0.5)' : '#2a2a2a'}`,
          fontFamily: 'monospace',
          fontSize: 18,
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 40,
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.color = '#fbbc00' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = '#777' }}
      >
        ?
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 41,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl"
            style={{
              width: 440,
              maxWidth: '90vw',
              background: '#161616',
              border: '1px solid rgba(251,188,0,0.3)',
              boxShadow: '0 0 32px rgba(0,0,0,0.7)',
              padding: '20px 24px',
            }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <span className="font-serif italic" style={{ color: '#fbbc00', fontSize: 20 }}>
                Keyboard Shortcuts
              </span>
              <span className="font-mono text-[10px]" style={{ color: '#666' }}>
                Play · Songs 뷰
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="flex items-center gap-3">
                  <span
                    className="font-mono text-[11px] px-2 py-1 rounded text-center"
                    style={{
                      minWidth: 86,
                      background: '#222',
                      color: '#fbbc00',
                      boxShadow: 'inset 0 1px 0 #3a3a3a, inset 0 -1px 0 #111',
                      flexShrink: 0,
                    }}
                  >
                    {key}
                  </span>
                  <span style={{ color: '#ccc', fontSize: 13, lineHeight: 1.4 }}>{desc}</span>
                </div>
              ))}
            </div>
            <div className="font-mono text-[10px] mt-4" style={{ color: '#555' }}>
              Stage Mode는 화면 하단에 자체 키맵 표시 · Esc로 닫기
            </div>
          </div>
        </div>
      )}
    </>
  )
}
