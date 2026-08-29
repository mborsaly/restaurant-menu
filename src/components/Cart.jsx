import { motion, AnimatePresence } from 'framer-motion'
import { t } from '../lib/translations'

export default function Cart({
  itemCount, subtotal, restaurant, lang = 'en', isRTL, onOpen
}) {
  const primary = restaurant?.primary_color || '#FF7A47'
  const rtl = isRTL

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          style={{ position: 'fixed', bottom: 20, left: 16, right: 16, maxWidth: 416, margin: '0 auto', zIndex: 20 }}
        >
          <motion.button
            onClick={onOpen}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', borderRadius: 18, padding: '14px 20px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', background: primary,
              boxShadow: `0 10px 30px ${primary}55`, border: 'none', cursor: 'pointer',
              color: 'white', fontWeight: 700,
              fontFamily: rtl ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <motion.div
              key={itemCount}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                order: rtl ? 3 : 1,
              }}
            >
              {itemCount}
            </motion.div>
            <span style={{ fontSize: 15, order: 2 }}>{t('view_cart', lang)}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 15, order: rtl ? 1 : 3 }}>
              ${subtotal.toFixed(2)}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}