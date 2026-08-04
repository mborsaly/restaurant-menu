import { motion } from 'framer-motion'
import { isRTL } from '../lib/translations'

export default function MenuItemCard({
  item, lang, restaurant, onQuickView
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const coral   = '#FF7A47'
  const rtl     = isRTL(lang)

  const name = lang === 'ar' ? (item.name_ar || item.name_en)
    : lang === 'fr' ? (item.name_fr || item.name_en) : item.name_en
  const desc = lang === 'ar' ? (item.description_ar || item.description_en)
    : lang === 'fr' ? (item.description_fr || item.description_en) : item.description_en

  const imgSrc = item.image_url
    ? `${item.image_url}${item.image_url.includes('?') ? '&' : '?'}fm=webp&auto=format`
    : null

  return (
    <motion.div
      onClick={onQuickView}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        background: 'white', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        border: '1px solid rgba(45,42,38,0.06)', direction: rtl ? 'rtl' : 'ltr',
        boxShadow: '0 1px 3px rgba(27,37,48,0.04)', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image — 65% of card height via aspect ratio */}
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
            {item.emoji || '🍽️'}
          </div>
        )}
        {item.is_popular && (
          <div style={{
            position: 'absolute', top: 8, [rtl ? 'right' : 'left']: 8,
            background: 'rgba(255,255,255,0.94)', color: coral,
            fontSize: 9.5, fontWeight: 800, padding: '4px 9px', borderRadius: 100,
            letterSpacing: '0.03em', textTransform: 'uppercase',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            ⭐ Popular
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '13px 14px 15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontWeight: 700, fontSize: 14.5, color: '#1B2530', marginBottom: 3, lineHeight: 1.3,
          fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
        }}>
          {name}
        </h3>

        {desc && (
          <p style={{
            fontSize: 11.5, color: '#1B2530', opacity: 0.5, marginBottom: 10, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
          }}>
            {desc}
          </p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 14.5, color: coral,
          }}>
            {lang === 'ar' ? `${Number(item.base_price).toFixed(2)} ج.م` : `$${Number(item.base_price).toFixed(2)}`}
          </span>

          <motion.div
            whileTap={{ scale: 0.85 }}
            style={{
              width: 34, height: 34, borderRadius: '50%', background: primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 19, fontWeight: 700, lineHeight: 1,
              boxShadow: `0 3px 10px ${primary}40`,
            }}
          >
            +
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}