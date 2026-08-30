import { Clock } from 'lucide-react'
import LangSwitcher from './LangSwitcher'
import { useSession } from '../hooks/useSession'
import { t } from '../lib/translations'
import { pickTranslation } from '../lib/i18n'

export default function Header({
  restaurant, lang, onLangSelect, isDineIn, dineInTable, onHistoryOpen
}) {
  const { isRTL, vendorLanguages } = useSession()
  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'
  const rtl     = isRTL

  // Vendor name now needs to come from the caller
  // via restaurant.translations (attached upstream)
  // if present; fall back to legacy columns.
  const displayName =
    pickTranslation(restaurant?.translations, 'name', lang, vendorLanguages.find(l => l.is_default)?.code)
    || (lang === 'ar' ? restaurant?.name_ar : lang === 'fr' ? restaurant?.name_fr : restaurant?.name)
    || restaurant?.name

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

  const textBlock = (
    <div style={{ textAlign: rtl ? 'right' : 'left', minWidth: 0 }}>
      <h1 style={{
        fontFamily: rtl ? "'Noto Naskh Arabic', serif" : "'Fraunces', serif",
        fontWeight: 700,
        fontSize: rtl ? 24 : 21,
        color: '#1A2530',
        margin: 0,
        lineHeight: 1.15,
        letterSpacing: rtl ? 0 : '-0.01em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {displayName || 'BistroVite'}
      </h1>

      <p style={{
        fontSize: 12.5, fontWeight: 700, color: primary, margin: '4px 0 0',
        display: 'flex', alignItems: 'center', gap: 5,
        justifyContent: rtl ? 'flex-end' : 'flex-start',
        fontFamily: rtl ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
        direction: 'ltr',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: primary, flexShrink: 0, order: rtl ? 2 : 1 }} />
        <span style={{ order: rtl ? 1 : 2, direction: rtl ? 'rtl' : 'ltr' }}>{t('open_now', lang)}</span>
      </p>

      {isDineIn && dineInTable && (
        <p style={{
          fontSize: 11.5, fontWeight: 700, color: '#fff', background: primary,
          borderRadius: 100, padding: '3px 10px', margin: '6px 0 0',
          display: 'inline-flex', width: 'fit-content',
          fontFamily: rtl ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
        }}>
          🪑 {t('dine_in_table', lang)} {dineInTable.table_number}
        </p>
      )}
    </div>
  )

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{
      flexShrink: 0, background: '#FFF8F0', borderBottom: '1px solid rgba(45,42,38,0.08)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px', maxWidth: 448, margin: '0 auto', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          {logoBlock}
          {textBlock}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {onHistoryOpen && restaurant?.show_order_history !== false && (
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
            languages={vendorLanguages}
          />
        </div>
      </div>
    </div>
  )
}