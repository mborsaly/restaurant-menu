import { t } from '../lib/translations'

export default function Header({
  restaurant, lang, onLangToggle
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'

  return (
    <div className="sticky top-0 z-20 border-b"
         style={{
           background:   '#FFF8F0',
           borderColor:  'rgba(45,42,38,0.08)',
         }}>
      <div className="flex items-center
                      justify-between px-4 py-3
                      max-w-md mx-auto">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl
                          flex items-center
                          justify-center text-xl
                          flex-shrink-0"
               style={{
                 background: `${primary}18`,
               }}>
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url}
                   alt={restaurant.name}
                   className="w-full h-full
                              object-cover rounded-xl" />
            ) : emoji}
          </div>
          <div>
            <h1 className="font-bold text-sm
                           leading-tight"
                style={{
                  fontFamily: "'Fraunces', serif",
                  color:      '#1A4D3E',
                }}>
              {restaurant?.name || 'BistroVite'}
            </h1>
            <p className="text-xs font-medium"
               style={{ color: primary }}>
              {t('open_now', lang)}
            </p>
          </div>
        </div>

        <button
          onClick={onLangToggle}
          className="text-xs font-bold px-3 py-1.5
                     rounded-full border
                     transition-all active:scale-95"
          style={{
            fontFamily:   "'JetBrains Mono', monospace",
            borderColor:  'rgba(45,42,38,0.15)',
            color:        '#2D2A26',
          }}
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

      </div>
    </div>
  )
}