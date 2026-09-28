import { useState, useEffect } from 'react'
import { motion }              from 'framer-motion'
import { Minus, Plus, Check }  from 'lucide-react'
import { supabase }            from '../lib/supabase'
import { useCart }             from '../context/CartContext'
import { t }                   from '../lib/translations'
import { pickTranslation, pickGroupName } from '../lib/i18n'
import { formatPrice }         from '../lib/currency'
import SheetCloseButton        from './SheetCloseButton'

const UNIT_LABELS = {
  piece: { en: 'pc', ar: 'قطعة', fr: 'pc' },
  kg:    { en: 'kg', ar: 'كجم',  fr: 'kg' },
  gram:  { en: 'g',  ar: 'جم',   fr: 'g'  },
  liter: { en: 'L',  ar: 'لتر',  fr: 'L'  },
  pack:  { en: 'pack', ar: 'عبوة', fr: 'paq' },
  dozen: { en: 'dz', ar: 'دستة', fr: 'dz' },
}

export default function ItemSheet({
  item, lang, isRTL, restaurant, isGrocery, onClose, onAdded, fallbackLang = 'en'
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl     = isRTL
  const arabicFont = rtl
    ? "'Noto Naskh Arabic', serif"
    : "'Plus Jakarta Sans', sans-serif"

  const { addItem } = useCart()

  const [fullItem, setFullItem]   = useState(item)
  const [loading, setLoading]     = useState(!item.optionGroups)
  const [loadError, setLoadError] = useState(null)
  const [quantity, setQuantity]   = useState(isGrocery ? (item.unit_step || 1) : 1)

  // single groups:   { [groupId]: option }
  // multiple groups: { [groupId]: { [optionId]: qty } }
  const [selections, setSelections] = useState({})
  const [validationError, setValidationError] = useState(null)
  const [totalPrice, setTotalPrice] = useState(item.base_price)
  const [justAdded, setJustAdded] = useState(false)

  const step = fullItem?.unit_step || 1
  const unit = fullItem?.unit_type || 'piece'
  const unitLabel = (UNIT_LABELS[unit] || UNIT_LABELS.piece)[lang] || (UNIT_LABELS[unit] || UNIT_LABELS.piece).en

  useEffect(() => {
    if (item.optionGroups) {
      setFullItem(item)
      initSelections(item.optionGroups)
      return
    }

    let cancelled = false

    async function load() {
      const table        = isGrocery ? 'grocery_products' : 'menu_items'
      const trTable      = isGrocery ? 'grocery_product_translations' : 'menu_item_translations'
      const groupsTable  = isGrocery ? 'grocery_product_option_groups' : 'item_option_groups'
      const groupFk      = isGrocery ? 'grocery_product_id' : 'menu_item_id'
      const groupTrTable = isGrocery ? 'grocery_option_group_translations' : 'item_option_group_translations'
      const optionsTable = isGrocery ? 'grocery_product_options' : 'item_options'
      const optTrTable   = isGrocery ? 'grocery_product_option_translations' : 'item_option_translations'
      const optTrFk      = isGrocery ? 'grocery_product_option_id' : 'item_option_id'

      try {
        // 1. The item and its own translations
        const { data: itemRow, error: itemErr } = await supabase
          .from(table)
          .select(`*, ${trTable}(*)`)
          .eq('id', item.id)
          .single()
        if (itemErr) throw new Error(`item: ${itemErr.message}`)

        // 2. Option groups for this item
        const { data: groups, error: groupsErr } = await supabase
          .from(groupsTable)
          .select('*')
          .eq(groupFk, item.id)
          .eq('active', true)
          .order('sort_order')
        if (groupsErr) throw new Error(`groups: ${groupsErr.message}`)

        let optionGroups = []

        if (groups?.length) {
          const groupIds = groups.map(g => g.id)

          // 3. Group translations and options, in parallel
          const [groupTrRes, optionsRes] = await Promise.all([
            supabase.from(groupTrTable).select('*').in('group_id', groupIds),
            supabase.from(optionsTable).select('*').in('group_id', groupIds).order('sort_order'),
          ])
          if (groupTrRes.error) throw new Error(`group translations: ${groupTrRes.error.message}`)
          if (optionsRes.error) throw new Error(`options: ${optionsRes.error.message}`)

          const options = optionsRes.data || []

          // 4. Option translations
          let optTrs = []
          if (options.length) {
            const { data, error } = await supabase
              .from(optTrTable)
              .select('*')
              .in(optTrFk, options.map(o => o.id))
            if (error) throw new Error(`option translations: ${error.message}`)
            optTrs = data || []
          }

          optionGroups = groups.map(g => ({
            ...g,
            translations: (groupTrRes.data || []).filter(tr => tr.group_id === g.id),
            options: options
              .filter(o => o.group_id === g.id)
              .map(o => ({
                ...o,
                translations: optTrs.filter(tr => tr[optTrFk] === o.id),
              })),
          }))
        }

        if (cancelled) return

        const normalized = { ...itemRow, translations: itemRow[trTable], optionGroups }
        setFullItem(normalized)
        initSelections(optionGroups)
      } catch (err) {
        // Technical detail goes to the console only;
        // customers see a plain message
        console.error('ItemSheet options load failed ->', err.message)
        if (!cancelled) setLoadError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [item.id])

  function initSelections(groups) {
    const defaults = {}
    groups.forEach(group => {
      if (group.selection_type === 'single') {
        const def = group.options.find(o => o.is_default) || (group.is_required ? group.options[0] : null)
        if (def) defaults[group.id] = def
      } else {
        defaults[group.id] = {}
      }
    })
    setSelections(defaults)
  }

  useEffect(() => {
    if (!fullItem) return
    let extra = 0

    Object.entries(selections).forEach(([groupId, value]) => {
      const group = fullItem.optionGroups?.find(g => g.id === groupId)
      if (!group) return

      if (group.selection_type === 'single') {
        if (value) extra += value.price_modifier || 0
      } else {
        Object.entries(value || {}).forEach(([optionId, qty]) => {
          const opt = group.options.find(o => o.id === optionId)
          if (opt && qty > 0) extra += (opt.price_modifier || 0) * qty
        })
      }
    })

    setTotalPrice((fullItem.base_price + extra) * quantity)
  }, [selections, quantity, fullItem])

  const getName = (obj) => pickTranslation(obj.translations, 'name', lang, fallbackLang) || obj.name_en
  const getDesc = (obj) => pickTranslation(obj.translations, 'description', lang, fallbackLang) || obj.description_en
  const getOptionName = (opt) => pickTranslation(opt.translations, 'option_name', lang, fallbackLang) || opt.option_name_en

  function selectSingle(group, option) {
    setSelections(prev => ({ ...prev, [group.id]: option }))
    setValidationError(null)
  }

  // Optional single-select groups can be cleared by tapping
  // the selected option again
  function selectSingleToggle(group, option) {
    setSelections(prev => {
      const isSelected = prev[group.id]?.id === option.id
      if (isSelected && !group.is_required) {
        const next = { ...prev }
        delete next[group.id]
        return next
      }
      return { ...prev, [group.id]: option }
    })
    setValidationError(null)
  }

  function toggleMultiple(group, option) {
    setSelections(prev => {
      const current = { ...(prev[group.id] || {}) }
      const currentQty = current[option.id] || 0

      if (currentQty > 0) {
        delete current[option.id]
      } else {
        const chosenCount = Object.keys(current).length
        if (group.max_select && chosenCount >= group.max_select) {
          setValidationError(
            lang === 'ar' ? `اختر حتى ${group.max_select} فقط`
            : lang === 'fr' ? `Choisissez jusqu'à ${group.max_select}`
            : `Choose up to ${group.max_select}`
          )
          return prev
        }
        current[option.id] = 1
      }
      setValidationError(null)
      return { ...prev, [group.id]: current }
    })
  }

  function stepOptionQuantity(group, option, dir) {
    setSelections(prev => {
      const current = { ...(prev[group.id] || {}) }
      const currentQty = current[option.id] || 0
      const maxQty = option.max_quantity || 1
      const nextQty = Math.max(0, Math.min(maxQty, currentQty + dir))

      if (nextQty === 0) delete current[option.id]
      else current[option.id] = nextQty

      return { ...prev, [group.id]: current }
    })
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

  function validateRequiredGroups() {
    const groups = fullItem?.optionGroups || []
    for (const group of groups) {
      if (!group.is_required) continue
      const label = pickGroupName(group, lang, fallbackLang)

      if (group.selection_type === 'single') {
        if (!selections[group.id]) {
          setValidationError(
            lang === 'ar' ? `يرجى الاختيار من: ${label}`
            : lang === 'fr' ? `Veuillez choisir : ${label}`
            : `Please choose: ${label}`
          )
          return false
        }
      } else {
        const chosenCount = Object.keys(selections[group.id] || {}).length
        const minNeeded = group.min_select || 1
        if (chosenCount < minNeeded) {
          setValidationError(
            lang === 'ar' ? `اختر ${minNeeded} على الأقل من: ${label}`
            : lang === 'fr' ? `Choisissez au moins ${minNeeded} dans : ${label}`
            : `Choose at least ${minNeeded} from: ${label}`
          )
          return false
        }
      }
    }
    return true
  }

  // Flattens group-based selections into the flat shape the
  // cart and checkout expect. Multi-select entries carry
  // selectedQty so pricing and display can honour it.
  function buildCartOptions() {
    const flat = {}
    Object.entries(selections).forEach(([groupId, value]) => {
      const group = fullItem.optionGroups?.find(g => g.id === groupId)
      if (!group) return

      if (group.selection_type === 'single') {
        if (value) flat[groupId] = value
      } else {
        Object.entries(value || {}).forEach(([optionId, qty]) => {
          if (qty > 0) {
            const opt = group.options.find(o => o.id === optionId)
            if (opt) flat[`${groupId}_${optionId}`] = { ...opt, selectedQty: qty }
          }
        })
      }
    })
    return flat
  }

  function handleAdd() {
    if (!validateRequiredGroups()) return
    addItem(fullItem, buildCartOptions(), quantity)
    setJustAdded(true)
    onAdded?.()
    setTimeout(() => onClose(), 320)
  }

  const outOfStock = isGrocery && fullItem?.in_stock === false
  const groups = fullItem?.optionGroups || []

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ paddingBottom: 100, position: 'relative' }}>
      <SheetCloseButton lang={lang} onClose={onClose} />

      <div style={{
        height: 200, background: `${primary}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {fullItem.image_url && (
          <img
            src={`${fullItem.image_url}${fullItem.image_url.includes('?') ? '&' : '?'}fm=webp&auto=format`}
            alt={getName(fullItem)}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

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
          fontFamily: rtl ? "'Noto Naskh Arabic', serif" : "'Fraunces', serif",
          fontSize: 21, fontWeight: 700, color: '#1A4D3E', marginBottom: 6,
        }}>
          {getName(fullItem)}
        </h2>
        {getDesc(fullItem) && (
          <p style={{ fontSize: 13, color: '#1B2530', opacity: 0.6, marginBottom: 10, fontFamily: arabicFont, lineHeight: 1.5 }}>
            {getDesc(fullItem)}
          </p>
        )}
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 800, color: primary }}>
          {formatPrice(fullItem.base_price, restaurant, lang)}
          {isGrocery && <span style={{ fontSize: 12, opacity: 0.5, fontWeight: 600 }}> / {unitLabel}</span>}
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
          {loadError && (
            <p style={{ color: '#ef4444', fontSize: 12, padding: '8px 20px', margin: 0, fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left' }}>
              {lang === 'ar' ? 'تعذر تحميل الخيارات، حاول مرة أخرى'
                : lang === 'fr' ? 'Impossible de charger les options, réessayez'
                : 'Options could not be loaded, please try again'}
            </p>
          )}

          {groups.map(group => {
            const groupLabel = pickGroupName(group, lang, fallbackLang)
            const isMultiple = group.selection_type === 'multiple'

            return (
              <div key={group.id} style={{ borderTop: '1px solid rgba(45,42,38,0.06)' }}>
                <div style={{
                  padding: '10px 20px', background: 'rgba(45,42,38,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <h4 style={{
                    fontWeight: 700, fontSize: 13, color: '#1B2530', margin: 0,
                    fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left',
                    order: rtl ? 2 : 1,
                  }}>
                    {groupLabel}
                    {group.is_required && (
                      <span style={{ color: primary, marginInlineStart: 4 }}>*</span>
                    )}
                  </h4>
                  {!group.is_required && (
                    <span style={{ fontSize: 10.5, color: '#1B2530', opacity: 0.45, fontFamily: arabicFont, order: rtl ? 1 : 2 }}>
                      {isMultiple && group.max_select
                        ? (lang === 'ar' ? `حتى ${group.max_select}` : `Max ${group.max_select}`)
                        : (lang === 'ar' ? 'اختياري' : lang === 'fr' ? 'Optionnel' : 'Optional')}
                    </span>
                  )}
                </div>

                {group.options.map(option => {
                  const optionName = getOptionName(option)

                  if (!isMultiple) {
                    const isSelected = selections[group.id]?.id === option.id
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => selectSingleToggle(group, option)}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '13px 20px', background: isSelected ? `${primary}08` : 'white',
                          border: 'none', borderTop: '1px solid rgba(45,42,38,0.04)', cursor: 'pointer',
                        }}
                      >
                        <span style={{
                          fontSize: 13.5, fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? primary : '#1B2530', fontFamily: arabicFont,
                          order: rtl ? 2 : 1,
                        }}>
                          {optionName}
                        </span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
                          color: isSelected ? primary : '#1B2530', opacity: isSelected ? 1 : 0.4,
                          order: rtl ? 1 : 2,
                        }}>
                          {option.price_modifier === 0 ? t('included', lang) : `+${formatPrice(option.price_modifier, restaurant, lang)}`}
                        </span>
                      </motion.button>
                    )
                  }

                  const selectedQty = selections[group.id]?.[option.id] || 0
                  const canRepeat = (option.max_quantity || 1) > 1

                  return (
                    <div
                      key={option.id}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 20px', background: selectedQty > 0 ? `${primary}08` : 'white',
                        borderTop: '1px solid rgba(45,42,38,0.04)',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
                        order: rtl ? 2 : 1, flexDirection: rtl ? 'row-reverse' : 'row',
                      }}>
                        <button
                          onClick={() => toggleMultiple(group, option)}
                          aria-label={optionName}
                          style={{
                            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                            border: selectedQty > 0 ? 'none' : '1.5px solid rgba(45,42,38,.25)',
                            background: selectedQty > 0 ? primary : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          }}
                        >
                          {selectedQty > 0 && <Check size={13} color="white" />}
                        </button>
                        <span style={{ fontSize: 13.5, color: '#1B2530', fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left' }}>
                          {optionName}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, order: rtl ? 1 : 2 }}>
                        {selectedQty > 0 && canRepeat && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => stepOptionQuantity(group, option, -1)}
                              style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(45,42,38,.2)', background: 'white', cursor: 'pointer' }}
                            >
                              <Minus size={11} style={{ margin: 'auto' }} />
                            </button>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, width: 14, textAlign: 'center' }}>
                              {selectedQty}
                            </span>
                            <button
                              onClick={() => stepOptionQuantity(group, option, 1)}
                              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: primary, color: 'white', cursor: 'pointer' }}
                            >
                              <Plus size={11} style={{ margin: 'auto' }} />
                            </button>
                          </div>
                        )}
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, minWidth: 46, textAlign: rtl ? 'left' : 'right',
                          color: selectedQty > 0 ? primary : '#1B2530', opacity: selectedQty > 0 ? 1 : 0.4,
                        }}>
                          {option.price_modifier === 0 ? t('included', lang) : `+${formatPrice(option.price_modifier, restaurant, lang)}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {validationError && (
            <p style={{ color: '#ef4444', fontSize: 12.5, padding: '10px 20px', margin: 0, fontFamily: arabicFont, textAlign: rtl ? 'right' : 'left' }}>
              {validationError}
            </p>
          )}

          <div style={{
            padding: 20, borderTop: '1px solid rgba(45,42,38,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2530', fontFamily: arabicFont, order: rtl ? 2 : 1 }}>
              {t('quantity', lang)}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, order: rtl ? 1 : 2 }}>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => stepQuantity(-1)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(45,42,38,.15)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={14} style={{ color: '#1B2530' }} />
              </motion.button>

              <motion.span
                key={quantity}
                initial={{ scale: 1.3, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, minWidth: 44, textAlign: 'center', display: 'inline-block' }}
              >
                {isGrocery ? `${quantity} ${unitLabel}` : quantity}
              </motion.span>

              <motion.button whileTap={{ scale: 0.85 }} onClick={() => stepQuantity(1)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: primary, boxShadow: `0 3px 10px ${primary}44`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Plus size={14} />
              </motion.button>
            </div>
          </div>
        </>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', padding: 16, background: '#FFF8F0' }}>
        <motion.button
          onClick={handleAdd}
          disabled={outOfStock}
          whileTap={{ scale: 0.97 }}
          animate={justAdded ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%', borderRadius: 18, padding: '15px 22px',
            background: outOfStock ? 'rgba(45,42,38,0.15)' : (justAdded ? '#2D6E5A' : primary),
            border: 'none', color: outOfStock ? 'rgba(45,42,38,0.4)' : 'white',
            fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', cursor: outOfStock ? 'not-allowed' : 'pointer',
            boxShadow: outOfStock ? 'none' : `0 8px 24px ${primary}44`,
          }}
        >
          <span style={{ fontFamily: arabicFont, order: rtl ? 2 : 1 }}>
            {outOfStock
              ? (lang === 'ar' ? 'غير متوفر' : lang === 'fr' ? 'Indisponible' : 'Unavailable')
              : justAdded
                ? (lang === 'ar' ? 'تمت الإضافة' : lang === 'fr' ? 'Ajouté' : 'Added')
                : t('add_to_cart', lang)}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", order: rtl ? 1 : 2 }}>
            {formatPrice(totalPrice, restaurant, lang)}
          </span>
        </motion.button>
      </div>
    </div>
  )
}