import { useState, useRef, useEffect } from 'react'

export default function LangSwitcher({
  lang, onSelect, primary = '#1A4D3E', languages = []
}) {
  const currentLangObj = languages.find(l => l.code === lang)
  const rtl    = !!currentLangObj?.is_rtl
  const isDark = primary === '#FFFFFF' || primary === 'white'
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Nothing to switch between — a vendor with
  // exactly one enabled language shows no dropdown
  if (!languages || languages.length <= 1) return null

  // Short label: first 2 letters of the native
  // name, uppercased, e.g. "EN", "FR", "AR", "ES"
  function shortLabel(l) {
    return (l.code || '').slice(0, 2).toUpperCase()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
          padding: '6px 12px', borderRadius: 100,
          border: isDark ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(45,42,38,0.15)',
          background: isDark
            ? (open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)')
            : (open ? 'rgba(45,42,38,0.05)' : 'transparent'),
          color: isDark ? 'white' : '#2D2A26',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span>{currentLangObj ? shortLabel(currentLangObj) : lang.toUpperCase()}</span>
        <span style={{
          fontSize: 9, transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s', opacity: 0.7,
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          [rtl ? 'left' : 'right']: 0,
          background: 'white', borderRadius: 14,
          boxShadow: '0 8px 28px rgba(45,42,38,0.15)',
          border: '1px solid rgba(45,42,38,0.06)',
          overflow: 'hidden', minWidth: 150, maxHeight: 280, overflowY: 'auto', zIndex: 50,
        }}>
          {languages.map(l => {
            const active   = l.code === lang
            const itemRtl  = !!l.is_rtl
            return (
              <button
                key={l.code}
                onClick={() => { onSelect(l.code); setOpen(false) }}
                dir={itemRtl ? 'rtl' : 'ltr'}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', border: 'none',
                  background: active ? `${isDark ? '#1A4D3E' : primary}10` : 'white',
                  cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? (isDark ? '#1A4D3E' : primary) : '#2D2A26',
                  fontFamily: itemRtl ? "'Noto Naskh Arabic', serif" : 'inherit',
                }}
              >
                <span>{l.native_name}</span>
                {active && <span style={{ color: isDark ? '#1A4D3E' : primary }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}