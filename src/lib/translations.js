export const t = (key, lang = 'fr') => {
  const translations = {

    // ── Header ──────────────────────────────
    open_now: {
      en: '● Open now',
      fr: '● Ouvert maintenant',
    },
    closed_now: {
      en: '● Closed',
      fr: '● Fermé',
    },

    // ── Cart component ───────────────────────
    view_cart: {
      en: 'View Cart',
      fr: 'Voir le panier',
    },

    // ── CartScreen ───────────────────────────
    your_cart: {
      en: 'Your Cart',
      fr: 'Votre panier',
    },
    cart_empty: {
      en: 'Your cart is empty',
      fr: 'Votre panier est vide',
    },
    cart_empty_sub: {
      en: 'Add items from the menu to get started',
      fr: 'Ajoutez des articles pour commencer',
    },
    browse_menu: {
      en: 'Browse Menu',
      fr: 'Voir le menu',
    },
    subtotal: {
      en: 'Subtotal',
      fr: 'Sous-total',
    },
    delivery: {
      en: 'Delivery',
      fr: 'Livraison',
    },
    total: {
      en: 'Total',
      fr: 'Total',
    },
    checkout: {
      en: 'Checkout',
      fr: 'Commander',
    },
    items: {
      en: 'items',
      fr: 'articles',
    },
    item: {
      en: 'item',
      fr: 'article',
    },

    // ── CheckoutScreen ───────────────────────
    delivery_details: {
      en: 'Delivery Details',
      fr: 'Détails de livraison',
    },
    your_order: {
      en: 'Your order',
      fr: 'Votre commande',
    },
    your_information: {
      en: 'Your Information',
      fr: 'Vos informations',
    },
    full_name: {
      en: 'Full Name',
      fr: 'Nom complet',
    },
    name_placeholder: {
      en: 'Marie Dubois',
      fr: 'Marie Dubois',
    },
    name_required: {
      en: 'Name is required',
      fr: 'Le nom est requis',
    },
    phone_number: {
      en: 'Phone Number',
      fr: 'Numéro de téléphone',
    },
    phone_placeholder: {
      en: '+1 514 000-0000',
      fr: '+1 514 000-0000',
    },
    phone_required: {
      en: 'Phone is required',
      fr: 'Le téléphone est requis',
    },
    delivery_address: {
      en: 'Delivery Address',
      fr: 'Adresse de livraison',
    },
    street_address: {
      en: 'Street Address',
      fr: 'Adresse',
    },
    street_placeholder: {
      en: '456 Rue Sherbrooke O',
      fr: '456 Rue Sherbrooke O',
    },
    address_required: {
      en: 'Address is required',
      fr: "L'adresse est requise",
    },
    apt_unit: {
      en: 'Apt / Unit',
      fr: 'App / Unité',
    },
    apt_placeholder: {
      en: 'Apt 4B',
      fr: 'App 4B',
    },
    optional: {
      en: 'optional',
      fr: 'optionnel',
    },
    delivery_notes: {
      en: 'Delivery Notes',
      fr: 'Instructions de livraison',
    },
    notes_placeholder: {
      en: 'Ring doorbell, leave at door...',
      fr: 'Sonner, laisser à la porte...',
    },
    payment: {
      en: 'Payment',
      fr: 'Paiement',
    },
    cash_on_delivery: {
      en: 'Cash on delivery',
      fr: 'Paiement à la livraison',
    },
    cash_ready: {
      en: 'Have',
      fr: 'Ayez',
    },
    cash_ready_suffix: {
      en: 'ready when driver arrives',
      fr: 'prêt à la livraison',
    },
    place_order: {
      en: 'Place Order',
      fr: 'Passer la commande',
    },
    placing_order: {
      en: 'Placing order...',
      fr: 'Commande en cours...',
    },
    order_error: {
      en: 'Something went wrong. Please try again.',
      fr: "Une erreur s'est produite. Réessayez.",
    },
    terms: {
      en: 'By ordering you agree to our terms',
      fr: 'En commandant vous acceptez nos conditions',
    },

    // ── ItemScreen ───────────────────────────
    add_to_cart: {
      en: 'Add to Cart',
      fr: 'Ajouter au panier',
    },
    popular: {
      en: '⭐ Popular',
      fr: '⭐ Populaire',
    },
    included: {
      en: 'Included',
      fr: 'Inclus',
    },
    choose_one: {
      en: 'Choose one',
      fr: 'Choisissez un',
    },
    quantity: {
      en: 'Quantity',
      fr: 'Quantité',
    },
    item_not_found: {
      en: 'Item not found',
      fr: 'Article introuvable',
    },
    back_to_menu: {
      en: 'Back to Menu',
      fr: 'Retour au menu',
    },
    loading_item: {
      en: 'Loading item...',
      fr: "Chargement...",
    },

    // ── ConfirmationScreen ───────────────────
    order_confirmed: {
      en: 'Order Confirmed!',
      fr: 'Commande confirmée!',
    },
    thank_you: {
      en: 'Thank you',
      fr: 'Merci',
    },
    order_number: {
      en: 'Order Number',
      fr: 'Numéro de commande',
    },
    estimated_delivery: {
      en: 'Estimated Delivery',
      fr: 'Livraison estimée',
    },
    on_the_way: {
      en: 'On the way',
      fr: 'En route',
    },
    driver_call: {
      en: 'Driver will call when nearby',
      fr: 'Le livreur appellera à son arrivée',
    },
    whatsapp_confirmation: {
      en: 'WhatsApp Confirmation',
      fr: 'Confirmation WhatsApp',
    },
    check_whatsapp: {
      en: 'Check your WhatsApp for details',
      fr: 'Vérifiez votre WhatsApp pour les détails',
    },
    returning_whatsapp: {
      en: 'Returning to WhatsApp in',
      fr: 'Retour à WhatsApp dans',
    },
    seconds: {
      en: 'seconds...',
      fr: 'secondes...',
    },
    return_whatsapp: {
      en: 'Return to WhatsApp',
      fr: 'Retourner à WhatsApp',
    },
    order_again: {
      en: 'Order Again 🍕',
      fr: 'Commander à nouveau 🍕',
    },
    check_whatsapp_desktop: {
      en: '📱 Check your WhatsApp for confirmation',
      fr: '📱 Vérifiez votre WhatsApp pour la confirmation',
    },

    // ── WelcomeScreen ────────────────────────
    loading_menu: {
      en: 'Loading your menu...',
      fr: 'Chargement du menu...',
    },
    welcome_back: {
      en: 'Welcome back',
      fr: 'Bon retour',
    },
    link_expired: {
      en: 'Link expired',
      fr: 'Lien expiré',
    },
    link_expired_sub: {
      en: 'Please call us again to receive a fresh link.',
      fr: 'Veuillez nous rappeler pour un nouveau lien.',
    },
    open_until: {
      en: 'Open until',
      fr: "Ouvert jusqu'à",
    },

    // ── MenuScreen ───────────────────────────
    no_items: {
      en: 'No items in this category',
      fr: 'Aucun article dans cette catégorie',
    },
    loading_menu_items: {
      en: 'Loading menu...',
      fr: 'Chargement du menu...',
    },
  }

  return translations[key]?.[lang]
    || translations[key]?.['en']
    || key
}