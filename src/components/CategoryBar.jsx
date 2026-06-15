export default function CategoryBar({
  categories,
  activeCategory,
  onSelect,
  lang,
  restaurant,
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'

  return (
    <div style={{
      flexShrink:   0,
      background:   'white',
      borderBottom: '1px solid rgba(45,42,38,0.06)',
    }}>
      <div style={{
        display:         'flex',
        gap:             8,
        padding:         '12px 16px',
        overflowX:       'auto',
        msOverflowStyle: 'none',
        scrollbarWidth:  'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {categories.map(cat => {
          const active = cat.id === activeCategory
          const name   = lang === 'fr'
            ? (cat.name_fr || cat.name_en)
            : cat.name_en

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{
                flexShrink:   0,
                padding:      '8px 18px',
                borderRadius: 100,
                fontSize:     13,
                fontWeight:   600,
                border:       'none',
                cursor:       'pointer',
                whiteSpace:   'nowrap',
                transition:   'all 0.2s',
                background:   active
                  ? primary : '#FFF8F0',
                color: active
                  ? '#FFF8F0' : '#2D2A26',
                opacity: active ? 1 : 0.7,
              }}
            >
              {cat.emoji && (
                <span style={{ marginRight: 6 }}>
                  {cat.emoji}
                </span>
              )}
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}