// BackToDashboard — fixed top-right link back to 10_Dashboard.
//
// Activation:
//   1. URL `?from=dashboard` → set sessionStorage flag, show link.
//   2. sessionStorage flag persists across in-app nav / refresh.
//
// Target URL is built from the current host so the same kiosk works
// on localhost / LAN / Tailscale (10_Dashboard is always on :8080 of
// the same host).

import { useEffect, useState } from 'react'

const SS_KEY = 'bocchi.from'
const ACTIVE_VALUE = 'dashboard'

export function BackToDashboard() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('from') === ACTIVE_VALUE) {
      try { sessionStorage.setItem(SS_KEY, ACTIVE_VALUE) } catch { /* */ }
      setShow(true)
    } else {
      try {
        if (sessionStorage.getItem(SS_KEY) === ACTIVE_VALUE) setShow(true)
      } catch { /* */ }
    }
  }, [])

  if (!show) return null

  const dashboardHref = `${window.location.protocol}//${window.location.hostname}:8080/`

  const onClick = () => {
    try { sessionStorage.removeItem(SS_KEY) } catch { /* */ }
  }

  return (
    <a
      href={dashboardHref}
      onClick={onClick}
      className="font-mono text-[11px] flex items-center gap-1.5 transition-all"
      style={{
        position: 'fixed',
        top: 14,
        right: 14,
        zIndex: 60,
        background: 'rgba(20, 20, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(251, 188, 0, 0.4)',
        color: '#fbbc00',
        padding: '6px 12px',
        borderRadius: 999,
        textDecoration: 'none',
        boxShadow: '0 4px 18px rgba(0,0,0,0.45), 0 0 12px rgba(251,188,0,0.18)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(251,188,0,0.12)'
        e.currentTarget.style.borderColor = 'rgba(251,188,0,0.7)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(20, 20, 20, 0.85)'
        e.currentTarget.style.borderColor = 'rgba(251, 188, 0, 0.4)'
      }}
      title="10_Dashboard로 돌아가기"
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>←</span>
      <span>Dashboard</span>
    </a>
  )
}
