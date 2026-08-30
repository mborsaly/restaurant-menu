export default function LoadingScreen({
  message = 'Loading...'
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: '#FFF8F0',
        width: '100%',
      }}
    >

      {/* Logo + Ringwave */}
      <div
        style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          minWidth: '64px',
          maxWidth: '64px',
          minHeight: '64px',
          maxHeight: '64px',
          flex: '0 0 64px',
          alignSelf: 'center',
          marginBottom: '32px',
        }}
      >

        {/* Rings */}
        {[1, 2].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '1px solid #FF7A47',
              boxSizing: 'border-box',
              animation: `ringwave 2.5s cubic-bezier(0.2, 0.6, 0.4, 1) ${i * 0.8}s infinite`,
            }}
          />
        ))}

        {/* Green Core */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '64px',
            height: '64px',
            minWidth: '64px',
            maxWidth: '64px',
            minHeight: '64px',
            maxHeight: '64px',
            borderRadius: '50%',
            background: '#1A4D3E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            zIndex: 10,
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFF8F0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              display: 'block',
              width: '28px',
              height: '28px',
              flex: '0 0 28px',
            }}
          >
            <path d="M12 2v6" />
            <path d="M5 12a7 7 0 0 1 14 0v8H5v-8z" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div
        style={{
          textAlign: 'center',
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: '24px',
          fontWeight: 600,
          color: '#1A4D3E',
          letterSpacing: '-0.01em',
          lineHeight: '1.2',
        }}
      >
        Bistro
        <span
          style={{
            fontStyle: 'italic',
            color: '#FF7A47',
            fontWeight: 500,
          }}
        >
          Vite
        </span>
      </div>

      {/* Loading message */}
      <p
        style={{
          marginTop: '12px',
          marginBottom: '0',
          textAlign: 'center',
          color: '#2D2A26',
          opacity: 0.5,
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        {message}
      </p>

    </div>
  )
}