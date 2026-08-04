import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { isRTL } from '../lib/translations'

export default function CategoryTabs({
  categories, activeCategory, onSelect, lang, primary, getName
}) {
  const rtl = isRTL(lang)
  const scrollRef = useRef(null)
  const btnRefs = useRef({})

  useEffect(() => {
    const btn = btnRefs.current[activeCategory]
    const container = scrollRef.current
    if (!btn || !container) return
    const btnCenter = btn.offsetLeft + btn.offsetWidth / 2
    const target = btnCenter - container.offsetWidth / 2
    container.scrollTo({ left: target, behavior: 'smooth' })
  }, [activeCategory])

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 5,
      flexShrink: 0, background: 'white',
      borderBottom: '1px solid rgba(45,42,38,0.06)',
      boxShadow: '0 1px 0 rgba(45,42,38,0.02)',
    }}>
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 6, padding: '12px 16px',
          overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categories.map(cat => {
          const active = cat.id === activeCategory
          return (
            <button
              key={cat.id}
              ref={el => (btnRefs.current[cat.id] = el)}
              onClick={() => onSelect(cat.id)}
              style={{
                position: 'relative', flexShrink: 0, padding: '9px 18px',
                borderRadius: 100, fontSize: 13, fontWeight: 600, border: 'none',
                cursor: 'pointer', whiteSpace: 'nowrap',
                minHeight: 40, // 44px touch target with padding
                background: 'transparent', color: active ? '#FFF8F0' : '#2D2A26',
                opacity: active ? 1 : 0.62,
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {active && (
                <motion.div
                  layoutId="category-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 100,
                    background: primary, zIndex: -1,
                  }}
                />
              )}
              {cat.emoji && <span style={{ marginInlineEnd: 6 }}>{cat.emoji}</span>}
              {getName(cat)}
            </button>
          )
        })}
      </div>
    </div>
  )
}