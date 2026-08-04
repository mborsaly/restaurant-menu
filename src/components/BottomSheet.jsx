import { useEffect } from 'react'

export default function BottomSheet({
  open, onClose, children, maxHeight = '85vh'
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(45,42,38,0.5)',
        zIndex: 300, display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFF8F0', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 480, maxHeight,
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.25s cubic-bezier(0.2,0.8,0.4,1)',
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 100,
          background: 'rgba(45,42,38,0.15)', margin: '10px auto 0',
          flexShrink: 0,
        }} />
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}