import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import { CheckCircle, Clock,
         Phone, MessageCircle } from 'lucide-react'
import { useSession }          from '../hooks/useSession'

export default function ConfirmationScreen() {
  const navigate     = useNavigate()
  const searchParams = window.location.search
  const { restaurant } = useSession()

  const primary = restaurant?.primary_color || '#1A4D3E'
  const coral   = '#FF7A47'
  const sage    = '#2D6E5A'

  const [orderNumber, setOrderNumber]     = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [customerName, setCustomerName]   = useState('')
  const [countdown, setCountdown]         = useState(4)
  const [isWhatsApp, setIsWhatsApp]       = useState(false)
  const [isDesktop, setIsDesktop]         = useState(false)

  // Detect platform
  useEffect(() => {
    const ua = navigator.userAgent
    setIsWhatsApp(/WhatsApp/i.test(ua))
    setIsDesktop(!/Android|iPhone|iPad|iPod/i.test(ua))
  }, [])

  // Load order data from sessionStorage
  useEffect(() => {
    setOrderNumber(
      sessionStorage.getItem('orderNumber')    || '0001'
    )
    setEstimatedTime(
      sessionStorage.getItem('estimatedTime')  || '35-45 mins'
    )
    setCustomerName(
      sessionStorage.getItem('customerName')   || ''
    )
  }, [])

  // Auto-return to WhatsApp if opened from WhatsApp
  useEffect(() => {
    if (!isWhatsApp) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          const twilioNumber = restaurant?.twilio_number
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
  }, [isWhatsApp, restaurant])

  function handleReturnToWhatsApp() {
    const twilioNumber = restaurant?.twilio_number
      ?.replace(/\D/g, '') || ''
    window.location.href = twilioNumber
      ? `https://wa.me/${twilioNumber}`
      : 'whatsapp://'
  }

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: '#FFF8F0' }}>

      <div className="flex-1 flex flex-col
                      items-center justify-center
                      p-8 text-center">

        {/* Animated checkmark with ringwave */}
        <div className="relative flex items-center
                        justify-center mb-8">

          {/* Outer ringwave rings */}
          {[1, 2].map(i => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 112, height: 112,
                border: `1.5px solid ${sage}`,
                animation: `ringwave 2.5s
                  cubic-bezier(0.2,0.6,0.4,1)
                  ${i * 0.9}s infinite`,
              }}
            />
          ))}

          {/* Core circle */}
          <div className="w-28 h-28 rounded-full
                          flex items-center
                          justify-center z-10"
               style={{
                 background: `${sage}18`,
               }}>
            <div className="w-20 h-20 rounded-full
                            flex items-center
                            justify-center"
                 style={{ background: `${sage}28` }}>
              <CheckCircle
                size={48}
                strokeWidth={1.5}
                style={{ color: sage }}
              />
            </div>
          </div>

          {/* Floating emoji */}
          <div className="absolute -top-2 -right-2
                          text-3xl animate-bounce">
            🎉
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold mb-2"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              color: '#1A4D3E',
              letterSpacing: '-0.01em',
            }}>
          Order Confirmed!
        </h1>

        {customerName && (
          <p className="text-sm mb-1"
             style={{ color: '#2D2A26', opacity: 0.6 }}>
            Thank you,{' '}
            {customerName.split(' ')[0]}!
          </p>
        )}

        {/* Order number */}
        <div className="rounded-2xl px-8 py-4
                        mb-8 mt-4"
             style={{
               background: 'white',
               border: '1px solid rgba(45,42,38,0.06)',
             }}>
          <p className="text-xs uppercase
                        tracking-widest mb-1"
             style={{
               fontFamily:
                 "'JetBrains Mono', monospace",
               color: '#2D2A26',
               opacity: 0.4,
             }}>
            Order Number
          </p>
          <p className="font-bold"
             style={{
               fontFamily:
                 "'JetBrains Mono', monospace",
               fontSize: 36,
               color: coral,
             }}>
            #{orderNumber}
          </p>
        </div>

        {/* Info cards */}
        <div className="w-full space-y-3 mb-8">

          {/* Estimated time */}
          <div className="rounded-2xl px-5 py-4
                          flex items-center gap-4"
               style={{
                 background: `${coral}10`,
                 border: `1px solid ${coral}20`,
               }}>
            <div className="w-10 h-10 rounded-full
                            flex items-center
                            justify-center flex-shrink-0"
                 style={{ background: `${coral}20` }}>
              <Clock size={20}
                     style={{ color: coral }} />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold"
                 style={{
                   fontFamily:
                     "'JetBrains Mono', monospace",
                   color: coral,
                   letterSpacing: '0.06em',
                   textTransform: 'uppercase',
                 }}>
                Estimated Delivery
              </p>
              <p className="font-bold text-sm mt-0.5"
                 style={{ color: '#2D2A26' }}>
                {estimatedTime}
              </p>
            </div>
          </div>

          {/* Driver call */}
          <div className="rounded-2xl px-5 py-4
                          flex items-center gap-4"
               style={{
                 background: 'rgba(59,130,246,0.06)',
                 border: '1px solid rgba(59,130,246,0.15)',
               }}>
            <div className="w-10 h-10 rounded-full
                            flex items-center
                            justify-center flex-shrink-0"
                 style={{
                   background: 'rgba(59,130,246,0.12)',
                 }}>
              <Phone size={20}
                     style={{ color: '#3b82f6' }} />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold"
                 style={{
                   fontFamily:
                     "'JetBrains Mono', monospace",
                   color: '#3b82f6',
                   letterSpacing: '0.06em',
                   textTransform: 'uppercase',
                 }}>
                On the way
              </p>
              <p className="font-bold text-sm mt-0.5"
                 style={{ color: '#2D2A26' }}>
                Driver will call when nearby
              </p>
            </div>
          </div>

          {/* WhatsApp confirmation */}
          <div className="rounded-2xl px-5 py-4
                          flex items-center gap-4"
               style={{
                 background: `${sage}10`,
                 border: `1px solid ${sage}25`,
               }}>
            <div className="w-10 h-10 rounded-full
                            flex items-center
                            justify-center
                            flex-shrink-0 text-xl"
                 style={{ background: `${sage}20` }}>
              💬
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold"
                 style={{
                   fontFamily:
                     "'JetBrains Mono', monospace",
                   color: sage,
                   letterSpacing: '0.06em',
                   textTransform: 'uppercase',
                 }}>
                WhatsApp Confirmation
              </p>
              <p className="font-bold text-sm mt-0.5"
                 style={{ color: '#2D2A26' }}>
                Check your WhatsApp for details
              </p>
            </div>
          </div>

        </div>

        {/* WhatsApp — countdown + return button */}
        {isWhatsApp && (
          <>
            <div className="w-full rounded-2xl
                            px-5 py-3 mb-4 text-center"
                 style={{
                   background: `${sage}10`,
                   border: `1px solid ${sage}20`,
                 }}>
              <p className="text-sm"
                 style={{ color: sage }}>
                Returning to WhatsApp in
                <span className="font-bold text-lg mx-1"
                      style={{ color: sage }}>
                  {countdown}
                </span>
                seconds...
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full
                              overflow-hidden"
                   style={{
                     background: `${sage}20`,
                   }}>
                <div
                  className="h-full rounded-full
                             transition-all duration-1000"
                  style={{
                    width: `${(countdown / 4) * 100}%`,
                    background: sage,
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleReturnToWhatsApp}
              className="w-full rounded-2xl py-4 px-6
                         font-semibold text-white
                         flex items-center
                         justify-center gap-3 mb-3
                         active:scale-95 transition-all"
              style={{
                background: sage,
                boxShadow: `0 8px 24px ${sage}44`,
              }}
            >
              <MessageCircle size={20} />
              <span>Return to WhatsApp</span>
            </button>
          </>
        )}

        {/* Mobile or Desktop — order again */}
        {!isWhatsApp && (
          <button
            onClick={() =>
              navigate('/menu' + searchParams)
            }
            className="w-full rounded-2xl py-4 px-6
                       font-semibold text-white
                       active:scale-95 transition-all
                       mb-3"
            style={{
              background: coral,
              boxShadow: `0 8px 24px ${coral}44`,
            }}
          >
            Order Again 🍕
          </button>
        )}

        {/* Desktop message */}
        {isDesktop && (
          <div className="rounded-2xl px-5 py-3
                          text-center"
               style={{
                 background: 'rgba(45,42,38,0.04)',
               }}>
            <p className="text-sm"
               style={{
                 color: '#2D2A26',
                 opacity: 0.5,
               }}>
              📱 Check your WhatsApp for
              order confirmation
            </p>
          </div>
        )}

        {/* BistroVite footer */}
        <div className="mt-8"
             style={{
               fontFamily:
                 "'Fraunces', Georgia, serif",
               fontSize: 14,
               color: '#2D2A26',
               opacity: 0.3,
             }}>
          Bistro
          <span style={{
            fontStyle: 'italic',
            color: coral,
            opacity: 1,
          }}>Vite</span>
        </div>

      </div>

    </div>
  )
}