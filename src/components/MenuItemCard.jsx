import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function MenuItemCard({ item, lang, onAdd, onViewDetail }) {
  const [adding, setAdding] = useState(false)

  const name = lang === 'fr' && item.name_fr 
    ? item.name_fr 
    : item.name_en

  const description = lang === 'fr' && item.description_fr
    ? item.description_fr
    : item.description_en

  const hasOptions = item.item_options && item.item_options.length > 0

  async function handleAdd() {
    if (hasOptions) {
      // Has options → go to detail screen
      onViewDetail(item)
      return
    }

    // No options → add directly to cart
    setAdding(true)
    await onAdd(item, {}, 1)
    setTimeout(() => setAdding(false), 800)
  }

  return (
    <div className="flex gap-3 p-4 border-b border-gray-50 
                    active:bg-gray-50 transition-colors">

      {/* Item info */}
      <div 
        className="flex-1 cursor-pointer"
        onClick={() => onViewDetail(item)}
      >
        {/* Popular badge */}
        {item.is_popular && (
          <span className="inline-block text-xs font-bold 
                           text-orange-500 bg-orange-50 
                           px-2 py-0.5 rounded-full mb-1">
            ⭐ Popular
          </span>
        )}

        <h3 className="font-semibold text-gray-900 text-sm 
                       leading-snug mb-0.5">
          {name}
        </h3>

        {description && (
          <p className="text-gray-400 text-xs leading-relaxed 
                        line-clamp-2 mb-2">
            {description}
          </p>
        )}

        <p className="font-bold text-gray-900 text-sm">
          ${item.base_price.toFixed(2)}
          {hasOptions && (
            <span className="text-gray-400 font-normal text-xs ml-1">
              & up
            </span>
          )}
        </p>
      </div>

      {/* Image + Add button */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">

        {/* Food image */}
        <div 
          className="w-24 h-20 rounded-xl overflow-hidden 
                     bg-gray-100 cursor-pointer"
          onClick={() => onViewDetail(item)}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center 
                            justify-center text-3xl">
              🍕
            </div>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            shadow-md transition-all active:scale-95
            ${adding
              ? 'bg-green-500 scale-110'
              : 'bg-orange-500 hover:bg-orange-600'
            }
          `}
        >
          {adding ? (
            <span className="text-white text-xs">✓</span>
          ) : (
            <Plus size={18} className="text-white" />
          )}
        </button>

      </div>
    </div>
  )
}
