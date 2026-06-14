import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Phone, MessageCircle } from 'lucide-react'
import { useSession } from '../hooks/useSession'

export default function ConfirmationScreen() {
  const navigate = useNavigate()
  const searchParams = window.location.search
  const { restaurant } = useSession()

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

  // Load order data
  useEffect(() => {
    setOrderNumber(sessionStorage.getItem('orderNumber')     || '0001')
    setEstimatedTime(sessionStorage.getItem('estimatedTime') || '35-45 mins')
    setCustomerName(sessionStorage.getItem('customerName')   || '')
  }, [])

  // Build return URL using Twilio number
  function getWhatsAppReturnUrl() {
    const twilioNumber = restaurant?.twilio_number
      || sessionStorage.getItem('twilioNumber')
      || ''

    // Clean to digits only
    const clean = twilioNumber.replace(/\D/g, '')
    return clean
      ? `https://wa.me/${clean}`
      : 'whatsapp://'
  }

  function returnToWhatsApp() {
    window.location.href = getWhatsAppReturnUrl()
  }

  // Auto countdown and return if from WhatsApp
  useEffect(() => {
    if (!isWhatsApp) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          returnToWhatsApp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isWhatsApp, restaurant])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center
                      justify-center p-8 text-center">

        {/* Animated checkmark */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-green-50
                          flex items-center justify-center
                          animate-pulse">
            <div className="w-20 h-20 rounded-full bg-green-100
                            flex items-center justify-center">
              <CheckCircle
                size={48}
                className="text-green-500"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 text-3xl
                          animate-bounce">
            🎉
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>

        {customerName && (
          <p className="text-gray-500 text-sm mb-1">
            Thank you, {customerName.split(' ')[0]}!
          </p>
        )}

        {/* Order number */}
        <div className="bg-gray-50 rounded-2xl px-8 py-4
                        mb-8 mt-4">
          <p className="text-xs text-gray-400 uppercase
                        tracking-widest mb-1">
            Order Number
          </p>
          <p className="text-3xl font-bold text-gray-900">
            #{orderNumber}
          </p>
        </div>

        {/* Info cards */}
        <div className="w-full space-y-3 mb-8">

          <div className="bg-orange-50 rounded-2xl px-5 py-4
                          flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100
                            flex items-center justify-center
                            flex-shrink-0">
              <Clock size={20} style={{ color: '#FF7A47' }} />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium" style={{ color: '#FF7A47' }}>
                Estimated Delivery
              </p>
              <p className="font-bold text-orange-900">
                {estimatedTime}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl px-5 py-4
                          flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100
                            flex items-center justify-center
                            flex-shrink-0">
              <Phone size={20} className="text-blue-500" />
            </div>
            <div className="text-left">
              <p className="text-xs text-blue-500 font-medium">
                On the way
              </p>
              <p className="font-bold text-blue-900">
                Driver will call when nearby
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl px-5 py-4
                          flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100
                            flex items-center justify-center
                            flex-shrink-0 text-xl">
              💬
            </div>
            <div className="text-left">
              <p className="text-xs text-green-600 font-medium">
                WhatsApp Confirmation
              </p>
              <p className="font-bold text-green-900">
                Check your WhatsApp for details
              </p>
            </div>
          </div>

        </div>

        {/* WhatsApp — countdown + return button */}
        {isWhatsApp && (
          <>
            <div className="w-full bg-green-50 rounded-2xl
                            px-5 py-3 mb-4 text-center">
              <p className="text-sm text-green-600">
                Returning to WhatsApp in
                <span className="font-bold text-green-700
                                 text-lg mx-1">
                  {countdown}
                </span>
                seconds...
              </p>
              <div className="mt-2 h-1.5 bg-green-100
                              rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(countdown / 4) * 100}%`,
                    background: '#2D6E5A',
                  }}
                />
            </div>

            <button
              onClick={returnToWhatsApp}
              style={{ background: '#2D6E5A' }} 
            >
              <MessageCircle size={20} />
              <span>Return to WhatsApp</span>
            </button>
          </>
        )}

        {/* Mobile or Desktop browser */}
        {!isWhatsApp && (
          <button
            onClick={() => navigate('/menu' + searchParams)}
            style={{ background: '#FF7A47' }}
          >
            Order Again 🍕
          </button>
        )}

        {/* Desktop message */}
        {isDesktop && (
          <div className="bg-gray-50 rounded-2xl px-5 py-3
                          text-center">
            <p className="text-sm text-gray-500">
              📱 Check your WhatsApp for order confirmation
            </p>
          </div>
        )}

        <p className="text-xs text-gray-300 mt-6">
          Powered by instant ordering 🚀
        </p>

      </div>
    </div>
  )
}
