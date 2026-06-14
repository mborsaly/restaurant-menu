import { useEffect }   from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession }  from '../hooks/useSession'
import LoadingScreen   from '../components/LoadingScreen'

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { restaurant, customer, loading, error }
    = useSession()

  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'

  // Auto-navigate to menu
  useEffect(() => {
    if (!restaurant) return
    const t = setTimeout(() => {
      navigate('/menu' + window.location.search)
    }, 2800)
    return () => clearTimeout(t)
  }, [restaurant])

  if (loading) return (
    <LoadingScreen message="Getting your menu ready..." />
  )

  if (error) return (
    <div className="min-h-screen flex flex-col
                    items-center justify-center
                    p-8 text-center"
         style={{ background: '#FFF8F0' }}>
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-bold mb-2"
          style={{
            fontFamily: "'Fraunces', serif",
            color: '#1A4D3E',
          }}>
        Link expired
      </h2>
      <p className="text-sm"
         style={{ color: '#2D2A26', opacity: 0.6 }}>
        Please call us again to receive
        a fresh menu link.
      </p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: '#FFF8F0' }}>
      <div className="flex-1 flex flex-col
                      items-center justify-center
                      p-8 text-center">

        {/* Ringwave logo */}
        <div className="relative flex items-center
                        justify-center mb-8">
          {[1, 2].map(i => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 96, height: 96,
                border: `1.5px solid ${primary}`,
                animation: `ringwave 2.5s
                  cubic-bezier(0.2,0.6,0.4,1)
                  ${i * 0.9}s infinite`,
              }}
            />
          ))}
          <div className="w-24 h-24 rounded-full
                          flex items-center
                          justify-center z-10
                          text-4xl"
               style={{
                 background: primary,
                 boxShadow:
                   `0 12px 40px ${primary}44`,
               }}>
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url}
                   alt={restaurant.name}
                   className="w-full h-full
                              object-cover rounded-full" />
            ) : emoji}
          </div>
        </div>

        {/* Restaurant name */}
        <h1 className="text-3xl font-semibold
                       leading-tight mb-2"
            style={{
              fontFamily: "'Fraunces', serif",
              color: '#1A4D3E',
              letterSpacing: '-0.01em',
            }}>
          {restaurant?.name}
        </h1>

        {restaurant?.address && (
          <p className="text-sm mb-1"
             style={{ color: '#2D2A26', opacity: 0.5 }}>
            {restaurant.address}
          </p>
        )}

        {restaurant?.close_time && (
          <p className="text-sm mb-6"
             style={{ color: '#2D6E5A',
                      fontWeight: 600 }}>
            Open until {restaurant.close_time.slice(0,5)}
          </p>
        )}

        {/* Returning customer greeting */}
        {customer?.name && (
          <div className="rounded-2xl px-5 py-3
                          mb-6 text-sm font-medium"
               style={{
                 background: `${primary}12`,
                 color: primary,
               }}>
            Welcome back,{' '}
            {customer.name.split(' ')[0]}! 👋
          </div>
        )}

        {/* Loading dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full
                         animate-bounce"
              style={{
                background: primary,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        <p className="text-xs mt-3"
           style={{ color: '#2D2A26', opacity: 0.4 }}>
          Loading your menu...
        </p>

      </div>

      {/* Footer */}
      <div className="p-6 text-center border-t"
           style={{
             borderColor: 'rgba(45,42,38,0.06)',
           }}>
        <div style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 14,
          color: '#2D2A26',
          opacity: 0.4,
        }}>
          Bistro<span style={{
            fontStyle: 'italic',
            color: '#FF7A47',
          }}>Vite</span>
        </div>
      </div>

    </div>
  )
}