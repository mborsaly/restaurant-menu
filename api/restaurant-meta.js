
/* global process */
// Vercel Function (Node.js runtime) — injects restaurant-specific <title>,
// <meta description>, canonical URL, <html lang>, and Open Graph tags into
// the built SPA shell for crawler-visible requests, before any client-side
// JavaScript runs. The React app itself is never touched by this file.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

export const RESERVED = ['welcome', 'menu', 'item', 'cart', 'checkout', 'confirmation']
export const SUB_ROUTES = ['cart', 'checkout', 'confirmation', 'item']
export const CANONICAL_BASE_URL = 'https://order.bistrovite.com'

const DEFAULT_TITLE_TAG = '<title>BistroVite — Commandez en quelques secondes</title>'
const DEFAULT_DESCRIPTION_TAG =
  '<meta name="description" content="Commandez chez vos restaurants préférés directement sur WhatsApp — zéro commission, zéro application." />'
const DEFAULT_HTML_TAG = '<html lang="fr">'
const HEAD_EXTRA_MARKER = '<!--SEO_HEAD_EXTRA-->'

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function looksDangerous(value) {
  return /<!--SEO_|<script/i.test(String(value ?? ''))
}

export function isValidHttpUrl(value) {
  if (!value) return false

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function isValidFacebookAppId(value) {
  return typeof value === 'string' && /^\d{1,20}$/.test(value)
}

export function pickLocalizedName(vendor, lang) {
  if (lang === 'fr' && vendor.name_fr) return vendor.name_fr
  if (lang === 'ar' && vendor.name_ar) return vendor.name_ar
  return vendor.name
}

export function buildDescription(displayName, vendor) {
  const parts = [displayName, vendor.cuisine_type, vendor.city].filter(Boolean)
  return parts.length ? parts.join(' — ') : null
}

export function classifyRequest(seg1, rest) {
  const restSegments = rest ? String(rest).split('/').filter(Boolean) : []
  const reserved = !seg1 || RESERVED.includes(seg1)
  const looksLikeVenuePair =
    !reserved && !!restSegments[0] && !SUB_ROUTES.includes(restSegments[0])

  return { restSegments, reserved, looksLikeVenuePair }
}

export function buildCanonicalPath({ looksLikeVenuePair, venueSlug, vendorSlug }) {
  if (looksLikeVenuePair) {
    return `/${encodeURIComponent(venueSlug)}/${encodeURIComponent(vendorSlug)}`
  }

  return `/${encodeURIComponent(vendorSlug)}`
}

export function buildHeadExtra({
  title,
  description,
  canonicalUrl,
  logoUrl,
  restaurantName,
  fbAppId,
  cuisineType,
  city,
  streetAddress,
  openTime,
  closeTime,
  closedDays,
}) {
  const hasImage = isValidHttpUrl(logoUrl)
  const hasFbAppId = isValidFacebookAppId(fbAppId)

  const jsonLdScriptTag = buildJsonLdScriptTag(
    buildRestaurantJsonLd({
      name: restaurantName,
      url: canonicalUrl,
      logoUrl,
      cuisineType,
      city,
      streetAddress,
      openTime,
      closeTime,
      closedDays,
    })
  )

  const parts = [
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    description
      ? `<meta property="og:description" content="${escapeHtml(description)}" />`
      : null,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:type" content="website" />`,
    hasFbAppId
      ? `<meta property="fb:app_id" content="${escapeHtml(fbAppId)}" />`
      : null,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    description
      ? `<meta name="twitter:description" content="${escapeHtml(description)}" />`
      : null,
    hasImage ? `<meta property="og:image" content="${escapeHtml(logoUrl)}" />` : null,
    hasImage && restaurantName
      ? `<meta property="og:image:alt" content="${escapeHtml(restaurantName)}" />`
      : null,
    hasImage ? `<meta name="twitter:image" content="${escapeHtml(logoUrl)}" />` : null,
    hasImage && restaurantName
      ? `<meta name="twitter:image:alt" content="${escapeHtml(restaurantName)}" />`
      : null,
    jsonLdScriptTag,
  ].filter(Boolean)

  return parts.join('\n  ')
}

function meaningfulString(value) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || null
}

// Postgres `time` columns come back from Supabase as "HH:MM:SS" (sometimes
// "HH:MM"); Schema.org's openingHoursSpecification expects "HH:MM".
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/

export function parseTimeToHHMM(value) {
  if (typeof value !== 'string') return null
  const match = TIME_PATTERN.exec(value.trim())
  return match ? `${match[1]}:${match[2]}` : null
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const DAY_ALIASES = {
  sun: 'Sunday',
  sunday: 'Sunday',
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
  sat: 'Saturday',
  saturday: 'Saturday',
}

/**
 * Normalizes `vendors.closed_days` into canonical Schema.org day names.
 * Returns `null` when the format can't be reliably determined (not an
 * array, or containing an entry that isn't a recognized English day
 * name/abbreviation) — callers must treat `null` as "don't know" rather
 * than "closed no days".
 */
export function normalizeClosedDays(closedDays) {
  // Only an actual array (including an empty one, matching the column's
  // '{}' default) has a reliably known meaning. null/undefined/other types
  // don't reliably mean "closed no days" — treat them as unknown.
  if (!Array.isArray(closedDays)) return null

  const normalized = new Set()

  for (const entry of closedDays) {
    if (typeof entry !== 'string') return null
    const key = entry.trim().toLowerCase()
    if (!key) continue
    const dayName = DAY_ALIASES[key]
    if (!dayName) return null
    normalized.add(dayName)
  }

  return Array.from(normalized)
}

function buildOpeningHoursSpecification({ openTime, closeTime, closedDays }) {
  const opens = parseTimeToHHMM(openTime)
  const closes = parseTimeToHHMM(closeTime)
  if (!opens || !closes) return null

  const normalizedClosedDays = normalizeClosedDays(closedDays)
  if (normalizedClosedDays === null) return null

  const closedSet = new Set(normalizedClosedDays)
  const dayOfWeek = DAY_NAMES.filter((day) => !closedSet.has(day))
  if (dayOfWeek.length === 0) return null

  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek,
    opens,
    closes,
  }
}

export function buildRestaurantJsonLd({
  name,
  url,
  logoUrl,
  cuisineType,
  city,
  streetAddress,
  openTime,
  closeTime,
  closedDays,
}) {
  const displayName = meaningfulString(name)
  if (!displayName || !url) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: displayName,
    url,
  }

  if (isValidHttpUrl(logoUrl)) jsonLd.image = logoUrl

  const cuisine = meaningfulString(cuisineType)
  if (cuisine) jsonLd.servesCuisine = cuisine

  const locality = meaningfulString(city)
  const street = meaningfulString(streetAddress)
  if (locality || street) {
    jsonLd.address = { '@type': 'PostalAddress' }
    if (street) jsonLd.address.streetAddress = street
    if (locality) jsonLd.address.addressLocality = locality
  }

  const openingHoursSpecification = buildOpeningHoursSpecification({
    openTime,
    closeTime,
    closedDays,
  })
  if (openingHoursSpecification) jsonLd.openingHoursSpecification = openingHoursSpecification

  return jsonLd
}

export function buildJsonLdScriptTag(jsonLd) {
  if (!jsonLd) return null

  const json = JSON.stringify(jsonLd)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return `<script type="application/ld+json">${json}</script>`
}

const VENDOR_SELECT =
  'id, slug, name, name_fr, name_ar, cuisine_type, city, logo_url, active, venue_id, ' +
  'address, open_time, close_time, closed_days'

export async function resolveRestaurant(supabase, { seg1, rest }) {
  const { looksLikeVenuePair, restSegments } = classifyRequest(seg1, rest)

  if (looksLikeVenuePair) {
    const venueSlug = seg1
    const vendorSlug = restSegments[0]

    const { data: venueData, error: venueErr } = await supabase
      .from('venues')
      .select('id, slug')
      .eq('slug', venueSlug)
      .eq('active', true)
      .maybeSingle()

    if (venueErr) throw venueErr
    if (!venueData) return null

    const { data: vendorData, error: vendorErr } = await supabase
      .from('vendors')
      .select(VENDOR_SELECT)
      .eq('slug', vendorSlug)
      .eq('venue_id', venueData.id)
      .eq('active', true)
      .maybeSingle()

    if (vendorErr) throw vendorErr
    if (!vendorData) return null

    return {
      vendor: vendorData,
      canonicalPath: buildCanonicalPath({
        looksLikeVenuePair: true,
        venueSlug,
        vendorSlug,
      }),
    }
  }

  const vendorSlug = seg1

  const { data: vendorData, error: vendorErr } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('slug', vendorSlug)
    .eq('active', true)
    .maybeSingle()

  if (vendorErr) throw vendorErr
  if (!vendorData) return null

  if (vendorData.venue_id) {
    const { data: venueData, error: venueErr } = await supabase
      .from('venues')
      .select('slug')
      .eq('id', vendorData.venue_id)
      .eq('active', true)
      .maybeSingle()

    if (venueErr) throw venueErr

    if (venueData) {
      return {
        vendor: vendorData,
        canonicalPath: buildCanonicalPath({
          looksLikeVenuePair: true,
          venueSlug: venueData.slug,
          vendorSlug,
        }),
      }
    }
  }

  return {
    vendor: vendorData,
    canonicalPath: buildCanonicalPath({
      looksLikeVenuePair: false,
      vendorSlug,
    }),
  }
}

export async function resolveLanguage(supabase, vendorId) {
  try {
    const { data: langRows } = await supabase
      .from('vendor_languages')
      .select('language_code, is_default')
      .eq('vendor_id', vendorId)
      .order('sort_order')

    const rows = langRows || []
    const def = rows.find((r) => r.is_default) || rows[0]

    return def?.language_code || 'en'
  } catch {
    return 'en'
  }
}

export function substituteTemplate(
  template,
  {
    title,
    description,
    lang,
    canonicalUrl,
    logoUrl,
    restaurantName,
    fbAppId,
    cuisineType,
    city,
    streetAddress,
    openTime,
    closeTime,
    closedDays,
  }
) {
  if (looksDangerous(title) || looksDangerous(description) || looksDangerous(canonicalUrl)) {
    return template
  }

  let html = template

  html = html.replace(DEFAULT_HTML_TAG, `<html lang="${escapeHtml(lang)}">`)
  html = html.replace(DEFAULT_TITLE_TAG, `<title>${escapeHtml(title)}</title>`)

  if (description) {
    html = html.replace(
      DEFAULT_DESCRIPTION_TAG,
      `<meta name="description" content="${escapeHtml(description)}" />`
    )
  }

  html = html.replace(
    HEAD_EXTRA_MARKER,
    buildHeadExtra({
      title,
      description,
      canonicalUrl,
      logoUrl,
      restaurantName,
      fbAppId,
      cuisineType,
      city,
      streetAddress,
      openTime,
      closeTime,
      closedDays,
    })
  )

  return html
}

/**
 * Reads the built SPA shell from the local deployment bundle.
 *
 * vercel.json must include dist/index.html in this function's deployment
 * bundle using functions.includeFiles. This avoids fetching the deployment's
 * own URL, which can return a Preview Protection login page.
 */
export function resolveTemplate({ readFileImpl = readFileSync } = {}) {
  return readFileImpl(join(process.cwd(), 'dist', 'index.html'), 'utf8')
}

let templateCache = null

async function getTemplate() {
  if (!templateCache) {
    templateCache = await resolveTemplate()
  }

  return templateCache
}

function sendShell(response, template, status) {
  response.status(status)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (status !== 200) {
    response.setHeader('Cache-Control', 'no-store')
  }

  response.send(template)
}

function sendNotFound(response) {
  response.status(404)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.send(
    '<!doctype html><html><head><title>Not found — BistroVite</title></head>' +
      '<body>This restaurant page does not exist.</body></html>'
  )
}

function sendInfraFailureMinimal(response) {
  response.status(503)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.send(
    '<!doctype html><html><head><title>BistroVite</title></head>' +
      '<body>Temporarily unavailable.</body></html>'
  )
}

export default async function handler(request, response) {
  let template

  try {
    template = await getTemplate()
  } catch (err) {
    console.error('restaurant-meta: could not read built index.html template', err)
    sendInfraFailureMinimal(response)
    return
  }

  const seg1 = typeof request.query.seg1 === 'string' ? request.query.seg1 : ''
  const rest = typeof request.query.rest === 'string' ? request.query.rest : ''
  const { reserved } = classifyRequest(seg1, rest)

  if (reserved) {
    sendShell(response, template, 200)
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  let supabase

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase env vars are not configured for this function')
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.error('restaurant-meta: supabase client unavailable', err)
    sendShell(response, template, 503)
    return
  }

  let resolved

  try {
    resolved = await resolveRestaurant(supabase, { seg1, rest })
  } catch (err) {
    console.error('restaurant-meta: lookup failed (infra), serving 503 shell', err)
    sendShell(response, template, 503)
    return
  }

  if (!resolved) {
    sendNotFound(response)
    return
  }

  const { vendor, canonicalPath } = resolved
  const lang = await resolveLanguage(supabase, vendor.id)
  const displayName = pickLocalizedName(vendor, lang)
  const title = `${displayName} — BistroVite`
  const description = buildDescription(displayName, vendor)
  const canonicalUrl = `${CANONICAL_BASE_URL}${canonicalPath}`

  const html = substituteTemplate(template, {
    title,
    description,
    lang,
    canonicalUrl,
    logoUrl: vendor.logo_url,
    restaurantName: displayName,
    cuisineType: vendor.cuisine_type,
    city: vendor.city,
    streetAddress: vendor.address,
    openTime: vendor.open_time,
    closeTime: vendor.close_time,
    closedDays: vendor.closed_days,
    fbAppId: process.env.FACEBOOK_APP_ID,
  })

  response.status(200)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.send(html)
}
