import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

function buildOptionsSignature(selectedOptions) {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return ''
  return Object.keys(selectedOptions)
    .sort()
    .map(key => `${key}:${selectedOptions[key]?.id}`)
    .join('|')
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  function addItem(item, selectedOptions = {}, quantity = 1) {
    const optionsSignature = buildOptionsSignature(selectedOptions)

    setCart(prev => {
      const existingIndex = prev.findIndex(line =>
        line.itemId === item.id &&
        buildOptionsSignature(line.options) === optionsSignature
      )

      if (existingIndex !== -1) {
        const next = [...prev]
        const existing = next[existingIndex]
        const newQuantity = existing.quantity + quantity
        next[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          total: existing.unitPrice * newQuantity,
        }
        return next
      }

      const optionsPrice = Object.values(selectedOptions)
        .reduce((sum, opt) => sum + (opt.price_modifier || 0), 0)

      const totalPrice = item.base_price + optionsPrice

      const cartItem = {
        id: `${item.id}-${optionsSignature || 'base'}-${Date.now()}`,
        itemId: item.id,
        // Legacy flat fields kept for backward
        // compatibility with anything still reading
        // .name / .name_fr / .name_ar directly
        name: item.name_en,
        name_fr: item.name_fr,
        name_ar: item.name_ar,
        // New: full translations array, carried
        // through so the cart can display correctly
        // in ANY vendor-supported language
        translations: item.translations || [],
        basePrice: item.base_price,
        options: selectedOptions,
        optionsPrice,
        unitPrice: totalPrice,
        total: totalPrice * quantity,
        quantity,
        image_url: item.image_url,
      }

      return [...prev, cartItem]
    })
  }

  function removeItem(cartItemId) {
    setCart(prev => prev.filter(item => item.id !== cartItemId))
  }

  function updateQuantity(cartItemId, quantity) {
    if (quantity < 1) {
      removeItem(cartItemId)
      return
    }
    setCart(prev => prev.map(item =>
      item.id === cartItemId
        ? { ...item, quantity, total: item.unitPrice * quantity }
        : item
    ))
  }

  function clearCart() {
    setCart([])
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}