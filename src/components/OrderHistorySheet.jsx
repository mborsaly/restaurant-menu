import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { supabase }        from '../lib/supabase'
import { t, isRTL }        from '../lib/translations'
import { formatPrice }     from '../lib/currency'
import SheetCloseButton    from './SheetCloseButton'

const STATUS_LABELS = {
  pending:   { en: 'Received',  fr: 'Reçue',      ar: 'تم الاستلام' },
  confirmed: { en: 'Confirmed', fr: 'Confirmée',  ar: 'مؤكد' },
  preparing: { en: 'Preparing', fr: 'En préparation', ar: 'قيد التحضير' },
  ready:     { en: 'Ready',     fr: 'Prête',      ar: 'جاهز' },
  delivered: { en: 'Delivered', fr: 'Livrée',     ar: 'تم التسليم' },
  cancelled: { en: 'Cancelled', fr: 'Annulée',    ar: 'ملغي' },
}
const STATUS_COLORS = {
  pending: '#FF7A47', confirmed: '#3b82f6', preparing: '#D4A03A',
  ready: '#2D6E5A', delivered: '#6b7280', cancelled: '#ef4444',
}

export default function OrderHistorySheet({
  lang, restaurant, isDineIn, dineInSessionId, dineInTable, onClose
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl     = isRTL(lang)
  const arabicFont = lang === 'ar'
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
          // Scoped to THIS visit only — not the
          // table's entire history across all guests
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
    if (lang === 'ar') return item.name_ar || item.name
    if (lang === 'fr') return item.name_fr || item.name
    return item.name
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
          ? (lang === 'ar' ? 'حساب الطاولة' : lang === 'fr' ? 'Addition de la Table' : 'Your Table Tab')
          : t('order_history', lang)}
      </h2>

      {isDineIn && dineInTable && (
        <p style={{ fontSize: 12.5, color: primary, opacity: 0.8, marginBottom: 14, fontFamily: arabicFont, fontWeight: 600 }}>
          🪑 {lang === 'ar' ? 'طاولة' : 'Table'} {dineInTable.table_number}
        </p>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13 }}>...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', opacity: 0.5 }}>
          <Clock size={36} style={{ margin: '0 auto 12px', color: '#1B2530' }} />
          <p style={{ fontSize: 13, fontFamily: arabicFont }}>
            {isDineIn
              ? (lang === 'ar' ? 'لسه معملتش أي طلب' : lang === 'fr' ? 'Aucune commande pour le moment' : 'No orders yet this visit')
              : (lang === 'ar' ? 'لا يوجد طلبات سابقة' : lang === 'fr' ? 'Aucune commande précédente' : 'No previous orders found')}
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
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 8, direction: 'ltr',
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13,
                      color: '#1A2530', order: rtl ? 2 : 1,
                    }}>
                      {isDineIn
                        ? `${lang === 'ar' ? 'جولة' : lang === 'fr' ? 'Tour' : 'Round'} ${orders.length - idx}`
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
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: 12.5,
                        direction: 'ltr',
                      }}>
                        <span style={{ color: '#1A2530', opacity: 0.75, fontFamily: arabicFont, order: rtl ? 2 : 1, direction: rtl ? 'rtl' : 'ltr' }}>
                          {item.quantity}× {getItemName(item)}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.6, order: rtl ? 1 : 2 }}>
                          {formatPrice(item.total, restaurant, lang)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', fontWeight: 700,
                    fontSize: 13, borderTop: '1px solid rgba(45,42,38,0.06)', paddingTop: 8, direction: 'ltr',
                  }}>
                    <span style={{ fontFamily: arabicFont, order: rtl ? 2 : 1, direction: rtl ? 'rtl' : 'ltr' }}>
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
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'ltr',
            }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: arabicFont, order: rtl ? 2 : 1, direction: rtl ? 'rtl' : 'ltr' }}>
                {lang === 'ar' ? 'إجمالي الطاولة' : lang === 'fr' ? 'Total de la Table' : 'Table Total'}
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