/* global process */
// Vercel Function (Node.js runtime) — serves /sitemap.xml, listing the
// canonical URL of every publicly accessible vendor ordering page.
//
// Publication gate: `vendors.active = true` is the ONLY publication-state
// field on the `vendors` table — confirmed directly against
// ../bistrovite-database/supabase_schema.sql (no draft/status/published
// column exists there). `manually_closed` and the open_time/close_time/
// closed_days fields are same-day operating-hours flags, a different
// concept, and do not gate sitemap inclusion — a restaurant that is closed
// right now is still a real, indexable page.
//
// Canonical path: reuses buildCanonicalPath from restaurant-meta.js and
// mirrors resolveRestaurant's exact fallback rule — a venue-attached
// vendor's canonical URL is venue-prefixed ONLY when its venue is ALSO
// active; otherwise it falls back to the vendor's own standalone slug. This
// guarantees the sitemap never lists a URL the live app itself wouldn't
// resolve, and the two can't silently drift apart.
//
// Vendor types: `vendors` holds every business type on the platform
// (restaurant/grocery/kiosk/pharmacy — see the table's own COMMENT in the
// schema), all sharing the same slug-based routing and the same
// api/restaurant-meta.js handling. This deliberately does NOT restrict to
// vendor_type = 'restaurant' — doing so would silently drop real, live
// ordering pages from the sitemap.
//
// `<lastmod>` is deliberately omitted: `vendors` has no updated_at/
// published_at column (confirmed against the schema), and this never
// fabricates a date — see buildDescription in restaurant-meta.js for the
// same policy applied to restaurant descriptions.
//
// Noted but NOT fixed here (out of scope for a sitemap endpoint, and
// RLS/schema changes require their own proposed migration per CLAUDE.md):
// `vendors.slug` has no UNIQUE constraint/index in the schema, so two
// active vendor rows could in theory share a slug. fetchCanonicalPaths
// de-duplicates its output defensively so that case can never produce a
// sitemap with a repeated <loc>, but the underlying data-integrity
// question is left for the schema owner to review.
//
// Supabase access: the same anon-key client and env vars as
// restaurant-meta.js (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — no
// service-role key, no new credentials.

import { createClient } from '@supabase/supabase-js'
import { buildCanonicalPath, CANONICAL_BASE_URL } from './restaurant-meta.js'

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour — matches the s-maxage sent below

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSitemapXml(canonicalPaths) {
  const urls = canonicalPaths
    .map(
      (path) =>
        `  <url>\n    <loc>${escapeXml(`${CANONICAL_BASE_URL}${path}`)}</loc>\n  </url>`
    )
    .join('\n')
  const body = urls ? `\n${urls}\n` : '\n'
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">${body}</urlset>\n`
}

export function buildEmptySitemapXml() {
  return buildSitemapXml([])
}

/**
 * Resolves every publicly accessible vendor's canonical path in bulk, from
 * an INJECTED Supabase client — two queries total (all active vendors,
 * then the active venues any of them reference), rather than one query per
 * vendor. Throws on a Supabase/infra error; never swallows it as "no
 * vendors" — callers decide how to respond to that distinction.
 */
export async function fetchCanonicalPaths(supabase) {
  const { data: vendors, error: vendorsErr } = await supabase
    .from('vendors')
    .select('slug, venue_id')
    .eq('active', true)
  if (vendorsErr) throw vendorsErr

  const rows = vendors || []
  const venueIds = [...new Set(rows.map((v) => v.venue_id).filter(Boolean))]

  let activeVenueSlugById = new Map()
  if (venueIds.length > 0) {
    const { data: venues, error: venuesErr } = await supabase
      .from('venues')
      .select('id, slug')
      .in('id', venueIds)
      .eq('active', true)
    if (venuesErr) throw venuesErr
    activeVenueSlugById = new Map((venues || []).map((v) => [v.id, v.slug]))
  }

  const paths = rows
    .filter((v) => typeof v.slug === 'string' && v.slug.length > 0)
    .map((v) => {
      const venueSlug = v.venue_id ? activeVenueSlugById.get(v.venue_id) : null
      return venueSlug
        ? buildCanonicalPath({ looksLikeVenuePair: true, venueSlug, vendorSlug: v.slug })
        : buildCanonicalPath({ looksLikeVenuePair: false, vendorSlug: v.slug })
    })

  // Defensive — see the file-level comment on vendors.slug having no
  // UNIQUE constraint in the schema.
  return [...new Set(paths)]
}

let cache = { xml: null, expiresAt: 0 }

// Test-only — lets restaurant-meta-style unit tests isolate cases from each
// other without reaching into module internals.
export function resetSitemapCache() {
  cache = { xml: null, expiresAt: 0 }
}

/**
 * Returns cached sitemap XML if still fresh, else queries Supabase via
 * fetchCanonicalPaths and repopulates the cache. `now` is injectable for
 * deterministic tests; production calls use the real Date.now. Throws on
 * a Supabase/infra error — a failure is never cached as if it were valid.
 */
export async function getSitemapXml(supabase, { now = Date.now } = {}) {
  const t = now()
  if (cache.xml && cache.expiresAt > t) {
    return cache.xml
  }
  const paths = await fetchCanonicalPaths(supabase)
  const xml = buildSitemapXml(paths)
  cache = { xml, expiresAt: t + CACHE_TTL_MS }
  return xml
}

function sendUnavailable(response) {
  response.status(503)
  response.setHeader('Content-Type', 'application/xml; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.send(buildEmptySitemapXml())
}

export default async function handler(request, response) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  let supabase
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase env vars are not configured for this function')
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.error('sitemap: supabase client unavailable', err)
    sendUnavailable(response)
    return
  }

  let xml
  try {
    xml = await getSitemapXml(supabase)
  } catch (err) {
    console.error('sitemap: lookup failed (infra), serving an empty sitemap with 503', err)
    sendUnavailable(response)
    return
  }

  response.status(200)
  response.setHeader('Content-Type', 'application/xml; charset=utf-8')
  // CDN-cached at the edge so a burst of crawler requests doesn't hit
  // Supabase on every request; a transient infra failure above is always
  // sent with Cache-Control: no-store so it can never be cached in its
  // place. 200 is on Vercel's documented cacheable-status list.
  response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  response.send(xml)
}
