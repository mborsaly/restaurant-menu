import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768
  )
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isDesktop
}

export default function Modal({ open, onClose, children, maxHeight = '85vh' }) {
  const isDesktop = useIsDesktop()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(27,37,48,0.45)',
            zIndex: 300, display: 'flex',
            alignItems: isDesktop ? 'center' : 'flex-end',
            justifyContent: 'center',
          }}
        >
          <motion.div
            key="panel"
            onClick={e => e.stopPropagation()}
            initial={isDesktop
              ? { opacity: 0, scale: 0.96, y: 12 }
              : { y: '100%' }}
            animate={isDesktop
              ? { opacity: 1, scale: 1, y: 0 }
              : { y: 0 }}
            exit={isDesktop
              ? { opacity: 0, scale: 0.97, y: 8 }
              : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            style={{
              background: '#FFF8F0',
              borderRadius: isDesktop ? 24 : '24px 24px 0 0',
              width: '100%',
              maxWidth: 480,
              maxHeight,
              margin: isDesktop ? 20 : 0,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: isDesktop ? '0 24px 60px rgba(27,37,48,0.25)' : 'none',
            }}
          >
            {!isDesktop && (
              <div style={{
                width: 36, height: 4, borderRadius: 100,
                background: 'rgba(45,42,38,0.15)', margin: '10px auto 0', flexShrink: 0,
              }} />
            )}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}