import { Trash2, Plus, Minus } from 'lucide-react'
import { useCart }             from '../context/CartContext'
import { t }                   from '../lib/translations'
import { pickTranslation }     from '../lib/i18n'
import { formatPrice }         from '../lib/currency'
import SheetCloseButton        from './SheetCloseButton'

export default function CartSheet({
  lang, isRTL, restaurant, onClose, onCheckout, fallbackLang = 'en'
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl     = isRTL
  const arabicFont = rtl ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif"
  const { cart, subtotal, itemCount, removeItem, updateQuantity } = useCart()

  function getItemName(item) {
    return pickTranslation(item.translations, 'name', lang, fallbackLang) || item.name
  }

  const titleSidePad = { [rtl ? 'paddingLeft' : 'paddingRight']: 40 }

  if (itemCount === 0) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} style={{ position: 'relative', padding: '50px 24px', textAlign: 'center' }}>
        <SheetCloseButton lang={lang} onClose={onClose} />
        <div style={{ fontSize: 44, marginBottom: 14 }}>🛒</div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: '#1A4D3E', marginBottom: 6 }}>
          {t('cart_empty', lang)}
        </h3>
        <p style={{ fontSize: 13, opacity: 0.55, fontFamily: arabicFont }}>{t('cart_empty_sub', lang)}</p>
      </div>
    )
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ position: 'relative', padding: '4px 16px 20px' }}>
      <SheetCloseButton lang={lang} onClose={onClose} />

      <h2 style={{
        fontFamily: arabicFont, fontSize: 18, fontWeight: 700, color: '#1A4D3E',
        margin: '10px 0 14px', textAlign: rtl ? 'right' : 'left', ...titleSidePad,
      }}>
        {t('your_cart', lang)} · {itemCount}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {cart.map(item => (
          <div key={item.id} style={{ background: 'white', borderRadius: 16, padding: 12, border: '1px solid rgba(45,42,38,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, order: rtl ? 2 : 1 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#2D2A26', marginBottom: 6, fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left' }}>
                  {getItemName(item)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: rtl ? 'flex-end' : 'flex-start' }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(45,42,38,0.06)', border: 'none', cursor: 'pointer' }}>
                    <Minus size={12} style={{ margin: 'auto' }} />
                  </button>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, width: 16, textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: primary, color: 'white', border: 'none', cursor: 'pointer' }}>
                    <Plus size={12} style={{ margin: 'auto' }} />
                  </button>
                </div>
              </div>

              <div style={{ order: rtl ? 1 : 2, textAlign: rtl ? 'left' : 'right' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: primary }}>
                  {formatPrice(item.total, restaurant, lang)}
                </p>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6, marginTop: 6 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Only subtotal + total here.
          NO delivery fee, NO tax — both depend
          on fulfillment type (delivery vs pickup
          vs dine-in), which isn't chosen yet at
          this point in the flow. Showing them
          here would either be wrong (assuming
          delivery before it's picked) or
          misleading (a number that changes at
          checkout looks like a bait-and-switch).
          At this stage, "total" simply equals
          "subtotal" — the real total with fees/
          tax only appears once CheckoutSheet
          knows the actual fulfillment type. ── */}
      <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,38,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ opacity: 0.55, fontFamily: arabicFont, order: rtl ? 2 : 1 }}>{t('subtotal', lang)}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", order: rtl ? 1 : 2 }}>{formatPrice(subtotal, restaurant, lang)}</span>
        </div>
        <p style={{
          fontSize: 11, color: '#2D2A26', opacity: 0.45, margin: 0,
          textAlign: rtl ? 'right' : 'left', fontFamily: arabicFont,
        }}>
          {lang === 'ar' ? 'رسوم التوصيل والضرائب هتتحسب في صفحة الدفع'
            : lang === 'fr' ? 'Frais de livraison et taxes calculés au paiement'
            : lang === 'es' ? 'Costo de envío e impuestos se calculan al pagar'
            : 'Delivery fee and tax calculated at checkout'}
        </p>
      </div>

      <button onClick={onCheckout} style={{
        width: '100%', borderRadius: 18, padding: '15px 22px', background: primary, border: 'none',
        color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 8px 24px ${primary}44`,
        fontFamily: arabicFont, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ order: rtl ? 2 : 1 }}>{t('checkout', lang)}</span>
        <span style={{ order: rtl ? 1 : 2, fontFamily: "'JetBrains Mono', monospace" }}>
          {formatPrice(subtotal, restaurant, lang)}
        </span>
      </button>
    </div>
  )
}