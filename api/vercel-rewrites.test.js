// Regression test: every vercel.json rewrite that points at a SPECIFIC API
// function (as opposed to a dynamic passthrough like "/api/:rest*") must
// resolve to a file that actually exists in api/. This is exactly the class
// of bug that broke /sitemap.xml in production — vercel.json rewrote it to
// /api/sitemap while api/sitemap.js had gone missing from the working tree,
// and nothing caught the mismatch until Search Console did.
//
// Run with: node --test api/vercel-rewrites.test.js

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function readVercelConfig() {
  return JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'))
}

// A rewrite destination is a reference to one specific API function only
// when its path portion (before any "?query") contains no Vercel
// path-segment placeholder (":seg", "*", etc.) — "/api/:rest*" is a generic
// passthrough, not a reference to a file named ":rest*.js".
function staticApiFunctionRewrites(config) {
  return (config.rewrites || [])
    .filter((r) => typeof r.destination === 'string' && r.destination.startsWith('/api/'))
    .map((r) => r.destination.split('?')[0])
    .filter((path) => !path.includes(':') && !path.includes('*'))
}

describe('vercel.json /api/... rewrites each resolve to an existing function file', () => {
  test('finds at least one static /api/... rewrite to check (guards against this test going vacuous)', () => {
    const config = readVercelConfig()
    const staticRewrites = staticApiFunctionRewrites(config)
    assert.ok(staticRewrites.length > 0)
  })

  test('every static /api/<name> rewrite destination has a matching api/<name>.js file', () => {
    const config = readVercelConfig()
    const staticRewrites = staticApiFunctionRewrites(config)

    for (const path of staticRewrites) {
      const relative = path.replace(/^\//, '') + '.js'
      const filePath = join(ROOT, relative)
      assert.ok(
        existsSync(filePath),
        `vercel.json rewrites to "${path}" but ${relative} does not exist`
      )
    }
  })

  test('the /sitemap.xml rewrite specifically targets api/sitemap.js', () => {
    const config = readVercelConfig()
    const sitemapRewrite = (config.rewrites || []).find((r) => r.source === '/sitemap.xml')
    assert.ok(sitemapRewrite, 'no rewrite found for /sitemap.xml in vercel.json')
    assert.equal(sitemapRewrite.destination, '/api/sitemap')
    assert.ok(existsSync(join(ROOT, 'api/sitemap.js')))
  })
})
