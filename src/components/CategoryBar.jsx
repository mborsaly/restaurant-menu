import { useRef } from 'react'

export default function CategoryBar({ 
  categories, 
  activeCategory, 
  onSelect,
  lang 
}) {
  const scrollRef = useRef(null)

  function handleSelect(categoryId) {
    onSelect(categoryId)

    // Scroll selected tab into view
    const el = document.getElementById(`cat-${categoryId}`)
    if (el) {
      el.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'center' 
      })
    }
  }

  return (
    <div className="sticky top-[61px] z-10 bg-white 
                    border-b border-gray-100">
      <div
        ref={scrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto 
                   scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {categories.map(cat => {
          const isActive = cat.id === activeCategory
          const name = lang === 'fr' && cat.name_fr 
            ? cat.name_fr 
            : cat.name_en

          return (
            <button
              key={cat.id}
              id={`cat-${cat.id}`}
              onClick={() => handleSelect(cat.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full 
                text-sm font-medium whitespace-nowrap transition-all
                ${isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span>{cat.emoji}</span>
              <span>{name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
