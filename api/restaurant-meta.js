/* global process */
// Vercel Function (Node.js runtime) — injects restaurant-specific <title>,
// <meta description>, canonical URL, <html lang>, and Open Graph tags into
// the built SPA shell for crawler-visible requests, before any client-side
// JavaScript runs. The React app itself is never touched by this file.
//
// Mirrors the slug-resolution rules already implemented client-side in
// src/hooks/useSession.js (RESERVED/SUB_ROUTES lists, venue-then-vendor
// lookup with a venue_id match guard) so the two can't drift apart silently.
//
// Pure, side-effect-free pieces (escaping, URL validation, classification,
// canonical building, Supabase resolution against an INJECTED client) are
// exported individually so restaurant-meta.test.js can exercise them with
// fixtures/mocks, with no network access and no new dependency. Only the
// default-exported `handler` touches real I/O (env vars, the filesystem,
// a real Supabase client, the HTTP response).
//
// Failure policy:
//   - Genuinely unknown/inactive restaurant, or a venue/vendor mismatch
//     -> real 404.
//   - A Supabase/infra failure (thrown error, not "no row") -> 503,
//     Cache-Control: no-store, but the response BODY is still the full,
//     working SPA shell — a real user's browser renders and runs it
//     exactly as it would a 200, so ordering keeps working during a
//     transient backend hiccup. The 503 status exists purely so crawlers
//     and monitoring can tell "temporarily unavailable" apart from
//     "doesn't exist" and so Vercel's CDN never caches it (503 is not in
//     Vercel's documented list of cacheable function-response statuses:
//     200, 404, 410, 301, 302, 307, 308 — confirmed via vercel.com/docs/caching/cdn-cache
//     fetched during the design review this implements).
//   - The one case with no working shell to fall back to at all is the
//     template itself being unreadable (a deployment/packaging problem,
//     not a Supabase problem) -> 503 with a minimal error body, since
//     there is nothing else to serve.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

export const RESERVED = ['welcome', 'menu', 'item', 'cart', 'checkout', 'confirmation']
export const SUB_ROUTES = ['cart', 'checkout', 'confirmation', 'item']
export const CANONICAL_BASE_URL = 'https://order.bistrovite.com'

// The actual request routing (which paths reach this function at all) is
// defined entirely in vercel.json's "rewrites" array — Vercel's rewrite
// "source" patterns are matched with path-to-regexp, which does NOT support
// regex lookahead/lookbehind (a single lookahead-based pattern here used to
// be deployed and was rejected at deploy time: "Rewrite at index 0 has
// invalid source pattern"). vercel.json now uses several explicit,
// lookahead-free rules instead of one clever regex: literal passthroughs for
// RESERVED routes/assets/api (checked first, so they never reach this
// function), then two plain path-to-regexp rules for a bare slug and a
// slug+rest, then the existing SPA catch-all. restaurant-meta.test.js reads
// vercel.json directly and asserts on its actual rule shapes/order, so the
// two can't silently drift apart. RESERVED/SUB_ROUTES below are still the
// one shared source of truth for sub-route classification, mirrored from
// src/hooks/useSession.js as noted above.

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

// Defensive — should be unreachable given escapeHtml above, but costs
// nothing to check before trusting a value is safe to insert.
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

// A Facebook/Meta App ID is a plain numeric string (Meta's own apps are
// typically 15-16 digits, but the format itself is just "digits"). Guards
// against a misconfigured env var (placeholder text, a URL, etc.) silently
// shipping as a broken fb:app_id tag.
export function isValidFacebookAppId(value) {
  return typeof value === 'string' && /^\d{1,20}$/.test(value)
}

export function pickLocalizedName(vendor, lang) {
  if (lang === 'fr' && vendor.name_fr) return vendor.name_fr
  if (lang === 'ar' && vendor.name_ar) return vendor.name_ar
  return vendor.name
}

// Only ever composed from verified fields that are actually present —
// never invents cuisine, location, ratings, or anything else.
export function buildDescription(displayName, vendor) {
  const parts = [displayName, vendor.cuisine_type, vendor.city].filter(Boolean)
  return parts.length ? parts.join(' — ') : null
}

// Classifies a (seg1, rest) pair exactly the way useSession.js's RESERVED/
// SUB_ROUTES lists already do, so the two can't quietly diverge.
export function classifyRequest(seg1, rest) {
  const restSegments = rest ? String(rest).split('/').filter(Boolean) : []
  const reserved = !seg1 || RESERVED.includes(seg1)
  const looksLikeVenuePair = !reserved && !!restSegments[0] && !SUB_ROUTES.includes(restSegments[0])
  return { restSegments, reserved, looksLikeVenuePair }
}

export function buildCanonicalPath({ looksLikeVenuePair, venueSlug, vendorSlug }) {
  if (looksLikeVenuePair) {
    return `/${encodeURIComponent(venueSlug)}/${encodeURIComponent(vendorSlug)}`
  }
  return `/${encodeURIComponent(vendorSlug)}`
}

export function buildHeadExtra({ title, description, canonicalUrl, logoUrl, restaurantName, fbAppId }) {
  const hasImage = isValidHttpUrl(logoUrl)
  const hasFbAppId = isValidFacebookAppId(fbAppId)
  const parts = [
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : null,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    // "website", not the Open Graph vertical "restaurant.restaurant": a
    // non-basic og:type requires declaring its RDFa namespace on <html>
    // (e.g. prefix="restaurant: http://ogp.me/ns/restaurant#"), which
    // index.html never did, making the old value spec-invalid — and
    // "website" is the one type every consumer (Twitter/Slack/iMessage/
    // LinkedIn/Google) reliably understands without any extra setup.
    `<meta property="og:type" content="website" />`,
    hasFbAppId ? `<meta property="fb:app_id" content="${escapeHtml(fbAppId)}" />` : null,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    description ? `<meta name="twitter:description" content="${escapeHtml(description)}" />` : null,
    hasImage ? `<meta property="og:image" content="${escapeHtml(logoUrl)}" />` : null,
    hasImage && restaurantName
      ? `<meta property="og:image:alt" content="${escapeHtml(restaurantName)}" />`
      : null,
    hasImage ? `<meta name="twitter:image" content="${escapeHtml(logoUrl)}" />` : null,
    hasImage && restaurantName
      ? `<meta name="twitter:image:alt" content="${escapeHtml(restaurantName)}" />`
      : null,
  ].filter(Boolean)
  return parts.join('\n  ')
}

const VENDOR_SELECT =
  'id, slug, name, name_fr, name_ar, cuisine_type, city, logo_url, active, venue_id'

/**
 * Resolves a restaurant from an INJECTED Supabase client. Returns
 * `{ vendor, canonicalPath }` on success, `null` for a genuine
 * not-found/inactive/mismatch, and THROWS on any Supabase/infra error —
 * callers must keep that distinction, it's what separates 404 from 503.
 */
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
      .eq('venue_id', venueData.id) // guards against a venue/vendor mismatch
      .eq('active', true)
      .maybeSingle()
    if (vendorErr) throw vendorErr
    if (!vendorData) return null

    return {
      vendor: vendorData,
      canonicalPath: buildCanonicalPath({ looksLikeVenuePair: true, venueSlug, vendorSlug }),
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

  // Approved canonical policy: a venue-attached vendor's canonical is the
  // venue-prefixed URL, even when reached via its own standalone slug.
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
    canonicalPath: buildCanonicalPath({ looksLikeVenuePair: false, vendorSlug }),
  }
}

/**
 * Authoritative per the design review: vendor_languages + languages —
 * never vendors.supported_languages (confirmed unread anywhere in src/).
 * Deliberately lenient: a language-lookup problem is cosmetic, not a
 * reason to turn the whole page into a 503, so this swallows its own
 * errors and just falls back to 'en'.
 */
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
  { title, description, lang, canonicalUrl, logoUrl, restaurantName, fbAppId }
) {
  if (looksDangerous(title) || looksDangerous(description) || looksDangerous(canonicalUrl)) {
    // Should be unreachable given escaping, but if it ever triggers, fail
    // toward the untouched template rather than risk injected markup.
    // (restaurantName is always a literal prefix of title, so this check on
    // title already covers it — no separate veto needed. fbAppId comes from
    // an env var, not vendor data, so it's never user/DB-controlled input.)
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
    buildHeadExtra({ title, description, canonicalUrl, logoUrl, restaurantName, fbAppId })
  )
  return html
}

let templateCache = null
function getTemplate() {
  if (!templateCache) {
    templateCache = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  }
  return templateCache
}

function sendShell(response, template, status) {
  response.status(status)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  if (status !== 200) response.setHeader('Cache-Control', 'no-store')
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
    template = getTemplate()
  } catch (err) {
    // No working shell exists to fall back to at all — a deployment/
    // packaging problem, distinct from a Supabase/infra failure.
    console.error('restaurant-meta: could not read built index.html template', err)
    sendInfraFailureMinimal(response)
    return
  }

  const seg1 = typeof request.query.seg1 === 'string' ? request.query.seg1 : ''
  const rest = typeof request.query.rest === 'string' ? request.query.rest : ''
  const { reserved } = classifyRequest(seg1, rest)

  // Defensive — the vercel.json rewrite already excludes RESERVED segments,
  // but a function should never trust its routing config alone.
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
    // No BistroVite Facebook/Meta App ID exists in this project today (none
    // found in .env, vercel.json, or docs) — FACEBOOK_APP_ID is read so the
    // tag activates automatically once a real one is configured in Vercel's
    // Environment Variables, but it is never invented here.
    fbAppId: process.env.FACEBOOK_APP_ID,
  })

  response.status(200)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.send(html)
}
