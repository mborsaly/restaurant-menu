import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { supabase }        from '../lib/supabase'
import { t }                from '../lib/translations'
import { pickTranslation }  from '../lib/i18n'
import { formatPrice }      from '../lib/currency'
import SheetCloseButton     from './SheetCloseButton'

const STATUS_LABELS = {
  pending:   { en: 'Received',  fr: 'Re\u00e7ue',      ar: '\u062a\u0645 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645' },
  confirmed: { en: 'Confirmed', fr: 'Confirm\u00e9e',  ar: '\u0645\u0624\u0643\u062f' },
  preparing: { en: 'Preparing', fr: 'En pr\u00e9paration', ar: '\u0642\u064a\u062f \u0627\u0644\u062a\u062d\u0636\u064a\u0631' },
  ready:     { en: 'Ready',     fr: 'Pr\u00eate',      ar: '\u062c\u0627\u0647\u0632' },
  delivered: { en: 'Delivered', fr: 'Livr\u00e9e',     ar: '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645' },
  cancelled: { en: 'Cancelled', fr: 'Annul\u00e9e',    ar: '\u0645\u0644\u063a\u064a' },
}
const STATUS_COLORS = {
  pending: '#FF7A47', confirmed: '#3b82f6', preparing: '#D4A03A',
  ready: '#2D6E5A', delivered: '#6b7280', cancelled: '#ef4444',
}

export default function OrderHistorySheet({
  lang, isRTL, restaurant, isDineIn, dineInSessionId, dineInTable, onClose, fallbackLang = 'en'
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl     = isRTL
  const arabicFont = rtl
    ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif"

  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .eq('vendor_id', restaurant?.id)
          .order('created_at', { ascending: false })

        if (isDineIn && dineInSessionId) {
          query = query.eq('dine_in_session_id', dineInSessionId)
        } else {
          const saved = JSON.parse(localStorage.getItem('bv_customer_info') || '{}')
          const phone = saved.countryCode && saved.localPhone
            ? `${saved.countryCode}${saved.localPhone.replace(/^0+/, '')}`
            : null
          if (!phone) { setOrders([]); setLoading(false); return }
          query = query.eq('customer_phone', phone).limit(20)
        }

        const { data } = await query
        setOrders(data || [])
      } finally {
        setLoading(false)
      }
    }
    if (restaurant?.id) load()
  }, [restaurant?.id, isDineIn, dineInSessionId])

  function getItemName(item) {
    return pickTranslation(item.translations, 'name', lang, fallbackLang) || item.name
  }
  function formatTime(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  const runningTotal = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ position: 'relative', padding: '4px 16px 24px' }}>
      <SheetCloseButton lang={lang} onClose={onClose} />

      <h2 style={{
        fontFamily: arabicFont, fontSize: 18, fontWeight: 700, color: '#1A4D3E',
        margin: '10px 0 4px', textAlign: rtl ? 'right' : 'left',
        [rtl ? 'paddingLeft' : 'paddingRight']: 40,
      }}>
        {isDineIn
          ? (lang === 'ar' ? '\u062d\u0633\u0627\u0628 \u0627\u0644\u0637\u0627\u0648\u0644\u0629' : lang === 'fr' ? 'Addition de la Table' : 'Your Table Tab')
          : t('order_history', lang)}
      </h2>

      {isDineIn && dineInTable && (
        <p style={{ fontSize: 12.5, color: primary, opacity: 0.8, marginBottom: 14, fontFamily: arabicFont, fontWeight: 600 }}>
          {lang === 'ar' ? '\u0637\u0627\u0648\u0644\u0629' : 'Table'} {dineInTable.table_number}
        </p>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13 }}>...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', opacity: 0.5 }}>
          <Clock size={36} style={{ margin: '0 auto 12px', color: '#1B2530' }} />
          <p style={{ fontSize: 13, fontFamily: arabicFont }}>
            {isDineIn
              ? (lang === 'ar' ? '\u0644\u0633\u0647 \u0645\u0639\u0645\u0644\u062a\u0634 \u0623\u064a \u0637\u0644\u0628' : lang === 'fr' ? 'Aucune commande pour le moment' : 'No orders yet this visit')
              : (lang === 'ar' ? '\u0644\u0627 \u064a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0633\u0627\u0628\u0642\u0629' : lang === 'fr' ? 'Aucune commande pr\u00e9c\u00e9dente' : 'No previous orders found')}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: isDineIn ? 16 : 0 }}>
            {orders.map((order, idx) => {
              const items = Array.isArray(order.items)
                ? order.items
                : (typeof order.items === 'string' ? JSON.parse(order.items) : [])
              const statusColor = STATUS_COLORS[order.status] || '#6b7280'
              const statusLabel = (STATUS_LABELS[order.status] || {})[lang] || order.status

              return (
                <div key={order.id} style={{
                  background: 'white', borderRadius: 16, padding: 14,
                  border: '1px solid rgba(45,42,38,0.06)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13,
                      color: '#1A2530', order: rtl ? 2 : 1,
                    }}>
                      {isDineIn
                        ? `${lang === 'ar' ? '\u062c\u0648\u0644\u0629' : lang === 'fr' ? 'Tour' : 'Round'} ${orders.length - idx}`
                        : `#${order.order_number}`}
                      <span style={{ opacity: 0.4, fontWeight: 500, marginInlineStart: 8, fontSize: 11 }}>
                        {formatTime(order.created_at)}
                      </span>
                    </span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                      background: `${statusColor}18`, color: statusColor, order: rtl ? 1 : 2,
                      fontFamily: arabicFont,
                    }}>
                      {statusLabel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                    {items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ color: '#1A2530', opacity: 0.75, fontFamily: arabicFont, order: rtl ? 2 : 1, textAlign: rtl ? 'right' : 'left' }}>
                          {item.quantity}\u00d7 {getItemName(item)}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.6, order: rtl ? 1 : 2 }}>
                          {formatPrice(item.total, restaurant, lang)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', fontWeight: 700,
                    fontSize: 13, borderTop: '1px solid rgba(45,42,38,0.06)', paddingTop: 8,
                  }}>
                    <span style={{ fontFamily: arabicFont, order: rtl ? 2 : 1 }}>
                      {t('total', lang)}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: primary, order: rtl ? 1 : 2 }}>
                      {formatPrice(order.total, restaurant, lang)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {isDineIn && (
            <div style={{
              background: primary, borderRadius: 16, padding: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: arabicFont, order: rtl ? 2 : 1 }}>
                {lang === 'ar' ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0637\u0627\u0648\u0644\u0629' : lang === 'fr' ? 'Total de la Table' : 'Table Total'}
              </span>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 18, fontFamily: "'JetBrains Mono', monospace", order: rtl ? 1 : 2 }}>
                {formatPrice(runningTotal, restaurant, lang)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}