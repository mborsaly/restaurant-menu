import { useState, useEffect }      from 'react'
import { useNavigate, useParams }   from 'react-router-dom'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { supabase }                 from '../lib/supabase'
import { useCart }                  from '../context/CartContext'
import { useSession }               from '../hooks/useSession'
import { t }                        from '../lib/translations'
import LoadingScreen                from '../components/LoadingScreen'

export default function ItemScreen() {
  const navigate     = useNavigate()
  const { id }       = useParams()
  const searchParams = window.location.search

  const { addItem }    = useCart()
  const { restaurant, lang, toggleLang } = useSession()

  const primary = restaurant?.primary_color || '#1A4D3E'
  const coral   = '#FF7A47'

  const [item, setItem]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [quantity, setQuantity]               = useState(1)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [totalPrice, setTotalPrice]           = useState(0)

  // Load item
  useEffect(() => {
    async function loadItem() {
      try {
        // Try sessionStorage first
        const stored = sessionStorage.getItem(
          'selectedItem'
        )
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.id === id) {
            setItem(parsed)
            initOptions(parsed)
            setTotalPrice(parsed.base_price)
            setLoading(false)
            return
          }
        }

        // Supabase fallback
        const { data, error } = await supabase
          .from('menu_items')
          .select('*, item_options(*)')
          .eq('id', id)
          .single()

        if (error) throw error
        setItem(data)
        initOptions(data)
        setTotalPrice(data.base_price)

      } catch (err) {
        console.error('Item load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [id])

  // Pre-select default options
  function initOptions(itemData) {
    if (!itemData?.item_options?.length) return
    const groups   = groupOptions(itemData.item_options)
    const defaults = {}
    Object.entries(groups).forEach(([group, opts]) => {
      const def = opts.find(o => o.is_default)
        || opts[0]
      if (def) defaults[group] = def
    })
    setSelectedOptions(defaults)
  }

  // Recalculate total
  useEffect(() => {
    if (!item) return
    const optExtra = Object.values(selectedOptions)
      .reduce((sum, opt) =>
        sum + (opt?.price_modifier || 0), 0
      )
    setTotalPrice(
      (item.base_price + optExtra) * quantity
    )
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
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: option,
    }))
  }

  function handleAddToCart() {
    addItem(item, selectedOptions, quantity)
    navigate('/menu' + searchParams)
  }

  if (loading) return (
    <LoadingScreen message={t('loading_item', lang)} />
  )

  if (!item) return (
    <div style={{
      minHeight:      '100dvh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        32,
      textAlign:      'center',
      background:     '#FFF8F0',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>
        😕
      </div>
      <h2 style={{
        fontFamily:   "'Fraunces', serif",
        fontSize:     20,
        color:        '#1A4D3E',
        marginBottom: 8,
      }}>
        {t('item_not_found', lang)}
      </h2>
      <button
        onClick={() =>
          navigate('/menu' + searchParams)
        }
        style={{
          padding:      '12px 28px',
          borderRadius: 14,
          background:   coral,
          color:        'white',
          fontWeight:   600,
          border:       'none',
          cursor:       'pointer',
          fontSize:     14,
        }}
      >
        {t('back_to_menu', lang)}
      </button>
    </div>
  )

  const name = lang === 'fr'
    ? (item.name_fr || item.name_en)
    : item.name_en

  const description = lang === 'fr'
    ? (item.description_fr || item.description_en)
    : item.description_en

  const optionGroups = item.item_options?.length
    ? groupOptions(item.item_options)
    : {}

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100dvh',
      background:    '#FFF8F0',
      overflow:      'hidden',
      maxWidth:      448,
      margin:        '0 auto',
    }}>

      {/* Hero image / emoji */}
      <div style={{
        position:       'relative',
        height:         240,
        flexShrink:     0,
        background:     `${primary}15`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        overflow:       'hidden',
      }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={name}
            style={{
              width:     '100%',
              height:    '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: 80 }}>
            {item.emoji || '🍽️'}
          </span>
        )}

        {/* Back button */}
        <button
          onClick={() =>
            navigate('/menu' + searchParams)
          }
          style={{
            position:       'absolute',
            top:            16,
            left:           16,
            width:          40,
            height:         40,
            borderRadius:   '50%',
            background:     'white',
            border:         'none',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            boxShadow:      '0 2px 12px rgba(0,0,0,0.12)',
          }}
        >
          <ChevronLeft size={20}
            style={{ color: '#2D2A26' }} />
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          style={{
            position:     'absolute',
            top:          16,
            right:        16,
            padding:      '6px 14px',
            borderRadius: 100,
            background:   'white',
            border:       'none',
            cursor:       'pointer',
            fontFamily:   "'JetBrains Mono', monospace",
            fontSize:     12,
            fontWeight:   700,
            color:        '#2D2A26',
            boxShadow:    '0 2px 12px rgba(0,0,0,0.12)',
          }}
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

        {/* Popular badge */}
        {item.is_popular && (
          <div style={{
            position:     'absolute',
            bottom:       16,
            left:         16,
            padding:      '6px 14px',
            borderRadius: 100,
            background:   coral,
            color:        'white',
            fontSize:     12,
            fontWeight:   700,
            fontFamily:   "'JetBrains Mono', monospace",
          }}>
            {t('popular', lang)}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{
        flex:       1,
        overflowY:  'auto',
        paddingBottom: 100,
        WebkitOverflowScrolling: 'touch',
      }}>

        {/* Item header */}
        <div style={{
          background:   'white',
          padding:      20,
          borderBottom: '1px solid rgba(45,42,38,0.06)',
        }}>
          <h1 style={{
            fontFamily:   "'Fraunces', serif",
            fontSize:     24,
            fontWeight:   600,
            color:        '#1A4D3E',
            marginBottom: 8,
            letterSpacing: '-0.01em',
          }}>
            {name}
          </h1>

          {description && (
            <p style={{
              fontSize:     14,
              lineHeight:   1.6,
              color:        '#2D2A26',
              opacity:      0.6,
              marginBottom: 12,
            }}>
              {description}
            </p>
          )}

          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   20,
            fontWeight: 700,
            color:      coral,
            margin:     0,
          }}>
            ${Number(item.base_price).toFixed(2)}
          </p>
        </div>

        {/* Option groups */}
        {Object.entries(optionGroups).map(
          ([groupName, options]) => {
            const groupLabel = lang === 'fr'
              && options[0]?.group_name_fr
              ? options[0].group_name_fr
              : groupName

            return (
              <div
                key={groupName}
                style={{
                  borderBottom:
                    '1px solid rgba(45,42,38,0.06)',
                }}
              >
                {/* Group header */}
                <div style={{
                  padding:    '12px 20px',
                  background: 'rgba(45,42,38,0.03)',
                }}>
                  <h3 style={{
                    fontWeight:   700,
                    fontSize:     14,
                    color:        '#2D2A26',
                    margin:       0,
                  }}>
                    {groupLabel}
                  </h3>
                  <p style={{
                    fontSize: 12,
                    color:    '#2D2A26',
                    opacity:  0.45,
                    margin:   '2px 0 0',
                  }}>
                    {t('choose_one', lang)}
                  </p>
                </div>

                {/* Options */}
                {options
                  .sort((a, b) =>
                    a.sort_order - b.sort_order
                  )
                  .map(option => {
                    const isSelected =
                      selectedOptions[groupName]
                        ?.id === option.id

                    const optName = lang === 'fr'
                      && option.option_name_fr
                      ? option.option_name_fr
                      : option.option_name_en

                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          handleOptionSelect(
                            groupName, option
                          )
                        }
                        style={{
                          width:          '100%',
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'space-between',
                          padding:        '14px 20px',
                          background:     isSelected
                            ? `${primary}08`
                            : 'white',
                          border:         'none',
                          borderBottom:   '1px solid rgba(45,42,38,0.04)',
                          cursor:         'pointer',
                          textAlign:      'left',
                        }}
                      >
                        <div style={{
                          display:    'flex',
                          alignItems: 'center',
                          gap:        12,
                        }}>
                          {/* Radio */}
                          <div style={{
                            width:          20,
                            height:         20,
                            borderRadius:   '50%',
                            border:         isSelected
                              ? `2px solid ${primary}`
                              : '2px solid rgba(45,42,38,0.2)',
                            background:     isSelected
                              ? primary : 'white',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            flexShrink:     0,
                            transition:     'all 0.15s',
                          }}>
                            {isSelected && (
                              <div style={{
                                width:        8,
                                height:       8,
                                borderRadius: '50%',
                                background:   'white',
                              }} />
                            )}
                          </div>

                          <span style={{
                            fontSize:   14,
                            fontWeight: isSelected
                              ? 600 : 400,
                            color:      isSelected
                              ? primary : '#2D2A26',
                          }}>
                            {optName}
                          </span>
                        </div>

                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize:   13,
                          fontWeight: 600,
                          color:      isSelected
                            ? coral
                            : '#2D2A26',
                          opacity:    isSelected
                            ? 1 : 0.4,
                        }}>
                          {option.price_modifier === 0
                            ? t('included', lang)
                            : `+$${Number(
                                option.price_modifier
                              ).toFixed(2)}`
                          }
                        </span>
                      </button>
                    )
                  })}
              </div>
            )
          }
        )}

        {/* Quantity */}
        <div style={{
          background:   'white',
          padding:      20,
          borderBottom: '1px solid rgba(45,42,38,0.06)',
        }}>
          <h3 style={{
            fontWeight:   700,
            fontSize:     14,
            color:        '#2D2A26',
            marginBottom: 16,
          }}>
            {t('quantity', lang)}
          </h3>

          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        20,
          }}>
            <button
              onClick={() =>
                setQuantity(q => Math.max(1, q - 1))
              }
              style={{
                width:          40,
                height:         40,
                borderRadius:   '50%',
                border:         '2px solid rgba(45,42,38,0.15)',
                background:     'white',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              <Minus size={16}
                style={{ color: '#2D2A26' }} />
            </button>

            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   20,
              fontWeight: 700,
              color:      '#2D2A26',
              width:      24,
              textAlign:  'center',
            }}>
              {quantity}
            </span>

            <button
              onClick={() =>
                setQuantity(q => q + 1)
              }
              style={{
                width:          40,
                height:         40,
                borderRadius:   '50%',
                border:         'none',
                background:     primary,
                boxShadow:      `0 4px 12px ${primary}44`,
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'white',
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Add to cart button */}
      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        maxWidth:   448,
        margin:     '0 auto',
        padding:    16,
        background: '#FFF8F0',
      }}>
        <button
          onClick={handleAddToCart}
          style={{
            width:          '100%',
            borderRadius:   18,
            padding:        '16px 24px',
            background:     '#FF7A47',
            boxShadow:      '0 8px 30px #FF7A4744',
            border:         'none',
            cursor:         'pointer',
            color:          'white',
            fontWeight:     600,
            fontSize:       16,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{
            width:          32,
            height:         32,
            borderRadius:   '50%',
            background:     'rgba(255,255,255,0.25)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       14,
            fontWeight:     700,
          }}>
            {quantity}
          </span>
          <span>{t('add_to_cart', lang)}</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
          }}>
            ${totalPrice.toFixed(2)}
          </span>
        </button>
      </div>
     </div>     
  )
}