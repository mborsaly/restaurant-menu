import { pickTranslation } from './i18n'

// Turns a cart/order line's selected options into display
// lines in the customer's language, e.g. { name: 'Extra Egg x2', price: 3 }.
// Works on live cart lines and on saved orders (older orders
// without translations fall back to option_name_en).
export function getOptionLines(options, lang, fallbackLang = 'en') {
  return Object.values(options || {})
    .map(opt => {
      const base =
        pickTranslation(opt.translations, 'option_name', lang, fallbackLang) ||
        opt.option_name_en ||
        ''
      const qty = opt.selectedQty > 1 ? ` x${opt.selectedQty}` : ''
      return {
        name: `${base}${qty}`,
        price: (opt.price_modifier || 0) * (opt.selectedQty || 1),
      }
    })
    .filter(line => line.name)
}