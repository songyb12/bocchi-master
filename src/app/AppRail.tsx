// AppRail — thin left icon rail (kiosk-style nav).
// Replaces the old top Play/Songs/Curriculum header.
// Active item: amber fill + glow. Bottom: vertical BocchiMaster wordmark.

interface RailItem {
  id: 'songs' | 'play' | 'curriculum' | 'learn' | 'session' | 'vocal' | 'routine'
  label: string
  icon: string // SVG path data
}

const ITEMS: RailItem[] = [
  { id: 'songs',      label: 'Practice',   icon: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { id: 'play',       label: 'Drills',     icon: 'M5 3v18l15-9L5 3Z' },
  { id: 'curriculum', label: 'Curriculum', icon: 'M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4Zm0 0v16m0-12h16' },
  { id: 'learn',      label: 'Learn',      icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
  { id: 'session',    label: 'Session',    icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { id: 'vocal',      label: 'Vocal',      icon: 'M12 1a4 4 0 0 1 4 4v8a4 4 0 1 1-8 0V5a4 4 0 0 1 4-4ZM5 11v2a7 7 0 0 0 14 0v-2M12 19v4M8 23h8' },
  { id: 'routine',    label: 'Routine',    icon: 'M9 11l3 3l8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11' },
]

interface Props {
  active: 'songs' | 'play' | 'curriculum' | 'learn' | 'session' | 'vocal' | 'routine' | 'results'
  onSelect: (id: 'songs' | 'play' | 'curriculum' | 'learn' | 'session' | 'vocal' | 'routine') => void
}

export function AppRail({ active, onSelect }: Props) {
  return (
    <nav
      className="flex flex-col items-center justify-between py-4"
      style={{
        width: 64,
        background: '#0e0e0e',
        flexShrink: 0,
      }}
      aria-label="Primary navigation"
    >
      {/* Top: nav icons */}
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <button
                onClick={() => onSelect(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center justify-center transition-all"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: isActive ? 'rgba(251,188,0,0.15)' : 'transparent',
                  color: isActive ? '#fbbc00' : '#666',
                  boxShadow: isActive ? '0 0 12px rgba(251,188,0,0.25), inset 0 0 0 1px rgba(251,188,0,0.4)' : 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#bbb' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#666' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Bottom: vertical BocchiMaster wordmark */}
      <div
        className="font-serif italic"
        style={{
          color: '#5c4300',
          fontSize: 13,
          letterSpacing: '0.15em',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          userSelect: 'none',
        }}
      >
        BocchiMaster
      </div>
    </nav>
  )
}
