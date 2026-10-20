// Local, dependency-free tests for api/sitemap.js, using Node's built-in
// test runner and assert module only (no package installed), following the
// same convention as api/restaurant-meta.test.js.
// Run with: node --test api/sitemap.test.js
//
// These exercise pure helpers and fetchCanonicalPaths/getSitemapXml against
// an in-memory mock Supabase client (fixtures below) — nothing here touches
// a network, a real Supabase project, or production data.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  escapeXml,
  buildSitemapXml,
  buildEmptySitemapXml,
  fetchCanonicalPaths,
  getSitemapXml,
  resetSitemapCache,
} from './sitemap.js'
import { CANONICAL_BASE_URL } from './restaurant-meta.js'

// ---------------------------------------------------------------------------
// Mock Supabase client — maps table name -> a fixed { data, error } result.
// Mimics just enough of the real supabase-js query-builder shape
// (select/eq/in/order chain, then a bare await) for fetchCanonicalPaths to
// run against it unmodified. Mirrors restaurant-meta.test.js's mock.
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
        in() {
          return chain
        },
        order() {
          return chain
        },
        then(resolve, reject) {
          Promise.resolve(fixture).then(resolve, reject)
        },
      }
      return chain
    },
  }
}

describe('escapeXml', () => {
  test('escapes the five XML-significant characters', () => {
    assert.equal(escapeXml(`& < > " '`), '&amp; &lt; &gt; &quot; &apos;')
  })

  test('tolerates null/undefined', () => {
    assert.equal(escapeXml(null), '')
    assert.equal(escapeXml(undefined), '')
  })
})

describe('buildSitemapXml / buildEmptySitemapXml', () => {
  test('produces a well-formed urlset with one <url><loc> per path, using the fixed canonical base URL', () => {
    const xml = buildSitemapXml(['/la-saveur-colombienne', '/esc-giza/dokan-el-kahwa'])
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'))
    assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'))
    assert.ok(xml.includes(`<loc>${CANONICAL_BASE_URL}/la-saveur-colombienne</loc>`))
    assert.ok(xml.includes(`<loc>${CANONICAL_BASE_URL}/esc-giza/dokan-el-kahwa</loc>`))
    assert.equal((xml.match(/<url>/g) || []).length, 2)
    assert.ok(xml.trim().endsWith('</urlset>'))
  })

  test('escapes an HTML/XML-significant character in a path rather than emitting broken XML', () => {
    const xml = buildSitemapXml(['/weird&slug<x>'])
    assert.ok(xml.includes(`${CANONICAL_BASE_URL}/weird&amp;slug&lt;x&gt;`))
    assert.ok(!xml.includes('&slug<x>'))
  })

  test('an empty list of paths still produces a valid, parseable urlset with no <url> entries', () => {
    const xml = buildEmptySitemapXml()
    assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'))
    assert.ok(!xml.includes('<url>'))
    assert.ok(xml.trim().endsWith('</urlset>'))
  })
})

describe('fetchCanonicalPaths — publication and canonical-path rules', () => {
  test('active vendors with no venue_id get a standalone canonical path', async () => {
    const supabase = makeMockSupabase({
      vendors: {
        data: [
          { slug: 'la-saveur-colombienne', venue_id: null },
          { slug: 'khmer-express', venue_id: null },
        ],
        error: null,
      },
    })
    const paths = await fetchCanonicalPaths(supabase)
    assert.deepEqual(paths.slice().sort(), ['/khmer-express', '/la-saveur-colombienne'])
  })

  test('a vendor with an ACTIVE venue gets a venue-prefixed canonical path', async () => {
    const supabase = makeMockSupabase({
      vendors: { data: [{ slug: 'dokan-el-kahwa', venue_id: 'venue-1' }], error: null },
      venues: { data: [{ id: 'venue-1', slug: 'esc-giza' }], error: null },
    })
    const paths = await fetchCanonicalPaths(supabase)
    assert.deepEqual(paths, ['/esc-giza/dokan-el-kahwa'])
  })

  test('a vendor whose venue is INACTIVE falls back to its own standalone path — it is NOT excluded', async () => {
    const supabase = makeMockSupabase({
      vendors: { data: [{ slug: 'dokan-el-kahwa', venue_id: 'venue-1' }], error: null },
      // The real query filters .eq('active', true) on venues too, so an
      // inactive venue simply yields no row here — same fallback
      // resolveRestaurant already uses in restaurant-meta.js.
      venues: { data: [], error: null },
    })
    const paths = await fetchCanonicalPaths(supabase)
    assert.deepEqual(paths, ['/dokan-el-kahwa'])
  })

  test('no active vendors at all returns an empty array and never queries venues', async () => {
    const supabase = makeMockSupabase({
      vendors: { data: [], error: null },
      venues: { data: null, error: new Error('should not be called') },
    })
    const paths = await fetchCanonicalPaths(supabase)
    assert.deepEqual(paths, [])
  })

  test('a vendor row with a missing or empty slug is excluded defensively', async () => {
    const supabase = makeMockSupabase({
      vendors: {
        data: [
          { slug: '', venue_id: null },
          { slug: null, venue_id: null },
          { slug: 'real-one', venue_id: null },
        ],
        error: null,
      },
    })
    const paths = await fetchCanonicalPaths(supabase)
    assert.deepEqual(paths, ['/real-one'])
  })

  test('duplicate canonical paths are de-duplicated (defensive: vendors.slug has no UNIQUE constraint in the schema)', async () => {
    const supabase = makeMockSupabase({
      vendors: {
        data: [
          { slug: 'same-slug', venue_id: null },
          { slug: 'same-slug', venue_id: null },
        ],
        error: null,
      },
    })
    const paths = await fetchCanonicalPaths(supabase)
    assert.deepEqual(paths, ['/same-slug'])
  })

  test('a Supabase error on the vendors query throws, is not swallowed as "no vendors"', async () => {
    const supabase = makeMockSupabase({ vendors: { data: null, error: new Error('connection timeout') } })
    await assert.rejects(() => fetchCanonicalPaths(supabase), /connection timeout/)
  })

  test('a Supabase error on the venues query throws, is not swallowed', async () => {
    const supabase = makeMockSupabase({
      vendors: { data: [{ slug: 'dokan-el-kahwa', venue_id: 'venue-1' }], error: null },
      venues: { data: null, error: new Error('network error') },
    })
    await assert.rejects(() => fetchCanonicalPaths(supabase), /network error/)
  })
})

describe('getSitemapXml — short-lived cache so a crawler burst does not hit Supabase repeatedly', () => {
  test('a second call within the TTL reuses the cache and does not re-query Supabase', async () => {
    resetSitemapCache()
    let calls = 0
    const supabase = {
      from(table) {
        calls++
        return makeMockSupabase({ vendors: { data: [{ slug: 'a', venue_id: null }], error: null } }).from(table)
      },
    }
    let now = 1_000
    const xml1 = await getSitemapXml(supabase, { now: () => now })
    now += 1_000 // well within the 1-hour TTL
    const xml2 = await getSitemapXml(supabase, { now: () => now })
    assert.equal(xml1, xml2)
    assert.equal(calls, 1)
  })

  test('a call after the TTL expires re-queries Supabase', async () => {
    resetSitemapCache()
    let calls = 0
    const supabase = {
      from(table) {
        calls++
        return makeMockSupabase({ vendors: { data: [{ slug: 'a', venue_id: null }], error: null } }).from(table)
      },
    }
    let now = 1_000
    await getSitemapXml(supabase, { now: () => now })
    now += 60 * 60 * 1000 + 1 // just past the 1-hour TTL
    await getSitemapXml(supabase, { now: () => now })
    assert.equal(calls, 2)
  })

  test('a Supabase error is never cached — the next call tries again instead of repeating the failure', async () => {
    resetSitemapCache()
    let shouldFail = true
    const supabase = {
      from(table) {
        if (shouldFail) {
          return makeMockSupabase({ vendors: { data: null, error: new Error('boom') } }).from(table)
        }
        return makeMockSupabase({ vendors: { data: [{ slug: 'a', venue_id: null }], error: null } }).from(table)
      },
    }
    const now = () => 1_000
    await assert.rejects(() => getSitemapXml(supabase, { now }))
    shouldFail = false
    const xml = await getSitemapXml(supabase, { now })
    assert.ok(xml.includes('/a'))
  })
})
