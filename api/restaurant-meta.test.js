// Local, dependency-free tests for api/restaurant-meta.js.
// Run with: node --test api/restaurant-meta.test.js

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
  buildRestaurantJsonLd,
  buildJsonLdScriptTag,
  resolveRestaurant,
  resolveLanguage,
  substituteTemplate,
  resolveTemplate,
} from './restaurant-meta.js'

// ---------------------------------------------------------------------------
// Mock Supabase client.
// ---------------------------------------------------------------------------
function makeMockSupabase(byTable, fromCalls) {
  return {
    from(table) {
      if (fromCalls) fromCalls.push(table)
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

const MOCK_APP_SHELL =
  '<!DOCTYPE html><html><head><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>'

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

  test('isValidHttpUrl accepts http/https and rejects other schemes', () => {
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

  test('buildHeadExtra omits description tags when description is absent', () => {
    const headExtra = buildHeadExtra({
      title: 'A',
      description: null,
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
    })
    assert.ok(!headExtra.includes('og:description'))
    assert.ok(!headExtra.includes('twitter:description'))
  })

  test('buildHeadExtra always uses og:type website', () => {
    const headExtra = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: 'https://order.bistrovite.com/a',
      logoUrl: null,
    })
    assert.ok(headExtra.includes('<meta property="og:type" content="website" />'))
    assert.ok(!headExtra.includes('restaurant.restaurant'))
  })

  test('buildHeadExtra emits image alt text only when an image and restaurant name exist', () => {
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

  test('buildHeadExtra escapes HTML in image alt text', () => {
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

  test('buildHeadExtra emits fb:app_id only for a valid numeric App ID', () => {
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

describe('buildRestaurantJsonLd / buildJsonLdScriptTag — Restaurant JSON-LD', () => {
  const FULL = {
    name: 'Khmer Express',
    url: `${CANONICAL_BASE_URL}/khmer-express`,
    logoUrl: 'https://example.com/logo.png',
    cuisineType: 'Cambodian',
    city: 'Laval',
  }

  test('a complete record produces a valid Restaurant object', () => {
    assert.deepEqual(buildRestaurantJsonLd(FULL), {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: 'Khmer Express',
      url: `${CANONICAL_BASE_URL}/khmer-express`,
      image: 'https://example.com/logo.png',
      servesCuisine: 'Cambodian',
      address: { '@type': 'PostalAddress', addressLocality: 'Laval' },
    })
  })

  test('missing optional fields are omitted', () => {
    const jsonLd = buildRestaurantJsonLd({ name: 'Khmer Express', url: FULL.url })
    assert.deepEqual(jsonLd, {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: 'Khmer Express',
      url: FULL.url,
    })
    assert.ok(!('image' in jsonLd))
    assert.ok(!('servesCuisine' in jsonLd))
    assert.ok(!('address' in jsonLd))
  })

  test('optional fields explicitly set to null are omitted', () => {
    const jsonLd = buildRestaurantJsonLd({
      name: 'Khmer Express',
      url: FULL.url,
      logoUrl: null,
      cuisineType: null,
      city: null,
    })
    assert.ok(!('image' in jsonLd))
    assert.ok(!('servesCuisine' in jsonLd))
    assert.ok(!('address' in jsonLd))
  })

  test('empty optional strings are omitted', () => {
    const jsonLd = buildRestaurantJsonLd({
      name: 'Khmer Express',
      url: FULL.url,
      cuisineType: '   ',
      city: '',
    })
    assert.ok(!('servesCuisine' in jsonLd))
    assert.ok(!('address' in jsonLd))
  })

  test('invalid logo URLs do not produce an image property', () => {
    assert.ok(!('image' in buildRestaurantJsonLd({ ...FULL, logoUrl: 'javascript:alert(1)' })))
    assert.ok(!('image' in buildRestaurantJsonLd({ ...FULL, logoUrl: '/relative/logo.png' })))
  })

  test('a missing or blank name prevents generation of a Restaurant object', () => {
    assert.equal(buildRestaurantJsonLd({ ...FULL, name: null }), null)
    assert.equal(buildRestaurantJsonLd({ ...FULL, name: undefined }), null)
    assert.equal(buildRestaurantJsonLd({ ...FULL, name: '' }), null)
    assert.equal(buildRestaurantJsonLd({ ...FULL, name: '   ' }), null)
  })

  test('a missing canonical URL prevents generation of a Restaurant object', () => {
    assert.equal(buildRestaurantJsonLd({ ...FULL, url: null }), null)
  })

  test('uses pickLocalizedName for French, Arabic, and default names', () => {
    const vendor = { name: 'Default Name', name_fr: 'Nom Français', name_ar: 'الاسم العربي' }
    assert.equal(buildRestaurantJsonLd({ ...FULL, name: pickLocalizedName(vendor, 'fr') }).name, 'Nom Français')
    assert.equal(buildRestaurantJsonLd({ ...FULL, name: pickLocalizedName(vendor, 'ar') }).name, 'الاسم العربي')
    assert.equal(buildRestaurantJsonLd({ ...FULL, name: pickLocalizedName(vendor, 'en') }).name, 'Default Name')
  })

  test('buildJsonLdScriptTag returns null for an invalid Restaurant object', () => {
    assert.equal(buildJsonLdScriptTag(null), null)
  })

  test('buildJsonLdScriptTag output parses with JSON.parse', () => {
    const tag = buildJsonLdScriptTag(buildRestaurantJsonLd(FULL))
    assert.ok(tag.startsWith('<script type="application/ld+json">'))
    assert.ok(tag.endsWith('</script>'))
    const inner = tag.slice('<script type="application/ld+json">'.length, -'</script>'.length)
    assert.deepEqual(JSON.parse(inner), buildRestaurantJsonLd(FULL))
  })

  test('hostile text cannot escape the JSON-LD script element', () => {
    const hostile = '</script><script>alert(1)</script>'
    const tag = buildJsonLdScriptTag(buildRestaurantJsonLd({ ...FULL, cuisineType: hostile }))
    assert.equal(tag.split('</script>').length - 1, 1)
    assert.ok(!tag.includes('<script>alert(1)</script>'))
    const inner = tag.slice('<script type="application/ld+json">'.length, -'</script>'.length)
    assert.equal(JSON.parse(inner).servesCuisine, hostile)
  })

  test('preserves Unicode through serialization', () => {
    const tag = buildJsonLdScriptTag(
      buildRestaurantJsonLd({ ...FULL, name: 'Café Chez l’Ami', city: 'Montréal' })
    )
    const inner = tag.slice('<script type="application/ld+json">'.length, -'</script>'.length)
    assert.equal(JSON.parse(inner).name, 'Café Chez l’Ami')
    assert.equal(JSON.parse(inner).address.addressLocality, 'Montréal')

    const arabicTag = buildJsonLdScriptTag(buildRestaurantJsonLd({ ...FULL, name: 'دكان القهوة' }))
    const arabicInner = arabicTag.slice('<script type="application/ld+json">'.length, -'</script>'.length)
    assert.equal(JSON.parse(arabicInner).name, 'دكان القهوة')
  })
})

describe('buildHeadExtra — JSON-LD integration', () => {
  test('emits JSON-LD alongside existing tags', () => {
    const headExtra = buildHeadExtra({
      title: 'Khmer Express — BistroVite',
      description: 'Cambodian — Laval',
      canonicalUrl: `${CANONICAL_BASE_URL}/khmer-express`,
      logoUrl: 'https://example.com/logo.png',
      restaurantName: 'Khmer Express',
      cuisineType: 'Cambodian',
      city: 'Laval',
    })
    assert.ok(headExtra.includes('<script type="application/ld+json">'))
    assert.ok(headExtra.includes('"@type":"Restaurant"'))
    assert.ok(headExtra.includes('<link rel="canonical"'))
  })

  test('omits JSON-LD when there is no restaurant name', () => {
    const headExtra = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: `${CANONICAL_BASE_URL}/a`,
      logoUrl: null,
    })
    assert.ok(!headExtra.includes('application/ld+json'))
  })

  test('a hostile restaurant name cannot break out of the JSON-LD script element', () => {
    const hostile = '</script><script>alert(1)</script>'
    const headExtra = buildHeadExtra({
      title: 'A',
      description: 'B',
      canonicalUrl: `${CANONICAL_BASE_URL}/a`,
      logoUrl: null,
      restaurantName: hostile,
    })
    assert.ok(!headExtra.includes('<script>alert(1)</script>'))
  })
})

describe('resolveRestaurant / resolveLanguage + JSON-LD — no extra Supabase query', () => {
  test('building JSON-LD from the resolved vendor record issues no additional .from() calls', async () => {
    const fromCalls = []
    const supabase = makeMockSupabase(
      {
        vendors: {
          data: {
            id: 'v1',
            slug: 'khmer-express',
            name: 'Khmer Express',
            cuisine_type: 'Cambodian',
            city: 'Laval',
            logo_url: 'https://example.com/logo.png',
            venue_id: null,
          },
          error: null,
        },
        vendor_languages: { data: [], error: null },
      },
      fromCalls
    )

    const resolved = await resolveRestaurant(supabase, { seg1: 'khmer-express', rest: '' })
    const lang = await resolveLanguage(supabase, resolved.vendor.id)
    const callsBeforeJsonLd = fromCalls.length
    const jsonLd = buildRestaurantJsonLd({
      name: pickLocalizedName(resolved.vendor, lang),
      url: `${CANONICAL_BASE_URL}${resolved.canonicalPath}`,
      logoUrl: resolved.vendor.logo_url,
      cuisineType: resolved.vendor.cuisine_type,
      city: resolved.vendor.city,
    })

    assert.ok(jsonLd)
    assert.equal(fromCalls.length, callsBeforeJsonLd)
    assert.deepEqual(fromCalls, ['vendors', 'vendor_languages'])
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

  test('slug segments are URL-encoded', () => {
    assert.equal(
      buildCanonicalPath({ looksLikeVenuePair: false, vendorSlug: 'a b/c' }),
      '/a%20b%2Fc'
    )
  })

  test('canonical URL uses the fixed base URL, not a Host header', () => {
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

  test('a bare restaurant slug is standalone', () => {
    const { reserved, looksLikeVenuePair } = classifyRequest('la-saveur-colombienne', '')
    assert.equal(reserved, false)
    assert.equal(looksLikeVenuePair, false)
  })

  test('restaurant slug + a SUB_ROUTE is still standalone', () => {
    for (const sub of SUB_ROUTES) {
      assert.equal(
        classifyRequest('la-saveur-colombienne', sub).looksLikeVenuePair,
        false,
        `expected "${sub}" to stay standalone`
      )
    }
  })

  test('venue slug + vendor slug is a venue pair', () => {
    assert.equal(classifyRequest('esc-giza', 'dokan-el-kahwa').looksLikeVenuePair, true)
  })

  test('venue pair + nested ordering route is still a venue pair', () => {
    assert.equal(classifyRequest('esc-giza', 'dokan-el-kahwa/cart').looksLikeVenuePair, true)
  })
})

// ---------------------------------------------------------------------------
// vercel.json rewrite rules — read the actual file.
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const vercelConfig = JSON.parse(readFileSync(join(__dirname, '..', 'vercel.json'), 'utf8'))
const REWRITE_RULES = vercelConfig.rewrites

function sourceToRegExp(source) {
  if (source === '/(.*)') return /^\/(.*)$/

  let m = source.match(/^\/([a-zA-Z0-9-]+)\/:[a-zA-Z0-9]+\*$/)
  if (m) return new RegExp(`^/${m[1]}(?:/.*)?$`)

  m = source.match(/^\/:[a-zA-Z0-9]+\(([^()]+)\)$/)
  if (m) return new RegExp(`^/(${m[1]})$`)

  m = source.match(/^\/:[a-zA-Z0-9]+\(([^()]+)\)\/:[a-zA-Z0-9]+\(([^()]+)\)$/)
  if (m) return new RegExp(`^/(${m[1]})/(${m[2]})$`)

  m = source.match(/^\/[a-zA-Z0-9.-]+$/)
  if (m) return new RegExp(`^${source.replace(/\./g, '\\.')}$`)

  throw new Error(`sourceToRegExp: unrecognized rewrite source shape: "${source}"`)
}

function matchRewrite(pathname, rules) {
  for (const rule of rules) {
    if (sourceToRegExp(rule.source).test(pathname)) return rule
  }
  return null
}

describe('vercel.json rewrite rules', () => {
  test('no rewrite source uses lookahead/lookbehind', () => {
    for (const rule of REWRITE_RULES) {
      assert.ok(!/\(\?[!=<]/.test(rule.source), `unexpected lookaround in "${rule.source}"`)
    }
  })

  test('a standalone restaurant slug routes to restaurant-meta', () => {
    assert.equal(
      matchRewrite('/la-saveur-colombienne', REWRITE_RULES).destination,
      '/api/restaurant-meta?seg1=:seg1'
    )
  })

  test('a restaurant + sub-route routes to restaurant-meta', () => {
    assert.equal(
      matchRewrite('/la-saveur-colombienne/cart', REWRITE_RULES).destination,
      '/api/restaurant-meta?seg1=:seg1&rest=:rest'
    )
  })

  test('a venue + vendor path routes to restaurant-meta', () => {
    assert.equal(
      matchRewrite('/esc-giza/dokan-el-kahwa', REWRITE_RULES).destination,
      '/api/restaurant-meta?seg1=:seg1&rest=:rest'
    )
  })

  test('a venue + vendor + nested route routes to restaurant-meta', () => {
    assert.equal(
      matchRewrite('/esc-giza/dokan-el-kahwa/cart', REWRITE_RULES).destination,
      '/api/restaurant-meta?seg1=:seg1&rest=:rest'
    )
  })

  test('reserved routes bypass the function', () => {
    for (const word of RESERVED) {
      assert.equal(matchRewrite(`/${word}`, REWRITE_RULES).destination, '/index.html', `/${word}`)
      assert.equal(
        matchRewrite(`/${word}/something/nested`, REWRITE_RULES).destination,
        '/index.html',
        `/${word}/something/nested`
      )
    }
  })

  test('static assets bypass the function', () => {
    assert.equal(
      matchRewrite('/assets/index-abc123.js', REWRITE_RULES).destination,
      '/assets/:rest*'
    )
  })

  test('/api/* bypasses the function', () => {
    assert.equal(
      matchRewrite('/api/restaurant-meta', REWRITE_RULES).destination,
      '/api/:rest*'
    )
  })

  test('root-level dotted static files fall through to the SPA catch-all', () => {
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

  test('/sitemap.xml routes to the sitemap function', () => {
    assert.equal(matchRewrite('/sitemap.xml', REWRITE_RULES).destination, '/api/sitemap')
  })

  test('the homepage falls through to the SPA catch-all', () => {
    assert.equal(matchRewrite('/', REWRITE_RULES).destination, '/index.html')
  })

  test('passthrough rules precede slug rules, which precede the catch-all', () => {
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

  test('live path-to-regexp behavior on Vercel still requires deployment verification', () => {
    assert.ok(true)
  })
})

describe('resolveRestaurant — unknown / inactive / venue-vendor mismatch', () => {
  test('unknown standalone slug returns null', async () => {
    const result = await resolveRestaurant(
      makeMockSupabase({ vendors: { data: null, error: null } }),
      { seg1: 'no-such-restaurant', rest: '' }
    )
    assert.equal(result, null)
  })

  test('inactive vendor returns null', async () => {
    const result = await resolveRestaurant(
      makeMockSupabase({ vendors: { data: null, error: null } }),
      { seg1: 'some-inactive-vendor', rest: '' }
    )
    assert.equal(result, null)
  })

  test('unknown venue returns null without querying vendors', async () => {
    const supabase = makeMockSupabase({
      venues: { data: null, error: null },
      vendors: { data: null, error: new Error('should not be called') },
    })
    assert.equal(
      await resolveRestaurant(supabase, { seg1: 'no-such-venue', rest: 'dokan-el-kahwa' }),
      null
    )
  })

  test('venue/vendor mismatch returns null', async () => {
    const supabase = makeMockSupabase({
      venues: { data: { id: 'venue-1', slug: 'esc-giza' }, error: null },
      vendors: { data: null, error: null },
    })
    assert.equal(
      await resolveRestaurant(supabase, { seg1: 'esc-giza', rest: 'wrong-vendor' }),
      null
    )
  })
})

describe('resolveRestaurant — success paths', () => {
  test('standalone vendor resolves with a standalone canonical path', async () => {
    const supabase = makeMockSupabase({
      vendors: {
        data: { id: 'v1', slug: 'la-saveur-colombienne', name: 'La Saveur Colombienne', venue_id: null },
        error: null,
      },
    })
    const result = await resolveRestaurant(supabase, { seg1: 'la-saveur-colombienne', rest: '' })
    assert.equal(result.canonicalPath, '/la-saveur-colombienne')
  })

  test('standalone vendor with venue_id canonicalizes to venue-prefixed URL', async () => {
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

  test('venue-pair request resolves with venue-prefixed canonical path', async () => {
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

describe('resolveRestaurant — infrastructure failures', () => {
  test('a Supabase venues-query error throws', async () => {
    const supabase = makeMockSupabase({
      venues: { data: null, error: new Error('connection timeout') },
    })
    await assert.rejects(
      () => resolveRestaurant(supabase, { seg1: 'esc-giza', rest: 'dokan-el-kahwa' }),
      /connection timeout/
    )
  })

  test('a Supabase vendors-query error throws', async () => {
    const supabase = makeMockSupabase({
      vendors: { data: null, error: new Error('network error') },
    })
    await assert.rejects(
      () => resolveRestaurant(supabase, { seg1: 'la-saveur-colombienne', rest: '' }),
      /network error/
    )
  })
})

describe('resolveLanguage — lenient fallback to en', () => {
  test('returns the is_default row language_code', async () => {
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

  test('falls back to first row when none is default', async () => {
    const supabase = makeMockSupabase({
      vendor_languages: { data: [{ language_code: 'fr', is_default: false }], error: null },
    })
    assert.equal(await resolveLanguage(supabase, 'v1'), 'fr')
  })

  test('falls back to en when there are no rows', async () => {
    const supabase = makeMockSupabase({ vendor_languages: { data: [], error: null } })
    assert.equal(await resolveLanguage(supabase, 'v1'), 'en')
  })

  test('falls back to en on a Supabase error', async () => {
    const supabase = makeMockSupabase({
      vendor_languages: { data: null, error: new Error('boom') },
    })
    assert.equal(await resolveLanguage(supabase, 'v1'), 'en')
  })
})

describe('substituteTemplate — end-to-end escaping', () => {
  test('escapes vendor names and injects expected tags', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: `Café "Chez l'Ami" & <Fancy> — BistroVite`,
      description: 'Cambodian — Laval',
      lang: 'ar',
      canonicalUrl: `${CANONICAL_BASE_URL}/khmer-express`,
      logoUrl: 'https://example.com/logo.png',
      restaurantName: `Café "Chez l'Ami" & <Fancy>`,
      fbAppId: '1234567890123456',
    })
    assert.ok(!html.includes(`"Chez l'Ami"`))
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

  test('a dangerous title vetoes substitution and leaves the template untouched', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: 'Evil <script>alert(1)</script> Name',
      description: null,
      lang: 'en',
      canonicalUrl: `${CANONICAL_BASE_URL}/evil`,
      logoUrl: null,
    })
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

  test('pickLocalizedName falls back to base name when translation is absent', () => {
    assert.equal(pickLocalizedName({ name: 'Default Name', name_fr: null, name_ar: null }, 'fr'), 'Default Name')
    assert.equal(pickLocalizedName({ name: 'Default Name', name_fr: 'Nom Français' }, 'fr'), 'Nom Français')
  })

  test('generated JSON-LD can be extracted and parsed', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: 'Khmer Express — BistroVite',
      description: 'Cambodian — Laval',
      lang: 'fr',
      canonicalUrl: `${CANONICAL_BASE_URL}/khmer-express`,
      logoUrl: 'https://example.com/logo.png',
      restaurantName: 'Khmer Express',
      cuisineType: 'Cambodian',
      city: 'Laval',
    })
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    assert.ok(match)
    const jsonLd = JSON.parse(match[1])
    assert.equal(jsonLd['@context'], 'https://schema.org')
    assert.equal(jsonLd['@type'], 'Restaurant')
    assert.equal(jsonLd.name, 'Khmer Express')
    assert.equal(jsonLd.url, `${CANONICAL_BASE_URL}/khmer-express`)
    assert.equal(jsonLd.image, 'https://example.com/logo.png')
    assert.equal(jsonLd.servesCuisine, 'Cambodian')
    assert.equal(jsonLd.address.addressLocality, 'Laval')
  })

  test('missing restaurant name omits JSON-LD but preserves the response', () => {
    const html = substituteTemplate(SAMPLE_TEMPLATE, {
      title: 'Some Restaurant',
      description: null,
      lang: 'en',
      canonicalUrl: `${CANONICAL_BASE_URL}/some-restaurant`,
      logoUrl: null,
      restaurantName: '',
    })
    assert.ok(!html.includes('application/ld+json'))
    assert.ok(html.includes('<title>Some Restaurant</title>'))
  })
})

// ---------------------------------------------------------------------------
// resolveTemplate — current implementation reads the local built SPA shell.
// It deliberately does not fetch VERCEL_URL, avoiding Preview Protection HTML.
// ---------------------------------------------------------------------------
describe('resolveTemplate — reads the local dist/index.html', () => {
  test('reads dist/index.html and returns the injected contents', () => {
    const calls = []
    const readFileImpl = (path, encoding) => {
      calls.push({ path, encoding })
      return MOCK_APP_SHELL
    }

    const html = resolveTemplate({ readFileImpl })

    assert.equal(html, MOCK_APP_SHELL)
    assert.equal(calls.length, 1)
    assert.ok(calls[0].path.endsWith(join('dist', 'index.html')))
    assert.equal(calls[0].encoding, 'utf8')
  })

  test('reads the local shell even when vercelUrl is supplied', () => {
    const readFileImpl = (path, encoding) => {
      assert.ok(path.endsWith(join('dist', 'index.html')))
      assert.equal(encoding, 'utf8')
      return MOCK_APP_SHELL
    }

    const html = resolveTemplate({
      vercelUrl: 'some-preview-deployment-xyz.vercel.app',
      readFileImpl,
    })

    assert.equal(html, MOCK_APP_SHELL)
  })

  test('never calls fetch', () => {
    let fetchCalled = false
    const fetchImpl = async () => {
      fetchCalled = true
      throw new Error('fetch should not be called')
    }

    const html = resolveTemplate({
      vercelUrl: 'my-app-abc123.vercel.app',
      fetchImpl,
      readFileImpl: () => MOCK_APP_SHELL,
    })

    assert.equal(html, MOCK_APP_SHELL)
    assert.equal(fetchCalled, false)
  })

  test('propagates local filesystem read errors', () => {
    assert.throws(
      () =>
        resolveTemplate({
          readFileImpl: () => {
            throw new Error('index.html not found')
          },
        }),
      /index\.html not found/
    )
  })
})
