// src/components/LoadingScreen.jsx (full replacement)
export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFF8F0',
      boxSizing: 'border-box',
      padding: 24,
      zIndex: 9999,
    }}>
      <div style={{
        position: 'relative',
        width: 72,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginBottom: 20,
      }}>
        {[1, 2].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: '1.5px solid #2D6E5A',
              boxSizing: 'border-box',
              animation: `bv-ringwave 2.5s cubic-bezier(0.2,0.6,0.4,1) ${i * 0.9}s infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: '#1A4D3E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
          boxSizing: 'border-box',
        }}>
          🔔
        </div>
      </div>

      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 13,
        color: '#2D2A26',
        opacity: 0.55,
        margin: 0,
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 1.4,
      }}>
        {message}
      </p>

      <style>{`
        @keyframes bv-ringwave {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0;   }
        }
      `}</style>
    </div>
  )
}