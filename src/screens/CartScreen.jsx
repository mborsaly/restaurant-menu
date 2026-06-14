import { useNavigate }    from 'react-router-dom'
import { ChevronLeft,
         Trash2, Plus,
         Minus }          from 'lucide-react'
import { useCart }        from '../context/CartContext'
import { useSession }     from '../hooks/useSession'

export default function CartScreen() {
  const navigate    = useNavigate()
  const searchParams = window.location.search
  const { restaurant } = useSession()
  const {
    cart, subtotal, itemCount,
    removeItem, updateQty,
  } = useCart()

  const primary     = restaurant?.primary_color
    || '#1A4D3E'
  const deliveryFee = restaurant?.delivery_fee || 3.99
  const total       = subtotal + deliveryFee

  if (itemCount === 0) {
    return (
      <div className="min-h-screen flex flex-col
                      items-center justify-center
                      p-8 text-center"
           style={{ background: '#FFF8F0' }}>
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-semibold mb-2"
            style={{
              fontFamily: "'Fraunces', serif",
              color: '#1A4D3E',
            }}>
          Your cart is empty
        </h2>
        <p className="text-sm mb-6"
           style={{ color: '#2D2A26', opacity: 0.6 }}>
          Add items from the menu to get started
        </p>
        <button
          onClick={() =>
            navigate('/menu' + searchParams)
          }
          className="px-6 py-3 rounded-xl
                     text-white font-semibold
                     active:scale-95 transition-all"
          style={{ background: primary }}
        >
          Browse Menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: '#FFF8F0' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b
                      px-4 py-4 flex items-center
                      gap-3"
           style={{
             background: '#FFF8F0',
             borderColor: 'rgba(45,42,38,0.08)',
           }}>
        <button
          onClick={() =>
            navigate('/menu' + searchParams)
          }
          className="w-9 h-9 rounded-full
                     flex items-center justify-center
                     active:scale-95 transition-all"
          style={{ background: 'rgba(45,42,38,0.06)' }}
        >
          <ChevronLeft size={20}
            style={{ color: '#2D2A26' }} />
        </button>
        <h1 className="font-bold text-lg"
            style={{
              fontFamily: "'Fraunces', serif",
              color: '#1A4D3E',
            }}>
          Your Cart
        </h1>
        <span className="ml-auto text-sm"
              style={{
                fontFamily:
                  "'JetBrains Mono', monospace",
                color: '#FF7A47',
                fontWeight: 700,
              }}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-40">

        {/* Cart items */}
        <div className="p-4 space-y-3">
          {cart.map(item => (
            <div key={item.cartId}
                 className="bg-white rounded-2xl p-4"
                 style={{
                   border:
                     '1px solid rgba(45,42,38,0.06)',
                 }}>
              <div className="flex items-start
                              justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm
                                 mb-0.5 leading-snug"
                      style={{ color: '#2D2A26' }}>
                    {item.name}
                  </h3>

                  {item.options &&
                   Object.keys(item.options).length > 0
                   && (
                    <p className="text-xs mb-2"
                       style={{
                         color: '#2D2A26',
                         opacity: 0.5,
                       }}>
                      {Object.values(item.options)
                        .map(o => o.option_name_en)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}

                  {/* Qty controls */}
                  <div className="flex items-center
                                  gap-3 mt-2">
                    <button
                      onClick={() =>
                        updateQty(item.cartId,
                          item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-full
                                 flex items-center
                                 justify-center
                                 active:scale-95
                                 transition-all"
                      style={{
                        background:
                          'rgba(45,42,38,0.06)',
                      }}
                    >
                      <Minus size={14} />
                    </button>

                    <span className="font-bold
                                     text-sm w-4
                                     text-center"
                          style={{
                            fontFamily:
                              "'JetBrains Mono'"
                                + ", monospace",
                          }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQty(item.cartId,
                          item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-full
                                 flex items-center
                                 justify-center
                                 active:scale-95
                                 transition-all
                                 text-white"
                      style={{ background: primary }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-right
                                flex-shrink-0">
                  <p className="font-bold text-sm"
                     style={{
                       fontFamily:
                         "'JetBrains Mono', monospace",
                       color: primary,
                     }}>
                    ${Number(item.total).toFixed(2)}
                  </p>
                  <button
                    onClick={() =>
                      removeItem(item.cartId)
                    }
                    className="mt-2 active:scale-95
                               transition-all"
                    style={{
                      color: '#2D2A26',
                      opacity: 0.3,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Price summary */}
        <div className="mx-4 bg-white rounded-2xl p-4"
             style={{
               border: '1px solid rgba(45,42,38,0.06)',
             }}>
          <div className="space-y-2">
            <div className="flex justify-between
                            text-sm">
              <span style={{ opacity: 0.55 }}>
                Subtotal
              </span>
              <span style={{
                fontFamily:
                  "'JetBrains Mono', monospace",
              }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between
                            text-sm">
              <span style={{ opacity: 0.55 }}>
                Delivery
              </span>
              <span style={{
                fontFamily:
                  "'JetBrains Mono', monospace",
              }}>
                ${deliveryFee.toFixed(2)}
              </span>
            </div>
            <div className="h-px"
                 style={{
                   background:
                     'rgba(45,42,38,0.06)',
                 }} />
            <div className="flex justify-between
                            font-bold">
              <span style={{ color: '#2D2A26' }}>
                Total
              </span>
              <span style={{
                fontFamily:
                  "'JetBrains Mono', monospace",
                color: primary,
                fontSize: 18,
              }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Checkout button */}
      <div className="fixed bottom-0 left-0 right-0
                      max-w-md mx-auto p-4"
           style={{ background: '#FFF8F0' }}>
        <button
          onClick={() =>
            navigate('/checkout' + searchParams)
          }
          className="w-full rounded-2xl py-4 px-6
                     font-semibold text-white
                     flex items-center justify-between
                     active:scale-95 transition-all"
          style={{
            background: primary,
            boxShadow: `0 8px 30px ${primary}44`,
          }}
        >
          <span>Checkout</span>
          <span style={{
            fontFamily:
              "'JetBrains Mono', monospace",
            fontWeight: 700,
          }}>
            ${total.toFixed(2)}
          </span>
        </button>
      </div>

    </div>
  )
}