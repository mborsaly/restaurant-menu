export const t = (key, lang = 'fr') => {
  const translations = {

    // ── Header ──────────────────────────────
    open_now: {
      en: '● Open now',
      fr: '● Ouvert maintenant',
      ar: '● مفتوح الآن',
    },
    closed_now: {
      en: '● Closed',
      fr: '● Fermé',
      ar: '● مغلق',
    },

    // ── Cart component ───────────────────────
    view_cart: {
      en: 'View Cart',
      fr: 'Voir le panier',
      ar: 'عرض السلة',
    },

    // ── CartScreen ───────────────────────────
    your_cart: {
      en: 'Your Cart',
      fr: 'Votre panier',
      ar: 'سلة مشترياتك',
    },
    cart_empty: {
      en: 'Your cart is empty',
      fr: 'Votre panier est vide',
      ar: 'سلتك فارغة',
    },
    cart_empty_sub: {
      en: 'Add items from the menu to get started',
      fr: 'Ajoutez des articles pour commencer',
      ar: 'أضف عناصر من المنيو للبدء',
    },
    browse_menu: {
      en: 'Browse Menu',
      fr: 'Voir le menu',
      ar: 'تصفح المنيو',
    },
    subtotal: {
      en: 'Subtotal',
      fr: 'Sous-total',
      ar: 'المجموع الجزئي',
    },
    delivery: {
      en: 'Delivery',
      fr: 'Livraison',
      ar: 'التوصيل',
    },
    total: {
      en: 'Total',
      fr: 'Total',
      ar: 'الإجمالي',
    },
    checkout: {
      en: 'Checkout',
      fr: 'Commander',
      ar: 'إتمام الطلب',
    },
    items: {
      en: 'items',
      fr: 'articles',
      ar: 'عناصر',
    },
    item: {
      en: 'item',
      fr: 'article',
      ar: 'عنصر',
    },

    // ── CheckoutScreen ───────────────────────
    delivery_details: {
      en: 'Delivery Details',
      fr: 'Détails de livraison',
      ar: 'تفاصيل التوصيل',
    },
    your_order: {
      en: 'Your order',
      fr: 'Votre commande',
      ar: 'طلبك',
    },
    your_information: {
      en: 'Your Information',
      fr: 'Vos informations',
      ar: 'بياناتك',
    },
    full_name: {
      en: 'Full Name',
      fr: 'Nom complet',
      ar: 'الاسم الكامل',
    },
    name_placeholder: {
      en: 'Marie Dubois',
      fr: 'Marie Dubois',
      ar: 'محمد أحمد',
    },
    name_required: {
      en: 'Name is required',
      fr: 'Le nom est requis',
      ar: 'الاسم مطلوب',
    },
    phone_number: {
      en: 'Phone Number',
      fr: 'Numéro de téléphone',
      ar: 'رقم الهاتف',
    },
    phone_placeholder: {
      en: '+1 514 000-0000',
      fr: '+1 514 000-0000',
      ar: '+20 10 0000 0000',
    },
    phone_required: {
      en: 'Phone is required',
      fr: 'Le téléphone est requis',
      ar: 'رقم الهاتف مطلوب',
    },
    delivery_address: {
      en: 'Delivery Address',
      fr: 'Adresse de livraison',
      ar: 'عنوان التوصيل',
    },
    street_address: {
      en: 'Street Address',
      fr: 'Adresse',
      ar: 'العنوان',
    },
    street_placeholder: {
      en: '456 Rue Sherbrooke O',
      fr: '456 Rue Sherbrooke O',
      ar: '١٢ شارع التحرير',
    },
    address_required: {
      en: 'Address is required',
      fr: "L'adresse est requise",
      ar: 'العنوان مطلوب',
    },
    apt_unit: {
      en: 'Apt / Unit',
      fr: 'App / Unité',
      ar: 'شقة / وحدة',
    },
    apt_placeholder: {
      en: 'Apt 4B',
      fr: 'App 4B',
      ar: 'شقة ٤ب',
    },
    optional: {
      en: 'optional',
      fr: 'optionnel',
      ar: 'اختياري',
    },
    delivery_notes: {
      en: 'Delivery Notes',
      fr: 'Instructions de livraison',
      ar: 'ملاحظات التوصيل',
    },
    notes_placeholder: {
      en: 'Ring doorbell, leave at door...',
      fr: 'Sonner, laisser à la porte...',
      ar: 'اتصل بالجرس، اترك عند الباب...',
    },
    payment: {
      en: 'Payment',
      fr: 'Paiement',
      ar: 'الدفع',
    },
    cash_on_delivery: {
      en: 'Cash on delivery',
      fr: 'Paiement à la livraison',
      ar: 'الدفع عند الاستلام',
    },
    cash_ready: {
      en: 'Have',
      fr: 'Ayez',
      ar: 'جهّز',
    },
    cash_ready_suffix: {
      en: 'ready when driver arrives',
      fr: 'prêt à la livraison',
      ar: 'جاهزاً عند وصول الموصّل',
    },
    place_order: {
      en: 'Place Order',
      fr: 'Passer la commande',
      ar: 'تأكيد الطلب',
    },
    placing_order: {
      en: 'Placing order...',
      fr: 'Commande en cours...',
      ar: 'جاري تقديم الطلب...',
    },
    order_error: {
      en: 'Something went wrong. Please try again.',
      fr: "Une erreur s'est produite. Réessayez.",
      ar: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    },
    terms: {
      en: 'By ordering you agree to our terms',
      fr: 'En commandant vous acceptez nos conditions',
      ar: 'بتقديم طلبك، أنت توافق على شروطنا',
    },

    // ── ItemScreen ───────────────────────────
    add_to_cart: {
      en: 'Add to Cart',
      fr: 'Ajouter au panier',
      ar: 'أضف للسلة',
    },
    popular: {
      en: '⭐ Popular',
      fr: '⭐ Populaire',
      ar: '⭐ الأكثر طلباً',
    },
    included: {
      en: 'Included',
      fr: 'Inclus',
      ar: 'مشمول',
    },
    choose_one: {
      en: 'Choose one',
      fr: 'Choisissez un',
      ar: 'اختر واحداً',
    },
    quantity: {
      en: 'Quantity',
      fr: 'Quantité',
      ar: 'الكمية',
    },
    item_not_found: {
      en: 'Item not found',
      fr: 'Article introuvable',
      ar: 'العنصر غير موجود',
    },
    back_to_menu: {
      en: 'Back to Menu',
      fr: 'Retour au menu',
      ar: 'العودة للمنيو',
    },
    loading_item: {
      en: 'Loading item...',
      fr: 'Chargement...',
      ar: 'جاري التحميل...',
    },

    // ── ConfirmationScreen ───────────────────
    order_confirmed: {
      en: 'Order Confirmed!',
      fr: 'Commande confirmée!',
      ar: 'تم تأكيد طلبك!',
    },
    thank_you: {
      en: 'Thank you',
      fr: 'Merci',
      ar: 'شكراً',
    },
    order_number: {
      en: 'Order Number',
      fr: 'Numéro de commande',
      ar: 'رقم الطلب',
    },
    estimated_delivery: {
      en: 'Estimated Delivery',
      fr: 'Livraison estimée',
      ar: 'وقت التوصيل المتوقع',
    },
    on_the_way: {
      en: 'On the way',
      fr: 'En route',
      ar: 'في الطريق',
    },
    driver_call: {
      en: 'Driver will call when nearby',
      fr: 'Le livreur appellera à son arrivée',
      ar: 'الموصّل سيتصل بك عند الوصول',
    },
    whatsapp_confirmation: {
      en: 'WhatsApp Confirmation',
      fr: 'Confirmation WhatsApp',
      ar: 'تأكيد واتساب',
    },
    check_whatsapp: {
      en: 'Check your WhatsApp for details',
      fr: 'Vérifiez votre WhatsApp pour les détails',
      ar: 'تحقق من واتساب للتفاصيل',
    },
    returning_whatsapp: {
      en: 'Returning to WhatsApp in',
      fr: 'Retour à WhatsApp dans',
      ar: 'العودة لواتساب خلال',
    },
    seconds: {
      en: 'seconds...',
      fr: 'secondes...',
      ar: 'ثوانٍ...',
    },
    return_whatsapp: {
      en: 'Return to WhatsApp',
      fr: 'Retourner à WhatsApp',
      ar: 'العودة لواتساب',
    },
    order_again: {
      en: 'Order Again',
      fr: 'Commander à nouveau',
      ar: 'اطلب مرة أخرى',
    },
    check_whatsapp_desktop: {
      en: '📱 Check your WhatsApp for confirmation',
      fr: '📱 Vérifiez votre WhatsApp pour la confirmation',
      ar: '📱 تحقق من واتساب للتأكيد',
    },

    // ── WelcomeScreen ────────────────────────
    loading_menu: {
      en: 'Loading your menu...',
      fr: 'Chargement du menu...',
      ar: 'جاري تحميل المنيو...',
    },
    welcome_back: {
      en: 'Welcome back',
      fr: 'Bon retour',
      ar: 'أهلاً بعودتك',
    },
    link_expired: {
      en: 'Link expired',
      fr: 'Lien expiré',
      ar: 'انتهت صلاحية الرابط',
    },
    link_expired_sub: {
      en: 'Please call us again to receive a fresh link.',
      fr: 'Veuillez nous rappeler pour un nouveau lien.',
      ar: 'يرجى الاتصال بنا مرة أخرى للحصول على رابط جديد.',
    },
    open_until: {
      en: 'Open until',
      fr: "Ouvert jusqu'à",
      ar: 'مفتوح حتى',
    },

    // ── MenuScreen ───────────────────────────
    no_items: {
      en: 'No items in this category',
      fr: 'Aucun article dans cette catégorie',
      ar: 'لا يوجد عناصر في هذا القسم',
    },
    loading_menu_items: {
      en: 'Loading menu...',
      fr: 'Chargement du menu...',
      ar: 'جاري تحميل المنيو...',
    },

    // ── Lang toggle label ────────────────────
    lang_toggle: {
      en: 'EN',
      fr: 'FR',
      ar: 'ع',
    },

    // Add these keys inside the existing translations object in translations.js

    your_location: {
      en: 'Where are you?',
      fr: 'Où êtes-vous?',
      ar: 'أين أنت؟',
    },
    select_spot: {
      en: 'Select your spot',
      fr: 'Choisissez votre emplacement',
      ar: 'اختر موقعك',
    },
    spot_required: {
      en: 'Please select your location',
      fr: 'Veuillez sélectionner votre emplacement',
      ar: 'يرجى اختيار موقعك',
    },
    spot_note_placeholder: {
      en: 'Additional note (e.g. wheelchair, umbrella #5)...',
      fr: 'Note supplémentaire (ex: parasol #5)...',
      ar: 'ملاحظة إضافية (مثلاً: شمسية رقم ٥)...',
    },
    order_ready_pickup: {
      en: "We'll bring it to you",
      fr: 'Nous vous l\'apporterons',
      ar: 'هنجيبهولك',
    },
    venue_order_note: {
      en: 'Your order will be delivered to your selected spot',
      fr: 'Votre commande sera livrée à votre emplacement',
      ar: 'هيتم توصيل طلبك لمكانك المختار',
    },

  }

  return translations[key]?.[lang]
    || translations[key]?.['en']
    || key
}

// Helper: is the language RTL?
export const isRTL = (lang) => lang === 'ar'

// Helper: get dir attribute
export const getDir = (lang) =>
  lang === 'ar' ? 'rtl' : 'ltr'