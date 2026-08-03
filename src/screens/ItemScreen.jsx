import { useState, useEffect }      from 'react'
import { useParams, useNavigate }   from 'react-router-dom'
import { ChevronLeft, ChevronRight,
         Minus, Plus }              from 'lucide-react'
import { supabase }                 from '../lib/supabase'
import { useCart }                  from '../context/CartContext'
import { useSession }               from '../hooks/useSession'
import { t, isRTL }                 from '../lib/translations'
import LoadingScreen                from '../components/LoadingScreen'

const UNIT_LABELS = {
  piece: { en: 'pc',   ar: 'قطعة', fr: 'pc'  },
  kg:    { en: 'kg',   ar: 'كجم',  fr: 'kg'  },
  gram:  { en: 'g',    ar: 'جم',   fr: 'g'   },
  liter: { en: 'L',    ar: 'لتر',  fr: 'L'   },
  pack:  { en: 'pack', ar: 'عبوة', fr: 'paq' },
  dozen: { en: 'dz',   ar: 'دستة', fr: 'dz'  },
}

export default function ItemScreen() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const { addItem }    = useCart()
  const {
    restaurant, lang, toggleLang, paths, isGrocery,
  } = useSession()

  const primary = restaurant?.primary_color || (isGrocery ? '#2E7D4F' : '#1A4D3E')
  const coral   = isGrocery ? '#FF9142' : '#FF7A47'
  const rtl     = isRTL(lang)
  const BackIcon = rtl ? ChevronRight : ChevronLeft

  const [item, setItem]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [quantity, setQuantity]               = useState(1)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [totalPrice, setTotalPrice]           = useState(0)

  const unit     = item?.unit_type || 'piece'
  const step     = item?.unit_step || 1
  const isWeightUnit = ['kg', 'gram', 'liter'].includes(unit)

  useEffect(() => {
    async function loadItem() {
      try {
        const stored = sessionStorage.getItem('selectedItem')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.id === id) {
            setItem(parsed)
            initOptions(parsed)
            setQuantity(isGrocery ? (parsed.unit_step || 1) : 1)
            setLoading(false)
            return
          }
        }

        if (isGrocery) {
          const { data, error } = await supabase
            .from('grocery_products')
            .select('*, grocery_product_options(*)')
            .eq('id', id)
            .single()
          if (error) throw error
          const normalized = { ...data, item_options: data.grocery_product_options }
          setItem(normalized)
          initOptions(normalized)
          setQuantity(data.unit_step || 1)
        } else {
          const { data, error } = await supabase
            .from('menu_items')
            .select('*, item_options(*)')
            .eq('id', id)
            .single()
          if (error) throw error
          setItem(data)
          initOptions(data)
        }

      } catch (err) {
        console.error('Item load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [id, isGrocery])

  function initOptions(itemData) {
    if (!itemData?.item_options?.length) {
      setTotalPrice(itemData.base_price)
      return
    }
    const groups   = groupOptions(itemData.item_options)
    const defaults = {}
    Object.entries(groups).forEach(([group, opts]) => {
      const def = opts.find(o => o.is_default) || opts[0]
      if (def) defaults[group] = def
    })
    setSelectedOptions(defaults)
  }

  useEffect(() => {
    if (!item) return
    const optExtra = Object.values(selectedOptions)
      .reduce((sum, opt) => sum + (opt?.price_modifier || 0), 0)
    setTotalPrice((item.base_price + optExtra) * quantity)
  }, [selectedOptions, quantity, item])

  function groupOptions(options) {
    return options.reduce((groups, opt) => {
      const group = opt.group_name_en
      if (!groups[group]) groups[group] = []
      groups[group].push(opt)
      return groups
    }, {})
  }

  function handleOptionSelect(groupName, option) {
    setSelectedOptions(prev => ({ ...prev, [groupName]: option }))
  }

  function handleAddToCart() {
    addItem(item, selectedOptions, quantity)
  console.log('DEBUG paths.menu():', paths.menu())
  console.log('DEBUG isStandalone:', isStandalone)
  console.log('DEBUG restaurantSlug:', restaurantSlug)
    navigate(paths.menu())
  }

  function getName(obj) {
    if (!obj) return ''
    if (lang === 'ar') return obj.name_ar || obj.name_en || ''
    if (lang === 'fr') return obj.name_fr || obj.name_en || ''
    return obj.name_en || ''
  }

  function getDesc(obj) {
    if (!obj) return ''
    if (lang === 'ar') return obj.description_ar || obj.description_en || ''
    if (lang === 'fr') return obj.description_fr || obj.description_en || ''
    return obj.description_en || ''
  }

  function getGroupName(opt) {
    if (lang === 'ar') return opt.group_name_ar || opt.group_name_en
    if (lang === 'fr') return opt.group_name_fr || opt.group_name_en
    return opt.group_name_en
  }

  function getOptionName(opt) {
    if (lang === 'ar') return opt.option_name_ar || opt.option_name_en
    if (lang === 'fr') return opt.option_name_fr || opt.option_name_en
    return opt.option_name_en
  }

  function formatPrice(price) {
    if (lang === 'ar') return `${Number(price).toFixed(2)} ج.م`
    return `$${Number(price).toFixed(2)}`
  }

  function unitLabel() {
    const u = UNIT_LABELS[unit] || UNIT_LABELS.piece
    return u[lang] || u.en
  }

  if (loading) return (
    <LoadingScreen message={t('loading_item', lang)} />
  )

  if (!item) return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32,
      textAlign: 'center', background: '#FFF8F0', direction: rtl ? 'rtl' : 'ltr',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: '#1A4D3E', marginBottom: 8 }}>
        {t('item_not_found', lang)}
      </h2>
      <button
        onClick={() => navigate(paths.menu())}
        style={{
          padding: '12px 28px', borderRadius: 14, background: coral, color: 'white',
          fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 14,
        }}
      >
        {t('back_to_menu', lang)}
      </button>
    </div>
  )

  const optionGroups = item.item_options?.length ? groupOptions(item.item_options) : {}
  const arabicFont = lang === 'ar' ? "'Noto Naskh Arabic', serif" : 'inherit'
  const outOfStock = item.in_stock === false

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: '#FFF8F0', overflow: 'hidden', maxWidth: 448, margin: '0 auto',
      direction: rtl ? 'rtl' : 'ltr',
    }}>

      {/* Hero image */}
      <div style={{
        position: 'relative', height: 240, flexShrink: 0,
        background: `${primary}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {item.image_url ? (
          <img src={item.image_url} alt={getName(item)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 80 }}>{item.emoji || (isGrocery ? '🛒' : '🍽️')}</span>
        )}

        <button
          onClick={() => navigate(paths.menu())}
          style={{
            position: 'absolute', top: 16, [rtl ? 'right' : 'left']: 16,
            width: 40, height: 40, borderRadius: '50%', background: 'white',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,.12)',
          }}
        >
          <BackIcon size={20} style={{ color: '#2D2A26' }} />
        </button>

        <button
          onClick={toggleLang}
          style={{
            position: 'absolute', top: 16, [rtl ? 'left' : 'right']: 16,
            padding: '6px 14px', borderRadius: 100, background: 'white',
            border: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, fontWeight: 700, color: '#2D2A26',
            boxShadow: '0 2px 12px rgba(0,0,0,.12)',
          }}
        >
          {lang === 'ar' ? 'EN' : lang === 'en' ? 'FR' : 'ع'}
        </button>

        {outOfStock && (
          <div style={{
            position: 'absolute', bottom: 16, [rtl ? 'right' : 'left']: 16,
            padding: '6px 14px', borderRadius: 100, background: '#24272B',
            color: 'white', fontSize: 12, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {lang === 'ar' ? 'غير متوفر' : lang === 'fr' ? 'Rupture de stock' : 'Out of stock'}
          </div>
        )}

        {!outOfStock && item.is_popular && (
          <div style={{
            position: 'absolute', bottom: 16, [rtl ? 'right' : 'left']: 16,
            padding: '6px 14px', borderRadius: 100, background: coral,
            color: 'white', fontSize: 12, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {t('popular', lang)}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100, WebkitOverflowScrolling: 'touch' }}>

        <div style={{
          background: 'white', padding: 20, borderBottom: '1px solid rgba(45,42,38,0.06)',
          textAlign: rtl ? 'right' : 'left',
        }}>
          {isGrocery && item.brand_name && (
            <p style={{
              fontSize: 12, fontWeight: 700, color: primary, opacity: 0.75,
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
            }}>
              {item.brand_name}
            </p>
          )}
          <h1 style={{
            fontFamily: arabicFont === 'inherit' ? "'Fraunces', serif" : arabicFont,
            fontSize: 22, fontWeight: 700, color: '#1A4D3E', marginBottom: 8,
            letterSpacing: lang === 'ar' ? 0 : '-0.01em',
          }}>
            {getName(item)}
          </h1>

          {getDesc(item) && (
            <p style={{
              fontSize: 14, lineHeight: 1.6, color: '#2D2A26', opacity: 0.6,
              marginBottom: 12, fontFamily: arabicFont,
            }}>
              {getDesc(item)}
            </p>
          )}

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: coral, margin: 0 }}>
            {formatPrice(item.base_price)}
            {isGrocery && (
              <span style={{ fontSize: 13, opacity: 0.55, fontWeight: 500 }}>
                {' '}/ {unitLabel()}
              </span>
            )}
          </p>

          {isGrocery && item.stock_qty != null && (
            <p style={{ fontSize: 12, color: '#2D6E5A', marginTop: 6, fontFamily: arabicFont }}>
              {lang === 'ar'
                ? `متوفر: ${item.stock_qty} ${unitLabel()}`
                : lang === 'fr'
                  ? `En stock: ${item.stock_qty} ${unitLabel()}`
                  : `In stock: ${item.stock_qty} ${unitLabel()}`}
            </p>
          )}
        </div>

        {/* Option groups */}
        {Object.entries(optionGroups).map(([groupName, options]) => {
          const groupLabel = getGroupName(options[0]) || groupName
          return (
            <div key={groupName} style={{ borderBottom: '1px solid rgba(45,42,38,0.06)' }}>
              <div style={{ padding: '12px 20px', background: 'rgba(45,42,38,0.03)', textAlign: rtl ? 'right' : 'left' }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, color: '#2D2A26', margin: 0, fontFamily: arabicFont }}>
                  {groupLabel}
                </h3>
                <p style={{ fontSize: 12, color: '#2D2A26', opacity: 0.45, margin: '2px 0 0', fontFamily: arabicFont }}>
                  {t('choose_one', lang)}
                </p>
              </div>

              {options.sort((a, b) => a.sort_order - b.sort_order).map(option => {
                const isSelected = selectedOptions[groupName]?.id === option.id
                const optName = getOptionName(option)
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(groupName, option)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px', background: isSelected ? `${primary}08` : 'white',
                      border: 'none', borderBottom: '1px solid rgba(45,42,38,0.04)', cursor: 'pointer',
                      flexDirection: rtl ? 'row-reverse' : 'row',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: rtl ? 'row-reverse' : 'row' }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: isSelected ? `2px solid ${primary}` : '2px solid rgba(45,42,38,.2)',
                        background: isSelected ? primary : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? primary : '#2D2A26', fontFamily: arabicFont }}>
                        {optName}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600,
                      color: isSelected ? coral : '#2D2A26', opacity: isSelected ? 1 : 0.4,
                    }}>
                      {option.price_modifier === 0 ? t('included', lang) : `+${formatPrice(option.price_modifier)}`}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}

        {/* Quantity — unit-aware for grocery, integer for restaurant */}
        <div style={{ background: 'white', padding: 20, borderBottom: '1px solid rgba(45,42,38,0.06)', textAlign: rtl ? 'right' : 'left' }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#2D2A26', marginBottom: 16, fontFamily: arabicFont }}>
            {t('quantity', lang)}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, direction: 'ltr' }}>
            <button
              onClick={() => setQuantity(q => {
                const minVal = isGrocery ? step : 1
                const next = isGrocery ? +(q - step).toFixed(3) : q - 1
                return Math.max(minVal, next)
              })}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(45,42,38,.15)',
                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Minus size={16} style={{ color: '#2D2A26' }} />
            </button>

            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700,
              color: '#2D2A26', minWidth: 64, textAlign: 'center',
            }}>
              {isGrocery ? `${quantity} ${unitLabel()}` : quantity}
            </span>

            <button
              onClick={() => setQuantity(q => isGrocery ? +(q + step).toFixed(3) : q + 1)}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', background: primary,
                boxShadow: `0 4px 12px ${primary}44`, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'white',
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {isGrocery && isWeightUnit && (
            <p style={{ fontSize: 11, color: '#2D2A26', opacity: 0.5, marginTop: 10, fontFamily: arabicFont }}>
              {lang === 'ar'
                ? `الزيادة بمقدار ${step} ${unitLabel()}`
                : lang === 'fr'
                  ? `Incréments de ${step} ${unitLabel()}`
                  : `Increments of ${step} ${unitLabel()}`}
            </p>
          )}
        </div>

      </div>

      {/* Add to cart */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 448,
        margin: '0 auto', padding: 16, background: '#FFF8F0', direction: 'ltr',
      }}>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          style={{
            width: '100%', borderRadius: 18, padding: '16px 24px',
            background: outOfStock ? 'rgba(45,42,38,0.15)' : coral,
            boxShadow: outOfStock ? 'none' : `0 8px 30px ${coral}44`,
            border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer',
            color: outOfStock ? 'rgba(45,42,38,0.4)' : 'white', fontWeight: 600, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{
            width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
          }}>
            {isGrocery ? `${quantity}${unitLabel()}`.slice(0, 6) : quantity}
          </span>
          <span style={{ fontFamily: arabicFont }}>
            {outOfStock
              ? (lang === 'ar' ? 'غير متوفر' : lang === 'fr' ? 'Indisponible' : 'Unavailable')
              : t('add_to_cart', lang)}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            {formatPrice(totalPrice)}
          </span>
        </button>
      </div>

    </div>
  )
}