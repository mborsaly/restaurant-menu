// src/lib/translations.js

export const t = (key, lang = 'fr') => {
  const translations = {

    // ── Header ──────────────────────────────
    open_now: {
      en: '● Open now',
      fr: '● Ouvert maintenant',
      ar: '● مفتوح الآن',
      es: '● Abierto ahora',
    },
    closed_now: {
      en: '● Closed',
      fr: '● Fermé',
      ar: '● مغلق',
      es: '● Cerrado',
    },

    // ── Cart component ───────────────────────
    view_cart: {
      en: 'View Cart',
      fr: 'Voir le panier',
      ar: 'عرض السلة',
      es: 'Ver Carrito',
    },

    // ── CartScreen / CartSheet ───────────────
    your_cart: {
      en: 'Your Cart',
      fr: 'Votre panier',
      ar: 'سلة مشترياتك',
      es: 'Tu Carrito',
    },
    cart_empty: {
      en: 'Your cart is empty',
      fr: 'Votre panier est vide',
      ar: 'سلتك فارغة',
      es: 'Tu carrito está vacío',
    },
    cart_empty_sub: {
      en: 'Add items from the menu to get started',
      fr: 'Ajoutez des articles pour commencer',
      ar: 'أضف عناصر من المنيو للبدء',
      es: 'Agrega productos del menú para comenzar',
    },
    browse_menu: {
      en: 'Browse Menu',
      fr: 'Voir le menu',
      ar: 'تصفح المنيو',
      es: 'Ver Menú',
    },
    subtotal: {
      en: 'Subtotal',
      fr: 'Sous-total',
      ar: 'المجموع الجزئي',
      es: 'Subtotal',
    },
    delivery: {
      en: 'Delivery',
      fr: 'Livraison',
      ar: 'التوصيل',
      es: 'Domicilio',
    },
    total: {
      en: 'Total',
      fr: 'Total',
      ar: 'الإجمالي',
      es: 'Total',
    },
    checkout: {
      en: 'Checkout',
      fr: 'Commander',
      ar: 'إتمام الطلب',
      es: 'Finalizar Pedido',
    },
    items: {
      en: 'items',
      fr: 'articles',
      ar: 'عناصر',
      es: 'productos',
    },
    item: {
      en: 'item',
      fr: 'article',
      ar: 'عنصر',
      es: 'producto',
    },

    // ── CheckoutSheet ────────────────────────
    delivery_details: {
      en: 'Delivery Details',
      fr: 'Détails de livraison',
      ar: 'تفاصيل التوصيل',
      es: 'Detalles de Entrega',
    },
    your_order: {
      en: 'Your order',
      fr: 'Votre commande',
      ar: 'طلبك',
      es: 'Tu Pedido',
    },
    your_information: {
      en: 'Your Information',
      fr: 'Vos informations',
      ar: 'بياناتك',
      es: 'Tu Información',
    },
    full_name: {
      en: 'Full Name',
      fr: 'Nom complet',
      ar: 'الاسم الكامل',
      es: 'Nombre Completo',
    },
    name_placeholder: {
      en: 'Marie Dubois',
      fr: 'Marie Dubois',
      ar: 'محمد أحمد',
      es: 'María González',
    },
    name_required: {
      en: 'Name is required',
      fr: 'Le nom est requis',
      ar: 'الاسم مطلوب',
      es: 'El nombre es obligatorio',
    },
    phone_number: {
      en: 'Phone Number',
      fr: 'Numéro de téléphone',
      ar: 'رقم الهاتف',
      es: 'Número de Teléfono',
    },
    phone_placeholder: {
      en: '+1 514 000-0000',
      fr: '+1 514 000-0000',
      ar: '+20 10 0000 0000',
      es: '+1 514 000-0000',
    },
    phone_required: {
      en: 'Phone is required',
      fr: 'Le téléphone est requis',
      ar: 'رقم الهاتف مطلوب',
      es: 'El teléfono es obligatorio',
    },
    delivery_address: {
      en: 'Delivery Address',
      fr: 'Adresse de livraison',
      ar: 'عنوان التوصيل',
      es: 'Dirección de Entrega',
    },
    street_address: {
      en: 'Street Address',
      fr: 'Adresse',
      ar: 'العنوان',
      es: 'Dirección',
    },
    street_placeholder: {
      en: '456 Rue Sherbrooke O',
      fr: '456 Rue Sherbrooke O',
      ar: '١٢ شارع التحرير',
      es: '456 Rue Sherbrooke O',
    },
    address_required: {
      en: 'Address is required',
      fr: "L'adresse est requise",
      ar: 'العنوان مطلوب',
      es: 'La dirección es obligatoria',
    },
    apt_unit: {
      en: 'Apt / Unit',
      fr: 'App / Unité',
      ar: 'شقة / وحدة',
      es: 'Apto / Unidad',
    },
    apt_placeholder: {
      en: 'Apt 4B',
      fr: 'App 4B',
      ar: 'شقة ٤ب',
      es: 'Apto 4B',
    },
    optional: {
      en: 'optional',
      fr: 'optionnel',
      ar: 'اختياري',
      es: 'opcional',
    },
    delivery_notes: {
      en: 'Delivery Notes',
      fr: 'Instructions de livraison',
      ar: 'ملاحظات التوصيل',
      es: 'Notas de Entrega',
    },
    notes_placeholder: {
      en: 'Ring doorbell, leave at door...',
      fr: 'Sonner, laisser à la porte...',
      ar: 'اتصل بالجرس، اترك عند الباب...',
      es: 'Tocar el timbre, dejar en la puerta...',
    },
    payment: {
      en: 'Payment',
      fr: 'Paiement',
      ar: 'الدفع',
      es: 'Pago',
    },
    cash_on_delivery: {
      en: 'Cash on delivery',
      fr: 'Paiement à la livraison',
      ar: 'الدفع عند الاستلام',
      es: 'Pago contra entrega',
    },
    cash_ready: {
      en: 'Have',
      fr: 'Ayez',
      ar: 'جهّز',
      es: 'Ten listo',
    },
    cash_ready_suffix: {
      en: 'ready when driver arrives',
      fr: 'prêt à la livraison',
      ar: 'جاهزاً عند وصول الموصّل',
      es: 'listo cuando llegue el repartidor',
    },
    place_order: {
      en: 'Place Order',
      fr: 'Passer la commande',
      ar: 'تأكيد الطلب',
      es: 'Confirmar Pedido',
    },
    placing_order: {
      en: 'Placing order...',
      fr: 'Commande en cours...',
      ar: 'جاري تقديم الطلب...',
      es: 'Enviando pedido...',
    },
    order_error: {
      en: 'Something went wrong. Please try again.',
      fr: "Une erreur s'est produite. Réessayez.",
      ar: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      es: 'Ocurrió un error. Inténtalo de nuevo.',
    },
    terms: {
      en: 'By ordering you agree to our terms',
      fr: 'En commandant vous acceptez nos conditions',
      ar: 'بتقديم طلبك، أنت توافق على شروطنا',
      es: 'Al pedir aceptas nuestros términos',
    },

    // ── ItemScreen / ItemSheet ───────────────
    add_to_cart: {
      en: 'Add to Cart',
      fr: 'Ajouter au panier',
      ar: 'أضف للسلة',
      es: 'Agregar al Carrito',
    },
    popular: {
      en: '⭐ Popular',
      fr: '⭐ Populaire',
      ar: '⭐ الأكثر طلباً',
      es: '⭐ Popular',
    },
    included: {
      en: 'Included',
      fr: 'Inclus',
      ar: 'مشمول',
      es: 'Incluido',
    },
    choose_one: {
      en: 'Choose one',
      fr: 'Choisissez un',
      ar: 'اختر واحداً',
      es: 'Elige una opción',
    },
    quantity: {
      en: 'Quantity',
      fr: 'Quantité',
      ar: 'الكمية',
      es: 'Cantidad',
    },
    item_not_found: {
      en: 'Item not found',
      fr: 'Article introuvable',
      ar: 'العنصر غير موجود',
      es: 'Producto no encontrado',
    },
    back_to_menu: {
      en: 'Back to Menu',
      fr: 'Retour au menu',
      ar: 'العودة للمنيو',
      es: 'Volver al Menú',
    },
    loading_item: {
      en: 'Loading item...',
      fr: 'Chargement...',
      ar: 'جاري التحميل...',
      es: 'Cargando...',
    },

    // ── ConfirmationScreen / CheckoutSheet success ──
    order_confirmed: {
      en: 'Order Confirmed!',
      fr: 'Commande confirmée!',
      ar: 'تم تأكيد طلبك!',
      es: 'Pedido Confirmado!',
    },
    thank_you: {
      en: 'Thank you',
      fr: 'Merci',
      ar: 'شكراً',
      es: 'Gracias',
    },
    order_number: {
      en: 'Order Number',
      fr: 'Numéro de commande',
      ar: 'رقم الطلب',
      es: 'Número de Pedido',
    },
    estimated_delivery: {
      en: 'Estimated Delivery',
      fr: 'Livraison estimée',
      ar: 'وقت التوصيل المتوقع',
      es: 'Entrega Estimada',
    },
    on_the_way: {
      en: 'On the way',
      fr: 'En route',
      ar: 'في الطريق',
      es: 'En camino',
    },
    driver_call: {
      en: 'Driver will call when nearby',
      fr: 'Le livreur appellera à son arrivée',
      ar: 'الموصّل سيتصل بك عند الوصول',
      es: 'El repartidor llamará al llegar',
    },
    whatsapp_confirmation: {
      en: 'WhatsApp Confirmation',
      fr: 'Confirmation WhatsApp',
      ar: 'تأكيد واتساب',
      es: 'Confirmación por WhatsApp',
    },
    check_whatsapp: {
      en: 'Check your WhatsApp for details',
      fr: 'Vérifiez votre WhatsApp pour les détails',
      ar: 'تحقق من واتساب للتفاصيل',
      es: 'Revisa tu WhatsApp para más detalles',
    },
    returning_whatsapp: {
      en: 'Returning to WhatsApp in',
      fr: 'Retour à WhatsApp dans',
      ar: 'العودة لواتساب خلال',
      es: 'Volviendo a WhatsApp en',
    },
    seconds: {
      en: 'seconds...',
      fr: 'secondes...',
      ar: 'ثوانٍ...',
      es: 'segundos...',
    },
    return_whatsapp: {
      en: 'Return to WhatsApp',
      fr: 'Retourner à WhatsApp',
      ar: 'العودة لواتساب',
      es: 'Volver a WhatsApp',
    },
    order_again: {
      en: 'Order Again',
      fr: 'Commander à nouveau',
      ar: 'اطلب مرة أخرى',
      es: 'Pedir de Nuevo',
    },
    check_whatsapp_desktop: {
      en: 'Check your WhatsApp for confirmation',
      fr: 'Vérifiez votre WhatsApp pour la confirmation',
      ar: 'تحقق من واتساب للتأكيد',
      es: 'Revisa tu WhatsApp para la confirmación',
    },

    // ── WelcomeScreen / LoadingScreen ────────
    loading_menu: {
      en: 'Loading your menu...',
      fr: 'Chargement du menu...',
      ar: 'جاري تحميل المنيو...',
      es: 'Cargando tu menú...',
    },
    welcome_back: {
      en: 'Welcome back',
      fr: 'Bon retour',
      ar: 'أهلاً بعودتك',
      es: 'Bienvenido de nuevo',
    },
    link_expired: {
      en: 'Link expired',
      fr: 'Lien expiré',
      ar: 'انتهت صلاحية الرابط',
      es: 'Enlace expirado',
    },
    link_expired_sub: {
      en: 'Please call us again to receive a fresh link.',
      fr: 'Veuillez nous rappeler pour un nouveau lien.',
      ar: 'يرجى الاتصال بنا مرة أخرى للحصول على رابط جديد.',
      es: 'Llámanos de nuevo para recibir un nuevo enlace.',
    },
    open_until: {
      en: 'Open until',
      fr: "Ouvert jusqu'à",
      ar: 'مفتوح حتى',
      es: 'Abierto hasta',
    },

    // ── MenuScreen ───────────────────────────
    no_items: {
      en: 'No items in this category',
      fr: 'Aucun article dans cette catégorie',
      ar: 'لا يوجد عناصر في هذا القسم',
      es: 'No hay productos en esta categoría',
    },
    loading_menu_items: {
      en: 'Loading menu...',
      fr: 'Chargement du menu...',
      ar: 'جاري تحميل المنيو...',
      es: 'Cargando menú...',
    },
    search_placeholder: {
      en: 'Search menu...',
      fr: 'Rechercher dans le menu...',
      ar: 'دوّر في المنيو...',
      es: 'Buscar en el menú...',
    },
    no_search_results: {
      en: 'No items match your search',
      fr: 'Aucun article ne correspond',
      ar: 'مفيش نتائج مطابقة',
      es: 'No se encontraron resultados',
    },

    // ── Lang toggle label (legacy, kept for
    //    any old code paths still referencing it) ──
    lang_toggle: {
      en: 'EN',
      fr: 'FR',
      ar: 'ع',
      es: 'ES',
    },

    // ── Grocery / ProductCard specific ───────
    out_of_stock: {
      en: 'Out of stock',
      fr: 'Rupture',
      ar: 'غير متوفر',
      es: 'Agotado',
    },
    in_stock: {
      en: 'In stock',
      fr: 'En stock',
      ar: 'متوفر',
      es: 'En stock',
    },
    unavailable: {
      en: 'Unavailable',
      fr: 'Indisponible',
      ar: 'غير متوفر',
      es: 'No disponible',
    },

    // ── Venue mode (CheckoutSheet) ───────────
    your_location: {
      en: 'Where are you?',
      fr: 'Où êtes-vous?',
      ar: 'أين أنت؟',
      es: '¿Dónde estás?',
    },
    select_spot: {
      en: 'Select your spot',
      fr: 'Choisissez votre emplacement',
      ar: 'اختر موقعك',
      es: 'Selecciona tu ubicación',
    },
    spot_required: {
      en: 'Please select your location',
      fr: 'Veuillez sélectionner votre emplacement',
      ar: 'يرجى اختيار موقعك',
      es: 'Por favor selecciona tu ubicación',
    },
    spot_note_placeholder: {
      en: 'Additional note (e.g. wheelchair, umbrella #5)...',
      fr: "Note supplémentaire (ex: parasol #5)...",
      ar: 'ملاحظة إضافية (مثلاً: شمسية رقم ٥)...',
      es: 'Nota adicional (ej: sombrilla #5)...',
    },
    order_ready_pickup: {
      en: "We'll bring it to you",
      fr: "Nous vous l'apporterons",
      ar: 'هنجيبهولك',
      es: 'Te lo llevaremos',
    },
    venue_order_note: {
      en: 'Your order will be delivered to your selected spot',
      fr: 'Votre commande sera livrée à votre emplacement',
      ar: 'هيتم توصيل طلبك لمكانك المختار',
      es: 'Tu pedido será entregado en la ubicación seleccionada',
    },

    // ── Fulfillment type (delivery/pickup/dine-in) ──
    fulfillment_type: {
      en: 'How would you like your order?',
      fr: 'Comment souhaitez-vous votre commande?',
      ar: 'إزاي عايز تستلم طلبك؟',
      es: '¿Cómo quieres tu pedido?',
    },
    fulfillment_delivery: {
      en: 'Delivery',
      fr: 'Livraison',
      ar: 'توصيل',
      es: 'Domicilio',
    },
    fulfillment_pickup: {
      en: 'Pickup',
      fr: 'À emporter',
      ar: 'استلام من المطعم',
      es: 'Recoger',
    },
    pickup_note: {
      en: 'Ready for pickup in about 20-25 min. Pay when you collect it.',
      fr: 'Prêt dans 20-25 min. Payez à la collecte.',
      ar: 'هيبقى جاهز خلال ٢٠-٢٥ دقيقة. ادفع وقت الاستلام.',
      es: 'Listo en 20-25 min. Paga al recogerlo.',
    },
    dine_in_table: {
      en: 'Table',
      fr: 'Table',
      ar: 'طاولة',
      es: 'Mesa',
    },
    dine_in_banner: {
      en: 'Ordering for',
      fr: 'Commande pour',
      ar: 'الطلب لـ',
      es: 'Pedido para',
    },
    dine_in_note: {
      en: 'Your order will be brought to your table. Pay when your order arrives.',
      fr: 'Votre commande sera apportée à votre table. Payez à la livraison.',
      ar: 'الطلب هيتوصلك على الطاولة. ادفع وقت وصول الطلب.',
      es: 'Tu pedido será llevado a tu mesa. Paga cuando llegue.',
    },
    cash_at_table: {
      en: 'Pay at your table',
      fr: 'Payez à votre table',
      ar: 'ادفع على الطاولة',
      es: 'Paga en tu mesa',
    },

    // ── Order History ────────────────────────
    order_history: {
      en: 'My Orders',
      fr: 'Mes Commandes',
      ar: 'طلباتي',
      es: 'Mis Pedidos',
    },
  }

  return translations[key]?.[lang]
    || translations[key]?.['en']
    || key
}

// Helper: is the language RTL?
// (Kept for legacy call sites; the unlimited-
// language architecture derives RTL from the
// `languages` table via useSession()'s isRTL
// value — this static map only covers the
// languages known at build time and is NOT the
// source of truth going forward.)
export const isRTL = (lang) => lang === 'ar'

// Helper: get dir attribute
export const getDir = (lang) =>
  lang === 'ar' ? 'rtl' : 'ltr'