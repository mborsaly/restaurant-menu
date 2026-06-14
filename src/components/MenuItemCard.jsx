import { useNavigate } from 'react-router-dom'

export default function MenuItemCard({
  item, lang, searchParams, restaurant
}) {
  const navigate  = useNavigate()
  const primary   = restaurant?.primary_color || '#1A4D3E'
  const name      = lang === 'fr'
    ? (item.name_fr || item.name_en) : item.name_en
  const desc      = lang === 'fr'
    ? (item.description_fr || item.description_en)
    : item.description_en

  return (
    <div
      onClick={() => navigate(
        `/item/${item.id}${searchParams}`
      )}
      className="bg-white rounded-2xl overflow-hidden
                 active:scale-[0.98] transition-all
                 cursor-pointer"
      style={{ border: '1px solid rgba(45,42,38,0.06)' }}
    >
      {/* Image or emoji placeholder */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={name}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-32 flex items-center
                        justify-center text-5xl"
             style={{ background: '#FFA47D22' }}>
          {item.emoji || '🍽️'}
        </div>
      )}

      <div className="p-4">
        <h3 className="font-bold text-sm mb-1
                       leading-snug"
            style={{ color: '#2D2A26' }}>
          {name}
        </h3>

        {desc && (
          <p className="text-xs mb-3 line-clamp-2"
             style={{
               color: '#2D2A26',
               opacity: 0.55,
             }}>
            {desc}
          </p>
        )}

        <div className="flex items-center
                        justify-between">
          <span className="font-bold text-sm"
                style={{
                  fontFamily:
                    "'JetBrains Mono', monospace",
                  color: primary,
                }}>
            ${Number(item.base_price).toFixed(2)}
          </span>

          <div className="w-7 h-7 rounded-full
                          flex items-center
                          justify-center text-white
                          text-lg font-bold
                          leading-none"
               style={{ background: primary }}>
            +
          </div>
        </div>
      </div>
    </div>
  )
}