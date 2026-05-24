export function usePlatform() {
  const ua = navigator.userAgent

  const isWhatsApp = /WhatsApp/i.test(ua)
  const isMobile   = /Android|iPhone|iPad|iPod/i.test(ua)
  const isDesktop  = !isMobile

  return {
    isWhatsApp,
    isMobile,
    isDesktop,
  }
}

