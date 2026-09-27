import { useEffect }   from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession }  from '../hooks/useSession'
import { t }           from '../lib/translations'
import LoadingScreen   from '../components/LoadingScreen'

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const {
    restaurant,
    customer,
    loading,
    error,
    lang,
  } = useSession()

  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'

  useEffect(() => {
    if (!restaurant) return
    const timer = setTimeout(() => {
      navigate('/menu' + window.location.search)
    }, 2800)
    return () => clearTimeout(timer)
  }, [restaurant])

  if (loading) return (
    <LoadingScreen
      message={t('loading_menu', lang)}
    />
  )

  if (error) return (
    <div style={{
      minHeight:      '100dvh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        32,
      textAlign:      'center',
      background:     '#FFF8F0',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>
        😕
      </div>
      <h2 style={{
        fontFamily: "'Fraunces', serif",
        fontSize:   20,
        color:      '#1A4D3E',
        marginBottom: 8,
      }}>
        {t('link_expired', lang)}
      </h2>
      <p style={{ color: '#2D2A26', opacity: 0.6, fontSize: 14 }}>
        {t('link_expired_sub', lang)}
      </p>
    </div>
  )

  return (
    <div style={{
      minHeight:      '100dvh',
      display:        'flex',
      flexDirection:  'column',
      background:     '#FFF8F0',
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

        {/* Ringwave logo */}
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
                width:        96,
                height:       96,
                borderRadius: '50%',
                border:       `1.5px solid ${primary}`,
                animation:    `ringwave 2.5s
                  cubic-bezier(0.2,0.6,0.4,1)
                  ${i * 0.9}s infinite`,
              }}
            />
          ))}
          <div style={{
            width:          96,
            height:         96,
            borderRadius:   '50%',
            background:     primary,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       40,
            zIndex:         1,
            boxShadow:      `0 12px 40px ${primary}44`,
          }}>
            {restaurant?.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                style={{
                  width:        '100%',
                  height:       '100%',
                  objectFit:    'cover',
                  borderRadius: '50%',
                }}
              />
            ) : emoji}
          </div>
        </div>

        {/* Restaurant name */}
        <h1 style={{
          fontFamily:   "'Fraunces', serif",
          fontSize:     28,
          fontWeight:   600,
          color:        '#1A4D3E',
          marginBottom: 6,
          letterSpacing: '-0.01em',
        }}>
          {restaurant?.name}
        </h1>

        {restaurant?.address && (
          <p style={{
            fontSize:     13,
            color:        '#2D2A26',
            opacity:      0.5,
            marginBottom: 4,
          }}>
            {restaurant.address}
          </p>
        )}

        {restaurant?.close_time && (
          <p style={{
            fontSize:     13,
            fontWeight:   600,
            color:        '#2D6E5A',
            marginBottom: 24,
          }}>
            {t('open_until', lang)}{' '}
            {restaurant.close_time.slice(0, 5)}
          </p>
        )}

        {/* Returning customer greeting */}
        {customer?.name && (
          <div style={{
            borderRadius: 16,
            padding:      '10px 20px',
            marginBottom: 24,
            background:   `${primary}12`,
            fontSize:     14,
            fontWeight:   500,
            color:        primary,
          }}>
            {t('welcome_back', lang)},{' '}
            {customer.name.split(' ')[0]}! 👋
          </div>
        )}

        {/* Loading dots */}
        <div style={{
          display: 'flex',
          gap:     6,
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width:            8,
                height:           8,
                borderRadius:     '50%',
                background:       primary,
                animation:        'bounce 1s infinite',
                animationDelay:   `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        <p style={{
          fontSize:   12,
          color:      '#2D2A26',
          opacity:    0.4,
          marginTop:  12,
        }}>
          {t('loading_menu', lang)}
        </p>

      </div>

      {/* Footer */}
      <div style={{
        padding:      24,
        textAlign:    'center',
        borderTop:    '1px solid rgba(45,42,38,0.06)',
      }}>
        <div style={{
          fontFamily: "'Fraunces', serif",
          fontSize:   14,
          color:      '#2D2A26',
          opacity:    0.35,
        }}>
          Bistro
          <span style={{
            fontStyle: 'italic',
            color:     '#FF7A47',
            opacity:   1,
          }}>
            Vite
          </span>
        </div>
      </div>

    </div>
  )
}