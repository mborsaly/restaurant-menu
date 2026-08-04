import { useNavigate } from 'react-router-dom'
import { isRTL } from '../lib/translations'

const UNIT_LABELS = {
  piece: { en: 'pc',   ar: 'قطعة', fr: 'pc'  },
  kg:    { en: 'kg',   ar: 'كجم',  fr: 'kg'  },
  gram:  { en: 'g',    ar: 'جم',   fr: 'g'   },
  liter: { en: 'L',    ar: 'لتر',  fr: 'L'   },
  pack:  { en: 'pack', ar: 'عبوة', fr: 'paq' },
  dozen: { en: 'dz',   ar: 'دستة', fr: 'dz'  },
}

export default function ProductCard({
  item, lang, restaurant, linkTo
}) {
  const navigate = useNavigate()
  const primary  = restaurant?.primary_color || '#2E7D4F'
  const rtl      = isRTL(lang)
  const outOfStock = item.in_stock === false

  const name = lang === 'ar'
    ? (item.name_ar || item.name_en)
    : lang === 'fr' ? (item.name_fr || item.name_en)
    : item.name_en

  const unit = UNIT_LABELS[item.unit_type] || UNIT_LABELS.piece
  const unitLabel = unit[lang] || unit.en

  function handleClick() {
  onQuickView?.()
}

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'white', borderRadius: 18, overflow: 'hidden',
        cursor: outOfStock ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(36,39,43,0.06)',
        opacity: outOfStock ? 0.5 : 1,
        direction: rtl ? 'rtl' : 'ltr', position: 'relative',
      }}
    >
      {outOfStock && (
        <div style={{
          position: 'absolute', top: 8, [rtl ? 'left' : 'right']: 8,
          background: '#24272B', color: 'white', fontSize: 10,
          fontWeight: 700, padding: '3px 8px', borderRadius: 100, zIndex: 2,
        }}>
          {lang === 'ar' ? 'غير متوفر' : lang === 'fr' ? 'Rupture' : 'Out of stock'}
        </div>
      )}

      {item.image_url ? (
        <img src={item.image_url} alt={name}
          style={{ width: '100%', height: 120, objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: 100, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 40, background: '#2E7D4F15',
        }}>
          {item.emoji || '🛒'}
        </div>
      )}

      <div style={{ padding: '10px 12px' }}>
        {item.brand_name && (
          <p style={{
            fontSize: 10, color: primary, opacity: 0.7, margin: '0 0 2px',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            {item.brand_name}
          </p>
        )}
        <h3 style={{
          fontWeight: 600, fontSize: 13, color: '#24272B',
          marginBottom: 6, lineHeight: 1.3,
        }}>
          {name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            fontSize: 13, color: primary,
          }}>
            {lang === 'ar'
              ? `${Number(item.base_price).toFixed(2)} ج.م`
              : `$${Number(item.base_price).toFixed(2)}`}
            <span style={{ fontSize: 10, opacity: 0.55, fontWeight: 500 }}>
              {' '}/ {unitLabel}
            </span>
          </span>

          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: outOfStock ? '#ccc' : primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 16, fontWeight: 700,
          }}>
            +
          </div>
        </div>
      </div>
    </div>
  )
}