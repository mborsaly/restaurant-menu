import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import LoadingScreen from '../components/LoadingScreen'

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { restaurant, customer, loading, error } = useSession()

  // Auto-advance to menu after 2 seconds
  useEffect(() => {
    if (!restaurant) return
    const timer = setTimeout(() => {
      navigate('/menu' + window.location.search)
    }, 2500)
    return () => clearTimeout(timer)
  }, [restaurant])

  if (loading) return <LoadingScreen message="Getting your menu ready..." />

  if (error) return (
    <div className="min-h-screen flex flex-col items-center 
                    justify-center p-6 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Link expired
      </h2>
      <p className="text-gray-500 text-sm">
        Please call us again or visit our restaurant directly.
      </p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center 
                      justify-center p-8 text-center">

        {/* Logo or emoji */}
        <div className="w-24 h-24 rounded-full bg-orange-100 
                        flex items-center justify-center 
                        text-5xl mb-6 shadow-lg">
          🍕
        </div>

        {/* Restaurant name */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {restaurant?.name}
        </h1>

        {/* Address */}
        {restaurant?.address && (
          <p className="text-gray-400 text-sm mb-1">
            {restaurant.address}
          </p>
        )}

        {/* Hours */}
        <p className="text-gray-400 text-sm mb-8">
          Open until {restaurant?.close_time?.slice(0, 5)}
        </p>

        {/* Returning customer greeting */}
        {customer?.name && (
          <div className="bg-orange-50 rounded-2xl px-6 py-3 mb-8">
            <p className="text-orange-600 font-medium text-sm">
              Welcome back, {customer.name.split(' ')[0]}! 👋
            </p>
          </div>
        )}

        {/* Loading indicator */}
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-400 
                         animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3">
          Loading menu...
        </p>
      </div>

      {/* Bottom info */}
      <div className="p-6 text-center border-t border-gray-100">
        <p className="text-xs text-gray-300">
          Powered by instant ordering 🚀
        </p>
      </div>

    </div>
  )
}
