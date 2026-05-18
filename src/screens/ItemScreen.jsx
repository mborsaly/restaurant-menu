import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function ItemScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const searchParams = window.location.search
  const { addItem } = useCart()

  const [item, setItem] = useState(null)
  const [lang, setLang] = useState('en')
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)

  // Load item from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('selectedItem')
    if (stored) {
      const parsed = JSON.parse(stored)
      setItem(parsed)
      setTotalPrice(parsed.base_price)

      // Pre-select default options
      if (parsed.item_options) {
        const defaults = {}
        const groups = groupOptions(parsed.item_options)

        Object.entries(groups).forEach(([group, options]) => {
          const defaultOpt = options.find(o => o.is_default)
          if (defaultOpt) {
            defaults[group] = defaultOpt
          }
        })
        setSelectedOptions(defaults)
      }
    }
  }, [id])

  // Recalculate price when options change
  useEffect(() => {
    if (!item) return
    const optionsTotal = Object.values(selectedOptions)
      .reduce((sum, opt) => sum + (opt?.price_modifier || 0), 0)
    setTotalPrice((item.base_price + optionsTotal) * quantity)
  }, [selectedOptions, quantity, item])

  // Group options by group_name
  function groupOptions(options) {
    return options.reduce((groups, opt) => {
      const group = opt.group_name_en
      if (!groups[group]) groups[group] = []
      groups[group].push(opt)
      return groups
    }, {})
  }

  function handleOptionSelect(groupName, option) {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: option
    }))
  }

  function handleAddToCart() {
    addItem(item, selectedOptions, quantity)
    navigate('/menu' + searchParams)
  }

  function handleBack() {
    navigate('/menu' + searchParams)
  }

  if (!item) return (
    <div className="min-h-screen flex items-center 
                    justify-center">
      <p className="text-gray-400">Item not found</p>
    </div>
  )

  const name = lang === 'fr' && item.name_fr
    ? item.name_fr : item.name_en

  const description = lang === 'fr' && item.description_fr
    ? item.description_fr : item.description_en

  const optionGroups = item.item_options
    ? groupOptions(item.item_options)
    : {}

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Hero image */}
      <div className="relative h-64 bg-gray-100 flex-shrink-0">

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center 
                          justify-center text-8xl">
            🍕
          </div>
        )}

        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 w-10 h-10 
                     bg-white rounded-full shadow-lg 
                     flex items-center justify-center
                     active:scale-95 transition-all"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'en' ? 'fr' : 'en')}
          className="absolute top-4 right-4 text-xs font-bold 
                     px-3 py-1.5 rounded-full bg-white 
                     shadow-lg text-gray-600"
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* Item header */}
        <div className="p-5 border-b border-gray-100">
          {item.is_popular && (
            <span className="inline-block text-xs font-bold 
                             text-orange-500 bg-orange-50 
                             px-2 py-0.5 rounded-full mb-2">
              ⭐ Popular
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {name}
          </h1>
          {description && (
            <p className="text-gray-500 text-sm leading-relaxed">
              {description}
            </p>
          )}
          <p className="text-xl font-bold text-orange-500 mt-3">
            ${item.base_price.toFixed(2)}
          </p>
        </div>

        {/* Option groups */}
        {Object.entries(optionGroups).map(([groupName, options]) => {
          const groupLabel = lang === 'fr' && options[0]?.group_name_fr
            ? options[0].group_name_fr
            : groupName

          return (
            <div key={groupName}
              className="border-b border-gray-100">

              {/* Group header */}
              <div className="px-5 py-3 bg-gray-50">
                <h3 className="font-bold text-gray-800 text-sm">
                  {groupLabel}
                </h3>
                <p className="text-xs text-gray-400">
                  Choose one
                </p>
              </div>

              {/* Options */}
              {options
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(option => {
                  const isSelected =
                    selectedOptions[groupName]?.id === option.id

                  const optName = lang === 'fr' && option.option_name_fr
                    ? option.option_name_fr
                    : option.option_name_en

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(groupName, option)}
                      className={`
                        w-full flex items-center justify-between
                        px-5 py-4 transition-colors
                        active:bg-gray-50
                        ${isSelected ? 'bg-orange-50' : 'bg-white'}
                      `}
                    >
                      {/* Radio + name */}
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-5 h-5 rounded-full border-2 
                          flex items-center justify-center
                          flex-shrink-0
                          ${isSelected
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full 
                                            bg-white" />
                          )}
                        </div>
                        <span className={`text-sm font-medium
                          ${isSelected
                            ? 'text-orange-700'
                            : 'text-gray-700'
                          }`}>
                          {optName}
                        </span>
                      </div>

                      {/* Price modifier */}
                      <span className={`text-sm font-semibold
                        ${isSelected
                          ? 'text-orange-500'
                          : 'text-gray-500'
                        }`}>
                        {option.price_modifier === 0
                          ? 'Included'
                          : `+$${option.price_modifier.toFixed(2)}`
                        }
                      </span>
                    </button>
                  )
                })}
            </div>
          )
        })}

        {/* Quantity selector */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm mb-3">
            Quantity
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full border-2 
                         border-gray-200 flex items-center 
                         justify-center active:scale-95 
                         transition-all hover:border-orange-300"
            >
              <Minus size={16} className="text-gray-600" />
            </button>

            <span className="text-xl font-bold text-gray-900 
                             w-8 text-center">
              {quantity}
            </span>

            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-full bg-orange-500 
                         flex items-center justify-center 
                         active:scale-95 transition-all
                         hover:bg-orange-600 shadow-md 
                         shadow-orange-200"
            >
              <Plus size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Spacer for button */}
        <div className="h-28" />

      </div>

      {/* Add to cart button — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 
                      max-w-md mx-auto p-4 bg-white 
                      border-t border-gray-100">
        <button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 hover:bg-orange-600 
                     active:scale-95 transition-all
                     text-white rounded-2xl py-4 px-6
                     flex items-center justify-between
                     shadow-lg shadow-orange-200 font-semibold"
        >
          <span className="bg-orange-400 rounded-lg px-2.5 
                           py-1 text-sm font-bold">
            {quantity}
          </span>
          <span>Add to Cart</span>
          <span className="font-bold">
            ${totalPrice.toFixed(2)}
          </span>
        </button>
      </div>

    </div>
  )
}

