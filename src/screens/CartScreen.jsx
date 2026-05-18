import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function CartScreen() {
  const navigate = useNavigate()
  const searchParams = window.location.search
  const { cart, updateQuantity, removeItem, subtotal, itemCount } = useCart()

  // Get restaurant delivery fee from sessionStorage
  const deliveryFee = 3.99
  const total = subtotal + deliveryFee

  function handleBack() {
    navigate('/menu' + searchParams)
  }

  function handleCheckout() {
    navigate('/checkout' + searchParams)
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col 
                      items-center justify-center p-6 
                      text-center bg-white">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Add some items from the menu
        </p>
        <button
          onClick={handleBack}
          className="bg-orange-500 text-white px-8 py-3 
                     rounded-2xl font-semibold 
                     active:scale-95 transition-all"
        >
          Browse Menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 
                      px-4 py-4 flex items-center gap-3
                      sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-gray-100 
                     flex items-center justify-center
                     active:scale-95 transition-all"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">
          Your Cart
        </h1>
        <span className="text-gray-400 text-sm">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto pb-48">

        <div className="bg-white mt-3 mx-3 rounded-2xl 
                        overflow-hidden shadow-sm">
          {cart.map((cartItem, index) => {

            // Build options summary string
            const optionsSummary = Object.entries(cartItem.options)
              .map(([group, opt]) => opt.option_name_en)
              .join(', ')

            return (
              <div
                key={cartItem.id}
                className={`p-4 flex gap-3
                  ${index < cart.length - 1
                    ? 'border-b border-gray-50'
                    : ''
                  }`}
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-xl 
                                bg-gray-100 flex-shrink-0 
                                overflow-hidden">
                  {cartItem.image_url ? (
                    <img
                      src={cartItem.image_url}
                      alt={cartItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex 
                                    items-center justify-center 
                                    text-2xl">
                      🍕
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 
                                 text-sm leading-snug">
                    {cartItem.name}
                  </h3>
                  {optionsSummary && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {optionsSummary}
                    </p>
                  )}
                  <p className="text-orange-500 font-bold 
                                text-sm mt-1">
                    ${cartItem.total.toFixed(2)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(
                        cartItem.id,
                        cartItem.quantity - 1
                      )}
                      className="w-7 h-7 rounded-full border 
                                 border-gray-200 flex items-center 
                                 justify-center active:scale-95 
                                 transition-all"
                    >
                      <Minus size={12} className="text-gray-600" />
                    </button>

                    <span className="text-sm font-bold 
                                     text-gray-900 w-4 text-center">
                      {cartItem.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(
                        cartItem.id,
                        cartItem.quantity + 1
                      )}
                      className="w-7 h-7 rounded-full bg-orange-500 
                                 flex items-center justify-center 
                                 active:scale-95 transition-all"
                    >
                      <Plus size={12} className="text-white" />
                    </button>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeItem(cartItem.id)}
                  className="self-start p-1.5 rounded-lg 
                             hover:bg-red-50 active:scale-95 
                             transition-all"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>

              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div className="bg-white mt-3 mx-3 rounded-2xl 
                        overflow-hidden shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3">
            Order Summary
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 font-medium">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery fee</span>
              <span className="text-gray-900 font-medium">
                ${deliveryFee.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-orange-500 text-lg">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 
                          flex items-center gap-3">
            <span className="text-xl">💵</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Cash on delivery
              </p>
              <p className="text-xs text-gray-400">
                Pay when your order arrives
              </p>
            </div>
          </div>
        </div>

        {/* Add more items */}
        <div className="mx-3 mt-3">
          <button
            onClick={handleBack}
            className="w-full py-3 rounded-2xl border-2 
                       border-dashed border-gray-200 
                       text-gray-400 text-sm font-medium
                       active:scale-95 transition-all
                       hover:border-orange-300 
                       hover:text-orange-400"
          >
            + Add more items
          </button>
        </div>

      </div>

      {/* Checkout button */}
      <div className="fixed bottom-0 left-0 right-0 
                      max-w-md mx-auto p-4 bg-white 
                      border-t border-gray-100">
        <button
          onClick={handleCheckout}
          className="w-full bg-orange-500 hover:bg-orange-600
                     active:scale-95 transition-all
                     text-white rounded-2xl py-4 px-6
                     flex items-center justify-between
                     shadow-lg shadow-orange-200 font-semibold"
        >
          <span className="bg-orange-400 rounded-lg px-2.5 
                           py-1 text-sm font-bold">
            {itemCount}
          </span>
          <span>Proceed to Checkout</span>
          <span className="font-bold">${total.toFixed(2)}</span>
        </button>
      </div>

    </div>
  )
}
