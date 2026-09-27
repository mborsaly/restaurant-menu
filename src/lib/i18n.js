import { supabase } from './supabase'

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

// ── Group name picker — same fallback chain,
//    reads from a group's .translations array
//    (populated from item_option_group_translations) ──
export function pickGroupName(group, lang, fallbackLang) {
  return pickTranslation(group.translations, 'name', lang, fallbackLang) || group.name_en || ''
}

export function groupTranslationsByEntity(translations, idField) {
  const map = {}
  for (const t of translations || []) {
    const id = t[idField]
    if (!map[id]) map[id] = []
    map[id].push(t)
  }
  return map
}


export function isRTLCode(code, languagesList) {
  const lang = languagesList?.find(l => l.code === code)
  return !!lang?.is_rtl
}