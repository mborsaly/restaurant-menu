import { useState } from 'react'
import { motion } from 'framer-motion'
import { isRTL } from '../lib/translations'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../lib/currency'

const UNIT_LABELS = {
  piece: { en: 'pc',   ar: 'قطعة', fr: 'pc'  },
  kg:    { en: 'kg',   ar: 'كجم',  fr: 'kg'  },
  gram:  { en: 'g',    ar: 'جم',   fr: 'g'   },
  liter: { en: 'L',    ar: 'لتر',  fr: 'L'   },
  pack:  { en: 'pack', ar: 'عبوة', fr: 'paq' },
  dozen: { en: 'dz',   ar: 'دستة', fr: 'dz'  },
}

export default function ProductCard({
  item, lang, restaurant, onQuickView
}) {
  const primary = restaurant?.primary_color || '#2E7D4F'
  const rtl     = isRTL(lang)
  const outOfStock = item.in_stock === false
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const hasOptions = !!(item.item_options && item.item_options.length > 0)

  const name = lang === 'ar' ? (item.name_ar || item.name_en)
    : lang === 'fr' ? (item.name_fr || item.name_en) : item.name_en

  const unit = UNIT_LABELS[item.unit_type] || UNIT_LABELS.piece
  const unitLabel = unit[lang] || unit.en

  const imgSrc = item.image_url
    ? `${item.image_url}${item.image_url.includes('?') ? '&' : '?'}fm=webp&auto=format`
    : null

  function handlePlusClick(e) {
    e.stopPropagation()
    if (outOfStock) return
    if (hasOptions) {
      onQuickView?.()
      return
    }
    addItem(item, {}, item.unit_step || 1)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 700)
  }

  return (
    <motion.div
      onClick={() => !outOfStock && onQuickView?.()}
      whileTap={outOfStock ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        background: 'white', borderRadius: 20, overflow: 'hidden',
        cursor: outOfStock ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(45,42,38,0.06)',
        opacity: outOfStock ? 0.55 : 1,
        direction: rtl ? 'rtl' : 'ltr',
        boxShadow: '0 1px 3px rgba(27,37,48,0.04)',
        display: 'flex', flexDirection: 'column', position: 'relative',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: `${primary}12`, position: 'relative' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            width={400}
            height={300}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46 }}>
            {item.emoji || '🛒'}
          </div>
        )}
        {outOfStock && (
          <div style={{
            position: 'absolute', top: 8, [rtl ? 'left' : 'right']: 8,
            background: '#24272B', color: 'white', fontSize: 9.5, fontWeight: 800,
            padding: '4px 9px', borderRadius: 100, letterSpacing: '0.03em',
            textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {lang === 'ar' ? 'غير متوفر' : lang === 'fr' ? 'Rupture' : 'Out of stock'}
          </div>
        )}
      </div>

      <div style={{ padding: '13px 14px 15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {item.brand_name && (
          <p style={{
            fontSize: 10, color: primary, opacity: 0.75, margin: '0 0 2px',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {item.brand_name}
          </p>
        )}

        <h3 style={{
          fontWeight: 700, fontSize: 14.5, color: '#1B2530', marginBottom: 3, lineHeight: 1.3,
          fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
        }}>
          {name}
        </h3>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 14, color: primary }}>
            {formatPrice(item.base_price, restaurant, lang)}
            <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 600 }}> / {unitLabel}</span>
          </span>

          <motion.button
            onClick={handlePlusClick}
            whileTap={outOfStock ? {} : { scale: 0.8 }}
            animate={justAdded ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.35 }}
            disabled={outOfStock}
            aria-label={hasOptions ? 'View options' : 'Add to cart'}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: outOfStock ? '#ccc' : (justAdded ? '#2D6E5A' : primary),
              border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 18, fontWeight: 700, lineHeight: 1,
              boxShadow: outOfStock ? 'none' : `0 3px 10px ${(justAdded ? '#2D6E5A' : primary)}40`,
              flexShrink: 0,
            }}
          >
            {justAdded ? '✓' : '+'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}