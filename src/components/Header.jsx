import { Clock } from 'lucide-react'
import LangSwitcher from './LangSwitcher'
import { t, isRTL } from '../lib/translations'

function getLocalizedVendorName(vendor, lang) {
  if (!vendor) return ''
  if (lang === 'ar') return vendor.name_ar || vendor.name
  if (lang === 'fr') return vendor.name_fr || vendor.name
  return vendor.name
}

export default function Header({
  restaurant, lang, onLangSelect, isDineIn, dineInTable, onHistoryOpen
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'
  const rtl     = isRTL(lang)
  const displayName = getLocalizedVendorName(restaurant, lang)

  // Logo enlarged: 40px → 56px, with a subtle ring
  // border + soft shadow for a premium, finished feel
  const logoBlock = (
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: `${primary}16`,
      border: `1.5px solid ${primary}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28, flexShrink: 0,
      boxShadow: `0 2px 8px ${primary}18`,
    }}>
      {restaurant?.logo_url ? (
        <img src={restaurant.logo_url} alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 15 }} />
      ) : emoji}
    </div>
  )

  // Restaurant name enlarged to match the weight of
  // category section headers (21-25px range), with a
  // status-dot "open now" line and optional dine-in
  // table badge beneath it
  const textBlock = (
    <div style={{ textAlign: rtl ? 'right' : 'left', minWidth: 0 }}>
      <h1 style={{
        fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Fraunces', serif",
        fontWeight: 700,
        fontSize: lang === 'ar' ? 24 : 21,
        color: '#1A2530',
        margin: 0,
        lineHeight: 1.15,
        letterSpacing: lang === 'ar' ? 0 : '-0.01em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {displayName || 'BistroVite'}
      </h1>

      <p style={{
        fontSize: 12.5,
        fontWeight: 700,
        color: primary,
        margin: '4px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        justifyContent: rtl ? 'flex-end' : 'flex-start',
        fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
        direction: 'ltr',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: primary, flexShrink: 0,
          order: rtl ? 2 : 1,
        }} />
        <span style={{ order: rtl ? 1 : 2, direction: rtl ? 'rtl' : 'ltr' }}>
          {t('open_now', lang)}
        </span>
      </p>

      {isDineIn && dineInTable && (
        <p style={{
          fontSize: 11.5, fontWeight: 700, color: '#fff',
          background: primary, borderRadius: 100,
          padding: '3px 10px', margin: '6px 0 0',
          display: 'inline-flex', width: 'fit-content',
          fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
        }}>
          🪑 {t('dine_in_table', lang)} {dineInTable.table_number}
        </p>
      )}
    </div>
  )

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{
      flexShrink: 0, background: '#FFF8F0',
      borderBottom: '1px solid rgba(45,42,38,0.08)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px', maxWidth: 448, margin: '0 auto', gap: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1,
        }}>
          {logoBlock}
          {textBlock}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {onHistoryOpen && (
            <button
              onClick={onHistoryOpen}
              aria-label="Order history"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: `${primary}12`, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Clock size={17} style={{ color: primary }} />
            </button>
          )}

          <LangSwitcher
            lang={lang}
            onSelect={onLangSelect}
            primary={primary}
            allowedLanguages={restaurant?.supported_languages}
          />
        </div>
      </div>
    </div>
  )
}