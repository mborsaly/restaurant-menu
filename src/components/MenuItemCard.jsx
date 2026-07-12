import { useNavigate } from 'react-router-dom'
import { isRTL }       from '../lib/translations'

export default function MenuItemCard({
  item, lang, searchParams, restaurant
}) {
  const navigate = useNavigate()
  const primary  = restaurant?.primary_color || '#1A4D3E'
  const rtl      = isRTL(lang)

  const name = lang === 'ar'
    ? (item.name_ar || item.name_en)
    : lang === 'fr'
      ? (item.name_fr || item.name_en)
      : item.name_en

  const desc = lang === 'ar'
    ? (item.description_ar || item.description_en)
    : lang === 'fr'
      ? (item.description_fr || item.description_en)
      : item.description_en

  return (
    <div
      onClick={() => {
        sessionStorage.setItem(
          'selectedItem',
          JSON.stringify(item)
        )
        navigate(`/item/${item.id}${searchParams}`)
      }}
      style={{
        background:   'white',
        borderRadius: 20,
        overflow:     'hidden',
        cursor:       'pointer',
        border:       '1px solid rgba(45,42,38,0.06)',
        direction:    rtl ? 'rtl' : 'ltr',
      }}
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={name}
          style={{
            width:     '100%',
            height:    144,
            objectFit: 'cover',
          }}
        />
      ) : (
        <div style={{
          width:          '100%',
          height:         120,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       48,
          background:     '#FFA47D22',
        }}>
          {item.emoji || '🍽️'}
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        <h3 style={{
          fontWeight:   700,
          fontSize:     13,
          color:        '#2D2A26',
          marginBottom: 4,
          lineHeight:   1.3,
          fontFamily:   lang === 'ar'
            ? "'Noto Naskh Arabic', serif"
            : 'inherit',
        }}>
          {name}
        </h3>

        {desc && (
          <p style={{
            fontSize:     12,
            color:        '#2D2A26',
            opacity:      0.55,
            marginBottom: 10,
            display:      '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:     'hidden',
            fontFamily:   lang === 'ar'
              ? "'Noto Naskh Arabic', serif"
              : 'inherit',
          }}>
            {desc}
          </p>
        )}

        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize:   13,
            color:      primary,
          }}>
            {/* Currency symbol position */}
            {lang === 'ar'
              ? `${Number(item.base_price).toFixed(0)} ج.م`
              : `$${Number(item.base_price).toFixed(2)}`
            }
          </span>

          <div style={{
            width:          28,
            height:         28,
            borderRadius:   '50%',
            background:     primary,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'white',
            fontSize:       18,
            fontWeight:     700,
            lineHeight:     1,
          }}>
            +
          </div>
        </div>
      </div>
    </div>
  )
}