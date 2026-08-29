import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useCart }              from '../context/CartContext'
import { useSession }           from '../hooks/useSession'
import { supabase }             from '../lib/supabase'
import { t }                    from '../lib/translations'
import { formatPrice }          from '../lib/currency'
import SheetCloseButton         from './SheetCloseButton'

const COUNTRY_CODES = [
  
  // Nort America
  { code: '+1', flag: '🇨🇦', placeholder: '514 000-0000', validate: d => /^\d{10}$/.test(d) },
  { code: '+1', flag: '🇺🇸', placeholder: '202 000-0000', validate: d => /^\d{10}$/.test(d) }, // United States
  { code: '+57', flag: '🇨🇴', placeholder: '300 0000000', validate: d => /^3\d{9}$/.test(d) }, // Colombia
  { code: '+52',  flag: '🇲🇽', placeholder: '55 0000 0000', validate: d => /^\d{10}$/.test(d) }, // Mexico
  // Carabian
  { code: '+53',  flag: '🇨🇺', placeholder: '5 0000000', validate: d => /^\d{8}$/.test(d) }, // Cuba
  { code: '+506', flag: '🇨🇷', placeholder: '8000 0000', validate: d => /^\d{8}$/.test(d) }, // Costa Rica
  { code: '+507', flag: '🇵🇦', placeholder: '6000-0000', validate: d => /^\d{8}$/.test(d) }, // Panama
  { code: '+509', flag: '🇭🇹', placeholder: '3700 0000', validate: d => /^\d{8}$/.test(d) }, // Haiti
  // South America
  { code: '+54', flag: '🇦🇷', placeholder: '11 0000-0000', validate: d => /^\d{10,11}$/.test(d) }, // Argentina
  { code: '+591', flag: '🇧🇴', placeholder: '7 0000000', validate: d => /^\d{8}$/.test(d) }, // Bolivia
  { code: '+55', flag: '🇧🇷', placeholder: '11 90000-0000', validate: d => /^\d{10,11}$/.test(d) }, // Brazil
  { code: '+56', flag: '🇨🇱', placeholder: '9 0000 0000', validate: d => /^9\d{8}$/.test(d) }, // Chile
  { code: '+593', flag: '🇪🇨', placeholder: '99 000 0000', validate: d => /^9\d{8}$/.test(d) }, // Ecuador
  { code: '+592', flag: '🇬🇾', placeholder: '600 0000', validate: d => /^\d{7}$/.test(d) }, // Guyana
  { code: '+595', flag: '🇵🇾', placeholder: '981 000000', validate: d => /^9\d{8}$/.test(d) }, // Paraguay
  { code: '+51', flag: '🇵🇪', placeholder: '900 000 000', validate: d => /^9\d{8}$/.test(d) }, // Peru
  { code: '+597', flag: '🇸🇷', placeholder: '700 0000', validate: d => /^\d{7}$/.test(d) }, // Suriname
  { code: '+598', flag: '🇺🇾', placeholder: '99 000 000', validate: d => /^9\d{7}$/.test(d) }, // Uruguay
  { code: '+58', flag: '🇻🇪', placeholder: '412 0000000', validate: d => /^4\d{9}$/.test(d) }, // Venezuela

  // Egypt
  { code: '+20', flag: '🇪🇬', placeholder: '10 0000 0000', validate: d => /^(10|11|12|15)\d{8}$/.test(d) },
];
const ARABIC_DIGITS = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' }
function normalizeDigits(v) {
  return v.split('').map(ch => ARABIC_DIGITS[ch] ?? ch).join('').replace(/[^\d]/g, '')
}

const STORAGE_KEY = 'bv_customer_info'
function loadSaved() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null } }
function saveInfo(v) {
  try {
    const existing = loadSaved() || {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...v }))
  } catch {}
}

export default function CheckoutSheet({
  lang, isRTL, restaurant, onClose, onSuccess
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl     = isRTL
  const arabicFont = rtl
    ? "'Noto Naskh Arabic', serif"
    : "'Plus Jakarta Sans', sans-serif"

  const { isDineIn, dineInTable, dineInSessionId } = useSession()
  const { cart, subtotal, itemCount, clearCart } = useCart()

  const isVenueMode = !!restaurant?.is_venue_vendor

  // ── Fulfillment type selection ──
  // Priority: dine-in (via table QR) overrides
  // everything else automatically. Otherwise, if
  // the vendor supports both delivery and pickup,
  // let the customer choose.
  const supportsDelivery = restaurant?.supports_delivery !== false
  const supportsPickup   = !!restaurant?.supports_pickup
  const canChooseFulfillment = !isDineIn && !isVenueMode
    && supportsDelivery && supportsPickup

  const [fulfillmentType, setFulfillmentType] = useState(
    isDineIn ? 'dine_in'
      : (supportsDelivery ? 'delivery' : 'pickup')
  )

  const isPickup = fulfillmentType === 'pickup'
  const deliveryFee = (isVenueMode || isDineIn || isPickup)
    ? 0 : (restaurant?.delivery_fee || 3.99)
  const total = subtotal + deliveryFee

  const [spots, setSpots] = useState([])
  const [spotsLoading, setSpotsLoading] = useState(isVenueMode)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [extraFieldValue, setExtraFieldValue] = useState('')

  const saved = loadSaved()
  const [name, setName] = useState(saved?.name || '')
  const [countryCode, setCountryCode] = useState(saved?.countryCode || (isVenueMode ? '+20' : '+1'))
  const [localPhone, setLocalPhone] = useState(saved?.localPhone || '')
  const [address, setAddress] = useState(saved?.address || '')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)

  const currentCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0]
  const phoneIsValid = currentCountry.validate(localPhone.replace(/^0+/, ''))

  useEffect(() => {
    if (!isVenueMode || !restaurant?.venue_id) { setSpotsLoading(false); return }
    supabase.from('venue_spots').select('*').eq('venue_id', restaurant.venue_id).eq('active', true).order('sort_order')
      .then(({ data }) => { setSpots(data || []); setSpotsLoading(false) })
  }, [isVenueMode, restaurant?.venue_id])

  function getSpotName(spot) {
    if (!spot) return ''
    if (lang === 'ar') return spot.name_ar || spot.name_en
    if (lang === 'fr') return spot.name_fr || spot.name_en
    return spot.name_en
  }
  function getExtraLabel(spot) {
    if (!spot) return null
    if (lang === 'ar') return spot.extra_field_label_ar || spot.extra_field_label_en
    return spot.extra_field_label_en
  }
  function getExtraPlaceholder(spot) {
    if (!spot) return ''
    if (lang === 'ar') return spot.extra_field_placeholder_ar || spot.extra_field_placeholder_en || ''
    return spot.extra_field_placeholder_en || ''
  }
  function getZoneEmoji(zone) {
    return { pool: '🏊', garden: '🌿', clubhouse: '🏛️', tennis: '🎾', kids: '🎠', entrance: '🚪' }[zone] || '📍'
  }
  function getTableName(table) {
    if (!table) return ''
    if (lang === 'ar') return table.name_ar || `${t('dine_in_table', lang)} ${table.table_number}`
    if (lang === 'fr') return table.name_fr || `${t('dine_in_table', lang)} ${table.table_number}`
    return table.name_en || `${t('dine_in_table', lang)} ${table.table_number}`
  }

  function validate() {
    const e = {}
    if (!name.trim()) e.name = t('name_required', lang)
    if (!localPhone.trim()) e.phone = t('phone_required', lang)
    else if (!phoneIsValid) e.phone = lang === 'ar' ? 'رقم غير صحيح' : 'Invalid number'

    if (isDineIn) {
      // Table already known from QR — nothing extra
      // required beyond name/phone
    } else if (isVenueMode) {
      if (!selectedSpot) e.spot = t('spot_required', lang)
      else if (selectedSpot.extra_field_required && !extraFieldValue.trim()) {
        e.extraField = lang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'
      }
    } else if (fulfillmentType === 'delivery' && !address.trim()) {
      e.address = t('address_required', lang)
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePlaceOrder() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const fullPhone = `${countryCode}${localPhone.replace(/^0+/, '')}`

      const resolvedOrderType = isDineIn
        ? 'dine_in'
        : (isVenueMode ? 'delivery' : fulfillmentType)

      const orderPayload = {
        token: 'demo',
        vendor_id: restaurant?.id,
        customer_phone: fullPhone,
        customer_name: name,
        order_type: resolvedOrderType,
        is_venue_order: isVenueMode,
        venue_spot_id: isVenueMode ? selectedSpot?.id : null,
        table_id: isDineIn ? dineInTable?.id : null,
        dine_in_session_id: isDineIn ? dineInSessionId : null,
        delivery_address: isVenueMode
          ? getSpotName(selectedSpot)
          : isDineIn
            ? getTableName(dineInTable)
            : (fulfillmentType === 'pickup' ? null : address),
        spot_note: isVenueMode ? extraFieldValue : null,
        notes: '',
        items: cart.map(item => ({
          itemId: item.itemId, name: item.name, name_fr: item.name_fr, name_ar: item.name_ar,
          translations: item.translations,
          options: item.options, quantity: item.quantity, unitPrice: item.unitPrice, total: item.total,
        })),
        subtotal, delivery_fee: deliveryFee, total, language: lang,
      }

      const response = await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Order failed')

      saveInfo({
        name, countryCode, localPhone,
        ...((!isVenueMode && !isDineIn && fulfillmentType === 'delivery') ? { address } : {}),
      })

      setSuccess({
        orderNumber: result.orderNumber,
        spotName: isVenueMode ? getSpotName(selectedSpot) : null,
        tableName: isDineIn ? getTableName(dineInTable) : null,
        orderType: resolvedOrderType,
      })
      clearCart()
      onSuccess?.()
    } catch (err) {
      setErrors({ submit: t('order_error', lang) })
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: hasError ? '1px solid #ef4444' : '1px solid rgba(45,42,38,0.12)',
    background: hasError ? '#fef2f2' : '#FFF8F0', fontSize: 13, color: '#2D2A26',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: rtl ? 'right' : 'left',
  })
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#2D2A26', opacity: 0.5, display: 'block', marginBottom: 5, fontFamily: "'JetBrains Mono', monospace" }
  const titleSidePad = { [rtl ? 'paddingLeft' : 'paddingRight']: 40 }

  // ── SUCCESS / CONFIRMATION STATE ──
  if (success) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} style={{ position: 'relative', padding: '50px 24px', textAlign: 'center' }}>
        <SheetCloseButton lang={lang} onClose={onClose} />
        <CheckCircle size={56} style={{ color: '#2D6E5A', margin: '0 auto 16px' }} />
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: '#1A4D3E', marginBottom: 8 }}>
          {t('order_confirmed', lang)}
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: primary, marginBottom: 16 }}>
          #{success.orderNumber}
        </p>
        {success.tableName && (
          <p style={{ fontSize: 13, color: '#2D2A26', opacity: 0.7, marginBottom: 8, fontFamily: arabicFont, fontWeight: 600 }}>
            🪑 {success.tableName}
          </p>
        )}
        {success.spotName && (
          <p style={{ fontSize: 13, color: '#2D2A26', opacity: 0.6, marginBottom: 8, fontFamily: arabicFont }}>
            📍 {success.spotName}
          </p>
        )}
        {success.orderType === 'pickup' && (
          <p style={{ fontSize: 12.5, color: '#2D2A26', opacity: 0.55, marginBottom: 20, fontFamily: arabicFont }}>
            {t('pickup_note', lang)}
          </p>
        )}
        {success.orderType === 'dine_in' && (
          <p style={{ fontSize: 12.5, color: '#2D2A26', opacity: 0.55, marginBottom: 20, fontFamily: arabicFont }}>
            {t('dine_in_note', lang)}
          </p>
        )}
        <button onClick={onClose} style={{
          padding: '12px 28px', borderRadius: 100, background: primary, color: 'white',
          border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: arabicFont,
        }}>
          {t('order_again', lang)}
        </button>
      </div>
    )
  }

  // ── CHECKOUT FORM STATE ──
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ position: 'relative', padding: '4px 16px 20px' }}>
      <SheetCloseButton lang={lang} onClose={onClose} />

      <h2 style={{
        fontFamily: arabicFont, fontSize: 18, fontWeight: 700, color: '#1A4D3E',
        margin: '10px 0 14px', textAlign: rtl ? 'right' : 'left', ...titleSidePad,
      }}>
        {isDineIn ? t('your_order', lang) : t('delivery_details', lang)}
      </h2>

      {/* Dine-in banner — table already known,
          no fulfillment choice needed */}
      {isDineIn && dineInTable && (
        <div style={{
          background: `${primary}10`, border: `1.5px solid ${primary}30`,
          borderRadius: 14, padding: '12px 14px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          flexDirection: rtl ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: 22 }}>🪑</span>
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <p style={{ fontSize: 11, color: primary, opacity: 0.8, margin: 0, fontFamily: arabicFont, fontWeight: 700 }}>
              {t('dine_in_banner', lang)}
            </p>
            <p style={{ fontSize: 14, color: '#1A2530', margin: '2px 0 0', fontWeight: 700, fontFamily: arabicFont }}>
              {getTableName(dineInTable)}
            </p>
          </div>
        </div>
      )}

      {/* Fulfillment type toggle — only shown when
          the vendor supports both delivery AND
          pickup, and this isn't a venue/dine-in
          order (which already have a fixed mode) */}
      {canChooseFulfillment && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 10,
          background: 'white', borderRadius: 14, padding: 4,
          border: '1px solid rgba(45,42,38,0.06)',
        }}>
          {[
            { key: 'delivery', label: t('fulfillment_delivery', lang), icon: '🛵' },
            { key: 'pickup',   label: t('fulfillment_pickup', lang),   icon: '🥡' },
          ].map(opt => {
            const active = fulfillmentType === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setFulfillmentType(opt.key)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 11, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: active ? primary : 'transparent',
                  color: active ? 'white' : '#1A2530',
                  opacity: active ? 1 : 0.55,
                  fontFamily: arabicFont,
                }}
              >
                {opt.icon} {opt.label}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,38,0.06)', marginBottom: 10 }}>
        <label style={labelStyle}>{t('full_name', lang)}</label>
        <input style={{ ...inputStyle(!!errors.name), marginBottom: 10 }} value={name} onChange={e => setName(e.target.value)} />

        <label style={labelStyle}>{t('phone_number', lang)}</label>
        {/* Phone row: intentionally always LTR — dial
            codes and digit sequences read left-to-right
            regardless of interface language */}
        <div style={{ display: 'flex', gap: 8, direction: 'ltr' }}>
          <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ ...inputStyle(false), width: 90 }}>
            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <input
            style={{ ...inputStyle(!!errors.phone), flex: 1, direction: 'ltr' }}
            value={localPhone}
            onChange={e => setLocalPhone(normalizeDigits(e.target.value))}
            placeholder={currentCountry.placeholder}
            lang="ar"
          />
        </div>
        {errors.phone && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.phone}</p>}
      </div>

      {/* Address — only for delivery (not dine-in,
          not venue, not pickup) */}
      {!isDineIn && !isVenueMode && fulfillmentType === 'delivery' && (
        <div style={{ background: 'white', borderRadius: 16, padding: 14, border: errors.address ? '1.5px solid #ef4444' : '1px solid rgba(45,42,38,0.06)', marginBottom: 10 }}>
          <label style={labelStyle}>{t('street_address', lang)}</label>
          <input
            style={inputStyle(!!errors.address)}
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={t('street_placeholder', lang)}
          />
          {errors.address && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.address}</p>}
        </div>
      )}

      {/* Pickup note */}
      {!isDineIn && !isVenueMode && fulfillmentType === 'pickup' && (
        <div style={{
          background: `${primary}08`, borderRadius: 12, padding: '10px 14px', marginBottom: 10,
          fontSize: 12.5, color: primary, fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left',
        }}>
          🥡 {t('pickup_note', lang)}
        </div>
      )}

      {/* Venue spot picker — unchanged, only for
          actual multi-vendor venues, never for
          this restaurant's own dine-in tables */}
      {isVenueMode && (
        <div style={{ background: 'white', borderRadius: 16, padding: 14, border: errors.spot ? '1.5px solid #ef4444' : '1px solid rgba(45,42,38,0.06)', marginBottom: 10 }}>
          <label style={labelStyle}>{t('your_location', lang)}</label>
          {spotsLoading ? <p style={{ fontSize: 12, opacity: 0.5 }}>...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {spots.map(spot => {
                const isSelected = selectedSpot?.id === spot.id
                return (
                  <button key={spot.id} onClick={() => { setSelectedSpot(spot); setExtraFieldValue('') }}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      border: isSelected ? `2px solid ${primary}` : '1.5px solid rgba(45,42,38,.1)',
                      background: isSelected ? `${primary}10` : '#FFF8F0', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5,
                      fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left',
                    }}>
                    <span style={{ order: rtl ? 3 : 1 }}>{getZoneEmoji(spot.zone)}</span>
                    <span style={{ flex: 1, order: 2 }}>{getSpotName(spot)}</span>
                    {isSelected && <span style={{ color: primary, order: rtl ? 1 : 3 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          )}
          {errors.spot && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{errors.spot}</p>}

          {selectedSpot && getExtraLabel(selectedSpot) && (
            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>{getExtraLabel(selectedSpot)}</label>
              <input
                style={inputStyle(!!errors.extraField)}
                value={extraFieldValue}
                onChange={e => setExtraFieldValue(e.target.value)}
                placeholder={getExtraPlaceholder(selectedSpot)}
              />
              {errors.extraField && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.extraField}</p>}
            </div>
          )}
        </div>
      )}

      {/* Dine-in delivery-to-table note */}
      {isDineIn && (
        <div style={{
          background: `${primary}08`, borderRadius: 12, padding: '10px 14px', marginBottom: 10,
          fontSize: 12.5, color: primary, fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left',
        }}>
          🪑 {t('dine_in_note', lang)}
        </div>
      )}

      {/* Total */}
      <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,38,0.06)', marginBottom: 16 }}>
        {!isVenueMode && !isDineIn && fulfillmentType === 'delivery' && deliveryFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ opacity: 0.55, fontFamily: arabicFont, order: rtl ? 2 : 1 }}>
              {t('delivery', lang)}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", order: rtl ? 1 : 2 }}>
              {formatPrice(deliveryFee, restaurant, lang)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span style={{ fontFamily: arabicFont, order: rtl ? 2 : 1 }}>
            {t('total', lang)}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: primary, fontSize: 16, order: rtl ? 1 : 2 }}>
            {formatPrice(total, restaurant, lang)}
          </span>
        </div>
      </div>

      {errors.submit && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{errors.submit}</p>}

      <button onClick={handlePlaceOrder} disabled={submitting} style={{
        width: '100%', borderRadius: 18, padding: '15px 22px', border: 'none',
        background: submitting ? 'rgba(45,42,38,0.15)' : primary, color: submitting ? 'rgba(45,42,38,0.4)' : 'white',
        fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: arabicFont,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ order: rtl ? 2 : 1 }}>
          {submitting ? t('placing_order', lang) : t('place_order', lang)}
        </span>
        <span style={{ order: rtl ? 1 : 2, fontFamily: "'JetBrains Mono', monospace" }}>
          {!submitting && `· ${formatPrice(total, restaurant, lang)}`}
        </span>
      </button>
    </div>
  )
}