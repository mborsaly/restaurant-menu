import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Phone } from 'lucide-react'

export default function ConfirmationScreen() {
  const navigate = useNavigate()
  const searchParams = window.location.search

  const [orderNumber, setOrderNumber] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [customerName, setCustomerName] = useState('')

  useEffect(() => {
    // Load from sessionStorage set by CheckoutScreen
    setOrderNumber(sessionStorage.getItem('orderNumber') || '0001')
    setEstimatedTime(sessionStorage.getItem('estimatedTime') || '35-45 mins')
    setCustomerName(sessionStorage.getItem('customerName') || '')
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Success animation area */}
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

          {/* Floating emoji */}
          <div className="absolute -top-2 -right-2 text-3xl 
                          animate-bounce">
            🎉
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>

        {/* Personal greeting */}
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

        {/* Delivery info cards */}
        <div className="w-full space-y-3 mb-8">

          {/* Estimated time */}
          <div className="bg-orange-50 rounded-2xl px-5 py-4 
                          flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 
                            flex items-center justify-center 
                            flex-shrink-0">
              <Clock size={20} className="text-orange-500" />
            </div>
            <div className="text-left">
              <p className="text-xs text-orange-500 font-medium">
                Estimated Delivery
              </p>
              <p className="font-bold text-orange-900">
                {estimatedTime}
              </p>
            </div>
          </div>

          {/* Driver will call */}
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

          {/* WhatsApp update */}
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

        {/* Order again button */}
        <button
          onClick={() => navigate('/menu' + searchParams)}
          className="w-full bg-orange-500 hover:bg-orange-600
                     active:scale-95 transition-all
                     text-white rounded-2xl py-4 px-6
                     font-semibold shadow-lg shadow-orange-200"
        >
          Order Again 🍕
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-300 mt-6">
          Powered by instant ordering 🚀
        </p>

      </div>

    </div>
  )
}
