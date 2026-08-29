import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession }          from '../hooks/useSession'
import { useCart }             from '../context/CartContext'
import { supabase }            from '../lib/supabase'
import { pickTranslation, groupTranslationsByEntity } from '../lib/i18n'
import { t }                   from '../lib/translations'
import { Search, X }           from 'lucide-react'
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
import OrderHistorySheet        from '../components/OrderHistorySheet'

export default function MenuScreen() {
  const {
    restaurant, loading: sessionLoading, lang, isRTL, setLang,
    isGrocery, isDineIn, dineInTable, dineInSessionId, vendorLanguages,
  } = useSession()

  const { itemCount, subtotal } = useCart()

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [activeItem, setActiveItem] = useState(null)
  const [sheetView, setSheetView] = useState(null)

  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl = isRTL
  const arabicFont = rtl ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif"

  const scrollContainerRef = useRef(null)
  const sectionRefs = useRef({})
  const isProgrammaticScroll = useRef(false)
  const programmaticTimeout = useRef(null)

  // ─────────────────────────────────────────────
  // Load Menu — now pulls category_translations
  // and menu_item_translations / grocery_product_
  // translations alongside the base rows, and
  // merges the current-language text onto each
  // row as .name / .description for the rest of
  // the component tree to consume unchanged
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!restaurant?.id) return

    async function loadMenu() {
      setLoading(true)

      try {
        const { data: cats } = await supabase
          .from('categories')
          .select('*, category_translations(*)')
          .eq('vendor_id', restaurant.id)
          .eq('active', true)
          .order('sort_order')

        let items = []

        if (isGrocery) {
          const { data } = await supabase
            .from('grocery_products')
            .select('*, grocery_product_options(*, grocery_product_option_translations(*)), grocery_product_translations(*)')
            .eq('vendor_id', restaurant.id)
            .eq('available', true)
            .order('sort_order')

          items = (data || []).map(product => ({
            ...product,
            item_options: (product.grocery_product_options || []).map(opt => ({
              ...opt,
              translations: opt.grocery_product_option_translations,
            })),
            translations: product.grocery_product_translations,
          }))
        } else {
          const { data } = await supabase
            .from('menu_items')
            .select('*, item_options(*, item_option_translations(*)), menu_item_translations(*)')
            .eq('vendor_id', restaurant.id)
            .eq('available', true)
            .order('sort_order')

          items = (data || []).map(item => ({
            ...item,
            item_options: (item.item_options || []).map(opt => ({
              ...opt,
              translations: opt.item_option_translations,
            })),
            translations: item.menu_item_translations,
          }))
        }

        const catsWithTranslations = (cats || []).map(cat => ({
          ...cat,
          translations: cat.category_translations,
        }))

        const nonEmptyCats = catsWithTranslations.filter(category =>
          items.some(item => item.category_id === category.id)
        )

        setCategories(nonEmptyCats)
        setMenuItems(items)

        setActiveCategory(nonEmptyCats.length > 0 ? nonEmptyCats[0].id : null)

      } catch (error) {
        console.error('Error loading menu:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [restaurant?.id, isGrocery])

  // ─────────────────────────────────────────────
  // Translation helpers — pull from the joined
  // .translations array using pickTranslation
  // ─────────────────────────────────────────────

  const fallbackLang = vendorLanguages.find(l => l.is_default)?.code || 'en'

  function getCatName(category) {
    return pickTranslation(category.translations, 'name', lang, fallbackLang)
      || category.name_en  // legacy fallback while old columns still exist
  }

  function getItemName(item) {
    return pickTranslation(item.translations, 'name', lang, fallbackLang)
      || item.name_en
  }

  function getItemDesc(item) {
    return pickTranslation(item.translations, 'description', lang, fallbackLang)
      || item.description_en
  }

  // ─────────────────────────────────────────────
  // Search — now searches across ALL translations
  // for an item, not just three hardcoded fields
  // ─────────────────────────────────────────────

  function getItemSearchNames(item) {
    const names = (item.translations || []).map(t => t.name).filter(Boolean)
    const legacyNames = [item.name_en, item.name_fr, item.name_ar].filter(Boolean)
    const brand = item.brand_name ? [item.brand_name] : []
    return [...names, ...legacyNames, ...brand].map(s => s.toLowerCase())
  }

  const searchActive = searchQuery.trim().length > 0
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const searchFilteredItems = searchActive
    ? menuItems.filter(item =>
        getItemSearchNames(item).some(n => n.includes(normalizedQuery))
      )
    : menuItems

  const visibleCategories = searchActive
    ? categories.filter(category =>
        searchFilteredItems.some(item => item.category_id === category.id)
      )
    : categories

  const setSectionRef = useCallback((categoryId) => (node) => {
    if (node) sectionRefs.current[categoryId] = node
    else delete sectionRefs.current[categoryId]
  }, [])

  useEffect(() => {
    if (loading || visibleCategories.length === 0) return
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return
      const containerTop = container.getBoundingClientRect().top
      let currentCategory = visibleCategories[0]?.id

      for (const category of visibleCategories) {
        const section = sectionRefs.current[category.id]
        if (!section) continue
        const sectionTop = section.getBoundingClientRect().top - containerTop
        if (sectionTop <= 100) currentCategory = category.id
        else break
      }
      setActiveCategory(currentCategory)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => container.removeEventListener('scroll', handleScroll)
  }, [loading, visibleCategories])

  function handleCategorySelect(categoryId) {
    const container = scrollContainerRef.current
    const target = sectionRefs.current[categoryId]
    if (!container || !target) return

    setActiveCategory(categoryId)
    isProgrammaticScroll.current = true

    const targetTop =
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop

    container.scrollTo({ top: targetTop, behavior: 'smooth' })

    clearTimeout(programmaticTimeout.current)
    programmaticTimeout.current = setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 700)
  }

  useEffect(() => {
    return () => clearTimeout(programmaticTimeout.current)
  }, [])

  if (sessionLoading) return null

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', height: '100dvh',
        background: '#FFF8F0', overflow: 'hidden', maxWidth: 448, margin: '0 auto',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      <Header
        restaurant={restaurant}
        lang={lang}
        onLangSelect={setLang}
        isDineIn={isDineIn}
        dineInTable={dineInTable}
        onHistoryOpen={() => setSheetView('history')}
      />

      <div style={{ flexShrink: 0, background: '#FFF8F0', padding: '10px 16px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              [rtl ? 'right' : 'left']: 12, color: '#1B2530', opacity: 0.35, pointerEvents: 'none',
            }}
          />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder', lang)}
            dir={rtl ? 'rtl' : 'ltr'}
            style={{
              width: '100%',
              padding: rtl ? '10px 38px 10px 34px' : '10px 34px 10px 38px',
              borderRadius: 100,
              border: '1.5px solid rgba(26, 77, 62, 0.12)',
              background: 'white',
              fontSize: 13.5,
              color: '#1B2530',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: arabicFont,
              textAlign: rtl ? 'right' : 'left',
            }}
          />
          {searchActive && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                [rtl ? 'left' : 'right']: 10, width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(26, 77, 62, 0.08)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={12} style={{ color: '#1B2530' }} />
            </button>
          )}
        </div>
      </div>

      {!searchActive && categories.length > 0 && (
        <div style={{
          flexShrink: 0, position: 'relative', zIndex: 20,
          background: '#FFF8F0', borderBottom: '1px solid rgba(26, 77, 62, 0.08)',
        }}>
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={handleCategorySelect}
            lang={lang}
            primary={primary}
            getName={getCatName}
          />
        </div>
      )}

      <div
        ref={scrollContainerRef}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          paddingBottom: 100, WebkitOverflowScrolling: 'touch',
          direction: rtl ? 'rtl' : 'ltr',
        }}
      >
        {loading ? (
          <SkeletonGrid count={6} />
        ) : visibleCategories.length > 0 ? (
          visibleCategories.map((category, index) => {
            const categoryItems = searchFilteredItems.filter(
              item => item.category_id === category.id
            )
            if (categoryItems.length === 0) return null

            const CardComponent = isGrocery ? ProductCard : MenuItemCard

            return (
              <section
                key={category.id}
                ref={setSectionRef(category.id)}
                data-category-id={category.id}
                style={{
                  width: '100%',
                  direction: rtl ? 'rtl' : 'ltr',
                  paddingTop: index === 0 ? 20 : 38,
                  borderTop: index === 0 ? 'none' : '1px solid rgba(26, 77, 62, 0.10)',
                }}
              >
                <div
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: rtl ? '8px 20px 16px 16px' : '8px 16px 16px 20px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    direction: 'ltr', justifyContent: 'flex-start',
                  }}
                >
                  <div style={{ width: 4, height: 32, borderRadius: 4, background: primary, flexShrink: 0 }} />
                  {category.emoji && (
                    <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{category.emoji}</span>
                  )}
                  <h2
                    style={{
                      fontFamily: rtl ? "'Noto Naskh Arabic', serif" : "'Fraunces', serif",
                      fontSize: rtl ? 25 : 23,
                      fontWeight: 700,
                      letterSpacing: rtl ? 0 : '-0.3px',
                      lineHeight: 1.1,
                      color: '#1A4D3E',
                      margin: 0,
                      direction: rtl ? 'rtl' : 'ltr',
                      textAlign: rtl ? 'right' : 'left',
                    }}
                  >
                    {getCatName(category)}
                  </h2>
                </div>

                <div
                  style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 12, padding: '0 16px 20px', direction: rtl ? 'rtl' : 'ltr',
                  }}
                >
                  {categoryItems.map(item => (
                    <CardComponent
                      key={item.id}
                      item={item}
                      lang={lang}
                      isRTL={rtl}
                      restaurant={restaurant}
                      onQuickView={() => setActiveItem(item)}
                    />
                  ))}
                </div>
              </section>
            )
          })
        ) : searchActive ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', opacity: 0.5 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
            <p style={{ fontSize: 14, fontFamily: arabicFont }}>{t('no_search_results', lang)}</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 24px', opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{isGrocery ? '🛒' : '🍽️'}</div>
            <p style={{ fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t('no_items', lang)}</p>
          </div>
        )}
      </div>

      <Cart
        itemCount={itemCount}
        subtotal={subtotal}
        restaurant={restaurant}
        lang={lang}
        isRTL={rtl}
        onOpen={() => setSheetView('cart')}
      />

      <Modal open={!!activeItem} onClose={() => setActiveItem(null)}>
        {activeItem && (
          <ItemSheet
            item={activeItem}
            lang={lang}
            isRTL={rtl}
            fallbackLang={fallbackLang}
            restaurant={restaurant}
            isGrocery={isGrocery}
            onClose={() => setActiveItem(null)}
          />
        )}
      </Modal>

      <Modal open={sheetView === 'cart'} onClose={() => setSheetView(null)}>
        <CartSheet
          lang={lang}
          isRTL={rtl}
          restaurant={restaurant}
          onClose={() => setSheetView(null)}
          onCheckout={() => setSheetView('checkout')}
        />
      </Modal>

      <Modal open={sheetView === 'checkout'} onClose={() => setSheetView(null)}>
        <CheckoutSheet
          lang={lang}
          isRTL={rtl}
          restaurant={restaurant}
          onClose={() => setSheetView(null)}
          onSuccess={() => {}}
        />
      </Modal>

      <Modal open={sheetView === 'history'} onClose={() => setSheetView(null)}>
        <OrderHistorySheet
          lang={lang}
          isRTL={rtl}
          restaurant={restaurant}
          isDineIn={isDineIn}
          dineInSessionId={dineInSessionId}
          dineInTable={dineInTable}
          onClose={() => setSheetView(null)}
        />
      </Modal>
    </div>
  )
}