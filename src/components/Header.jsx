import { t, isRTL } from '../lib/translations'

export default function Header({
  restaurant, lang, onLangToggle
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'
  const rtl     = isRTL(lang)

  // Cycle label: shows what you'll switch TO
  const toggleLabel = lang === 'ar'
    ? 'EN' : lang === 'en' ? 'FR' : 'ع'

  return (
    <div style={{
      flexShrink:   0,
      background:   '#FFF8F0',
      borderBottom: '1px solid rgba(45,42,38,0.08)',
      direction:    rtl ? 'rtl' : 'ltr',
    }}>
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '12px 16px',
        maxWidth:       448,
        margin:         '0 auto',
      }}>

        {/* Logo + name */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        12,
          direction:  'ltr', // logo always LTR
        }}>
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

          <div style={{
            textAlign: rtl ? 'right' : 'left',
          }}>
            <h1 style={{
              fontFamily:   "'Fraunces', serif",
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
            }}>
              {t('open_now', lang)}
            </p>
          </div>
        </div>

        {/* Language toggle */}
        <button
          onClick={onLangToggle}
          style={{
            fontFamily:   "'JetBrains Mono', monospace",
            fontSize:     12,
            fontWeight:   700,
            padding:      '6px 14px',
            borderRadius: 100,
            border:       '1px solid rgba(45,42,38,0.15)',
            background:   'transparent',
            color:        '#2D2A26',
            cursor:       'pointer',
          }}
        >
          {toggleLabel}
        </button>

      </div>
    </div>
  )
}