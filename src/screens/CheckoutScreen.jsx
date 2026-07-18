import { useState, useEffect }    from 'react'
import { useNavigate }            from 'react-router-dom'
import { ChevronLeft, ChevronRight,
         MapPin, User, Phone }    from 'lucide-react'
import { useCart }                from '../context/CartContext'
import { useSession }             from '../hooks/useSession'
import { supabase }               from '../lib/supabase'
import { t, isRTL }               from '../lib/translations'

// ── Country codes — Egypt default ──────────────
const COUNTRY_CODES = [
  {
    code: '+2', flag: '🇪🇬', label: 'EG',
    placeholder: '010 0000 0000',
    validate: d => /^(010|011|012|015)\d{8}$/.test(d),
  },
  {
    code: '+966', flag: '🇸🇦', label: 'SA',
    placeholder: '5 0000 0000',
    validate: d => /^5\d{8}$/.test(d),
  },
  {
    code: '+971', flag: '🇦🇪', label: 'AE',
    placeholder: '50 000 0000',
    validate: d => /^5\d{8}$/.test(d),
  },
  {
    code: '+965', flag: '🇰🇼', label: 'KW',
    placeholder: '5000 0000',
    validate: d => /^\d{8}$/.test(d),
  },
  {
    code: '+974', flag: '🇶🇦', label: 'QA',
    placeholder: '3000 0000',
    validate: d => /^\d{8}$/.test(d),
  },
  {
    code: '+973', flag: '🇧🇭', label: 'BH',
    placeholder: '3600 0000',
    validate: d => /^\d{8}$/.test(d),
  },
  {
    code: '+968', flag: '🇴🇲', label: 'OM',
    placeholder: '9000 0000',
    validate: d => /^\d{8}$/.test(d),
  },
  {
    code: '+962', flag: '🇯🇴', label: 'JO',
    placeholder: '7 9000 0000',
    validate: d => /^7\d{8}$/.test(d),
  },
  {
    code: '+961', flag: '🇱🇧', label: 'LB',
    placeholder: '71 000 000',
    validate: d => /^\d{7,8}$/.test(d),
  },
  {
    code: '+1', flag: '🇨🇦', label: 'CA',
    placeholder: '514 000-0000',
    validate: d => /^\d{10}$/.test(d),
  },
  {
    code: '+33', flag: '🇫🇷', label: 'FR',
    placeholder: '6 00 00 00 00',
    validate: d => /^\d{9}$/.test(d),
  },
]

// Arabic-Indic + Persian digit conversion → Western digits
const ARABIC_DIGIT_MAP = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

function normalizeDigits(value) {
  return value
    .split('')
    .map(ch => ARABIC_DIGIT_MAP[ch] ?? ch)
    .join('')
    .replace(/[^\d]/g, '')
}

// ── localStorage helpers for returning customers ──
const STORAGE_KEY = 'bv_customer_info'

function loadSavedCustomer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCustomerInfo({ name, countryCode, localPhone }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name, countryCode, localPhone,
    }))
  } catch {
    // ignore write errors (private browsing etc.)
  }
}

// ── Field component OUTSIDE CheckoutScreen ──────
function Field({
  label, optional, error,
  lang, children,
}) {
  const rtl = isRTL(lang)
  return (
    <div>
      <label style={{
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color:         '#2D2A26',
        opacity:       0.5,
        display:       'block',
        marginBottom:  8,
        textAlign:     rtl ? 'right' : 'left',
      }}>
        {label}
        {optional && (
          <span style={{
            fontFamily:    'inherit',
            textTransform: 'none',
            fontWeight:    400,
            margin:        rtl ? '0 6px 0 0' : '0 0 0 6px',
            opacity:       0.6,
          }}>
            ({t('optional', lang)})
          </span>
        )}
      </label>
      {children}
      {error && (
        <p style={{
          fontSize:  12,
          color:     '#ef4444',
          margin:    '4px 0 0',
          textAlign: rtl ? 'right' : 'left',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ── SectionTitle OUTSIDE CheckoutScreen ─────────
function SectionTitle({ text, lang }) {
  const rtl = isRTL(lang)
  return (
    <h3 style={{
      fontFamily: lang === 'ar'
        ? "'Noto Naskh Arabic', serif"
        : "'Fraunces', serif",
      fontSize:   16,
      fontWeight: 600,
      color:      '#1A4D3E',
      margin:     0,
      textAlign:  rtl ? 'right' : 'left',
    }}>
      {text}
    </h3>
  )
}

// ── Main component ───────────────────────────────
export default function CheckoutScreen() {
  const navigate = useNavigate()
  const {
    restaurant, customer,
    session, lang, paths,
  } = useSession()
  const {
    cart, subtotal,
    itemCount, clearCart,
  } = useCart()

  const primary     = restaurant?.primary_color || '#1A4D3E'
  const coral       = '#FF7A47'
  const rtl         = isRTL(lang)
  const BackIcon    = rtl ? ChevronRight : ChevronLeft
  const arabicFont  = lang === 'ar'
    ? "'Noto Naskh Arabic', serif" : 'inherit'

  const isVenueMode = !!restaurant?.is_venue_vendor
  const deliveryFee = isVenueMode
    ? 0
    : (restaurant?.delivery_fee || 3.99)
  const total = subtotal + deliveryFee

  // ── Venue spots state ───────────────────────
  const [spots, setSpots]               = useState([])
  const [spotsLoading, setSpotsLoading] = useState(isVenueMode)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [spotNote, setSpotNote]         = useState('')
  const [spotSectionRef, setSpotSectionRef] = useState(null)

  useEffect(() => {
    if (!isVenueMode || !restaurant?.venue_id) {
      setSpotsLoading(false)
      return
    }

    async function loadSpots() {
      try {
        const { data } = await supabase
          .from('venue_spots')
          .select('*')
          .eq('venue_id', restaurant.venue_id)
          .eq('active', true)
          .order('sort_order')

        setSpots(data || [])
      } catch (err) {
        console.error('Load spots error:', err)
      } finally {
        setSpotsLoading(false)
      }
    }

    loadSpots()
  }, [isVenueMode, restaurant?.venue_id])

  function getSpotName(spot) {
    if (!spot) return ''
    if (lang === 'ar') return spot.name_ar || spot.name_en
    if (lang === 'fr') return spot.name_fr || spot.name_en
    return spot.name_en
  }

  function getZoneEmoji(zone) {
    const map = {
      pool:      '🏊',
      garden:    '🌿',
      clubhouse: '🏛️',
      tennis:    '🎾',
      kids:      '🎠',
      entrance:  '🚪',
    }
    return map[zone] || '📍'
  }

  // ── Load previously saved customer info ─────
  const saved = loadSavedCustomer()

  // ── Standard fields, seeded from (in order):
  //    localStorage saved info > Supabase customer ──
  const [name, setName] = useState(
    saved?.name || customer?.name || ''
  )

  // ── Country code: seeded from restaurant's
  //    default_country_code once it loads ──
  const [countryCode, setCountryCode] = useState(
    saved?.countryCode || '+1'
  )
  const [countryInitialized, setCountryInitialized] =
    useState(!!saved?.countryCode) // if we already
      // have a saved preference, don't override it

  useEffect(() => {
    if (countryInitialized) return
    if (!restaurant) return

    const restoDefault = restaurant.default_country_code
    if (restoDefault) {
      setCountryCode(restoDefault)
    } else if (isVenueMode) {
      setCountryCode('+20')
    }
    setCountryInitialized(true)
  }, [restaurant, isVenueMode, countryInitialized])

  const [localPhone, setLocalPhone] = useState(
    saved?.localPhone
      || normalizeDigits(
          session?.customer_phone
            ?.replace('whatsapp:', '')
            ?.replace(countryCode, '') || ''
        )
  )
  const [phoneTouched, setPhoneTouched] = useState(false)

  const currentCountry = COUNTRY_CODES.find(
    c => c.code === countryCode
  ) || COUNTRY_CODES[0]

  const phoneIsValid = currentCountry.validate(
    localPhone.replace(/^0+/, '')
  )

  const phoneErrorMsg = (() => {
    if (!phoneTouched) return ''
    if (!localPhone.trim())
      return t('phone_required', lang)
    if (!phoneIsValid)
      return lang === 'ar'
        ? `رقم غير صحيح لـ ${currentCountry.label} — جرّب صيغة مثل ${currentCountry.placeholder}`
        : lang === 'fr'
          ? `Numéro invalide pour ${currentCountry.label} — format attendu ${currentCountry.placeholder}`
          : `Invalid number for ${currentCountry.label} — expected format ${currentCountry.placeholder}`
    return ''
  })()

  function handlePhoneChange(e) {
    const cleaned = normalizeDigits(e.target.value)
    setLocalPhone(cleaned)
  }

  const [address, setAddress]   = useState(
    customer?.last_address || ''
  )
  const [apt, setApt]           = useState('')
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]     = useState({})

  function validate() {
    const e = {}
    setPhoneTouched(true)

    if (!name.trim())
      e.name    = t('name_required',    lang)

    if (!localPhone.trim()) {
      e.phone   = t('phone_required',   lang)
    } else if (!phoneIsValid) {
      e.phone   = phoneErrorMsg ||
        (lang === 'ar'
          ? 'رقم الهاتف غير صحيح'
          : lang === 'fr'
            ? 'Numéro de téléphone invalide'
            : 'Invalid phone number')
    }

    if (isVenueMode) {
      if (!selectedSpot) {
        e.spot  = t('spot_required', lang)
      }
    } else {
      if (!address.trim())
        e.address = t('address_required', lang)
    }

    setErrors(e)

    // Scroll to the spot section if that's
    // the (only) problem, since it's easy to miss
    if (e.spot && spotSectionRef) {
      spotSectionRef.scrollIntoView({
        behavior: 'smooth', block: 'center',
      })
    }

    return Object.keys(e).length === 0
  }

  async function handlePlaceOrder() {
    if (!validate()) return
    setSubmitting(true)

    try {
      const fullPhone =
        `${countryCode}${localPhone.replace(/^0+/, '')}`

      const orderPayload = {
        token:            session?.token || 'demo',
        restaurant_id:    restaurant?.id,
        customer_phone:   fullPhone,
        customer_name:    name,

        is_venue_order:   isVenueMode,
        venue_spot_id:    isVenueMode
          ? selectedSpot?.id : null,
        delivery_address: isVenueMode
          ? getSpotName(selectedSpot)
          : address + (apt ? `, ${apt}` : ''),
        spot_note:        isVenueMode ? spotNote : null,
        notes:            isVenueMode ? '' : notes,

        items: cart.map(item => ({
          itemId:    item.itemId,
          name:      item.name,
          name_fr:   item.name_fr,
          name_ar:   item.name_ar,
          options:   item.options,
          quantity:  item.quantity,
          unitPrice: item.unitPrice,
          total:     item.total,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        language: lang,
      }

      const response = await fetch(
        import.meta.env.VITE_N8N_WEBHOOK_URL,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || 'Order failed'
        )
      }

      // ── Remember name + phone for next visit ──
      saveCustomerInfo({ name, countryCode, localPhone })

      sessionStorage.setItem('orderNumber',
        result.orderNumber   || '0001')
      sessionStorage.setItem('estimatedTime',
        result.estimatedTime || '15-25 mins')
      sessionStorage.setItem('customerName', name)
      sessionStorage.setItem('twilioNumber',
        restaurant?.twilio_number || '')
      sessionStorage.setItem('lang', lang)
      sessionStorage.setItem('isVenueOrder',
        isVenueMode ? '1' : '0')
      sessionStorage.setItem('spotName',
        isVenueMode ? getSpotName(selectedSpot) : '')

      clearCart()
      navigate(paths.confirmation())

    } catch (err) {
      console.error('Order error:', err)
      setErrors({ submit: t('order_error', lang) })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Shared styles ──────────────────────────────
  const inputBase = {
    width:        '100%',
    padding:      '12px 16px',
    borderRadius: 14,
    fontSize:     14,
    color:        '#2D2A26',
    outline:      'none',
    boxSizing:    'border-box',
    fontFamily:   arabicFont === 'inherit'
      ? "'Inter', sans-serif" : arabicFont,
    textAlign:    rtl ? 'right' : 'left',
    direction:    rtl ? 'rtl' : 'ltr',
  }

  function inputStyle(hasError) {
    return {
      ...inputBase,
      border: hasError
        ? '1px solid #ef4444'
        : '1px solid rgba(45,42,38,0.12)',
      background: hasError
        ? '#fef2f2' : '#FFF8F0',
    }
  }

  function inputIconStyle(hasError) {
    return {
      ...inputStyle(hasError),
      [rtl ? 'paddingRight' : 'paddingLeft']: 42,
    }
  }

  const iconPos = {
    position:  'absolute',
    [rtl ? 'right' : 'left']: 14,
    top:       '50%',
    transform: 'translateY(-50%)',
    color:     '#2D2A26',
    opacity:   0.35,
    pointerEvents: 'none',
  }

  function sectionBoxStyle(hasError) {
    return {
      background:    'white',
      borderRadius:  20,
      padding:       20,
      border:        hasError
        ? '1.5px solid #ef4444'
        : '1px solid rgba(45,42,38,0.06)',
      display:       'flex',
      flexDirection: 'column',
      gap:           16,
    }
  }

  return (
    <div style={{
      height:        '100dvh',
      display:       'flex',
      flexDirection: 'column',
      background:    '#FFF8F0',
      overflow:      'hidden',
      maxWidth:      448,
      margin:        '0 auto',
      direction:     rtl ? 'rtl' : 'ltr',
    }}>

      {/* Header — never scrolls */}
      <div style={{
        flexShrink:   0,
        background:   '#FFF8F0',
        borderBottom: '1px solid rgba(45,42,38,0.08)',
        padding:      '14px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
      }}>
        <button
          onClick={() => navigate(paths.cart())}
          style={{
            width:          36,
            height:         36,
            borderRadius:   '50%',
            background:     'rgba(45,42,38,0.06)',
            border:         'none',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          <BackIcon size={20}
            style={{ color: '#2D2A26' }} />
        </button>

        <h1 style={{
          fontFamily: arabicFont === 'inherit'
            ? "'Fraunces', serif" : arabicFont,
          fontSize:   18,
          fontWeight: 600,
          color:      '#1A4D3E',
          margin:     0,
        }}>
          {isVenueMode
            ? t('your_order', lang)
            : t('delivery_details', lang)}
        </h1>
      </div>

      {/* Scrollable content — ONLY this scrolls */}
      <div style={{
        flex:          1,
        minHeight:     0,
        overflowY:     'auto',
        overflowX:     'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 140,
      }}>
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           12,
          padding:       16,
        }}>

          {/* Order summary banner */}
          <div style={{
            borderRadius:   20,
            padding:        16,
            background:     `${coral}10`,
            border:         `1px solid ${coral}20`,
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            flexDirection:  rtl ? 'row-reverse' : 'row',
          }}>
            <div style={{ textAlign: rtl ? 'right' : 'left' }}>
              <p style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:         coral,
                margin:        0,
              }}>
                {t('your_order', lang)}
              </p>
              <p style={{
                fontWeight: 700,
                fontSize:   14,
                color:      '#2D2A26',
                margin:     '4px 0 0',
                fontFamily: arabicFont,
              }}>
                {itemCount}{' '}
                {itemCount === 1
                  ? t('item', lang)
                  : t('items', lang)
                }
              </p>
            </div>
            <div style={{ textAlign: rtl ? 'left' : 'right' }}>
              <p style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:         coral,
                margin:        0,
              }}>
                {t('total', lang)}
              </p>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize:   18,
                color:      coral,
                margin:     '4px 0 0',
              }}>
                ${total.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Personal info */}
          <div style={sectionBoxStyle(false)}>
            <SectionTitle
              text={t('your_information', lang)}
              lang={lang}
            />

            {/* Name */}
            <Field
              label={t('full_name', lang)}
              error={errors.name}
              lang={lang}
            >
              <div style={{ position: 'relative' }}>
                <User size={16} style={iconPos} />
                <input
                  type="text"
                  value={name}
                  onChange={e =>
                    setName(e.target.value)
                  }
                  placeholder={
                    t('name_placeholder', lang)
                  }
                  style={inputIconStyle(!!errors.name)}
                />
              </div>
            </Field>

            {/* Phone — country code dropdown + number */}
            <Field
              label={t('phone_number', lang)}
              error={errors.phone || phoneErrorMsg}
              lang={lang}
            >
              <div style={{
                display:   'flex',
                gap:       8,
                direction: 'ltr',
              }}>
                {/* Country code dropdown */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <select
                    value={countryCode}
                    onChange={e => {
                      setCountryCode(e.target.value)
                      setCountryInitialized(true)
                      setPhoneTouched(false)
                    }}
                    style={{
                      appearance:   'none',
                      WebkitAppearance: 'none',
                      padding:      '12px 30px 12px 14px',
                      borderRadius: 14,
                      border:       '1px solid rgba(45,42,38,0.12)',
                      background:   '#FFF8F0',
                      fontSize:     14,
                      fontWeight:   600,
                      color:        '#2D2A26',
                      outline:      'none',
                      cursor:       'pointer',
                      fontFamily:   "'Inter', sans-serif",
                      minWidth:     92,
                    }}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <span style={{
                    position:      'absolute',
                    right:         10,
                    top:           '50%',
                    transform:     'translateY(-50%)',
                    pointerEvents: 'none',
                    fontSize:      10,
                    color:         '#2D2A26',
                    opacity:       0.4,
                  }}>
                    ▼
                  </span>
                </div>

                {/* Local phone number */}
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone size={16}
                    style={{
                      position:  'absolute',
                      left:      14,
                      top:       '50%',
                      transform: 'translateY(-50%)',
                      color:     '#2D2A26',
                      opacity:   0.35,
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="tel"
                    value={localPhone}
                    onChange={handlePhoneChange}
                    onBlur={() => setPhoneTouched(true)}
                    placeholder={currentCountry.placeholder}
                    inputMode="numeric"
                    lang="ar"
                    style={{
                      width:        '100%',
                      padding:      '12px 16px 12px 42px',
                      borderRadius: 14,
                      border:       (errors.phone || phoneErrorMsg)
                        ? '1px solid #ef4444'
                        : phoneTouched && phoneIsValid
                          ? '1px solid #2D6E5A'
                          : '1px solid rgba(45,42,38,0.12)',
                      background:   (errors.phone || phoneErrorMsg)
                        ? '#fef2f2' : '#FFF8F0',
                      fontSize:     14,
                      color:        '#2D2A26',
                      outline:      'none',
                      boxSizing:    'border-box',
                      fontFamily:   "'Inter', sans-serif",
                      textAlign:    'left',
                      direction:    'ltr',
                    }}
                  />
                  {phoneTouched && phoneIsValid && (
                    <span style={{
                      position:  'absolute',
                      right:     12,
                      top:       '50%',
                      transform: 'translateY(-50%)',
                      color:     '#2D6E5A',
                      fontSize:  16,
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </Field>
          </div>

          {/* ── VENUE MODE: Spot Picker ── */}
          {isVenueMode ? (
            <div
              ref={setSpotSectionRef}
              style={sectionBoxStyle(!!errors.spot)}
            >
              <SectionTitle
                text={t('your_location', lang)}
                lang={lang}
              />

              {spotsLoading ? (
                <p style={{
                  fontSize: 13,
                  color:    '#2D2A26',
                  opacity:  0.5,
                  fontFamily: arabicFont,
                }}>
                  {t('loading_menu_items', lang)}
                </p>
              ) : (
                <>
                  {errors.spot && (
                    <div style={{
                      background:   '#fef2f2',
                      border:       '1px solid #fecaca',
                      borderRadius: 12,
                      padding:      '10px 14px',
                      display:      'flex',
                      alignItems:   'center',
                      gap:          8,
                      flexDirection: rtl ? 'row-reverse' : 'row',
                    }}>
                      <span style={{ fontSize: 16 }}>⚠️</span>
                      <p style={{
                        fontSize:   13,
                        color:      '#ef4444',
                        margin:     0,
                        fontWeight: 600,
                        fontFamily: arabicFont,
                        textAlign:  rtl ? 'right' : 'left',
                      }}>
                        {errors.spot}
                      </p>
                    </div>
                  )}

                  <div style={{
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           8,
                  }}>
                    {spots.map(spot => {
                      const isSelected =
                        selectedSpot?.id === spot.id
                      return (
                        <button
                          key={spot.id}
                          onClick={() => {
                            setSelectedSpot(spot)
                            if (errors.spot) {
                              setErrors(prev => {
                                const next = { ...prev }
                                delete next.spot
                                return next
                              })
                            }
                          }}
                          style={{
                            padding:      '12px 16px',
                            borderRadius: 14,
                            border:       isSelected
                              ? `2px solid ${primary}`
                              : '1.5px solid rgba(45,42,38,.12)',
                            background:   isSelected
                              ? `${primary}10` : '#FFF8F0',
                            cursor:       'pointer',
                            textAlign:    rtl
                              ? 'right' : 'left',
                            display:      'flex',
                            alignItems:   'center',
                            gap:          10,
                            flexDirection: rtl
                              ? 'row-reverse' : 'row',
                            color:        '#2D2A26',
                            fontWeight:   isSelected
                              ? 600 : 400,
                            fontSize:     14,
                            fontFamily:   arabicFont,
                          }}
                        >
                          <span style={{ fontSize: 18 }}>
                            {getZoneEmoji(spot.zone)}
                          </span>
                          <span style={{ flex: 1 }}>
                            {getSpotName(spot)}
                          </span>
                          {isSelected && (
                            <span style={{
                              color:    primary,
                              fontSize: 18,
                            }}>
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Optional note */}
                  <Field
                    label={t('delivery_notes', lang)}
                    optional
                    lang={lang}
                  >
                    <input
                      type="text"
                      value={spotNote}
                      onChange={e =>
                        setSpotNote(e.target.value)
                      }
                      placeholder={
                        t('spot_note_placeholder', lang)
                      }
                      style={inputStyle(false)}
                    />
                  </Field>

                  {/* Venue delivery note */}
                  <div style={{
                    background:   `${primary}08`,
                    borderRadius: 12,
                    padding:      '10px 14px',
                    fontSize:     12,
                    color:        primary,
                    fontFamily:   arabicFont,
                    textAlign:    rtl ? 'right' : 'left',
                  }}>
                    📍 {t('venue_order_note', lang)}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── REGULAR MODE: Address ── */
            <div style={sectionBoxStyle(!!errors.address)}>
              <SectionTitle
                text={t('delivery_address', lang)}
                lang={lang}
              />

              <Field
                label={t('street_address', lang)}
                error={errors.address}
                lang={lang}
              >
                <div style={{ position: 'relative' }}>
                  <MapPin size={16}
                    style={{
                      ...iconPos,
                      top:       16,
                      transform: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={address}
                    onChange={e =>
                      setAddress(e.target.value)
                    }
                    placeholder={
                      t('street_placeholder', lang)
                    }
                    style={inputIconStyle(
                      !!errors.address
                    )}
                  />
                </div>
              </Field>

              <Field
                label={t('apt_unit', lang)}
                optional
                lang={lang}
              >
                <input
                  type="text"
                  value={apt}
                  onChange={e => setApt(e.target.value)}
                  placeholder={
                    t('apt_placeholder', lang)
                  }
                  style={inputStyle(false)}
                />
              </Field>

              <Field
                label={t('delivery_notes', lang)}
                optional
                lang={lang}
              >
                <textarea
                  value={notes}
                  onChange={e =>
                    setNotes(e.target.value)
                  }
                  placeholder={
                    t('notes_placeholder', lang)
                  }
                  rows={2}
                  style={{
                    ...inputStyle(false),
                    resize: 'none',
                  }}
                />
              </Field>
            </div>
          )}

          {/* Payment */}
          <div style={sectionBoxStyle(false)}>
            <SectionTitle
              text={t('payment', lang)}
              lang={lang}
            />
            <div style={{
              borderRadius: 14,
              padding:      '12px 16px',
              background:   'rgba(45,42,38,0.03)',
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              flexDirection: rtl ? 'row-reverse' : 'row',
            }}>
              <span style={{ fontSize: 24 }}>💵</span>
              <div style={{ textAlign: rtl ? 'right' : 'left' }}>
                <p style={{
                  fontWeight: 700,
                  fontSize:   14,
                  color:      '#2D2A26',
                  margin:     0,
                  fontFamily: arabicFont,
                }}>
                  {t('cash_on_delivery', lang)}
                </p>
                <p style={{
                  fontSize: 12,
                  color:    '#2D2A26',
                  opacity:  0.5,
                  margin:   '2px 0 0',
                  fontFamily: arabicFont,
                }}>
                  {t('cash_ready', lang)}{' '}
                  ${total.toFixed(2)}{' '}
                  {isVenueMode
                    ? t('order_ready_pickup', lang)
                    : t('cash_ready_suffix', lang)}
                </p>
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div style={sectionBoxStyle(false)}>
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           10,
            }}>
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                fontSize:       14,
                flexDirection:  rtl ? 'row-reverse' : 'row',
              }}>
                <span style={{
                  opacity: 0.55,
                  fontFamily: arabicFont,
                }}>
                  {t('subtotal', lang)}
                </span>
                <span style={{
                  fontFamily:
                    "'JetBrains Mono', monospace",
                }}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {!isVenueMode && (
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  fontSize:       14,
                  flexDirection:  rtl ? 'row-reverse' : 'row',
                }}>
                  <span style={{
                    opacity: 0.55,
                    fontFamily: arabicFont,
                  }}>
                    {t('delivery', lang)}
                  </span>
                  <span style={{
                    fontFamily:
                      "'JetBrains Mono', monospace",
                  }}>
                    ${deliveryFee.toFixed(2)}
                  </span>
                </div>
              )}

              <div style={{
                height:     1,
                background: 'rgba(45,42,38,0.06)',
              }} />

              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                fontWeight:     700,
                flexDirection:  rtl ? 'row-reverse' : 'row',
              }}>
                <span style={{
                  color: '#2D2A26',
                  fontFamily: arabicFont,
                }}>
                  {t('total', lang)}
                </span>
                <span style={{
                  fontFamily:
                    "'JetBrains Mono', monospace",
                  color:    primary,
                  fontSize: 18,
                }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div style={{
              borderRadius: 16,
              padding:      '12px 16px',
              background:   '#fef2f2',
              border:       '1px solid #fecaca',
              textAlign:    'center',
            }}>
              <p style={{
                fontSize: 13,
                color:    '#ef4444',
                margin:   0,
              }}>
                {errors.submit}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Place order button — fixed, outside scroll flow */}
      <div style={{
        flexShrink: 0,
        padding:    16,
        background: '#FFF8F0',
        borderTop:  '1px solid rgba(45,42,38,0.06)',
      }}>
        <button
          onClick={handlePlaceOrder}
          disabled={submitting}
          style={{
            width:          '100%',
            borderRadius:   18,
            padding:        '16px 24px',
            border:         'none',
            cursor:         submitting
              ? 'not-allowed' : 'pointer',
            fontWeight:     600,
            fontSize:       16,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            12,
            transition:     'all 0.2s',
            background:     submitting
              ? 'rgba(45,42,38,0.12)'
              : coral,
            color: submitting
              ? 'rgba(45,42,38,0.4)'
              : 'white',
            boxShadow: submitting
              ? 'none'
              : `0 8px 30px ${coral}44`,
          }}
        >
          {submitting ? (
            <>
              <div style={{
                width:          20,
                height:         20,
                borderRadius:   '50%',
                border:         '2px solid rgba(45,42,38,0.2)',
                borderTopColor: 'rgba(45,42,38,0.5)',
                animation:      'spin 0.8s linear infinite',
              }} />
              <span style={{ fontFamily: arabicFont }}>
                {t('placing_order', lang)}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontFamily: arabicFont }}>
                {t('place_order', lang)}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
              }}>
                ${total.toFixed(2)}
              </span>
            </>
          )}
        </button>

        <p style={{
          textAlign:  'center',
          fontSize:   11,
          color:      '#2D2A26',
          opacity:    0.35,
          margin:     '8px 0 0',
          fontFamily: arabicFont,
        }}>
          {t('terms', lang)}
        </p>
      </div>

    </div>
  )
}