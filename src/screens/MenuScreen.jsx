import { useState, useEffect } from 'react'
import { useSession }          from '../hooks/useSession'
import { useCart }             from '../context/CartContext'
import { supabase }            from '../lib/supabase'
import { t, isRTL }            from '../lib/translations'
import Header                  from '../components/Header'
import CategoryTabs            from '../components/CategoryTabs'
import MenuItemCard            from '../components/MenuItemCard'
import ProductCard             from '../components/ProductCard'
import Cart                    from '../components/Cart'
import { SkeletonGrid }        from '../components/SkeletonCard'
import Modal                   from '../components/Modal'
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

  const [activeItem, setActiveItem]   = useState(null)
  const [sheetView, setSheetView]     = useState(null)

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

  // Header renders immediately (restaurant data is
  // already resolved by useSession before this runs);
  // only the menu grid shows a skeleton, avoiding a
  // full-page blocking spinner — reduces perceived LCP.
  if (sessionLoading) return null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: '#FFF8F0', overflow: 'hidden', maxWidth: 448, margin: '0 auto',
      direction: rtl ? 'rtl' : 'ltr',
    }}>
      <Header restaurant={restaurant} lang={lang} onLangSelect={setLang} />

      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          lang={lang}
          primary={primary}
          getName={getCatName}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {loading ? (
          <SkeletonGrid count={6} />
        ) : filteredItems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: 16 }}>
            {filteredItems.map(item => {
              const CardComponent = isGrocery ? ProductCard : MenuItemCard
              return (
                <CardComponent
                  key={item.id}
                  item={item}
                  lang={lang}
                  restaurant={restaurant}
                  onQuickView={() => setActiveItem(item)}
                />
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 24px', opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{isGrocery ? '🛒' : '🍽️'}</div>
            <p style={{ fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t('no_items', lang)}</p>
          </div>
        )}
      </div>

      <Cart itemCount={itemCount} subtotal={subtotal} restaurant={restaurant} lang={lang}
        onOpen={() => setSheetView('cart')} />

      <Modal open={!!activeItem} onClose={() => setActiveItem(null)}>
        {activeItem && (
          <ItemSheet
            item={activeItem} lang={lang} restaurant={restaurant} isGrocery={isGrocery}
            onClose={() => setActiveItem(null)}
          />
        )}
      </Modal>

      <Modal open={sheetView === 'cart'} onClose={() => setSheetView(null)}>
        <CartSheet lang={lang} restaurant={restaurant} onClose={() => setSheetView(null)}
          onCheckout={() => setSheetView('checkout')} />
      </Modal>

      <Modal open={sheetView === 'checkout'} onClose={() => setSheetView(null)}>
        <CheckoutSheet lang={lang} restaurant={restaurant} onClose={() => setSheetView(null)} onSuccess={() => {}} />
      </Modal>
    </div>
  )
}