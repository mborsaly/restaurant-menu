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
        const { data: cats, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('vendor_id', restaurant.id)
          .eq('active', true)
          .order('sort_order')

        if (categoriesError) {
          console.error(
            'Error loading categories:',
            categoriesError
          )
        }

        let items = []

        if (isGrocery) {
          const { data, error } = await supabase
            .from('grocery_products')
            .select('*, grocery_product_options(*)')
            .eq('vendor_id', restaurant.id)
            .eq('available', true)
            .order('sort_order')

          if (error) {
            console.error(
              'Error loading grocery products:',
              error
            )
          }

          items = (data || []).map(product => ({
            ...product,
            item_options: product.grocery_product_options
          }))
        } else {
          const { data, error } = await supabase
            .from('menu_items')
            .select('*, item_options(*)')
            .eq('vendor_id', restaurant.id)
            .eq('available', true)
            .order('sort_order')

          if (error) {
            console.error(
              'Error loading menu items:',
              error
            )
          }

          items = data || []
        }

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
        console.error(
          'Error loading menu:',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [restaurant?.id, isGrocery])

  // ─────────────────────────────────────────────
  // Category Name
  // ─────────────────────────────────────────────

  function getCatName(category) {
    if (lang === 'ar') {
      return category.name_ar || category.name_en
    }

    if (lang === 'fr') {
      return category.name_fr || category.name_en
    }

    return category.name_en
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
        const section =
          sectionRefs.current[category.id]

        if (!section) continue

        const sectionTop =
          section.getBoundingClientRect().top -
          containerTop

        if (sectionTop <= 100) {
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
    const container =
      scrollContainerRef.current

    const target =
      sectionRefs.current[categoryId]

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

    clearTimeout(
      programmaticTimeout.current
    )

    programmaticTimeout.current =
      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 700)
  }

  // ─────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearTimeout(
        programmaticTimeout.current
      )
    }
  }, [])

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

        // Overall page direction
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >

      {/* ═══════════════════════════════════════ */}
      {/* RESTAURANT HEADER */}
      {/* ═══════════════════════════════════════ */}

      <Header
        restaurant={restaurant}
        lang={lang}
        onLangSelect={setLang}
      />

      {/* ═══════════════════════════════════════ */}
      {/* CATEGORY NAVIGATION */}
      {/* ═══════════════════════════════════════ */}

      {categories.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            position: 'relative',
            zIndex: 20,
            background: '#FFF8F0',
            borderBottom:
              '1px solid rgba(26, 77, 62, 0.08)',
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

      {/* ═══════════════════════════════════════ */}
      {/* SCROLLABLE MENU */}
      {/* ═══════════════════════════════════════ */}

      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 100,
          WebkitOverflowScrolling: 'touch',

          direction: rtl ? 'rtl' : 'ltr',
        }}
      >

        {loading ? (

          <SkeletonGrid count={6} />

        ) : categories.length > 0 ? (

          categories.map((category, index) => {

            const categoryItems =
              menuItems.filter(
                item =>
                  item.category_id === category.id
              )

            const CardComponent =
              isGrocery
                ? ProductCard
                : MenuItemCard

            return (
              <section
                key={category.id}
                ref={setSectionRef(category.id)}
                data-category-id={category.id}
                style={{
                  width: '100%',

                  direction:
                    rtl ? 'rtl' : 'ltr',

                  paddingTop:
                    index === 0
                      ? 20
                      : 38,

                  borderTop:
                    index === 0
                      ? 'none'
                      : '1px solid rgba(26, 77, 62, 0.10)',
                }}
              >

                {/* ═══════════════════════════════ */}
                {/* CATEGORY HEADER */}
                {/* ═══════════════════════════════ */}

                <div
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',

                    padding:
                      rtl
                        ? '8px 20px 16px 16px'
                        : '8px 16px 16px 20px',

                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,

                    /*
                     * IMPORTANT:
                     *
                     * English / French:
                     *
                     * │  ☕  Category
                     *
                     * Arabic:
                     *
                     * Category  ☕  │
                     */

                    flexDirection:
                      rtl
                        ? 'row-reverse'
                        : 'row',

                    /*
                     * Anchor the complete group:
                     *
                     * English/French → LEFT
                     * Arabic         → RIGHT
                     */

                    justifyContent:
                      rtl
                        ? 'flex-end'
                        : 'flex-start',

                    /*
                     * Explicitly override the parent's
                     * RTL direction so flex positioning
                     * behaves predictably.
                     */

                    direction: 'ltr',
                  }}
                >

                  {/* Vertical Accent */}

                  <div
                    style={{
                      width: 4,
                      height: 32,
                      borderRadius: 4,
                      background: primary,
                      flexShrink: 0,
                    }}
                  />

                  {/* Category Icon */}

                  {category.emoji && (
                    <span
                      style={{
                        fontSize: 24,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {category.emoji}
                    </span>
                  )}

                  {/* Category Name */}

                  <h2
                    style={{
                      fontFamily:
                        lang === 'ar'
                          ? "'Noto Naskh Arabic', serif"
                          : "'Fraunces', serif",

                      fontSize:
                        lang === 'ar'
                          ? 25
                          : 23,

                      fontWeight: 700,

                      letterSpacing:
                        lang === 'ar'
                          ? 0
                          : '-0.3px',

                      lineHeight: 1.1,

                      color: '#1A4D3E',

                      margin: 0,

                      /*
                       * Text itself follows its language.
                       */

                      direction:
                        rtl ? 'rtl' : 'ltr',

                      textAlign:
                        rtl ? 'right' : 'left',
                    }}
                  >
                    {getCatName(category)}
                  </h2>

                </div>

                {/* ═══════════════════════════════ */}
                {/* CATEGORY ITEMS */}
                {/* ═══════════════════════════════ */}

                <div
                  style={{
                    display: 'grid',

                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',

                    gap: 12,

                    padding:
                      '0 16px 20px',

                    direction:
                      rtl ? 'rtl' : 'ltr',
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
              {isGrocery
                ? '🛒'
                : '🍽️'}
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

      {/* ═══════════════════════════════════════ */}
      {/* CART */}
      {/* ═══════════════════════════════════════ */}

      <Cart
        itemCount={itemCount}
        subtotal={subtotal}
        restaurant={restaurant}
        lang={lang}
        onOpen={() =>
          setSheetView('cart')
        }
      />

      {/* ═══════════════════════════════════════ */}
      {/* ITEM MODAL */}
      {/* ═══════════════════════════════════════ */}

      <Modal
        open={!!activeItem}
        onClose={() =>
          setActiveItem(null)
        }
      >
        {activeItem && (
          <ItemSheet
            item={activeItem}
            lang={lang}
            restaurant={restaurant}
            isGrocery={isGrocery}
            onClose={() =>
              setActiveItem(null)
            }
          />
        )}
      </Modal>

      {/* ═══════════════════════════════════════ */}
      {/* CART MODAL */}
      {/* ═══════════════════════════════════════ */}

      <Modal
        open={sheetView === 'cart'}
        onClose={() =>
          setSheetView(null)
        }
      >
        <CartSheet
          lang={lang}
          restaurant={restaurant}
          onClose={() =>
            setSheetView(null)
          }
          onCheckout={() =>
            setSheetView('checkout')
          }
        />
      </Modal>

      {/* ═══════════════════════════════════════ */}
      {/* CHECKOUT MODAL */}
      {/* ═══════════════════════════════════════ */}

      <Modal
        open={sheetView === 'checkout'}
        onClose={() =>
          setSheetView(null)
        }
      >
        <CheckoutSheet
          lang={lang}
          restaurant={restaurant}
          onClose={() =>
            setSheetView(null)
          }
          onSuccess={() => {}}
        />
      </Modal>

    </div>
  )
}