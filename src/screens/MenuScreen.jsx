import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useSession }          from '../hooks/useSession'
import { useCart }             from '../context/CartContext'
import { supabase }            from '../lib/supabase'
import { t }                   from '../lib/translations'
import Header                  from '../components/Header'
import MenuItemCard             from '../components/MenuItemCard'
import Cart                    from '../components/Cart'
import LoadingScreen            from '../components/LoadingScreen'

export default function MenuScreen() {
  const navigate     = useNavigate()
  const searchParams = window.location.search

  const {
    restaurant,
    loading: sessionLoading,
    lang,
    toggleLang,
  } = useSession()

  const { itemCount, subtotal } = useCart()

  const [categories, setCategories]         = useState([])
  const [menuItems, setMenuItems]           = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading]               = useState(true)

  const primary = restaurant?.primary_color || '#1A4D3E'

  // Load menu data
  useEffect(() => {
    if (!restaurant?.id) return

    async function loadMenu() {
      try {
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('active', true)
          .order('sort_order')

        const { data: items } = await supabase
          .from('menu_items')
          .select('*, item_options(*)')
          .eq('restaurant_id', restaurant.id)
          .eq('available', true)
          .order('sort_order')

        setCategories(cats || [])
        setMenuItems(items || [])

        if (cats?.length > 0) {
          setActiveCategory(cats[0].id)
        }
      } catch (err) {
        console.error('Menu load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [restaurant?.id])

  const filteredItems = activeCategory
    ? menuItems.filter(
        item => item.category_id === activeCategory
      )
    : menuItems

  if (sessionLoading || loading) return (
    <LoadingScreen
      message={t('loading_menu_items', lang)}
    />
  )

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100dvh',
      background:    '#FFF8F0',
      overflow:      'hidden',
      maxWidth:      448,
      margin:        '0 auto',
      position:      'relative',
    }}>

      {/* ── Header — never scrolls ── */}
      <Header
        restaurant={restaurant}
        lang={lang}
        onLangToggle={toggleLang}
      />

      {/* ── Category bar — never scrolls ── */}
      <div style={{
        flexShrink:   0,
        background:   'white',
        borderBottom: '1px solid rgba(45,42,38,0.06)',
      }}>
        <div style={{
          display:          'flex',
          gap:              8,
          padding:          '12px 16px',
          overflowX:        'auto',
          msOverflowStyle:  'none',
          scrollbarWidth:   'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {categories.map(cat => {
            const active = cat.id === activeCategory
            const name   = lang === 'fr'
              ? (cat.name_fr || cat.name_en)
              : cat.name_en

            return (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(cat.id)
                }
                style={{
                  flexShrink:   0,
                  padding:      '8px 18px',
                  borderRadius: 100,
                  fontSize:     13,
                  fontWeight:   600,
                  border:       'none',
                  cursor:       'pointer',
                  whiteSpace:   'nowrap',
                  transition:   'all 0.2s',
                  background:   active
                    ? primary : '#FFF8F0',
                  color: active
                    ? '#FFF8F0' : '#2D2A26',
                  opacity: active ? 1 : 0.7,
                }}
              >
                {cat.emoji && (
                  <span style={{ marginRight: 6 }}>
                    {cat.emoji}
                  </span>
                )}
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Items — only this scrolls ── */}
      <div style={{
        flex:            1,
        overflowY:       'auto',
        overflowX:       'hidden',
        paddingBottom:   100,
        WebkitOverflowScrolling: 'touch',
      }}>
        {filteredItems.length > 0 ? (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap:                 12,
            padding:             16,
          }}>
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                lang={lang}
                searchParams={searchParams}
                restaurant={restaurant}
              />
            ))}
          </div>
        ) : (
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '80px 24px',
            textAlign:      'center',
            opacity:        0.5,
          }}>
            <div style={{
              fontSize:     48,
              marginBottom: 16,
            }}>
              🍽️
            </div>
            <p style={{ color: '#2D2A26', fontSize: 15 }}>
              {t('no_items', lang)}
            </p>
          </div>
        )}
      </div>

      {/* ── Cart button ── */}
      <Cart
        itemCount={itemCount}
        subtotal={subtotal}
        searchParams={searchParams}
        restaurant={restaurant}
        lang={lang}
      />

    </div>
  )
}