export function usePlatform() {
  const ua = navigator.userAgent

  const isWhatsApp = /WhatsApp/i.test(ua)
  const isMobile   = /Android|iPhone|iPad|iPod/i.test(ua)
  const isIOS      = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid  = /Android/i.test(ua)
  const isDesktop  = !isMobile

  function returnToWhatsApp(restaurantPhone) {
    // Clean phone number
    const phone = restaurantPhone
      ? restaurantPhone.replace(/\D/g, '')
      : ''

    if (isIOS) {
      // iOS — use whatsapp:// scheme
      window.location.href = 'whatsapp://'
    } else if (isAndroid) {
      // Android — use intent scheme
      window.location.href = 
        `intent://send/${phone}#Intent;` +
        `scheme=whatsapp;` +
        `package=com.whatsapp;` +
        `end`
    } else {
      // Fallback — wa.me link
      window.location.href = phone
        ? `https://wa.me/${phone}`
        : 'https://wa.me/'
    }
  }

  return {
    isWhatsApp,
    isMobile,
    isIOS,
    isAndroid,
    isDesktop,
    returnToWhatsApp,
  }
}
