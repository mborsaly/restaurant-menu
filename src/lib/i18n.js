import { supabase } from './supabase'

// ── Fetch the language catalog (cached in memory
//    for the session — rarely changes) ──
let _languagesCache = null

export async function getAllLanguages() {
  if (_languagesCache) return _languagesCache
  const { data } = await supabase
    .from('languages')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  _languagesCache = data || []
  return _languagesCache
}

export function isRTLCode(code, languagesList) {
  const lang = languagesList?.find(l => l.code === code)
  return !!lang?.is_rtl
}

// ── Fetch which languages a specific vendor
//    supports, joined with the language catalog
//    for name/native_name/is_rtl ──
export async function getVendorLanguages(vendorId) {
  const { data } = await supabase
    .from('vendor_languages')
    .select('language_code, is_default, sort_order, languages(*)')
    .eq('vendor_id', vendorId)
    .order('sort_order')

  return (data || []).map(row => ({
    ...row.languages,
    is_default: row.is_default,
  }))
}

// ── Generic translation picker.
//    translations: array of rows like
//      [{ language_code: 'en', name: '...' }, ...]
//    Falls back: requested lang → vendor default
//    lang → first available → null
export function pickTranslation(translations, field, lang, fallbackLang) {
  if (!translations || translations.length === 0) return null

  const exact = translations.find(t => t.language_code === lang)
  if (exact?.[field]) return exact[field]

  if (fallbackLang) {
    const fallback = translations.find(t => t.language_code === fallbackLang)
    if (fallback?.[field]) return fallback[field]
  }

  const anyMatch = translations.find(t => t[field])
  return anyMatch?.[field] || null
}

// ── Turn an array of translation rows into a
//    lookup map keyed by entity id, for merging
//    onto a list of parent rows after a query ──
export function groupTranslationsByEntity(translations, idField) {
  const map = {}
  for (const t of translations || []) {
    const id = t[idField]
    if (!map[id]) map[id] = []
    map[id].push(t)
  }
  return map
}