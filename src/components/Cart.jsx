import { useNavigate } from 'react-router-dom'
import { t }           from '../lib/translations'

export default function Cart({
  itemCount,
  subtotal,
  searchParams,
  restaurant,
  lang = 'fr',
}) {
  const navigate = useNavigate()
  const primary  = restaurant?.primary_color || '#FF7A47'

  if (itemCount === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom:   24,
      left:     16,
      right:    16,
      maxWidth: 416,
      margin:   '0 auto',
      zIndex:   20,
    }}>
      <button
        onClick={() =>
          navigate('/cart' + searchParams)
        }
        style={{
          width:          '100%',
          borderRadius:   18,
          padding:        '14px 20px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          background:     primary,
          boxShadow:      `0 8px 30px ${primary}55`,
          border:         'none',
          cursor:         'pointer',
          color:          'white',
          fontWeight:     600,
        }}
      >
        {/* Badge */}
        <div style={{
          width:          28,
          height:         28,
          borderRadius:   '50%',
          background:     'rgba(255,255,255,0.25)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       13,
          fontWeight:     700,
        }}>
          {itemCount}
        </div>

        {/* Label */}
        <span style={{ fontSize: 15 }}>
          {t('view_cart', lang)}
        </span>

        {/* Price */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize:   15,
        }}>
          ${subtotal.toFixed(2)}
        </span>
      </button>
    </div>
  )
}