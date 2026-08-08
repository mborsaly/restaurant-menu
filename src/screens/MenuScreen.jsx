import { useState, useEffect, useRef, useCallback } from 'react'
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

  // ── Scroll-spy refs ──
  const scrollContainerRef = useRef(null)
  const sectionRefs        = useRef({}) // { [categoryId]: HTMLElement }
  const isProgrammaticScroll = useRef(false)
  const programmaticTimeout  = useRef(null)

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

        // Only keep categories that actually have items —
        // avoids empty sections in the vertical scroll
        const nonEmptyCats = (cats || []).filter(
          cat => items.some(i => i.category_id === cat.id)
        )

        setCategories(nonEmptyCats)
        setMenuItems(items)
        if (nonEmptyCats.length > 0) setActiveCategory(nonEmptyCats[0].id)
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

  // ── Register a section DOM node ──
  const setSectionRef = useCallback((categoryId) => (node) => {
    if (node) sectionRefs.current[categoryId] = node
    else delete sectionRefs.current[categoryId]
  }, [])

  // ── Scroll-spy: watch which section is at the top
  //    of the scroll container and update the active tab ──
  useEffect(() => {
    if (loading || categories.length === 0) return
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return

        // Determine which observed section is currently
        // intersecting the "active band" (top portion of
        // the scroll container). Multiple sections can be
        // intersecting at once near boundaries — pick the
        // topmost one in DOM/category order for stability.
        const intersectingIds = new Set(
          entries.filter(e => e.isIntersecting)
            .map(e => e.target.dataset.categoryId)
        )
        if (intersectingIds.size === 0) return

        const topmost = categories.find(cat => intersectingIds.has(String(cat.id)))
        if (topmost) setActiveCategory(topmost.id)
      },
      {
        root: container,
        // Trigger band: top of the scroll container down to
        // 65% of its height. A section becomes "active" once
        // its top has scrolled up into this band.
        rootMargin: '0px 0px -65% 0px',
        threshold: 0,
      }
    )

    categories.forEach(cat => {
      const el = sectionRefs.current[cat.id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [loading, categories])

  // ── Tap a category tab → smooth-scroll to that section ──
  function handleCategorySelect(categoryId) {
    const container = scrollContainerRef.current
    const target = sectionRefs.current[categoryId]
    if (!container || !target) return

    // Suppress scroll-spy updates while the programmatic
    // scroll animation is in flight, so it doesn't fight
    // with the tap and briefly highlight the wrong tab
    isProgrammaticScroll.current = true
    setActiveCategory(categoryId)

    const targetTop = target.offsetTop - container.offsetTop
    container.scrollTo({ top: targetTop, behavior: 'smooth' })

    clearTimeout(programmaticTimeout.current)
    programmaticTimeout.current = setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 600)
  }

  useEffect(() => {
    return () => clearTimeout(programmaticTimeout.current)
  }, [])

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
          onSelect={handleCategorySelect}
          lang={lang}
          primary={primary}
          getName={getCatName}
        />
      )}

      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {loading ? (
          <SkeletonGrid count={6} />
        ) : categories.length > 0 ? (
          categories.map(cat => {
            const catItems = menuItems.filter(i => i.category_id === cat.id)
            return (
              <section
                key={cat.id}
                ref={setSectionRef(cat.id)}
                data-category-id={cat.id}
                style={{ scrollMarginTop: 0 }}
              >
                <div style={{
                  padding: '18px 16px 8px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  flexDirection: rtl ? 'row-reverse' : 'row',
                }}>
                  {cat.emoji && <span style={{ fontSize: 17 }}>{cat.emoji}</span>}
                  <h2 style={{
                    fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Fraunces', serif",
                    fontSize: 17, fontWeight: 700, color: '#1A4D3E', margin: 0,
                  }}>
                    {getCatName(cat)}
                  </h2>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12, padding: '4px 16px 8px',
                }}>
                  {catItems.map(item => {
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
              </section>
            )
          })
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