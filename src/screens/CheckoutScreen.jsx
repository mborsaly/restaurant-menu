import { useState }           from 'react'
import { useNavigate }        from 'react-router-dom'
import { ChevronLeft,
         MapPin, User, Phone } from 'lucide-react'
import { useCart }            from '../context/CartContext'
import { useSession }         from '../hooks/useSession'
import { t }                  from '../lib/translations'

export default function CheckoutScreen() {
  const navigate     = useNavigate()
  const searchParams = window.location.search
  const { restaurant, customer, session, lang }
    = useSession()
  const { cart, subtotal, itemCount, clearCart }
    = useCart()

  const primary     = restaurant?.primary_color || '#1A4D3E'
  const coral       = '#FF7A47'
  const deliveryFee = restaurant?.delivery_fee  || 3.99
  const total       = subtotal + deliveryFee

  const [name, setName]       = useState(
    customer?.name || ''
  )
  const [phone, setPhone]     = useState(
    session?.customer_phone
      ?.replace('whatsapp:+', '+') || ''
  )
  const [address, setAddress] = useState(
    customer?.last_address || ''
  )
  const [apt, setApt]         = useState('')
  const [notes, setNotes]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]   = useState({})

  function validate() {
    const newErrors = {}
    if (!name.trim())
      newErrors.name    = t('name_required', lang)
    if (!phone.trim())
      newErrors.phone   = t('phone_required', lang)
    if (!address.trim())
      newErrors.address = t('address_required', lang)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(orderPayload),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Order failed')
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

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: '#FFF8F0' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b
                      px-4 py-4 flex items-center
                      gap-3"
           style={{
             background:  '#FFF8F0',
             borderColor: 'rgba(45,42,38,0.08)',
           }}>
        <button
          onClick={() =>
            navigate('/cart' + searchParams)
          }
          className="w-9 h-9 rounded-full
                     flex items-center justify-center
                     active:scale-95 transition-all"
          style={{
            background: 'rgba(45,42,38,0.06)',
          }}
        >
          <ChevronLeft size={20}
            style={{ color: '#2D2A26' }} />
        </button>
        <h1 className="font-bold text-lg"
            style={{
              fontFamily: "'Fraunces', serif",
              color:      '#1A4D3E',
            }}>
          {t('delivery_details', lang)}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-40">

        {/* Order summary banner */}
        <div className="mx-3 mt-3 rounded-2xl p-4"
             style={{
               background: `${coral}10`,
               border:     `1px solid ${coral}20`,
             }}>
          <div className="flex justify-between
                          items-center">
            <div>
              <p className="text-xs font-semibold"
                 style={{
                   color:        coral,
                   fontFamily:
                     "'JetBrains Mono', monospace",
                   letterSpacing: '0.06em',
                   textTransform: 'uppercase',
                 }}>
                {t('your_order', lang)}
              </p>
              <p className="font-bold text-sm mt-0.5"
                 style={{ color: '#2D2A26' }}>
                {itemCount}{' '}
                {itemCount === 1
                  ? t('item', lang)
                  : t('items', lang)
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold"
                 style={{
                   color:        coral,
                   fontFamily:
                     "'JetBrains Mono', monospace",
                   letterSpacing: '0.06em',
                   textTransform: 'uppercase',
                 }}>
                {t('total', lang)}
              </p>
              <p className="font-bold text-lg mt-0.5"
                 style={{
                   fontFamily:
                     "'JetBrains Mono', monospace",
                   color: coral,
                 }}>
                ${total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white mt-3 mx-3
                        rounded-2xl p-5 space-y-4"
             style={{
               border:
                 '1px solid rgba(45,42,38,0.06)',
             }}>
          <h3 className="font-bold"
              style={{
                fontFamily: "'Fraunces', serif",
                color:      '#1A4D3E',
              }}>
            {t('your_information', lang)}
          </h3>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold
                              uppercase tracking-wide
                              mb-1.5 block"
                   style={{
                     fontFamily:
                       "'JetBrains Mono', monospace",
                     color:   '#2D2A26',
                     opacity: 0.5,
                   }}>
              {t('full_name', lang)}
            </label>
            <div className="relative">
              <User size={16}
                className="absolute left-3
                           top-1/2 -translate-y-1/2"
                style={{
                  color:   '#2D2A26',
                  opacity: 0.35,
                }}
              />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={
                  t('name_placeholder', lang)
                }
                className="w-full pl-9 pr-4 py-3
                           rounded-xl text-sm
                           outline-none transition-colors"
                style={{
                  border:     errors.name
                    ? '1px solid #ef4444'
                    : '1px solid rgba(45,42,38,0.12)',
                  background: errors.name
                    ? '#fef2f2' : '#FFF8F0',
                  color: '#2D2A26',
                }}
              />
            </div>
            {errors.name && (
              <p className="text-xs mt-1"
                 style={{ color: '#ef4444' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold
                              uppercase tracking-wide
                              mb-1.5 block"
                   style={{
                     fontFamily:
                       "'JetBrains Mono', monospace",
                     color:   '#2D2A26',
                     opacity: 0.5,
                   }}>
              {t('phone_number', lang)}
            </label>
            <div className="relative">
              <Phone size={16}
                className="absolute left-3
                           top-1/2 -translate-y-1/2"
                style={{
                  color:   '#2D2A26',
                  opacity: 0.35,
                }}
              />
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
                className="w-full pl-9 pr-4 py-3
                           rounded-xl text-sm
                           outline-none transition-colors"
                style={{
                  border:     errors.phone
                    ? '1px solid #ef4444'
                    : '1px solid rgba(45,42,38,0.12)',
                  background: errors.phone
                    ? '#fef2f2' : '#FFF8F0',
                  color: '#2D2A26',
                }}
              />
            </div>
            {errors.phone && (
              <p className="text-xs mt-1"
                 style={{ color: '#ef4444' }}>
                {errors.phone}
              </p>
            )}
          </div>

        </div>

        {/* Delivery address */}
        <div className="bg-white mt-3 mx-3
                        rounded-2xl p-5 space-y-4"
             style={{
               border:
                 '1px solid rgba(45,42,38,0.06)',
             }}>
          <h3 className="font-bold"
              style={{
                fontFamily: "'Fraunces', serif",
                color:      '#1A4D3E',
              }}>
            {t('delivery_address', lang)}
          </h3>

          {/* Street */}
          <div>
            <label className="text-xs font-semibold
                              uppercase tracking-wide
                              mb-1.5 block"
                   style={{
                     fontFamily:
                       "'JetBrains Mono', monospace",
                     color:   '#2D2A26',
                     opacity: 0.5,
                   }}>
              {t('street_address', lang)}
            </label>
            <div className="relative">
              <MapPin size={16}
                className="absolute left-3 top-3.5"
                style={{
                  color:   '#2D2A26',
                  opacity: 0.35,
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
                className="w-full pl-9 pr-4 py-3
                           rounded-xl text-sm
                           outline-none transition-colors"
                style={{
                  border:     errors.address
                    ? '1px solid #ef4444'
                    : '1px solid rgba(45,42,38,0.12)',
                  background: errors.address
                    ? '#fef2f2' : '#FFF8F0',
                  color: '#2D2A26',
                }}
              />
            </div>
            {errors.address && (
              <p className="text-xs mt-1"
                 style={{ color: '#ef4444' }}>
                {errors.address}
              </p>
            )}
          </div>

          {/* Apt */}
          <div>
            <label className="text-xs font-semibold
                              uppercase tracking-wide
                              mb-1.5 block"
                   style={{
                     fontFamily:
                       "'JetBrains Mono', monospace",
                     color:   '#2D2A26',
                     opacity: 0.5,
                   }}>
              {t('apt_unit', lang)}
              <span className="ml-1 normal-case
                               font-normal"
                    style={{ opacity: 0.5 }}>
                ({t('optional', lang)})
              </span>
            </label>
            <input
              type="text"
              value={apt}
              onChange={e => setApt(e.target.value)}
              placeholder={t('apt_placeholder', lang)}
              className="w-full px-4 py-3 rounded-xl
                         text-sm outline-none
                         transition-colors"
              style={{
                border:
                  '1px solid rgba(45,42,38,0.12)',
                background: '#FFF8F0',
                color:      '#2D2A26',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold
                              uppercase tracking-wide
                              mb-1.5 block"
                   style={{
                     fontFamily:
                       "'JetBrains Mono', monospace",
                     color:   '#2D2A26',
                     opacity: 0.5,
                   }}>
              {t('delivery_notes', lang)}
              <span className="ml-1 normal-case
                               font-normal"
                    style={{ opacity: 0.5 }}>
                ({t('optional', lang)})
              </span>
            </label>
            <textarea
              value={notes}
              onChange={e =>
                setNotes(e.target.value)
              }
              placeholder={
                t('notes_placeholder', lang)
              }
              rows={2}
              className="w-full px-4 py-3 rounded-xl
                         text-sm outline-none
                         transition-colors resize-none"
              style={{
                border:
                  '1px solid rgba(45,42,38,0.12)',
                background: '#FFF8F0',
                color:      '#2D2A26',
              }}
            />
          </div>

        </div>

        {/* Payment */}
        <div className="bg-white mt-3 mx-3
                        rounded-2xl p-5"
             style={{
               border:
                 '1px solid rgba(45,42,38,0.06)',
             }}>
          <h3 className="font-bold mb-3"
              style={{
                fontFamily: "'Fraunces', serif",
                color:      '#1A4D3E',
              }}>
            {t('payment', lang)}
          </h3>
          <div className="rounded-xl px-4 py-3
                          flex items-center gap-3"
               style={{
                 background:
                   'rgba(45,42,38,0.03)',
               }}>
            <span className="text-2xl">💵</span>
            <div>
              <p className="text-sm font-semibold"
                 style={{ color: '#2D2A26' }}>
                {t('cash_on_delivery', lang)}
              </p>
              <p className="text-xs mt-0.5"
                 style={{
                   color:   '#2D2A26',
                   opacity: 0.5,
                 }}>
                {t('cash_ready', lang)}{' '}
                ${total.toFixed(2)}{' '}
                {t('cash_ready_suffix', lang)}
              </p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white mt-3 mx-3
                        rounded-2xl p-5"
             style={{
               border:
                 '1px solid rgba(45,42,38,0.06)',
             }}>
          <div className="space-y-2">
            <div className="flex justify-between
                            text-sm">
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
            <div className="flex justify-between
                            text-sm">
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
            <div className="h-px"
                 style={{
                   background:
                     'rgba(45,42,38,0.06)',
                 }} />
            <div className="flex justify-between
                            font-bold">
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
          <div className="mx-3 mt-3 rounded-2xl
                          px-4 py-3"
               style={{
                 background: '#fef2f2',
                 border:     '1px solid #fecaca',
               }}>
            <p className="text-sm text-center"
               style={{ color: '#ef4444' }}>
              {errors.submit}
            </p>
          </div>
        )}

      </div>

      {/* Place order button */}
      <div className="fixed bottom-0 left-0 right-0
                      max-w-md mx-auto p-4"
           style={{ background: '#FFF8F0' }}>
        <button
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="w-full rounded-2xl py-4 px-6
                     font-semibold flex items-center
                     justify-center gap-3
                     transition-all active:scale-95"
          style={submitting ? {
            background: 'rgba(45,42,38,0.12)',
            color:      'rgba(45,42,38,0.4)',
            cursor:     'not-allowed',
          } : {
            background: coral,
            color:      'white',
            boxShadow:  `0 8px 30px ${coral}44`,
          }}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2
                              rounded-full
                              animate-spin"
                   style={{
                     borderColor:
                       'rgba(45,42,38,0.2)',
                     borderTopColor:
                       'rgba(45,42,38,0.5)',
                   }} />
              <span>
                {t('placing_order', lang)}
              </span>
            </>
          ) : (
            <>
              <span>
                {t('place_order', lang)}
              </span>
              <span style={{
                fontFamily:
                  "'JetBrains Mono', monospace",
                fontWeight: 700,
              }}>
                ${total.toFixed(2)}
              </span>
            </>
          )}
        </button>

        <p className="text-center text-xs mt-2"
           style={{ color: '#2D2A26', opacity: 0.35 }}>
          {t('terms', lang)}
        </p>
      </div>

    </div>
  )
}