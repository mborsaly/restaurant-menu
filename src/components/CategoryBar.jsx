export default function CategoryBar({
  categories, activeCategory,
  onSelect, lang, restaurant
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'

  return (
    <div className="border-b overflow-x-auto
                    flex gap-2 px-4 py-3
                    no-scrollbar"
         style={{
           background: 'white',
           borderColor: 'rgba(45,42,38,0.06)',
         }}>
      {categories.map(cat => {
        const active = cat.id === activeCategory
        const name = lang === 'fr'
          ? (cat.name_fr || cat.name_en)
          : cat.name_en

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex-shrink-0 flex items-center
                       gap-1.5 px-4 py-2 rounded-full
                       text-sm font-semibold
                       transition-all active:scale-95
                       whitespace-nowrap"
            style={active ? {
              background: primary,
              color: '#FFF8F0',
            } : {
              background: '#FFF8F0',
              color: '#2D2A26',
              opacity: 0.7,
            }}
          >
            {cat.emoji && (
              <span className="text-base">
                {cat.emoji}
              </span>
            )}
            <span>{name}</span>
          </button>
        )
      })}
    </div>
  )
}