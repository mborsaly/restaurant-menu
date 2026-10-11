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
// Failure policy (see docs/ARCHITECTURE.md-style reasoning in the design
// review this file implements): a genuinely missing/inactive restaurant
// gets a real 404. Any infrastructure failure (bad env vars, Supabase
// unreachable, etc.) falls back to serving the original, unmodified SPA
// shell with 200 — never a 404, since we can't assert non-existence, and
// never fabricated metadata, since we can't assert correctness either.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const RESERVED = ['welcome', 'menu', 'item', 'cart', 'checkout', 'confirmation']
const SUB_ROUTES = ['cart', 'checkout', 'confirmation', 'item']
const CANONICAL_BASE_URL = 'https://order.bistrovite.com'

const DEFAULT_TITLE_TAG =
  '<title>BistroVite — Commandez en quelques secondes</title>'
const DEFAULT_DESCRIPTION_TAG =
  '<meta name="description" content="Commandez chez vos restaurants préférés directement sur WhatsApp — zéro commission, zéro application." />'
const DEFAULT_HTML_TAG = '<html lang="fr">'
const HEAD_EXTRA_MARKER = '<!--SEO_HEAD_EXTRA-->'

let templateCache = null
function getTemplate() {
  if (!templateCache) {
    templateCache = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  }
  return templateCache
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Refuses to substitute a value that itself looks like it could be, or
// contain, markup — defensive, should never actually trigger given the
// escaping above, but costs nothing to check.
function looksDangerous(value) {
  return /<!--SEO_|<script/i.test(String(value ?? ''))
}

function isValidHttpUrl(value) {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function pickLocalizedName(vendor, lang) {
  if (lang === 'fr' && vendor.name_fr) return vendor.name_fr
  if (lang === 'ar' && vendor.name_ar) return vendor.name_ar
  return vendor.name
}

function buildDescription(displayName, vendor) {
  const parts = [displayName, vendor.cuisine_type, vendor.city].filter(Boolean)
  return parts.length ? parts.join(' — ') : null
}

function sendPlainShell(response, template, status = 200) {
  response.status(status)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.send(template)
}

function sendNotFound(response) {
  response.status(404)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.send(
    '<!doctype html><html><head><title>Not found — BistroVite</title></head>' +
      '<body>This restaurant page does not exist.</body></html>'
  )
}

export default async function handler(request, response) {
  let template
  try {
    template = getTemplate()
  } catch (err) {
    console.error('restaurant-meta: could not read built index.html template', err)
    response.status(200)
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.send('<!doctype html><html><body>BistroVite</body></html>')
    return
  }

  const seg1 = typeof request.query.seg1 === 'string' ? request.query.seg1 : ''
  const rest = typeof request.query.rest === 'string' ? request.query.rest : ''

  // Defensive — the vercel.json rewrite already excludes these, but a
  // function should never trust its routing config alone.
  if (!seg1 || RESERVED.includes(seg1)) {
    sendPlainShell(response, template)
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
    console.error('restaurant-meta: supabase client unavailable, serving plain shell', err)
    sendPlainShell(response, template)
    return
  }

  const restSegments = rest ? rest.split('/').filter(Boolean) : []
  const looksLikeVenuePair = !!restSegments[0] && !SUB_ROUTES.includes(restSegments[0])

  try {
    let vendor = null
    let canonicalPath = null

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
      if (!venueData) {
        sendNotFound(response)
        return
      }

      const { data: vendorData, error: vendorErr } = await supabase
        .from('vendors')
        .select(
          'id, slug, name, name_fr, name_ar, cuisine_type, city, logo_url, active, venue_id'
        )
        .eq('slug', vendorSlug)
        .eq('venue_id', venueData.id) // guards against a venue/vendor mismatch
        .eq('active', true)
        .maybeSingle()
      if (vendorErr) throw vendorErr
      if (!vendorData) {
        sendNotFound(response)
        return
      }

      vendor = vendorData
      canonicalPath = `/${encodeURIComponent(venueSlug)}/${encodeURIComponent(vendorSlug)}`
    } else {
      const vendorSlug = seg1
      const { data: vendorData, error: vendorErr } = await supabase
        .from('vendors')
        .select(
          'id, slug, name, name_fr, name_ar, cuisine_type, city, logo_url, active, venue_id'
        )
        .eq('slug', vendorSlug)
        .eq('active', true)
        .maybeSingle()
      if (vendorErr) throw vendorErr
      if (!vendorData) {
        sendNotFound(response)
        return
      }

      vendor = vendorData

      // Approved canonical policy: a venue-attached vendor's canonical is
      // the venue-prefixed URL, even when reached via its standalone slug.
      if (vendor.venue_id) {
        const { data: venueData, error: venueErr } = await supabase
          .from('venues')
          .select('slug')
          .eq('id', vendor.venue_id)
          .eq('active', true)
          .maybeSingle()
        if (venueErr) throw venueErr
        if (venueData) {
          canonicalPath = `/${encodeURIComponent(venueData.slug)}/${encodeURIComponent(vendor.slug)}`
        }
      }
      if (!canonicalPath) {
        canonicalPath = `/${encodeURIComponent(vendor.slug)}`
      }
    }

    // Authoritative per the design review: vendor_languages + languages,
    // never vendors.supported_languages (confirmed unread by the client).
    let lang = 'en'
    try {
      const { data: langRows } = await supabase
        .from('vendor_languages')
        .select('language_code, is_default')
        .eq('vendor_id', vendor.id)
        .order('sort_order')
      const rows = langRows || []
      const def = rows.find((r) => r.is_default) || rows[0]
      if (def?.language_code) lang = def.language_code
    } catch (err) {
      console.error('restaurant-meta: language lookup failed, defaulting to en', err)
    }

    const displayName = pickLocalizedName(vendor, lang)
    const title = `${displayName} — BistroVite`
    const description = buildDescription(displayName, vendor)
    const canonicalUrl = `${CANONICAL_BASE_URL}${canonicalPath}`

    if (looksDangerous(title) || looksDangerous(description) || looksDangerous(canonicalUrl)) {
      // Should be unreachable given escaping below, but if it ever triggers,
      // fail toward the safe plain shell rather than risk injected markup.
      sendPlainShell(response, template)
      return
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

    const headExtraParts = [
      `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      description
        ? `<meta property="og:description" content="${escapeHtml(description)}" />`
        : null,
      `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
      `<meta property="og:type" content="restaurant.restaurant" />`,
      isValidHttpUrl(vendor.logo_url)
        ? `<meta property="og:image" content="${escapeHtml(vendor.logo_url)}" />`
        : null,
    ].filter(Boolean)

    html = html.replace(HEAD_EXTRA_MARKER, headExtraParts.join('\n  '))

    response.status(200)
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.send(html)
  } catch (err) {
    console.error('restaurant-meta: lookup failed, falling back to plain shell', err)
    sendPlainShell(response, template)
  }
}
