import { X } from 'lucide-react'
import { isRTL } from '../lib/translations'

export default function SheetCloseButton({ lang, onClose }) {
  const rtl = isRTL(lang)
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      style={{
        position: 'absolute', top: 14,
        [rtl ? 'left' : 'right']: 14,
        width: 32, height: 32, borderRadius: '50%', background: 'white',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 5,
      }}
    >
      <X size={16} style={{ color: '#1B2530' }} />
    </button>
  )
}