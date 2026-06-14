export default function LoadingScreen({
  message = 'Loading...'
}) {
  return (
    <div className="min-h-screen flex flex-col
                    items-center justify-center"
         style={{ background: '#FFF8F0' }}>

      {/* Ringwave animation */}
      <div className="relative flex items-center
                      justify-center mb-8">
        {/* Rings */}
        {[1, 2].map(i => (
          <div
            key={i}
            className="absolute rounded-full
                       border border-[#FF7A47]"
            style={{
              width: 64, height: 64,
              animation: `ringwave 2.5s
                cubic-bezier(0.2,0.6,0.4,1)
                ${i * 0.8}s infinite`,
            }}
          />
        ))}

        {/* Core */}
        <div className="w-16 h-16 rounded-full
                        flex items-center
                        justify-center z-10"
             style={{ background: '#1A4D3E' }}>
          <svg width="28" height="28"
               viewBox="0 0 24 24" fill="none"
               stroke="#FFF8F0" strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round">
            <path d="M12 2v6"/>
            <path d="M5 12a7 7 0 0 1 14 0v8H5v-8z"/>
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: 24,
        fontWeight: 600,
        color: '#1A4D3E',
        letterSpacing: '-0.01em',
      }}>
        Bistro
        <span style={{
          fontStyle: 'italic',
          color: '#FF7A47',
          fontWeight: 500,
        }}>Vite</span>
      </div>

      <p className="text-sm mt-3"
         style={{ color: '#2D2A26', opacity: 0.5 }}>
        {message}
      </p>

    </div>
  )
}