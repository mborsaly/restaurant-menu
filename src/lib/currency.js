// Maps ISO country code → currency code
export const CURRENCY_BY_COUNTRY = {
  EG: 'EGP', CA: 'CAD', US: 'USD', SA: 'SAR',
  AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD',
  OM: 'OMR', JO: 'JOD', LB: 'LBP', FR: 'EUR',
}

// Currency display label per language.
// The NUMBER and the underlying currency itself
// never change with language — only how the
// currency's name/symbol is WRITTEN changes.
export const CURRENCY_LABELS = {
  EGP: { en: 'EGP', fr: 'EGP', ar: 'ج.م', decimals: 2, symbolPosition: 'suffix' },
  CAD: { en: '$',   fr: '$',   ar: '$',   decimals: 2, symbolPosition: 'prefix' },
  USD: { en: '$',   fr: '$',   ar: '$',   decimals: 2, symbolPosition: 'prefix' },
  SAR: { en: 'SAR', fr: 'SAR', ar: 'ر.س', decimals: 2, symbolPosition: 'suffix' },
  AED: { en: 'AED', fr: 'AED', ar: 'د.إ', decimals: 2, symbolPosition: 'suffix' },
  KWD: { en: 'KWD', fr: 'KWD', ar: 'د.ك', decimals: 3, symbolPosition: 'suffix' },
  QAR: { en: 'QAR', fr: 'QAR', ar: 'ر.ق', decimals: 2, symbolPosition: 'suffix' },
  BHD: { en: 'BHD', fr: 'BHD', ar: 'د.ب', decimals: 3, symbolPosition: 'suffix' },
  OMR: { en: 'OMR', fr: 'OMR', ar: 'ر.ع', decimals: 3, symbolPosition: 'suffix' },
  JOD: { en: 'JOD', fr: 'JOD', ar: 'د.أ', decimals: 3, symbolPosition: 'suffix' },
  LBP: { en: 'LBP', fr: 'LBP', ar: 'ل.ل', decimals: 0, symbolPosition: 'suffix' },
  EUR: { en: '€',   fr: '€',   ar: '€',   decimals: 2, symbolPosition: 'prefix' },
}

export function getCurrencyCode(vendor) {
  return vendor?.currency_code
    || CURRENCY_BY_COUNTRY[vendor?.country_code]
    || 'USD'
}

// Single source of truth for every price display
// in the app. amount stays fixed to the vendor's
// currency; only the label text changes with lang.
export function formatPrice(amount, vendor, lang = 'en') {
  const code  = getCurrencyCode(vendor)
  const meta  = CURRENCY_LABELS[code] || CURRENCY_LABELS.USD
  const label = meta[lang] || meta.en
  const num   = Number(amount || 0).toFixed(meta.decimals)

  return meta.symbolPosition === 'prefix'
    ? `${label}${num}`
    : `${num} ${label}`
}