import { useState, useEffect, useCallback }  from 'react'
import { useNavigate, useParams,
         useSearchParams }                   from 'react-router-dom'
import { ChevronLeft, Minus, Plus }          from 'lucide-react'
import { supabase }                          from '../lib/supabase'
import { useCart }                           from '../context/CartContext'
import { useSession }                        from '../hooks/useSession'
import LoadingScreen                         from '../components/LoadingScreen'

// ─── Helpers (outside component — stable references, no stale closures) ───────

function groupOptions(options) {
  return options.reduce((groups, opt) => {
    const group = opt.group_name_en
    if (!groups[group]) groups[group] = []
    groups[group].push(opt)
    return groups
  }, {})
}

function initOptions(itemData) {
  if (!itemData?.item_options?.length) return {}

  const groups   = groupOptions(itemData.item_options)
  const defaults = {}

  Object.entries(groups).forEach(([group, options]) => {
    const defaultOpt = options.find(o => o.is_default) || options[0]
    if (defaultOpt) defaults[group] = defaultOpt
  })

  return defaults
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemScreen() {
  const navigate                    = useNavigate()
  const { id }                      = useParams()
  const [searchParams]              = useSearchParams()          // FIX #1: useSearchParams instead of window.location.search
  const searchStr                   = '?' + searchParams.toString()

  const { addItem }                 = useCart()
  const { restaurant }              = useSession()

  const primary = restaurant?.primary_color || '#1A4D3E'
  const coral   = '#FF7A47'

  const [item, setItem]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [lang, setLang]                       = useState('en')
  const [quantity, setQuantity]               = useState(1)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [totalPrice, setTotalPrice]           = useState(0)

  // FIX #2 & #3: Load item — no stale closure risk; helpers are module-level
  useEffect(() => {
    let cancelled = false

    async function loadItem() {
      try {
        // Try sessionStorage first (instant)
        const stored = sessionStorage.getItem('selectedItem')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.id === id) {
            if (!cancelled) {
              setItem(parsed)
              setSelectedOptions(initOptions(parsed))
              setTotalPrice(parsed.base_price)
              setLoading(false)
            }
            return
          }
        }

        // Fall back to Supabase
        const { data, error } = await supabase
          .from('menu_items')
          .select('*, item_options(*)')
          .eq('id', id)
          .single()

        if (error) throw error

        if (!cancelled) {
          setItem(data)
          setSelectedOptions(initOptions(data))
          setTotalPrice(data.base_price)
        }

      } catch (err) {
        console.error('Item load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadItem()

    // FIX #5: Clear stale sessionStorage entry on unmount
    return () => {
      cancelled = true
      sessionStorage.removeItem('selectedItem')
    }
  }, [id])

  // Recalculate total when options or quantity change
  useEffect(() => {
    if (!item) return
    const optionsTotal = Object.values(selectedOptions)
      .reduce((sum, opt) => sum + (opt?.price_modifier || 0), 0)
    setTotalPrice((item.base_price + optionsTotal) * quantity)
  }, [selectedOptions, quantity, item])

  // FIX #2: Stable callback — no recreations causing stale closure issues
  const handleOptionSelect = useCallback((groupName, option) => {
    setSelectedOptions(prev => ({ ...prev, [groupName]: option }))
  }, [])

  // FIX #6: Guard against missing CartContext
  function handleAddToCart() {
    if (typeof addItem !== 'function') {
      console.error('CartContext not available — wrap your app in <CartProvider>')
      return
    }
    addItem(item, selectedOptions, quantity)
    navigate('/menu' + (searchParams.toString() ? '?' + searchParams.toString() : ''))
  }

  // ─── Loading ───────────────────────────────────────
  if (loading) return <LoadingScreen message="Loading item..." />

  // ─── Not found ─────────────────────────────────────
  if (!item) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
         style={{ background: '#FFF8F0' }}>
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-semibold mb-2"
          style={{ fontFamily: "'Fraunces', serif", color: '#1A4D3E' }}>
        Item not found
      </h2>
      <button
        onClick={() => navigate('/menu' + searchStr)}
        className="mt-4 px-6 py-3 rounded-xl text-white font-semibold active:scale-95 transition-all"
        style={{ background: coral }}
      >
        Back to Menu
      </button>
    </div>
  )

  // ─── Derived values ────────────────────────────────
  // FIX #4: lang is used purely as a render-time derived value here — correct
  const name = lang === 'fr'
    ? (item.name_fr || item.name_en)
    : item.name_en

  const description = lang === 'fr'
    ? (item.description_fr || item.description_en)
    : item.description_en

  const optionGroups = item.item_options?.length
    ? groupOptions(item.item_options)
    : {}

  // ─── Render ────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: '#FFF8F0' }}>

      {/* Hero image */}
      <div className="relative h-64 flex-shrink-0"
           style={{ background: '#FFA47D22' }}>

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            {item.emoji || '🍽️'}
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate('/menu' + searchStr)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full shadow-lg flex
                     items-center justify-center active:scale-95 transition-all"
          style={{ background: 'white' }}
        >
          <ChevronLeft size={20} style={{ color: '#2D2A26' }} />
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'en' ? 'fr' : 'en')}
          className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5
                     rounded-full shadow-lg active:scale-95 transition-all"
          style={{
            background: 'white',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#2D2A26',
          }}
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

        {/* Popular badge */}
        {item.is_popular && (
          <div className="absolute bottom-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full"
               style={{
                 background: coral,
                 color: 'white',
                 fontFamily: "'JetBrains Mono', monospace",
               }}>
            ⭐ Popular
          </div>
        )}

      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">

        {/* Item header */}
        <div className="p-5 bg-white border-b"
             style={{ borderColor: 'rgba(45,42,38,0.06)' }}>
          <h1 className="text-2xl font-semibold leading-tight mb-2"
              style={{
                fontFamily: "'Fraunces', serif",
                color: '#1A4D3E',
                letterSpacing: '-0.01em',
              }}>
            {name}
          </h1>

          {description && (
            <p className="text-sm leading-relaxed mb-3"
               style={{ color: '#2D2A26', opacity: 0.6 }}>
              {description}
            </p>
          )}

          <p className="font-bold text-xl"
             style={{ fontFamily: "'JetBrains Mono', monospace", color: coral }}>
            ${Number(item.base_price).toFixed(2)}
          </p>
        </div>

        {/* Option groups */}
        {Object.entries(optionGroups).map(([groupName, options]) => {
          const groupLabel = lang === 'fr' && options[0]?.group_name_fr
            ? options[0].group_name_fr
            : groupName

          return (
            <div key={groupName} className="border-b"
                 style={{ borderColor: 'rgba(45,42,38,0.06)' }}>

              {/* Group header */}
              <div className="px-5 py-3"
                   style={{ background: 'rgba(45,42,38,0.03)' }}>
                <h3 className="font-bold text-sm" style={{ color: '#2D2A26' }}>
                  {groupLabel}
                </h3>
                <p className="text-xs mt-0.5"
                   style={{ color: '#2D2A26', opacity: 0.45 }}>
                  Choose one
                </p>
              </div>

              {/* Options */}
              {options
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(option => {
                  const isSelected = selectedOptions[groupName]?.id === option.id

                  const optName = lang === 'fr' && option.option_name_fr
                    ? option.option_name_fr
                    : option.option_name_en

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(groupName, option)}
                      className="w-full flex items-center justify-between px-5 py-4
                                 transition-colors active:opacity-70 bg-white"
                      style={isSelected ? { background: `${primary}08` } : {}}
                    >
                      {/* Radio + name */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center
                                     justify-center flex-shrink-0 transition-all"
                          style={isSelected ? {
                            borderColor: primary,
                            background: primary,
                          } : {
                            borderColor: 'rgba(45,42,38,0.2)',
                          }}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: isSelected ? primary : '#2D2A26' }}
                        >
                          {optName}
                        </span>
                      </div>

                      {/* Price modifier */}
                      <span
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isSelected ? coral : '#2D2A26',
                          opacity: isSelected ? 1 : 0.45,
                        }}
                      >
                        {option.price_modifier === 0
                          ? 'Included'
                          : `+$${Number(option.price_modifier).toFixed(2)}`
                        }
                      </span>
                    </button>
                  )
                })}
            </div>
          )
        })}

        {/* Quantity selector */}
        <div className="px-5 py-5 bg-white border-b"
             style={{ borderColor: 'rgba(45,42,38,0.06)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: '#2D2A26' }}>
            Quantity
          </h3>
          <div className="flex items-center gap-5">

            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full border-2 flex items-center
                         justify-center active:scale-95 transition-all"
              style={{ borderColor: 'rgba(45,42,38,0.15)' }}
            >
              <Minus size={16} style={{ color: '#2D2A26' }} />
            </button>

            <span className="text-xl font-bold w-6 text-center"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: '#2D2A26' }}>
              {quantity}
            </span>

            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-full flex items-center justify-center
                         active:scale-95 transition-all text-white"
              style={{ background: primary, boxShadow: `0 4px 12px ${primary}44` }}
            >
              <Plus size={16} />
            </button>

          </div>
        </div>

      </div>

      {/* Add to cart button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4"
           style={{ background: '#FFF8F0' }}>
        <button
          onClick={handleAddToCart}
          className="w-full rounded-2xl py-4 px-6 font-semibold text-white
                     flex items-center justify-between active:scale-95 transition-all"
          style={{ background: coral, boxShadow: `0 8px 30px ${coral}44` }}
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center
                           font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.25)' }}>
            {quantity}
          </span>

          <span>Add to Cart</span>

          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            ${totalPrice.toFixed(2)}
          </span>
        </button>
      </div>

    </div>
  )
}