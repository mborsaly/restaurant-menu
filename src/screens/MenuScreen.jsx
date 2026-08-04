import { useState, useEffect } from 'react'
import { useSession }          from '../hooks/useSession'
import { useCart }             from '../context/CartContext'
import { supabase }            from '../lib/supabase'
import { t, isRTL }            from '../lib/translations'
import Header                  from '../components/Header'
import MenuItemCard            from '../components/MenuItemCard'
import ProductCard             from '../components/ProductCard'
import Cart                    from '../components/Cart'
import LoadingScreen           from '../components/LoadingScreen'
import BottomSheet             from '../components/BottomSheet'
import ItemSheet                from '../components/ItemSheet'
import CartSheet                from '../components/CartSheet'
import CheckoutSheet            from '../components/CheckoutSheet'

export default function MenuScreen() {
  const { restaurant, loading: sessionLoading, lang, setLang, isGrocery } = useSession()
  const { itemCount, subtotal } = useCart()

  const [categories, setCategories]         = useState([])
  const [menuItems, setMenuItems]           = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading]               = useState(true)

  // Sheet state — replaces page navigation
  const [activeItem, setActiveItem]   = useState(null) // opens ItemSheet
  const [sheetView, setSheetView]     = useState(null) // 'cart' | 'checkout' | null
  const [justAdded, setJustAdded]     = useState(false)

  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl     = isRTL(lang)

  useEffect(() => {
    if (!restaurant?.id) return
    async function loadMenu() {
      try {
        const { data: cats } = await supabase.from('categories').select('*')
          .eq('vendor_id', restaurant.id).eq('active', true).order('sort_order')

        let items = []
        if (isGrocery) {
          const { data } = await supabase.from('grocery_products')
            .select('*, grocery_product_options(*)').eq('vendor_id', restaurant.id)
            .eq('available', true).order('sort_order')
          items = (data || []).map(p => ({ ...p, item_options: p.grocery_product_options }))
        } else {
          const { data } = await supabase.from('menu_items')
            .select('*, item_options(*)').eq('vendor_id', restaurant.id)
            .eq('available', true).order('sort_order')
          items = data || []
        }

        setCategories(cats || [])
        setMenuItems(items)
        if (cats?.length > 0) setActiveCategory(cats[0].id)
      } finally {
        setLoading(false)
      }
    }
    loadMenu()
  }, [restaurant?.id, isGrocery])

  function getCatName(cat) {
    if (lang === 'ar') return cat.name_ar || cat.name_en
    if (lang === 'fr') return cat.name_fr || cat.name_en
    return cat.name_en
  }

  const filteredItems = activeCategory ? menuItems.filter(i => i.category_id === activeCategory) : menuItems

  if (sessionLoading || loading) return <LoadingScreen message={t('loading_menu_items', lang)} />

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: '#FFF8F0', overflow: 'hidden', maxWidth: 448, margin: '0 auto',
      direction: rtl ? 'rtl' : 'ltr',
    }}>
      <Header restaurant={restaurant} lang={lang} onLangSelect={setLang} />

      <div style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid rgba(45,42,38,0.06)' }}>
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {categories.map(cat => {
            const active = cat.id === activeCategory
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                flexShrink: 0, padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: active ? primary : '#FFF8F0', color: active ? '#FFF8F0' : '#2D2A26', opacity: active ? 1 : 0.7,
              }}>
                {cat.emoji && <span style={{ marginInlineEnd: 6 }}>{cat.emoji}</span>}
                {getCatName(cat)}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {filteredItems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: 16 }}>
            {filteredItems.map(item => {
              const Card = isGrocery ? ProductCard : MenuItemCard
              return (
                <Card
                  key={item.id}
                  item={item}
                  lang={lang}
                  restaurant={restaurant}
                  // Instead of navigating away, open the ItemSheet in place
                  onQuickView={() => setActiveItem(item)}
                  linkTo={null}
                />
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 24px', opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{isGrocery ? '🛒' : '🍽️'}</div>
            <p style={{ fontSize: 15 }}>{t('no_items', lang)}</p>
          </div>
        )}
      </div>

      {/* Floating cart button opens CartSheet instead of navigating */}
      <Cart itemCount={itemCount} subtotal={subtotal} restaurant={restaurant} lang={lang}
        onOpen={() => setSheetView('cart')} linkTo={null} />

      {/* Item detail sheet */}
      <BottomSheet open={!!activeItem} onClose={() => setActiveItem(null)}>
        {activeItem && (
          <ItemSheet
            item={activeItem} lang={lang} restaurant={restaurant} isGrocery={isGrocery}
            onClose={() => setActiveItem(null)}
            onAdded={() => { setJustAdded(true); setTimeout(() => setJustAdded(false), 1200) }}
          />
        )}
      </BottomSheet>

      {/* Cart sheet */}
      <BottomSheet open={sheetView === 'cart'} onClose={() => setSheetView(null)}>
        <CartSheet lang={lang} restaurant={restaurant} onClose={() => setSheetView(null)}
          onCheckout={() => setSheetView('checkout')} />
      </BottomSheet>

      {/* Checkout sheet */}
      <BottomSheet open={sheetView === 'checkout'} onClose={() => setSheetView(null)}>
        <CheckoutSheet lang={lang} restaurant={restaurant} onClose={() => setSheetView(null)}
          onSuccess={() => {}} />
      </BottomSheet>

    </div>
  )
}