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
import ItemSheet               from '../components/ItemSheet'
import CartSheet               from '../components/CartSheet'
import CheckoutSheet           from '../components/CheckoutSheet'

export default function MenuScreen() {
  const {
    restaurant,
    loading: sessionLoading,
    lang,
    setLang,
    isGrocery
  } = useSession()

  const { itemCount, subtotal } = useCart()

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  const [activeItem, setActiveItem] = useState(null)
  const [sheetView, setSheetView] = useState(null)

  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl = isRTL(lang)

  // ─────────────────────────────────────────────
  // Scroll / Section Refs
  // ─────────────────────────────────────────────

  const scrollContainerRef = useRef(null)
  const sectionRefs = useRef({})
  const isProgrammaticScroll = useRef(false)
  const programmaticTimeout = useRef(null)

  // ─────────────────────────────────────────────
  // Load Menu
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!restaurant?.id) return

    async function loadMenu() {
      setLoading(true)

      try {
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('vendor_id', restaurant.id)
          .eq('active', true)
          .order('sort_order')

        let items = []

        if (isGrocery) {
          const { data } = await supabase
            .from('grocery_products')
            .select('*, grocery_product_options(*)')
            .eq('vendor_id', restaurant.id)
            .eq('available', true)
            .order('sort_order')

          items = (data || []).map(product => ({
            ...product,
            item_options: product.grocery_product_options
          }))
        } else {
          const { data } = await supabase
            .from('menu_items')
            .select('*, item_options(*)')
            .eq('vendor_id', restaurant.id)
            .eq('available', true)
            .order('sort_order')

          items = data || []
        }

        // Only show categories that contain items
        const nonEmptyCats = (cats || []).filter(category =>
          items.some(item => item.category_id === category.id)
        )

        setCategories(nonEmptyCats)
        setMenuItems(items)

        if (nonEmptyCats.length > 0) {
          setActiveCategory(nonEmptyCats[0].id)
        } else {
          setActiveCategory(null)
        }

      } catch (error) {
        console.error('Error loading menu:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [restaurant?.id, isGrocery])

  // ─────────────────────────────────────────────
  // Category Name
  // ─────────────────────────────────────────────

  function getCatName(cat) {
    if (lang === 'ar') {
      return cat.name_ar || cat.name_en
    }

    if (lang === 'fr') {
      return cat.name_fr || cat.name_en
    }

    return cat.name_en
  }

  // ─────────────────────────────────────────────
  // Register Category Section
  // ─────────────────────────────────────────────

  const setSectionRef = useCallback((categoryId) => (node) => {
    if (node) {
      sectionRefs.current[categoryId] = node
    } else {
      delete sectionRefs.current[categoryId]
    }
  }, [])

  // ─────────────────────────────────────────────
  // Scroll Spy
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (loading || categories.length === 0) return

    const container = scrollContainerRef.current

    if (!container) return

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return

      const containerTop =
        container.getBoundingClientRect().top

      let currentCategory = categories[0]?.id

      for (const category of categories) {
        const section = sectionRefs.current[category.id]

        if (!section) continue

        const sectionTop =
          section.getBoundingClientRect().top -
          containerTop

        if (sectionTop <= 80) {
          currentCategory = category.id
        } else {
          break
        }
      }

      setActiveCategory(currentCategory)
    }

    container.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )

    handleScroll()

    return () => {
      container.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [loading, categories])

  // ─────────────────────────────────────────────
  // Category Tab Click
  // ─────────────────────────────────────────────

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

    container.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    })

    clearTimeout(programmaticTimeout.current)

    programmaticTimeout.current = setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 700)
  }

  // ─────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearTimeout(programmaticTimeout.current)
    }
  }, [])

  // ─────────────────────────────────────────────
  // Session Loading
  // ─────────────────────────────────────────────

  if (sessionLoading) {
    return null
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: '#FFF8F0',
        overflow: 'hidden',
        maxWidth: 448,
        margin: '0 auto',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >

      {/* ─────────────────────────────────────── */}
      {/* Restaurant Header */}
      {/* ─────────────────────────────────────── */}

      <Header
        restaurant={restaurant}
        lang={lang}
        setLang={setLang}
      />

      {/* ─────────────────────────────────────── */}
      {/* Category Navigation */}
      {/* ─────────────────────────────────────── */}

      {categories.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            position: 'relative',
            zIndex: 20,
            background: '#FFF8F0',
          }}
        >
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

      {/* ─────────────────────────────────────── */}
      {/* Scrollable Menu */}
      {/* ─────────────────────────────────────── */}

      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 100,
          WebkitOverflowScrolling: 'touch',
        }}
      >

        {loading ? (
          <SkeletonGrid count={6} />

        ) : categories.length > 0 ? (

          categories.map(category => {

            const categoryItems = menuItems.filter(
              item => item.category_id === category.id
            )

            const CardComponent =
              isGrocery ? ProductCard : MenuItemCard

            return (
              <section
                key={category.id}
                ref={setSectionRef(category.id)}
                data-category-id={category.id}
                style={{
                  width: '100%',
                  direction: rtl ? 'rtl' : 'ltr',
                }}
              >

                {/* Category Title */}

                <div
                  style={{
                    padding: '18px 16px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,

                    // Arabic → right aligned
                    // English/French → left aligned
                    justifyContent: rtl
                      ? 'flex-end'
                      : 'flex-start',

                    flexDirection: rtl
                      ? 'row-reverse'
                      : 'row',

                    textAlign: rtl
                      ? 'right'
                      : 'left',
                  }}
                >

                  {category.emoji && (
                    <span style={{ fontSize: 17 }}>
                      {category.emoji}
                    </span>
                  )}

                  <h2
                    style={{
                      fontFamily:
                        lang === 'ar'
                          ? "'Noto Naskh Arabic', serif"
                          : "'Fraunces', serif",

                      fontSize: 17,
                      fontWeight: 700,
                      color: '#1A4D3E',
                      margin: 0,

                      textAlign: rtl
                        ? 'right'
                        : 'left',
                    }}
                  >
                    {getCatName(category)}
                  </h2>

                </div>

                {/* Menu Items */}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, 1fr)',
                    gap: 12,
                    padding: '4px 16px 8px',

                    direction: rtl
                      ? 'rtl'
                      : 'ltr',
                  }}
                >

                  {categoryItems.map(item => (
                    <CardComponent
                      key={item.id}
                      item={item}
                      lang={lang}
                      restaurant={restaurant}
                      onQuickView={() =>
                        setActiveItem(item)
                      }
                    />
                  ))}

                </div>

              </section>
            )
          })

        ) : (

          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              opacity: 0.5,
            }}
          >
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
              }}
            >
              {isGrocery ? '🛒' : '🍽️'}
            </div>

            <p
              style={{
                fontSize: 15,
                fontFamily:
                  "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {t('no_items', lang)}
            </p>
          </div>

        )}

      </div>

      {/* ─────────────────────────────────────── */}
      {/* Cart */}
      {/* ─────────────────────────────────────── */}

      <Cart
        itemCount={itemCount}
        subtotal={subtotal}
        restaurant={restaurant}
        lang={lang}
        onOpen={() => setSheetView('cart')}
      />

      {/* ─────────────────────────────────────── */}
      {/* Item Modal */}
      {/* ─────────────────────────────────────── */}

      <Modal
        open={!!activeItem}
        onClose={() => setActiveItem(null)}
      >
        {activeItem && (
          <ItemSheet
            item={activeItem}
            lang={lang}
            restaurant={restaurant}
            isGrocery={isGrocery}
            onClose={() => setActiveItem(null)}
          />
        )}
      </Modal>

      {/* ─────────────────────────────────────── */}
      {/* Cart Modal */}
      {/* ─────────────────────────────────────── */}

      <Modal
        open={sheetView === 'cart'}
        onClose={() => setSheetView(null)}
      >
        <CartSheet
          lang={lang}
          restaurant={restaurant}
          onClose={() => setSheetView(null)}
          onCheckout={() => setSheetView('checkout')}
        />
      </Modal>

      {/* ─────────────────────────────────────── */}
      {/* Checkout Modal */}
      {/* ─────────────────────────────────────── */}

      <Modal
        open={sheetView === 'checkout'}
        onClose={() => setSheetView(null)}
      >
        <CheckoutSheet
          lang={lang}
          restaurant={restaurant}
          onClose={() => setSheetView(null)}
          onSuccess={() => {}}
        />
      </Modal>

    </div>
  )
}