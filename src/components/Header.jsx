import { useState, useRef, useEffect } from 'react'
import { t, isRTL } from '../lib/translations'

const LANGUAGES = [
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
]

export default function Header({
  restaurant, lang, onLangSelect
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'
  const rtl     = isRTL(lang)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLang = LANGUAGES.find(l => l.code === lang)
    || LANGUAGES[0]

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current
          && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () =>
      document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(code) {
    onLangSelect(code)
    setDropdownOpen(false)
  }

  const logoBlock = (
    <div style={{
      width:          40,
      height:         40,
      borderRadius:   12,
      background:     `${primary}18`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       20,
      flexShrink:     0,
    }}>
      {restaurant?.logo_url ? (
        <img
          src={restaurant.logo_url}
          alt={restaurant.name}
          style={{
            width:        '100%',
            height:       '100%',
            objectFit:    'cover',
            borderRadius: 12,
          }}
        />
      ) : emoji}
    </div>
  )

  const textBlock = (
    <div style={{
      textAlign: rtl ? 'right' : 'left',
    }}>
      <h1 style={{
        fontFamily:   lang === 'ar'
          ? "'Noto Naskh Arabic', serif"
          : "'Fraunces', serif",
        fontWeight:   600,
        fontSize:     14,
        color:        '#1A4D3E',
        margin:       0,
        lineHeight:   1.2,
      }}>
        {restaurant?.name || 'BistroVite'}
      </h1>
      <p style={{
        fontSize:   12,
        fontWeight: 600,
        color:      primary,
        margin:     0,
        marginTop:  2,
        fontFamily: lang === 'ar'
          ? "'Noto Naskh Arabic', serif" : 'inherit',
      }}>
        {t('open_now', lang)}
      </p>
    </div>
  )

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        flexShrink:   0,
        background:   '#FFF8F0',
        borderBottom: '1px solid rgba(45,42,38,0.08)',
      }}
    >
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '12px 16px',
        maxWidth:       448,
        margin:         '0 auto',
        // Plain 'row' — dir="rtl" on the parent
        // already places the first child (logo+name)
        // at the START, which is the RIGHT in RTL.
        // No row-reverse needed — that would
        // double-flip it.
        flexDirection:  'row',
      }}>

        {/* Logo + name group.
            RTL:  [Logo] [Name / Open now]  →  reads
                  right-to-left as Logo, then text,
                  because dir="rtl" makes 'row' start
                  from the right.
            LTR:  [Logo] [Name / Open now] normal. */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           12,
          flexDirection: 'row',
        }}>
          {logoBlock}
          {textBlock}
        </div>

        {/* Language dropdown — always at the END
            of the row: right in LTR, left in RTL,
            purely from dir + justify-content:
            space-between. No manual flipping. */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      12,
              fontWeight:    700,
              padding:       '6px 12px',
              borderRadius:  100,
              border:        '1px solid rgba(45,42,38,0.15)',
              background:    dropdownOpen
                ? 'rgba(45,42,38,0.05)' : 'transparent',
              color:         '#2D2A26',
              cursor:        'pointer',
              display:       'flex',
              alignItems:    'center',
              gap:           6,
            }}
          >
            <span>{currentLang.short}</span>
            <span style={{
              fontSize:  9,
              transform: dropdownOpen
                ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
              opacity:   0.6,
            }}>
              ▼
            </span>
          </button>

          {dropdownOpen && (
            <div style={{
              position:     'absolute',
              top:          'calc(100% + 6px)',
              // Dropdown panel hugs the same side
              // the button visually sits on:
              // right in LTR, left in RTL.
              [rtl ? 'left' : 'right']: 0,
              background:   'white',
              borderRadius: 14,
              boxShadow:    '0 8px 28px rgba(45,42,38,0.15)',
              border:       '1px solid rgba(45,42,38,0.06)',
              overflow:     'hidden',
              minWidth:     140,
              zIndex:       50,
            }}>
              {LANGUAGES.map(l => {
                const active   = l.code === lang
                const itemRtl  = isRTL(l.code)
                return (
                  <button
                    key={l.code}
                    onClick={() => handleSelect(l.code)}
                    dir={itemRtl ? 'rtl' : 'ltr'}
                    style={{
                      width:          '100%',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      padding:        '10px 14px',
                      border:         'none',
                      background:     active
                        ? `${primary}10` : 'white',
                      cursor:         'pointer',
                      fontSize:       13,
                      fontWeight:     active ? 700 : 500,
                      color:          active ? primary : '#2D2A26',
                      fontFamily:     l.code === 'ar'
                        ? "'Noto Naskh Arabic', serif" : 'inherit',
                    }}
                  >
                    <span>{l.label}</span>
                    {active && (
                      <span style={{ color: primary }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}