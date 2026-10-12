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
import {
  RESERVED,
  SUB_ROUTES,
  CANONICAL_BASE_URL,
  REWRITE_SOURCE_PATTERN,
  escapeHtml,
  looksDangerous,
  isValidHttpUrl,
  pickLocalizedName,
  buildDescription,
  classifyRequest,
  buildCanonicalPath,
  buildHeadExtra,
  resolveRestaurant,
  resolveLanguage,
  substituteTemplate,
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

describe('REWRITE_SOURCE_PATTERN (must stay identical to vercel.json)', () => {
  const regex = new RegExp(REWRITE_SOURCE_PATTERN)

  test('matches a standalone restaurant slug and a venue-pair path', () => {
    assert.ok(regex.test('/la-saveur-colombienne'))
    assert.ok(regex.test('/esc-giza/dokan-el-kahwa'))
    assert.ok(regex.test('/la-saveur-colombienne/cart'))
  })

  test('does NOT match any RESERVED legacy route', () => {
    for (const word of RESERVED) {
      assert.equal(regex.test(`/${word}`), false, `expected "/${word}" to be excluded`)
    }
  })

  test('does NOT match /assets/* — the whole Vite build-output directory is excluded by name', () => {
    assert.equal(regex.test('/assets/index-abc123.js'), false)
    assert.equal(regex.test('/assets/index-abc123.css'), false)
  })

  test('does NOT match a root-level static file — any first segment containing a "." is excluded', () => {
    for (const path of [
      '/robots.txt',
      '/favicon.svg',
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/icon-192.png',
      '/icon-512.png',
      '/icons.svg',
      '/sitemap.xml',
    ]) {
      assert.equal(regex.test(path), false, `expected "${path}" to be excluded`)
    }
  })

  test('REMAINING, genuinely unresolved: rewrite-array evaluation order itself', () => {
    // This test only proves the regex's own matching behavior, in isolation.
    // It cannot prove that Vercel evaluates this rewrite before the existing
    // catch-all for paths that DO match (real restaurant slugs) — that
    // ordering/precedence question still requires a Preview deployment,
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
    })
    assert.ok(!html.includes(`"Chez l'Ami"`)) // raw quote/apostrophe must not survive unescaped
    assert.ok(html.includes('&quot;Chez l&#39;Ami&quot;'))
    assert.ok(html.includes('&amp; &lt;Fancy&gt;'))
    assert.ok(html.includes('<html lang="ar">'))
    assert.ok(html.includes(`<link rel="canonical" href="${CANONICAL_BASE_URL}/khmer-express" />`))
    assert.ok(html.includes('og:image'))
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
