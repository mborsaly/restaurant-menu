import { useState, useEffect } from 'react'
import { motion }              from 'framer-motion'
import { X, Minus, Plus }      from 'lucide-react'
import { supabase }            from '../lib/supabase'
import { useCart }             from '../context/CartContext'
import { t, isRTL }            from '../lib/translations'

const UNIT_LABELS = {
  piece: { en: 'pc',   ar: 'قطعة', fr: 'pc'  },
  kg:    { en: 'kg',   ar: 'كجم',  fr: 'kg'  },
  gram:  { en: 'g',    ar: 'جم',   fr: 'g'   },
  liter: { en: 'L',    ar: 'لتر',  fr: 'L'   },
  pack:  { en: 'pack', ar: 'عبوة', fr: 'paq' },
  dozen: { en: 'dz',   ar: 'دستة', fr: 'dz'  },
}

export default function ItemSheet({
  item, lang, restaurant, isGrocery, onClose, onAdded
}) {
  const primary = restaurant?.primary_color || (isGrocery ? '#2E7D4F' : '#1A4D3E')
  const coral   = isGrocery ? '#FF9142' : '#FF7A47'
  const rtl     = isRTL(lang)
  const arabicFont = lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif"
  const { addItem } = useCart()

  const [fullItem, setFullItem]   = useState(item)
  const [loading, setLoading]     = useState(!item.item_options)
  const [quantity, setQuantity]   = useState(isGrocery ? (item.unit_step || 1) : 1)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [totalPrice, setTotalPrice] = useState(item.base_price)
  const [justAdded, setJustAdded] = useState(false)

  const step = fullItem?.unit_step || 1
  const unit = fullItem?.unit_type || 'piece'
  const unitLabel = (UNIT_LABELS[unit] || UNIT_LABELS.piece)[lang] || (UNIT_LABELS[unit] || UNIT_LABELS.piece).en

  useEffect(() => {
    if (item.item_options) {
      setFullItem(item)
      initOptions(item)
      return
    }
    async function load() {
      const table = isGrocery ? 'grocery_products' : 'menu_items'
      const optKey = isGrocery ? 'grocery_product_options' : 'item_options'
      const { data } = await supabase
        .from(table)
        .select(`*, ${optKey}(*)`)
        .eq('id', item.id)
        .single()
      if (data) {
        const normalized = isGrocery
          ? { ...data, item_options: data.grocery_product_options }
          : data
        setFullItem(normalized)
        initOptions(normalized)
      }
      setLoading(false)
    }
    load()
  }, [item.id])

  function initOptions(itemData) {
    if (!itemData?.item_options?.length) return
    const groups = groupOptions(itemData.item_options)
    const defaults = {}
    Object.entries(groups).forEach(([g, opts]) => {
      const def = opts.find(o => o.is_default) || opts[0]
      if (def) defaults[g] = def
    })
    setSelectedOptions(defaults)
  }

  useEffect(() => {
    if (!fullItem) return
    const extra = Object.values(selectedOptions)
      .reduce((sum, o) => sum + (o?.price_modifier || 0), 0)
    setTotalPrice((fullItem.base_price + extra) * quantity)
  }, [selectedOptions, quantity, fullItem])

  function groupOptions(options) {
    return options.reduce((g, o) => {
      const key = o.group_name_en
      if (!g[key]) g[key] = []
      g[key].push(o)
      return g
    }, {})
  }

  function getName(obj) {
    if (lang === 'ar') return obj.name_ar || obj.name_en
    if (lang === 'fr') return obj.name_fr || obj.name_en
    return obj.name_en
  }
  function getDesc(obj) {
    if (lang === 'ar') return obj.description_ar || obj.description_en
    if (lang === 'fr') return obj.description_fr || obj.description_en
    return obj.description_en
  }
  function getGroupName(o) {
    if (lang === 'ar') return o.group_name_ar || o.group_name_en
    if (lang === 'fr') return o.group_name_fr || o.group_name_en
    return o.group_name_en
  }
  function getOptionName(o) {
    if (lang === 'ar') return o.option_name_ar || o.option_name_en
    if (lang === 'fr') return o.option_name_fr || o.option_name_en
    return o.option_name_en
  }
  function formatPrice(p) {
    return lang === 'ar' ? `${Number(p).toFixed(2)} ج.م` : `$${Number(p).toFixed(2)}`
  }

  function stepQuantity(dir) {
    setQuantity(q => {
      if (isGrocery) {
        const next = dir > 0 ? q + step : q - step
        return Math.max(step, +next.toFixed(3))
      }
      return Math.max(1, q + dir)
    })
  }

  function handleAdd() {
    addItem(fullItem, selectedOptions, quantity)
    setJustAdded(true)
    onAdded?.()
    setTimeout(() => {
      onClose()
    }, 320)
  }

  const optionGroups = fullItem?.item_options?.length
    ? groupOptions(fullItem.item_options) : {}
  const outOfStock = isGrocery && fullItem?.in_stock === false

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ paddingBottom: 100, position: 'relative' }}>

      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 14, [rtl ? 'left' : 'right']: 14,
        width: 32, height: 32, borderRadius: '50%', background: 'white',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 2,
      }}>
        <X size={16} style={{ color: '#1B2530' }} />
      </button>

      {/* Image */}
      <div style={{
        height: 200, background: `${primary}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {fullItem.image_url ? (
          <img
            src={`${fullItem.image_url}${fullItem.image_url.includes('?') ? '&' : '?'}fm=webp&auto=format`}
            alt={getName(fullItem)}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 64 }}>{fullItem.emoji || (isGrocery ? '🛒' : '🍽️')}</span>
        )}
      </div>

      {/* Header */}
      <div style={{ padding: 20, textAlign: rtl ? 'right' : 'left' }}>
        {isGrocery && fullItem.brand_name && (
          <p style={{
            fontSize: 11, fontWeight: 700, color: primary, opacity: 0.75,
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {fullItem.brand_name}
          </p>
        )}
        <h2 style={{
          fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Fraunces', serif",
          fontSize: 21, fontWeight: 700, color: '#1A4D3E', marginBottom: 6,
        }}>
          {getName(fullItem)}
        </h2>
        {getDesc(fullItem) && (
          <p style={{ fontSize: 13, color: '#1B2530', opacity: 0.6, marginBottom: 10, fontFamily: arabicFont, lineHeight: 1.5 }}>
            {getDesc(fullItem)}
          </p>
        )}
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 800, color: coral }}>
          {formatPrice(fullItem.base_price)}
          {isGrocery && (
            <span style={{ fontSize: 12, opacity: 0.5, fontWeight: 600 }}> / {unitLabel}</span>
          )}
        </p>

        {isGrocery && fullItem.stock_qty != null && (
          <p style={{ fontSize: 11.5, color: '#2D6E5A', marginTop: 6, fontFamily: arabicFont }}>
            {lang === 'ar' ? `متوفر: ${fullItem.stock_qty} ${unitLabel}`
              : lang === 'fr' ? `En stock: ${fullItem.stock_qty} ${unitLabel}`
              : `In stock: ${fullItem.stock_qty} ${unitLabel}`}
          </p>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 20, opacity: 0.5, fontSize: 13 }}>...</p>
      ) : (
        <>
          {Object.entries(optionGroups).map(([groupName, options]) => {
            const groupLabel = getGroupName(options[0]) || groupName
            return (
              <div key={groupName} style={{ borderTop: '1px solid rgba(45,42,38,0.06)' }}>
                <div style={{ padding: '10px 20px', background: 'rgba(45,42,38,0.03)', textAlign: rtl ? 'right' : 'left' }}>
                  <h4 style={{ fontWeight: 700, fontSize: 13, color: '#1B2530', margin: 0, fontFamily: arabicFont }}>
                    {groupLabel}
                  </h4>
                </div>
                {options.sort((a, b) => a.sort_order - b.sort_order).map(option => {
                  const isSelected = selectedOptions[groupName]?.id === option.id
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => setSelectedOptions(p => ({ ...p, [groupName]: option }))}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 20px', background: isSelected ? `${primary}08` : 'white',
                        border: 'none', borderTop: '1px solid rgba(45,42,38,0.04)', cursor: 'pointer',
                        flexDirection: rtl ? 'row-reverse' : 'row',
                      }}
                    >
                      <span style={{ fontSize: 13.5, fontWeight: isSelected ? 600 : 400, color: isSelected ? primary : '#1B2530', fontFamily: arabicFont }}>
                        {getOptionName(option)}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: isSelected ? coral : '#1B2530', opacity: isSelected ? 1 : 0.4 }}>
                        {option.price_modifier === 0 ? t('included', lang) : `+${formatPrice(option.price_modifier)}`}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            )
          })}

          {/* Quantity */}
          <div style={{
            padding: 20, borderTop: '1px solid rgba(45,42,38,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2530', fontFamily: arabicFont }}>
              {t('quantity', lang)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, direction: 'ltr' }}>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => stepQuantity(-1)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(45,42,38,.15)',
                  background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Minus size={14} style={{ color: '#1B2530' }} />
              </motion.button>

              <motion.span
                key={quantity}
                initial={{ scale: 1.3, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14,
                  minWidth: 44, textAlign: 'center', display: 'inline-block',
                }}
              >
                {isGrocery ? `${quantity} ${unitLabel}` : quantity}
              </motion.span>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => stepQuantity(1)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none', background: primary,
                  boxShadow: `0 3px 10px ${primary}44`, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'white',
                }}
              >
                <Plus size={14} />
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* Sticky add button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480,
        margin: '0 auto', padding: 16, background: '#FFF8F0',
      }}>
        <motion.button
          onClick={handleAdd}
          disabled={outOfStock}
          whileTap={{ scale: 0.97 }}
          animate={justAdded ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%', borderRadius: 18, padding: '15px 22px',
            background: outOfStock ? 'rgba(45,42,38,0.15)' : (justAdded ? '#2D6E5A' : coral),
            border: 'none', color: outOfStock ? 'rgba(45,42,38,0.4)' : 'white',
            fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', cursor: outOfStock ? 'not-allowed' : 'pointer',
            boxShadow: outOfStock ? 'none' : `0 8px 24px ${coral}44`,
          }}
        >
          <span style={{ fontFamily: arabicFont }}>
            {outOfStock
              ? (lang === 'ar' ? 'غير متوفر' : lang === 'fr' ? 'Indisponible' : 'Unavailable')
              : justAdded
                ? (lang === 'ar' ? '✓ تمت الإضافة' : lang === 'fr' ? '✓ Ajouté' : '✓ Added')
                : t('add_to_cart', lang)}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatPrice(totalPrice)}</span>
        </motion.button>
      </div>
    </div>
  )
}