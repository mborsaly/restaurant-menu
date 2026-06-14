import { useNavigate } from 'react-router-dom'

export default function Cart({
  itemCount, subtotal,
  searchParams, restaurant
}) {
  const navigate = useNavigate()
  const primary  = restaurant?.primary_color || '#FF7A47'

  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-6 left-4 right-4
                    max-w-md mx-auto z-20">
      <button
        onClick={() =>
          navigate('/cart' + searchParams)
        }
        className="w-full rounded-2xl px-5 py-4
                   flex items-center justify-between
                   text-white font-semibold
                   active:scale-95 transition-all"
        style={{
          background: primary,
          boxShadow: `0 8px 30px ${primary}55`,
        }}
      >
        {/* Item count badge */}
        <div className="w-7 h-7 rounded-full
                        flex items-center
                        justify-center text-sm
                        font-bold"
             style={{
               background: 'rgba(255,255,255,0.25)',
             }}>
          {itemCount}
        </div>

        <span className="font-semibold">
          {itemCount === 1
            ? 'View Cart'
            : 'View Cart'
          }
        </span>

        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
        }}>
          ${subtotal.toFixed(2)}
        </span>
      </button>
    </div>
  )
}