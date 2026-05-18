import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useMenu } from '../hooks/useMenu'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import MenuItemCard from '../components/MenuItemCard'
import Cart from '../components/Cart'
import LoadingScreen from '../components/LoadingScreen'

export default function MenuScreen() {
  const navigate = useNavigate()
  const searchParams = window.location.search

  const { restaurant, customer, loading } = useSession()
  const { categories, loading: menuLoading, getItemsByCategory } = useMenu(restaurant?.id)
  const { cart, addItem, subtotal, itemCount } = useCart()

  const [activeCategory, setActiveCategory] = useState(null)
  const [lang, setLang] = useState('en')

  // Set first category as active once loaded
  const firstCatSet = useRef(false)
  if (categories.length > 0 && !firstCatSet.current) {
    setActiveCategory(categories[0].id)
    firstCatSet.current = true
  }

  function handleLangToggle() {
    setLang(prev => prev === 'en' ? 'fr' : 'en')
  }

  function handleViewDetail(item) {
    // Store item in sessionStorage for ItemScreen
    sessionStorage.setItem('selectedItem', JSON.stringify(item))
    navigate('/item/' + item.id + searchParams)
  }

  function handleAddItem(item, options, quantity) {
    addItem(item, options, quantity)
  }

  function handleCategorySelect(categoryId) {
    setActiveCategory(categoryId)
    // Scroll to category section
    const el = document.getElementById(`section-${categoryId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading || menuLoading) {
    return <LoadingScreen message="Loading menu..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <Header
        restaurant={restaurant}
        lang={lang}
        onLangToggle={handleLangToggle}
      />

      {/* Category tabs */}
      <CategoryBar
        categories={categories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        lang={lang}
      />

      {/* Returning customer banner */}
      {customer?.name && (
        <div className="mx-4 mt-4 bg-orange-50 rounded-2xl 
                        px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">👋</span>
          <div>
            <p className="text-sm font-semibold text-orange-800">
              Welcome back, {customer.name.split(' ')[0]}!
            </p>
            <p className="text-xs text-orange-500">
              Great to see you again
            </p>
          </div>
        </div>
      )}

      {/* Menu sections per category */}
      <div className="mt-4">
        {categories.map(cat => {
          const catItems = getItemsByCategory(cat.id)
          if (catItems.length === 0) return null

          const catName = lang === 'fr' && cat.name_fr
            ? cat.name_fr
            : cat.name_en

          return (
            <div
              key={cat.id}
              id={`section-${cat.id}`}
              className="mb-2"
            >
              {/* Category header */}
              <div className="px-4 py-3 bg-white border-b 
                              border-gray-100">
                <h2 className="font-bold text-gray-900 flex 
                                items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{catName}</span>
                </h2>
              </div>

              {/* Items */}
              <div className="bg-white">
                {catItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    lang={lang}
                    onAdd={handleAddItem}
                    onViewDetail={handleViewDetail}
                  />
                ))}
              </div>

            </div>
          )
        })}
      </div>

      {/* Floating cart button */}
      <Cart
        itemCount={itemCount}
        subtotal={subtotal}
        searchParams={searchParams}
      />

    </div>
  )
}
