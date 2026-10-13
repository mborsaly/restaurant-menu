// Local, dependency-free tests for api/restaurant-meta.js, using Node's
// built-in test runner and assert module only (no package installed).
// Run with: node --test api/restaurant-meta.test.js
//
// These exercise pure helpers and resolveRestaurant/resolveLanguage against
// an in-memory mock Supabase client (fixtures below) — nothing here touches
// a network, a real Supabase project, or production data. No claim is made
// about live database behavior; see the accompanying report for what still
// needs Preview-deployment and Vercel-dashboard verification.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  RESERVED,
  SUB_ROUTES,
  CANONICAL_BASE_URL,
  escapeHtml,
  looksDangerous,
  isValidHttpUrl,
  isValidFacebookAppId,
  pickLocalizedName,
  buildDescription,
  classifyRequest,
  buildCanonicalPath,
  buildHeadExtra,
  resolveRestaurant,
  resolveLanguage,
  substituteTemplate,
  resolveTemplate,
} from './restaurant-meta.js'

// ---------------------------------------------------------------------------
// Mock Supabase client — maps table name -> a fixed { data, error } result.
// Mimics just enough of the real supabase-js query-builder shape
// (select/eq/order chain, then either .maybeSingle() or a bare await) for
// resolveRestaurant/resolveLanguage to run against it unmodified.
// ---------------------------------------------------------------------------
function makeMockSupabase(byTable) {
  return {
    from(table) {
      if (!(table in byTable)) {
        throw new Error(`mock supabase: no fixture configured for table "${table}"`)
      }
      const fixture = byTable[table]
      const chain = {
        select() {
          return chain
        },
        eq() {
          return chain
        },
        order() {
          return chain
        },
        maybeSingle() {
          return Promise.resolve(fixture)
        },
        then(resolve, reject) {
          Promise.resolve(fixture).then(resolve, reject)
        },
      }
      return chain
    },
  }
}

const SAMPLE_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <title>BistroVite — Commandez en quelques secondes</title>
  <meta name="description" content="Commandez chez vos restaurants préférés directement sur WhatsApp — zéro commission, zéro application." />
  <!--SEO_HEAD_EXTRA-->
</head>
<body><div id="root"></div></body>
</html>`

describe('escaping and missing-optional-field handling', () => {
  test('escapeHtml escapes the five HTML-significant characters', () => {
    assert.equal(escapeHtml(`& < > " '`), '&amp; &lt; &gt; &quot; &#39;')
  })

  test('escapeHtml tolerates null/undefined', () => {
    assert.equal(escapeHtml(null), '')
    assert.equal(escapeHtml(undefined), '')
  })

  test('looksDangerous flags an embedded placeholder-like string', () => {
    assert.equal(looksDangerous('normal name'), false)
    assert.equal(looksDangerous('weird<!--SEO_TITLE-->name'), true)
    assert.equal(looksDangerous('<script>alert(1)</script>'), true)
  })

  test('isValidHttpUrl accepts https/http, rejects everything else', () => {
    assert.equal(isValidHttpUrl('https://example.com/logo.png'), true)
    assert.equal(isValidHttpUrl('http://example.com/logo.png'), true)
    assert.equal(isValidHttpUrl('javascript:alert(1)'), false)
    assert.equal(isValidHttpUrl('data:text/html,<script>1</script>'), false)
    assert.equal(isValidHttpUrl('/relative/path.png'), false)
    assert.equal(isValidHttpUrl(''), false)
    assert.equal(isValidHttpUrl(null), false)
  })

  test('isValidFacebookAppId accepts plain digit strings only', () => {
    assert.equal(isValidFacebookAppId('1234567890123456'), true)
    assert.equal(isValidFacebookAppId('123'), true)
    assert.equal(isValidFacebookAppId(''), false)
    assert.equal(isValidFacebookAppId(undefined), false)
    assert.equal(isValidFacebookAppId(null), false)
    assert.equal(isValidFacebookAppId('abc123'), false)
    assert.equal(isValidFacebookAppId('123.456'), false)
    assert.equal(isValidFacebookAppId('<script>1</script>'), false)
  })

  test('buildDescription omits missing fields and never fabricates them', () => {
    assert.equal(
      buildDescription('Khmer Express', { cuisine_type: 'Cambodian', city: 'Laval' }),
      'Khmer Express — Cambodian — Laval'
    )
    assert.equal(buildDescription('Khmer Express', { cuisine_type: null, city: null }), 'Khmer Express')
    assert.equal(buildDescription(null, { cuisine_type: null, city: null }), null)
  })

  test('buildHeadExtra omits og:image/twitter:image when logo is missing or invalid', () => {
    const withoutLogo = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
    })
    assert.ok(!withoutLogo.includes('og:image'))
    assert.ok(!withoutLogo.includes('twitter:image'))

    const invalidLogo = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: 'javascript:alert(1)',
    })
    assert.ok(!invalidLogo.includes('og:image'))

    const withLogo = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: 'https://example.com/logo.png',
    })
    assert.ok(withLogo.includes('og:image'))
    assert.ok(withLogo.includes('https://example.com/logo.png'))
  })

  test('buildHeadExtra omits description tags when there is no description', () => {
    const headExtra = buildHeadExtra({
      title: 'A',
      description: null,
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
    })
    assert.ok(!headExtra.includes('og:description'))
    assert.ok(!headExtra.includes('twitter:description'))
  })

  test('buildHeadExtra always uses the basic "website" og:type, never the unregistered restaurant vertical', () => {
    const headExtra = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
    })
    assert.ok(headExtra.includes('<meta property="og:type" content="website" />'))
    assert.ok(!headExtra.includes('restaurant.restaurant'))
  })

  test('buildHeadExtra emits og:image:alt and twitter:image:alt from the restaurant name, only when an image is present', () => {
    const withImageAndName = buildHeadExtra({
      title: 'Khmer Express — BistroVite',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/khmer-express',
      logoUrl: 'https://example.com/logo.png',
      restaurantName: 'Khmer Express',
    })
    assert.ok(withImageAndName.includes('<meta property="og:image:alt" content="Khmer Express" />'))
    assert.ok(withImageAndName.includes('<meta name="twitter:image:alt" content="Khmer Express" />'))

    const withImageNoName = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: 'https://example.com/logo.png',
    })
    assert.ok(!withImageNoName.includes('image:alt'))

    const withNameNoImage = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
      restaurantName: 'Khmer Express',
    })
    assert.ok(!withNameNoImage.includes('image:alt'))
  })

  test('buildHeadExtra escapes HTML-significant characters in the image alt text', () => {
    const headExtra = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: 'https://example.com/logo.png',
      restaurantName: `Chez l'Ami & <Fancy>`,
    })
    assert.ok(headExtra.includes('&amp; &lt;Fancy&gt;'))
    assert.ok(!headExtra.includes('<Fancy>'))
  })

  test('buildHeadExtra emits fb:app_id only when a valid, numeric App ID is provided', () => {
    const withAppId = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
      fbAppId: '1234567890123456',
    })
    assert.ok(withAppId.includes('<meta property="fb:app_id" content="1234567890123456" />'))

    const withoutAppId = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
    })
    assert.ok(!withoutAppId.includes('fb:app_id'))

    const withInvalidAppId = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
      fbAppId: 'not-a-real-app-id',
    })
    assert.ok(!withInvalidAppId.includes('fb:app_id'))
  })
})

describe('canonical URL construction', () => {
  test('standalone vendor canonical path', () => {
    assert.equal(
      buildCanonicalPath({ looksLikeVenuePair: false, vendorSlug: 'la-saveur-colombienne' }),
      '/la-saveur-colombienne'
    )
  })

  test('venue-prefixed canonical path', () => {
    assert.equal(
      buildCanonicalPath({ looksLikeVenuePair: true, venueSlug: 'esc-giza', vendorSlug: 'dokan-el-kahwa' }),
      '/esc-giza/dokan-el-kahwa'
    )
  })

  test('slug segments are URL-encoded, not trusted verbatim', () => {
    assert.equal(
      buildCanonicalPath({ looksLikeVenuePair: false, vendorSlug: 'a b/c' }),
      '/a%20b%2Fc'
    )
  })

  test('canonical is always built from the fixed base URL, never from a Host header', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: 'X',
      description: null,
      lang: 'en',
      canonicalUrl: `${CANONICAL_BASE_URL}/la-saveur-colombienne`,
      logoUrl: null,
    })
    assert.ok(html.includes(`href="${CANONICAL_BASE_URL}/la-saveur-colombienne"`))
  })
})

describe('request classification: standalone vs. venue-prefixed vs. reserved', () => {
  test('a RESERVED first segment is flagged reserved', () => {
    for (const word of RESERVED) {
      assert.equal(classifyRequest(word, '').reserved, true, `expected "${word}" to be reserved`)
    }
  })

  test('a bare restaurant slug is standalone, not a venue pair', () => {
    const { reserved, looksLikeVenuePair } = classifyRequest('la-saveur-colombienne', '')
    assert.equal(reserved, false)
    assert.equal(looksLikeVenuePair, false)
  })

  test('restaurant slug + a SUB_ROUTE is still standalone (nested ordering route)', () => {
    for (const sub of SUB_ROUTES) {
      const { looksLikeVenuePair } = classifyRequest('la-saveur-colombienne', sub)
      assert.equal(looksLikeVenuePair, false, `expected "${sub}" to stay standalone`)
    }
  })

  test('venue slug + vendor slug is a venue pair', () => {
    const { looksLikeVenuePair } = classifyRequest('esc-giza', 'dokan-el-kahwa')
    assert.equal(looksLikeVenuePair, true)
  })

  test('venue pair + nested ordering route is still a venue pair', () => {
    const { looksLikeVenuePair } = classifyRequest('esc-giza', 'dokan-el-kahwa/cart')
    assert.equal(looksLikeVenuePair, true)
  })
})

// ---------------------------------------------------------------------------
// vercel.json rewrite rules — read the REAL file, not a copy, so these tests
// can't silently drift from what actually ships. This replaced a single
// lookahead-based regex ("^/(?!welcome|menu|...)...") that Vercel rejected
// at deploy time ("Rewrite at index 0 has invalid source pattern") because
// path-to-regexp — what Vercel's rewrite "source" matching actually uses —
// does not support lookahead/lookbehind assertions. vercel.json now lists
// explicit, lookahead-free passthrough rules (reserved SPA routes, /assets,
// /api) before the slug rules, relying only on array order (first match
// wins), not on regex exclusion tricks.
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const vercelConfig = JSON.parse(readFileSync(join(__dirname, '..', 'vercel.json'), 'utf8'))
const REWRITE_RULES = vercelConfig.rewrites

// Converts the small, known set of path-to-regexp shapes actually used in
// vercel.json into a real RegExp, so tests can simulate "first match wins"
// against representative request paths without adding a path-to-regexp
// dependency. Throws on any shape it doesn't recognize, so a future edit to
// vercel.json that changes a rule's shape fails loudly here instead of
// silently matching the wrong thing.
function sourceToRegExp(source) {
  if (source === '/(.*)') return /^\/(.*)$/

  let m = source.match(/^\/([a-zA-Z0-9-]+)\/:[a-zA-Z0-9]+\*$/)
  if (m) return new RegExp(`^/${m[1]}(?:/.*)?$`)

  m = source.match(/^\/:[a-zA-Z0-9]+\(([^()]+)\)$/)
  if (m) return new RegExp(`^/(${m[1]})$`)

  m = source.match(/^\/:[a-zA-Z0-9]+\(([^()]+)\)\/:[a-zA-Z0-9]+\(([^()]+)\)$/)
  if (m) return new RegExp(`^/(${m[1]})/(${m[2]})$`)

  // A plain literal path with no params at all, e.g. "/robots.txt" or
  // "/sitemap.xml" — matches itself exactly.
  m = source.match(/^\/[a-zA-Z0-9.-]+$/)
  if (m) return new RegExp(`^${source.replace(/\./g, '\\.')}$`)

  throw new Error(`sourceToRegExp: unrecognized vercel.json rewrite source shape: "${source}"`)
}

function matchRewrite(pathname, rules) {
  for (const rule of rules) {
    if (sourceToRegExp(rule.source).test(pathname)) return rule
  }
  return null
}

describe('vercel.json rewrite rules (read from the real file, first-match-wins)', () => {
  test('no rewrite source uses lookahead/lookbehind — the exact syntax Vercel rejected at deploy time', () => {
    for (const rule of REWRITE_RULES) {
      assert.ok(
        !/\(\?[!=<]/.test(rule.source),
        `expected "${rule.source}" not to contain a lookahead/lookbehind assertion`
      )
    }
  })

  test('a standalone restaurant slug routes to the restaurant-meta function', () => {
    const rule = matchRewrite('/la-saveur-colombienne', REWRITE_RULES)
    assert.equal(rule.destination, '/api/restaurant-meta?seg1=:seg1')
  })

  test('a vendor + sub-route path (nested ordering route) routes to the restaurant-meta function', () => {
    const rule = matchRewrite('/la-saveur-colombienne/cart', REWRITE_RULES)
    assert.equal(rule.destination, '/api/restaurant-meta?seg1=:seg1&rest=:rest')
  })

  test('a venue + vendor path routes to the restaurant-meta function', () => {
    const rule = matchRewrite('/esc-giza/dokan-el-kahwa', REWRITE_RULES)
    assert.equal(rule.destination, '/api/restaurant-meta?seg1=:seg1&rest=:rest')
  })

  test('a venue + vendor + nested sub-route path routes to the restaurant-meta function', () => {
    const rule = matchRewrite('/esc-giza/dokan-el-kahwa/cart', REWRITE_RULES)
    assert.equal(rule.destination, '/api/restaurant-meta?seg1=:seg1&rest=:rest')
  })

  test('every RESERVED route, bare and nested, bypasses the function entirely', () => {
    for (const word of RESERVED) {
      assert.equal(matchRewrite(`/${word}`, REWRITE_RULES).destination, '/index.html', `/${word}`)
      assert.equal(
        matchRewrite(`/${word}/something/nested`, REWRITE_RULES).destination,
        '/index.html',
        `/${word}/something/nested`
      )
    }
  })

  test('static assets bypass the function and are served as themselves, not rewritten to index.html', () => {
    const rule = matchRewrite('/assets/index-abc123.js', REWRITE_RULES)
    assert.equal(rule.destination, '/assets/:rest*')
  })

  test('/api/* bypasses the function and is served as itself — avoids a self-referential rewrite', () => {
    const rule = matchRewrite('/api/restaurant-meta', REWRITE_RULES)
    assert.equal(rule.destination, '/api/:rest*')
  })

  test('root-level dotted static files (with no dedicated rewrite rule) fall through to the SPA catch-all within the rewrites array', () => {
    // This only proves what the REWRITES array itself does with these paths
    // in isolation. It is NOT what a real request experiences: Vercel's own
    // Build Output API docs (confirmed directly, not assumed) define the
    // "filesystem" handle phase as running BEFORE any rewrite is evaluated
    // ("check matches after the filesystem misses") — and robots.txt,
    // favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png,
    // icon-512.png and icons.svg all physically exist as real files in
    // `.vercel/output/static/` once built, confirmed via a local
    // `vercel build`. So in production every one of these is served
    // directly by that filesystem phase and never reaches this array at
    // all — a dedicated passthrough rule for any of them would be dead
    // code, which is why none exists (one for /robots.txt was tried and
    // removed after this was confirmed).
    for (const path of [
      '/robots.txt',
      '/favicon.svg',
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/icon-192.png',
      '/icon-512.png',
      '/icons.svg',
    ]) {
      assert.equal(matchRewrite(path, REWRITE_RULES).destination, '/index.html', path)
    }
  })

  test('/sitemap.xml routes to the sitemap function, not the SPA catch-all or the restaurant-meta function', () => {
    const rule = matchRewrite('/sitemap.xml', REWRITE_RULES)
    assert.equal(rule.destination, '/api/sitemap')
  })

  test('the homepage falls through to the SPA catch-all', () => {
    assert.equal(matchRewrite('/', REWRITE_RULES).destination, '/index.html')
  })

  test('every passthrough rule (reserved/asset/api/sitemap.xml) is ordered before the slug rules, which are ordered before the final catch-all', () => {
    const catchAllIndex = REWRITE_RULES.findIndex((r) => r.source === '/(.*)')
    const slugRuleIndexes = []
    const passthroughIndexes = []
    REWRITE_RULES.forEach((r, i) => {
      if (r.source === '/(.*)') return
      if (/^\/:[a-zA-Z0-9]+\(/.test(r.source)) slugRuleIndexes.push(i)
      else passthroughIndexes.push(i)
    })

    assert.ok(passthroughIndexes.length > 0 && slugRuleIndexes.length > 0 && catchAllIndex !== -1)
    assert.ok(Math.max(...passthroughIndexes) < Math.min(...slugRuleIndexes))
    assert.ok(Math.max(...slugRuleIndexes) < catchAllIndex)
  })

  test('REMAINING, genuinely unresolved: live path-to-regexp behavior on Vercel itself', () => {
    // These tests prove the rule set's matching/ordering behavior against a
    // conversion of the documented path-to-regexp syntax, and that no source
    // uses unsupported regex. They cannot prove Vercel's live engine
    // interpolates a plain named param (":seg1", ":rest") into a query-string
    // destination exactly as assumed, or that a trailing "*" modifier really
    // makes its preceding "/" optional in Vercel's specific implementation.
    // That still requires one real Preview request per representative path,
    // exactly as flagged in the design review. Nothing here claims otherwise.
    assert.ok(true)
  })
})

describe('resolveRestaurant — unknown / inactive / venue-vendor mismatch (all return null)', () => {
  test('unknown standalone slug returns null', async () => {
    const supabase = makeMockSupabase({ vendors: { data: null, error: null } })
    const result = await resolveRestaurant(supabase, { seg1: 'no-such-restaurant', rest: '' })
    assert.equal(result, null)
  })

  test('inactive vendor is indistinguishable from unknown (active=true filter yields no row)', async () => {
    // An inactive vendor never satisfies .eq('active', true) in the real
    // query, so the fixture is identical to "unknown" — this IS the
    // intended behavior: never reveal that an inactive restaurant exists.
    const supabase = makeMockSupabase({ vendors: { data: null, error: null } })
    const result = await resolveRestaurant(supabase, { seg1: 'some-inactive-vendor', rest: '' })
    assert.equal(result, null)
  })

  test('unknown venue slug returns null without ever querying vendors', async () => {
    const supabase = makeMockSupabase({
      venues: { data: null, error: null },
      vendors: { data: null, error: new Error('should not be called') },
    })
    const result = await resolveRestaurant(supabase, { seg1: 'no-such-venue', rest: 'dokan-el-kahwa' })
    assert.equal(result, null)
  })

  test('venue/vendor mismatch (vendor exists, but not under this venue_id) returns null', async () => {
    const supabase = makeMockSupabase({
      venues: { data: { id: 'venue-1', slug: 'esc-giza' }, error: null },
      // The real query filters on .eq('venue_id', venueData.id) too, so a
      // vendor that belongs to a DIFFERENT venue simply yields no row here.
      vendors: { data: null, error: null },
    })
    const result = await resolveRestaurant(supabase, { seg1: 'esc-giza', rest: 'wrong-vendor' })
    assert.equal(result, null)
  })
})

describe('resolveRestaurant — success paths', () => {
  test('standalone vendor with no venue_id resolves with a standalone canonical path', async () => {
    const supabase = makeMockSupabase({
      vendors: {
        data: { id: 'v1', slug: 'la-saveur-colombienne', name: 'La Saveur Colombienne', venue_id: null },
        error: null,
      },
    })
    const result = await resolveRestaurant(supabase, { seg1: 'la-saveur-colombienne', rest: '' })
    assert.equal(result.canonicalPath, '/la-saveur-colombienne')
  })

  test('standalone vendor WITH a venue_id canonicalizes to the venue-prefixed URL', async () => {
    const supabase = makeMockSupabase({
      vendors: {
        data: { id: 'v1', slug: 'dokan-el-kahwa', name: 'Dokan El Kahwa', venue_id: 'venue-1' },
        error: null,
      },
      venues: { data: { slug: 'esc-giza' }, error: null },
    })
    const result = await resolveRestaurant(supabase, { seg1: 'dokan-el-kahwa', rest: '' })
    assert.equal(result.canonicalPath, '/esc-giza/dokan-el-kahwa')
  })

  test('venue-pair request resolves with a venue-prefixed canonical path', async () => {
    const supabase = makeMockSupabase({
      venues: { data: { id: 'venue-1', slug: 'esc-giza' }, error: null },
      vendors: {
        data: { id: 'v1', slug: 'dokan-el-kahwa', name: 'Dokan El Kahwa', venue_id: 'venue-1' },
        error: null,
      },
    })
    const result = await resolveRestaurant(supabase, { seg1: 'esc-giza', rest: 'dokan-el-kahwa' })
    assert.equal(result.canonicalPath, '/esc-giza/dokan-el-kahwa')
  })
})

describe('resolveRestaurant — infrastructure failures (must throw, never return null)', () => {
  test('a Supabase error on the venues query throws, is not swallowed as "not found"', async () => {
    const supabase = makeMockSupabase({
      venues: { data: null, error: new Error('connection timeout') },
    })
    await assert.rejects(
      () => resolveRestaurant(supabase, { seg1: 'esc-giza', rest: 'dokan-el-kahwa' }),
      /connection timeout/
    )
  })

  test('a Supabase error on the vendors query throws, is not swallowed as "not found"', async () => {
    const supabase = makeMockSupabase({
      vendors: { data: null, error: new Error('network error') },
    })
    await assert.rejects(
      () => resolveRestaurant(supabase, { seg1: 'la-saveur-colombienne', rest: '' }),
      /network error/
    )
  })
})

describe('resolveLanguage — deliberately lenient, falls back to "en", never throws', () => {
  test('returns the is_default row\'s language_code', async () => {
    const supabase = makeMockSupabase({
      vendor_languages: {
        data: [
          { language_code: 'fr', is_default: false },
          { language_code: 'ar', is_default: true },
        ],
        error: null,
      },
    })
    assert.equal(await resolveLanguage(supabase, 'v1'), 'ar')
  })

  test('falls back to the first row when none is marked default', async () => {
    const supabase = makeMockSupabase({
      vendor_languages: { data: [{ language_code: 'fr', is_default: false }], error: null },
    })
    assert.equal(await resolveLanguage(supabase, 'v1'), 'fr')
  })

  test('falls back to "en" when there are no rows at all', async () => {
    const supabase = makeMockSupabase({ vendor_languages: { data: [], error: null } })
    assert.equal(await resolveLanguage(supabase, 'v1'), 'en')
  })

  test('falls back to "en" (never throws) on a Supabase error', async () => {
    const supabase = makeMockSupabase({
      vendor_languages: { data: null, error: new Error('boom') },
    })
    assert.equal(await resolveLanguage(supabase, 'v1'), 'en')
  })
})

describe('substituteTemplate — end-to-end escaping on a realistic template', () => {
  test('escapes HTML-significant characters in a vendor name, injects all expected tags', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: `Café "Chez l'Ami" & <Fancy> — BistroVite`,
      description: 'Cambodian — Laval',
      lang: 'ar',
      canonicalUrl: `${CANONICAL_BASE_URL}/khmer-express`,
      logoUrl: 'https://example.com/logo.png',
      restaurantName: `Café "Chez l'Ami" & <Fancy>`,
      fbAppId: '1234567890123456',
    })
    assert.ok(!html.includes(`"Chez l'Ami"`)) // raw quote/apostrophe must not survive unescaped
    assert.ok(html.includes('&quot;Chez l&#39;Ami&quot;'))
    assert.ok(html.includes('&amp; &lt;Fancy&gt;'))
    assert.ok(html.includes('<html lang="ar">'))
    assert.ok(html.includes(`<link rel="canonical" href="${CANONICAL_BASE_URL}/khmer-express" />`))
    assert.ok(html.includes('<meta property="og:type" content="website" />'))
    assert.ok(html.includes('og:image'))
    assert.ok(html.includes('og:image:alt'))
    assert.ok(html.includes('twitter:image:alt'))
    assert.ok(html.includes('<meta property="fb:app_id" content="1234567890123456" />'))
    assert.ok(!html.includes('<!--SEO_HEAD_EXTRA-->'))
  })

  test('a title that smuggles a placeholder/script-like string is vetoed entirely, template stays untouched', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: `Evil <script>alert(1)</script> Name`,
      description: null,
      lang: 'en',
      canonicalUrl: `${CANONICAL_BASE_URL}/evil`,
      logoUrl: null,
    })
    // looksDangerous() vetoes the whole substitution — the safe, original
    // template is returned unmodified rather than risking injected markup.
    assert.equal(html, SAMPLE_TEMPLATE)
  })

  test('a missing description leaves the default description tag untouched', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: 'Some Restaurant',
      description: null,
      lang: 'en',
      canonicalUrl: `${CANONICAL_BASE_URL}/some-restaurant`,
      logoUrl: null,
    })
    assert.ok(html.includes('Commandez chez vos restaurants préférés'))
  })

  test('pickLocalizedName falls back to the base name when no translation exists', () => {
    assert.equal(pickLocalizedName({ name: 'Default Name', name_fr: null, name_ar: null }, 'fr'), 'Default Name')
    assert.equal(pickLocalizedName({ name: 'Default Name', name_fr: 'Nom Français' }, 'fr'), 'Nom Français')
  })
})

describe('resolveTemplate — fetches the deployed SPA shell via VERCEL_URL, never the filesystem, on Vercel', () => {
  test('with vercelUrl set, fetches https://<vercelUrl>/index.html and returns its text', async () => {
    const calls = []
    const fetchImpl = async (url) => {
      calls.push(url)
      return { ok: true, text: async () => '<html>deployed shell</html>' }
    }
    const html = await resolveTemplate({ vercelUrl: 'my-app-abc123.vercel.app', fetchImpl })
    assert.equal(html, '<html>deployed shell</html>')
    assert.deepEqual(calls, ['https://my-app-abc123.vercel.app/index.html'])
  })

  test('never uses the incoming request Host header or a hardcoded production/preview URL — only the injected vercelUrl', async () => {
    const fetchImpl = async (url) => ({ ok: true, text: async () => `fetched:${url}` })
    const html = await resolveTemplate({ vercelUrl: 'some-preview-deployment-xyz.vercel.app', fetchImpl })
    assert.equal(html, 'fetched:https://some-preview-deployment-xyz.vercel.app/index.html')
  })

  test('a non-ok fetch response throws (so the caller\'s infra-failure path runs, not a silently broken page)', async () => {
    const fetchImpl = async () => ({ ok: false, status: 503, text: async () => 'should not be read' })
    await assert.rejects(
      () => resolveTemplate({ vercelUrl: 'my-app-abc123.vercel.app', fetchImpl }),
      /503/
    )
  })

  test('a network error from fetch propagates, is not swallowed', async () => {
    const fetchImpl = async () => {
      throw new Error('network unreachable')
    }
    await assert.rejects(
      () => resolveTemplate({ vercelUrl: 'my-app-abc123.vercel.app', fetchImpl }),
      /network unreachable/
    )
  })

  test('with no vercelUrl (local dev / local build, not a Vercel deployment), reads the local filesystem instead', async () => {
    const readFileImpl = (path, encoding) => `read:${path}:${encoding}`
    const html = await resolveTemplate({ vercelUrl: undefined, readFileImpl })
    assert.ok(html.startsWith('read:'))
    assert.ok(html.includes(join('dist', 'index.html')))
    assert.ok(html.endsWith('utf8'))
  })

  test('with no vercelUrl, never calls fetch at all', async () => {
    let fetchCalled = false
    const fetchImpl = async () => {
      fetchCalled = true
      return { ok: true, text: async () => '' }
    }
    const readFileImpl = () => 'local shell'
    await resolveTemplate({ vercelUrl: undefined, fetchImpl, readFileImpl })
    assert.equal(fetchCalled, false)
  })
})
