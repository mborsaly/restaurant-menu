import { useState }               from 'react'
import { useNavigate }            from 'react-router-dom'
import { ChevronLeft, MapPin,
         User, Phone }            from 'lucide-react'
import { useCart }                from '../context/CartContext'
import { useSession }             from '../hooks/useSession'
import { t }                      from '../lib/translations'

// ── Field component OUTSIDE CheckoutScreen ──────
// Critical: if defined inside, it remounts on every
// keystroke causing inputs to lose focus
function Field({
  label, optional, error,
  lang, children,
}) {
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
      }}>
        {label}
        {optional && (
          <span style={{
            fontFamily:    'inherit',
            textTransform: 'none',
            fontWeight:    400,
            marginLeft:    6,
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
          marginTop: 4,
          margin:    '4px 0 0',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ── SectionTitle OUTSIDE CheckoutScreen ─────────
function SectionTitle({ text }) {
  return (
    <h3 style={{
      fontFamily: "'Fraunces', serif",
      fontSize:   16,
      fontWeight: 600,
      color:      '#1A4D3E',
      margin:     0,
    }}>
      {text}
    </h3>
  )
}

// ── Main component ───────────────────────────────
export default function CheckoutScreen() {
  const navigate     = useNavigate()
  const searchParams = window.location.search
  const {
    restaurant, customer,
    session, lang,
  } = useSession()
  const {
    cart, subtotal,
    itemCount, clearCart,
  } = useCart()

  const primary     = restaurant?.primary_color || '#1A4D3E'
  const coral       = '#FF7A47'
  const deliveryFee = restaurant?.delivery_fee  || 3.99
  const total       = subtotal + deliveryFee

  const [name, setName]         = useState(
    customer?.name || ''
  )
  const [phone, setPhone]       = useState(
    session?.customer_phone
      ?.replace('whatsapp:+', '+') || ''
  )
  const [address, setAddress]   = useState(
    customer?.last_address || ''
  )
  const [apt, setApt]           = useState('')
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]     = useState({})

  function validate() {
    const e = {}
    if (!name.trim())
      e.name    = t('name_required',    lang)
    if (!phone.trim())
      e.phone   = t('phone_required',   lang)
    if (!address.trim())
      e.address = t('address_required', lang)
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePlaceOrder() {
    if (!validate()) return
    setSubmitting(true)

    try {
      const orderPayload = {
        token:            session?.token || 'demo',
        restaurant_id:    restaurant?.id,
        customer_phone:   phone,
        customer_name:    name,
        delivery_address: address
          + (apt ? `, ${apt}` : ''),
        notes,
        items: cart.map(item => ({
          itemId:    item.itemId,
          name:      item.name,
          name_fr:   item.name_fr,
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

      sessionStorage.setItem('orderNumber',
        result.orderNumber   || '0001')
      sessionStorage.setItem('estimatedTime',
        result.estimatedTime || '35-45 mins')
      sessionStorage.setItem('customerName', name)
      sessionStorage.setItem('twilioNumber',
        restaurant?.twilio_number || '')
      sessionStorage.setItem('lang', lang)

      clearCart()
      navigate('/confirmation' + searchParams)

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
    fontFamily:   "'Inter', sans-serif",
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
      paddingLeft: 42,
    }
  }

  const iconPos = {
    position:  'absolute',
    left:      14,
    top:       '50%',
    transform: 'translateY(-50%)',
    color:     '#2D2A26',
    opacity:   0.35,
    pointerEvents: 'none',
  }

  const sectionBox = {
    background:    'white',
    borderRadius:  20,
    padding:       20,
    border:        '1px solid rgba(45,42,38,0.06)',
    display:       'flex',
    flexDirection: 'column',
    gap:           16,
  }

  return (
    <div style={{
      minHeight:     '100dvh',
      display:       'flex',
      flexDirection: 'column',
      background:    '#FFF8F0',
    }}>

      {/* Header */}
      <div style={{
        position:     'sticky',
        top:          0,
        zIndex:       10,
        background:   '#FFF8F0',
        borderBottom: '1px solid rgba(45,42,38,0.08)',
        padding:      '14px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
      }}>
        <button
          onClick={() =>
            navigate('/cart' + searchParams)
          }
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
          <ChevronLeft size={20}
            style={{ color: '#2D2A26' }} />
        </button>

        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize:   18,
          fontWeight: 600,
          color:      '#1A4D3E',
          margin:     0,
        }}>
          {t('delivery_details', lang)}
        </h1>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex:          1,
        overflowY:     'auto',
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
          }}>
            <div>
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
              }}>
                {itemCount}{' '}
                {itemCount === 1
                  ? t('item', lang)
                  : t('items', lang)
                }
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
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
          <div style={sectionBox}>
            <SectionTitle
              text={t('your_information', lang)}
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

            {/* Phone */}
            <Field
              label={t('phone_number', lang)}
              error={errors.phone}
              lang={lang}
            >
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={iconPos} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e =>
                    setPhone(e.target.value)
                  }
                  placeholder={
                    t('phone_placeholder', lang)
                  }
                  pattern=".*"
                  inputMode="tel"
                  style={inputIconStyle(!!errors.phone)}
                />
              </div>
            </Field>
          </div>

          {/* Delivery address */}
          <div style={sectionBox}>
            <SectionTitle
              text={t('delivery_address', lang)}
            />

            {/* Street */}
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

            {/* Apt */}
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

            {/* Notes */}
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

          {/* Payment */}
          <div style={sectionBox}>
            <SectionTitle
              text={t('payment', lang)}
            />
            <div style={{
              borderRadius: 14,
              padding:      '12px 16px',
              background:   'rgba(45,42,38,0.03)',
              display:      'flex',
              alignItems:   'center',
              gap:          12,
            }}>
              <span style={{ fontSize: 24 }}>💵</span>
              <div>
                <p style={{
                  fontWeight: 700,
                  fontSize:   14,
                  color:      '#2D2A26',
                  margin:     0,
                }}>
                  {t('cash_on_delivery', lang)}
                </p>
                <p style={{
                  fontSize: 12,
                  color:    '#2D2A26',
                  opacity:  0.5,
                  margin:   '2px 0 0',
                }}>
                  {t('cash_ready', lang)}{' '}
                  ${total.toFixed(2)}{' '}
                  {t('cash_ready_suffix', lang)}
                </p>
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div style={sectionBox}>
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           10,
            }}>
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                fontSize:       14,
              }}>
                <span style={{ opacity: 0.55 }}>
                  {t('subtotal', lang)}
                </span>
                <span style={{
                  fontFamily:
                    "'JetBrains Mono', monospace",
                }}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                fontSize:       14,
              }}>
                <span style={{ opacity: 0.55 }}>
                  {t('delivery', lang)}
                </span>
                <span style={{
                  fontFamily:
                    "'JetBrains Mono', monospace",
                }}>
                  ${deliveryFee.toFixed(2)}
                </span>
              </div>

              <div style={{
                height:     1,
                background: 'rgba(45,42,38,0.06)',
              }} />

              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                fontWeight:     700,
              }}>
                <span style={{ color: '#2D2A26' }}>
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

      {/* Place order button */}
      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        maxWidth:   448,
        margin:     '0 auto',
        padding:    16,
        background: '#FFF8F0',
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

      : '#FF7A47',

    color: submitting

      ? 'rgba(45,42,38,0.4)'

      : 'white',

    boxShadow: submitting

      ? 'none'

      : '0 8px 30px #FF7A4744',

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

      <span>{t('placing_order', lang)}</span>

    </>

  ) : (

    <>

      <span>{t('place_order', lang)}</span>

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
          marginTop:  8,
          margin:     '8px 0 0',
        }}>
          {t('terms', lang)}
        </p>
      </div>

    </div>
  )
}