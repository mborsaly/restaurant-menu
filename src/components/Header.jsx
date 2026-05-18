export default function Header({ restaurant, lang, onLangToggle }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b 
                    border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">

        {/* Restaurant info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 
                          flex items-center justify-center text-xl">
            🍕
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-tight">
              {restaurant?.name}
            </h1>
            <p className="text-xs text-green-500 font-medium">
              ● Open now
            </p>
          </div>
        </div>

        {/* Language toggle */}
        <button
          onClick={onLangToggle}
          className="text-xs font-bold px-3 py-1.5 rounded-full 
                     border border-gray-200 text-gray-600 
                     hover:bg-gray-50 transition-colors"
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

      </div>
    </div>
  )
}
