import { useState } from 'react'

export function useCart() {
  const [cart, setCart] = useState([])

  function addItem(item, selectedOptions = {}, quantity = 1) {
    // Calculate total price with options
    const optionsPrice = Object.values(selectedOptions)
      .reduce((sum, opt) => sum + (opt.price_modifier || 0), 0)

    const totalPrice = item.base_price + optionsPrice

    // Build cart item
    const cartItem = {
      id: `${item.id}-${Date.now()}`,
      itemId: item.id,
      name: item.name_en,
      name_fr: item.name_fr,
      basePrice: item.base_price,
      options: selectedOptions,
      optionsPrice,
      unitPrice: totalPrice,
      total: totalPrice * quantity,
      quantity,
      image_url: item.image_url,
    }

    setCart(prev => [...prev, cartItem])
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

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
  }
}
