import { useEffect, useState }     from 'react'
import { useNavigate }             from 'react-router-dom'
import { CheckCircle, Clock,
         Phone, MessageCircle }    from 'lucide-react'
import { useSession }              from '../hooks/useSession'
import { t, isRTL }                from '../lib/translations'

export default function ConfirmationScreen() {
  const navigate = useNavigate()
  const { restaurant, paths } = useSession()

  const lang        = sessionStorage.getItem('lang') || 'fr'
  const coral        = '#FF7A47'
  const sage          = '#2D6E5A'
  const primary        = restaurant?.primary_color || '#1A4D3E'
  const rtl             = isRTL(lang)
  const arabicFont = lang === 'ar'
    ? "'Noto Naskh Arabic', serif" : 'inherit'

  const isVenueOrder = sessionStorage.getItem('isVenueOrder') === '1'
  const spotName      = sessionStorage.getItem('spotName') || ''

  const [orderNumber, setOrderNumber]     = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [customerName, setCustomerName]   = useState('')
  const [countdown, setCountdown]         = useState(4)
  const [isWhatsApp, setIsWhatsApp]       = useState(false)
  const [isDesktop, setIsDesktop]         = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsWhatsApp(/WhatsApp/i.test(ua))
    setIsDesktop(
      !/Android|iPhone|iPad|iPod/i.test(ua)
    )
  }, [])

  useEffect(() => {
    setOrderNumber(
      sessionStorage.getItem('orderNumber')   || '0001'
    )
    setEstimatedTime(
      sessionStorage.getItem('estimatedTime') || '15-25 mins'
    )
    setCustomerName(
      sessionStorage.getItem('customerName')  || ''
    )
  }, [])

  useEffect(() => {
    if (!isWhatsApp || isVenueOrder) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          const twilioNumber =
            restaurant?.twilio_number
              ?.replace(/\D/g, '') || ''
          window.location.href = twilioNumber
            ? `https://wa.me/${twilioNumber}`
            : 'whatsapp://'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isWhatsApp, restaurant, isVenueOrder])

  function handleReturnToWhatsApp() {
    const twilioNumber =
      restaurant?.twilio_number
        ?.replace(/\D/g, '') || ''
    window.location.href = twilioNumber
      ? `https://wa.me/${twilioNumber}`
      : 'whatsapp://'
  }

  function InfoCard({ bg, border, icon, label, labelColor, value }) {
    return (
      <div style={{
        borderRadius: 20,
        padding:      '16px 20px',
        background:   bg,
        border:       `1px solid ${border}`,
        display:      'flex',
        alignItems:   'center',
        gap:          16,
        flexDirection: rtl ? 'row-reverse' : 'row',
      }}>
        <div style={{
          width:          40,
          height:         40,
          borderRadius:   '50%',
          background:     border,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}>
          {icon}
        </div>
        <div style={{ textAlign: rtl ? 'right' : 'left' }}>
          <p style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color:         labelColor,
            margin:        0,
          }}>
            {label}
          </p>
          <p style={{
            fontWeight: 700,
            fontSize:   14,
            color:      '#2D2A26',
            margin:     '3px 0 0',
            fontFamily: arabicFont,
          }}>
            {value}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:  '100dvh',
      display:    'flex',
      flexDirection: 'column',
      background: '#FFF8F0',
      direction:  rtl ? 'rtl' : 'ltr',
    }}>
      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        32,
        textAlign:      'center',
      }}>

        {/* Ringwave checkmark */}
        <div style={{
          position:       'relative',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   32,
        }}>
          {[1, 2].map(i => (
            <div
              key={i}
              style={{
                position:     'absolute',
                width:        112,
                height:       112,
                borderRadius: '50%',
                border:       `1.5px solid ${sage}`,
                animation:    `ringwave 2.5s
                  cubic-bezier(0.2,0.6,0.4,1)
                  ${i * 0.9}s infinite`,
              }}
            />
          ))}
          <div style={{
            width:          112,
            height:         112,
            borderRadius:   '50%',
            background:     `${sage}18`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         1,
          }}>
            <div style={{
              width:          80,
              height:         80,
              borderRadius:   '50%',
              background:     `${sage}28`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <CheckCircle
                size={44}
                strokeWidth={1.5}
                style={{ color: sage }}
              />
            </div>
          </div>
          <div style={{
            position:  'absolute',
            top:       -4,
            [rtl ? 'left' : 'right']: -4,
            fontSize:  28,
            animation: 'bounce 1s infinite',
          }}>
            🎉
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily:   arabicFont === 'inherit'
            ? "'Fraunces', serif" : arabicFont,
          fontSize:     28,
          fontWeight:   600,
          color:        '#1A4D3E',
          marginBottom: 6,
          letterSpacing: lang === 'ar' ? 0 : '-0.01em',
        }}>
          {t('order_confirmed', lang)}
        </h1>

        {customerName && (
          <p style={{
            fontSize:     14,
            color:        '#2D2A26',
            opacity:      0.6,
            marginBottom: 4,
            fontFamily:   arabicFont,
          }}>
            {t('thank_you', lang)},{' '}
            {customerName.split(' ')[0]}!
          </p>
        )}

        {/* Order number */}
        <div style={{
          background:   'white',
          border:       '1px solid rgba(45,42,38,0.06)',
          borderRadius: 20,
          padding:      '16px 40px',
          margin:       '20px 0 28px',
        }}>
          <p style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         '#2D2A26',
            opacity:       0.4,
            margin:        '0 0 4px',
          }}>
            {t('order_number', lang)}
          </p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   36,
            fontWeight: 700,
            color:      coral,
            margin:     0,
          }}>
            #{orderNumber}
          </p>
        </div>

        {/* Info cards */}
        <div style={{
          width:         '100%',
          display:       'flex',
          flexDirection: 'column',
          gap:           10,
          marginBottom:  24,
        }}>
          <InfoCard
            bg={`${coral}10`}
            border={`${coral}25`}
            labelColor={coral}
            label={t('estimated_delivery', lang)}
            value={estimatedTime}
            icon={
              <Clock size={18}
                style={{ color: coral }} />
            }
          />

          {isVenueOrder ? (
            <InfoCard
              bg="rgba(59,130,246,0.06)"
              border="rgba(59,130,246,0.2)"
              labelColor="#3b82f6"
              label={t('your_location', lang)}
              value={spotName}
              icon={
                <span style={{ fontSize: 18 }}>📍</span>
              }
            />
          ) : (
            <InfoCard
              bg="rgba(59,130,246,0.06)"
              border="rgba(59,130,246,0.2)"
              labelColor="#3b82f6"
              label={t('on_the_way', lang)}
              value={t('driver_call', lang)}
              icon={
                <Phone size={18}
                  style={{ color: '#3b82f6' }} />
              }
            />
          )}

          <InfoCard
            bg={`${sage}10`}
            border={`${sage}25`}
            labelColor={sage}
            label={t('whatsapp_confirmation', lang)}
            value={t('check_whatsapp', lang)}
            icon={
              <span style={{ fontSize: 18 }}>
                💬
              </span>
            }
          />
        </div>

        {/* WhatsApp countdown — only for WhatsApp-origin, non-venue orders */}
        {isWhatsApp && !isVenueOrder && (
          <>
            <div style={{
              width:        '100%',
              borderRadius: 20,
              padding:      '12px 20px',
              background:   `${sage}10`,
              border:       `1px solid ${sage}20`,
              marginBottom: 12,
              textAlign:    'center',
            }}>
              <p style={{
                fontSize: 14,
                color:    sage,
                margin:   '0 0 8px',
                fontFamily: arabicFont,
              }}>
                {t('returning_whatsapp', lang)}
                {' '}
                <strong>{countdown}</strong>
                {' '}
                {t('seconds', lang)}
              </p>
              <div style={{
                height:       6,
                borderRadius: 3,
                background:   `${sage}20`,
                overflow:     'hidden',
              }}>
                <div style={{
                  height:     '100%',
                  borderRadius: 3,
                  background:  sage,
                  width:       `${(countdown / 4) * 100}%`,
                  transition:  'width 1s linear',
                }} />
              </div>
            </div>

            <button
              onClick={handleReturnToWhatsApp}
              style={{
                width:          '100%',
                borderRadius:   18,
                padding:        '16px 24px',
                background:     sage,
                boxShadow:      `0 8px 24px ${sage}44`,
                border:         'none',
                cursor:         'pointer',
                color:          'white',
                fontWeight:     600,
                fontSize:       15,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            10,
                marginBottom:   12,
              }}
            >
              <MessageCircle size={20} />
              <span style={{ fontFamily: arabicFont }}>
                {t('return_whatsapp', lang)}
              </span>
            </button>
          </>
        )}

        {/* Order again — venue orders or non-WhatsApp origin */}
        {(!isWhatsApp || isVenueOrder) && (
          <button
            onClick={() => navigate(paths.menu())}
            style={{
              width:        '100%',
              borderRadius: 18,
              padding:      '16px 24px',
              background:   coral,
              boxShadow:    `0 8px 24px ${coral}44`,
              border:       'none',
              cursor:       'pointer',
              color:        'white',
              fontWeight:   600,
              fontSize:     15,
              marginBottom: 12,
              fontFamily:   arabicFont,
            }}
          >
            {t('order_again', lang)}
          </button>
        )}

        {/* Desktop message */}
        {isDesktop && !isVenueOrder && (
          <div style={{
            borderRadius: 16,
            padding:      '12px 20px',
            background:   'rgba(45,42,38,0.04)',
          }}>
            <p style={{
              fontSize: 13,
              color:    '#2D2A26',
              opacity:  0.5,
              margin:   0,
              fontFamily: arabicFont,
            }}>
              {t('check_whatsapp_desktop', lang)}
            </p>
          </div>
        )}

        {/* BistroVite footer */}
        <div style={{
          marginTop:  24,
          fontFamily: "'Fraunces', serif",
          fontSize:   13,
          color:      '#2D2A26',
          opacity:    0.3,
        }}>
          Bistro
          <span style={{
            fontStyle: 'italic',
            color:     coral,
            opacity:   1,
          }}>
            Vite
          </span>
        </div>

      </div>
    </div>
  )
}