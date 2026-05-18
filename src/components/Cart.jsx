import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

export default function Cart({ itemCount, subtotal, searchParams }) {
  const navigate = useNavigate()

  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-6 left-0 right-0 
                    flex justify-center px-4 z-20
                    max-w-md mx-auto">
      <button
        onClick={() => navigate('/cart' + searchParams)}
        className="w-full bg-orange-500 hover:bg-orange-600 
                   active:scale-95 transition-all
                   text-white rounded-2xl px-6 py-4 
                   flex items-center justify-between
                   shadow-xl shadow-orange-200"
      >
        {/* Item count badge */}
        <div className="bg-orange-400 rounded-lg px-2.5 py-1 
                        text-sm font-bold min-w-[28px] text-center">
          {itemCount}
        </div>

        {/* Label */}
        <div className="flex items-center gap-2 font-semibold">
          <ShoppingBag size={18} />
          <span>View Cart</span>
        </div>

        {/* Price */}
        <span className="font-bold">
          ${subtotal.toFixed(2)}
        </span>
      </button>
    </div>
  )
}
