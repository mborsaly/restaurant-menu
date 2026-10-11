# BistroVite — Architecture Guide

Internal reference for the `restaurant-menu` repo. Written from direct inspection of the code in this repository as of this writing. Where a claim depends on a system outside this repo (the n8n workflows, Stripe Connect account setup), it is marked **(external / unverified)** — this repo contains no server code and no tests. The Postgres schema and RLS policies also live outside this repo, in a sibling repository — see §5 for where to find them and how to use them.

## 1. Purpose, Stack, Entry Points, Commands

BistroVite is the customer-facing ordering web app for multiple independent restaurants/grocers ("vendors"), including vendors grouped inside a physical "venue" (e.g. a compound with several food vendors). It is a single-page app with no backend server in this repo; data reads go straight to Supabase from the browser, and order writes go to an external n8n webhook.

- **Stack**: React 19, Vite 8, React Router 7 (`BrowserRouter`), `@supabase/supabase-js`, `@stripe/stripe-js` + `@stripe/react-stripe-js`, Framer Motion, lucide-react, ESLint (flat config). Tailwind/PostCSS are present in `devDependencies` and configured (`tailwind.config.js`, `postcss.config.js`) but the app's components use **inline style objects**, not Tailwind classes — verify before assuming Tailwind utility classes are in active use anywhere you touch.
- **Entry point**: `index.html` → `src/main.jsx` (mounts `<App />` in `StrictMode`) → `src/App.jsx` (wraps `<CartProvider>` around `<BrowserRouter>`/`<Routes>`).
- **Commands** (from `package.json`): `npm run dev`, `npm run build` (`vite build`), `npm run lint` (`eslint .`), `npm run preview`.
- **Hosting**: `vercel.json` has a single SPA catch-all rewrite (`/(.*) → /index.html`), consistent with static Vite hosting.

## 2. Source Layout

```
src/
  main.jsx            — React root
  App.jsx             — Routes (see §3)
  context/CartContext.jsx  — cart state + useCart() hook (THE active cart implementation)
  hooks/
    useSession.js      — resolves vendor/venue/session/customer/language from the URL (central hook)
    usePlatform.js      — UA sniffing: WhatsApp / iOS / Android / desktop, WhatsApp deep-link return
    useMenu.js          — DEAD CODE, not imported anywhere (see §8)
    useCart.js          — DEAD CODE, not imported anywhere (see §8)
  lib/
    supabase.js         — Supabase client singleton
    i18n.js             — DB-driven translation helpers (languages/vendor_languages tables, pickTranslation, isRTLCode)
    translations.js     — static hardcoded UI-string dictionary (en/fr/ar/es) + a SEPARATE static isRTL(lang) = lang==='ar' helper (see §6)
    currency.js         — per-vendor currency code + display formatting (formatPrice)
    tax.js              — per-vendor tax calculation (calculateTax)
    cartOptions.js       — turns a cart line's selected options into display rows (getOptionLines)
    stripe.js            — getStripe(stripeAccount): Stripe.js loader, Connect-account-aware, cached per account
  screens/             — route-level components, see §3
  components/          — presentational + feature components, see §4
```

`RestaurantsSetup/<vendor-slug>/*.sql` holds **data-seeding scripts** (hand-written `INSERT`s) used to onboard individual restaurants — not schema migrations; no `CREATE TABLE`/RLS statements appear in them. The actual schema lives elsewhere — see §5.

## 3. Routing, Session Resolution, Identification, Language

### Routes (`src/App.jsx`)
Three route families all resolve to the same screens, disambiguated by URL shape (order matters — more specific/static patterns are registered first for readability, though React Router's own ranking handles correctness regardless):

| Pattern | Screen | Use case |
|---|---|---|
| `/welcome`, `/menu`, `/item/:id`, `/cart`, `/checkout`, `/confirmation` | WelcomeScreen / MenuScreen / ItemScreen / CartScreen / CheckoutScreen / ConfirmationScreen | WhatsApp token flow (`?t=...`) or the hardcoded demo fallback |
| `/:venueSlug/:vendorSlug[/item/:id|/cart|/checkout|/confirmation]` | MenuScreen / ItemScreen / CartScreen / CheckoutScreen / ConfirmationScreen | Vendor inside a venue |
| `/:vendorSlug[/item/:id|/cart|/checkout|/confirmation]` | same screens | Standalone vendor, clean URL |
| `/:slug` | `VendorOrVenueRouter` | Single segment — ambiguous; resolved at runtime (see below) |

`VendorOrVenueRouter` (`src/screens/VendorOrVenueRouter.jsx`) queries `venues` by slug first, then `vendors` by slug, and renders `VenuePortalScreen` or `MenuScreen` accordingly (404 UI if neither matches).

### Session resolution (`src/hooks/useSession.js`)
Runs independently on every screen that calls it (no shared/global context — each mount re-resolves). Order of resolution, from the URL's path segments and `?t=` query token:

1. **Venue pair** `/:venueSlug/:vendorSlug` — looks up `venues` by slug (`active=true`), then `vendors` by slug + `venue_id` (`active=true`).
2. **Standalone vendor** `/:vendorSlug[/sub-route]` — looks up `vendors` by slug. If the vendor has a `venue_id`, also fetches the venue's slug (so `paths.*` can still build venue-aware URLs). If `?table=` (or a previously saved `sessionStorage['bv_dine_in_table_slug']`) is present and `vendor.supports_dine_in`, looks up `restaurant_tables` by `qr_code_slug` + `vendor_id` to enable dine-in mode, generating/persisting a `bv_dine_in_session_id` in `sessionStorage`.
3. **No token, no slug match** — hardcoded demo fallback: loads the vendor with slug `dokan-el-kahwa`.
4. **WhatsApp token mode** (`?t=`) — looks up `sessions` (joined with `vendors`) by `token`. Computes `expires_at` but **the actual expiry throw is commented out** (`useSession.js`, inside the token branch) — expired sessions currently still resolve. If `session.customer_phone` is set, also loads the matching `customers` row.

Exposes: `restaurant`/`vendor`, `venue`, `session`, `customer`, `lang`, `isRTL` (DB-driven, see §6), `isVenueMode`, `isStandalone`, `isDineIn`, `dineInTable`, `dineInSessionId`, `vendorType`/`isGrocery`, and a `paths` object (`paths.menu()`, `paths.item(id)`, `paths.cart()`, `paths.checkout()`, `paths.confirmation()`) that builds the correct URL shape (clean slug path vs. `?token`-suffixed legacy path) depending on mode.

### Language selection
`resolveLangForVendor(vendorId, requestedLang)` loads that vendor's enabled languages (`vendor_languages` joined with `languages`) and picks: the requested language if the vendor offers it → else the vendor's configured default → else the first offered language. Selected language is persisted to `sessionStorage['lang']` and reloaded on next visit within the session; it resets per vendor if the saved choice isn't offered.

## 4. Customer Journey

**Primary (active) flow**, all within `MenuScreen` using modal "sheets" rather than page navigation:

1. **Menu load** (`MenuScreen.jsx`, on `restaurant.id` resolving) — queries `categories` (+`category_translations`) and, depending on `isGrocery`, either `grocery_products` (+`grocery_product_options`, `grocery_product_translations`) or `menu_items` (+`item_options`, `menu_item_translations`), each filtered by `vendor_id` and `active`/`available`, ordered by `sort_order`. Categories with zero items are filtered out. Client-side search filters across all translation names, legacy `name_en/fr/ar`, and `brand_name`.
2. **Item customization** (`ItemSheet.jsx`, opened via quick-view from a menu card) — separately fetches the single item row, its option groups (`item_option_groups`/`grocery_product_option_groups`), group translations, and options (`item_options`/`grocery_product_options`) + their translations, scoped by `group_id`/the item's FK. Builds single-select and multi-select (with per-option quantity) groups; computes a running price.
3. **Add to cart** (`src/context/CartContext.jsx`, the real `useCart()`) — builds a signature from `itemId` + sorted `optionId:qty` pairs so identical configurations merge quantities into one line instead of duplicating; otherwise appends a new line with `unitPrice = base_price + Σ(option price_modifier × selectedQty)`. **Cart state is in-memory only** (React state) — not persisted to `localStorage`/`sessionStorage`, so a hard refresh clears it.
4. **Checkout** (`CheckoutSheet.jsx`, opened from `CartSheet.jsx`'s "Checkout" button) — collects name + phone (per-country-code regex validation, Arabic/Persian digit normalization), and depending on mode: delivery address, pickup toggle, a venue "spot" picker (`venue_spots` table, scoped by `venue_id`), or (if dine-in) the QR-resolved table — no extra input needed. Computes tax via `calculateTax()` (§5). If `restaurant.supports_online_payment` and the customer selects "Pay Now," creates a Stripe PaymentIntent via n8n (§7) and renders `StripePaymentSection` (Stripe Elements `PaymentElement`). On submit, POSTs the order to the n8n order webhook (§7), clears the cart, and shows an inline success state (the sheet never navigates away). Customer name/phone/(address) are cached in `localStorage['bv_customer_info']` to prefill next time.
5. **Order history** (`OrderHistorySheet.jsx`, opened from the header clock icon) — queries `orders` filtered by `vendor_id` plus either `dine_in_session_id` (dine-in) or a `customer_phone` reconstructed from `localStorage['bv_customer_info']` (non-dine-in). **No server-side identity check is visible from this repo** — see §9.

**Legacy (apparently unreachable) flow** — full-page routes `/cart` → `CartScreen.jsx` and `/checkout` → `CheckoutScreen.jsx`, plus `/confirmation` → `ConfirmationScreen.jsx`. Verified: nothing in the active UI (`MenuScreen`, `Cart`, `CartSheet`) calls `paths.cart()` or `paths.checkout()` or otherwise navigates to these routes — `CartScreen` and `CheckoutScreen` only link to each other. They remain reachable only by typing the URL directly, lack Stripe/dine-in/multi-tax support, and still POST to the same n8n order webhook. See §8.

## 5. Supabase

- **Client**: `src/lib/supabase.js` — `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`. (A commented-out hardcoded URL/anon key also sits in this file, unused — dead code, not a live secret since Supabase anon keys are meant to be public/RLS-protected, but worth removing on a future cleanup pass.) **No env values are reproduced here or anywhere in this doc.**
- **Tables read from the frontend** (verified via grep across `src/`, all through the anon key, no auth header observed anywhere): `languages`, `vendor_languages`, `venues`, `vendors`, `restaurant_tables`, `sessions`, `customers`, `categories`, `category_translations`, `menu_items`, `menu_item_translations`, `item_options`, `item_option_groups`, `item_option_group_translations`, `grocery_products`, `grocery_product_translations`, `grocery_product_options`, `grocery_product_option_groups`, `grocery_option_group_translations`, `venue_spots`, `orders`.
- **No table is ever written to from this repo.** Order creation is entirely delegated to the n8n webhook (§7) — there is no `supabase.from('orders').insert(...)` anywhere in `src/`.

### Schema and RLS source of truth: `../bistrovite-database/`

This repo has no schema, no migrations, and no RLS policy definitions of its own — `RestaurantsSetup/*.sql` (§2) is data-seeding only. The actual Postgres schema is maintained in the **sibling repository `../bistrovite-database/`** (sibling to `restaurant-menu`, not a subdirectory of it), in two files:

- **`supabase_schema.sql`** — the checked-in schema snapshot: table/column definitions, constraints, indexes, triggers, functions, grants, and Row Level Security policies. Treat it as the source of truth for *what was checked in*, not as proof of the currently deployed Supabase project's configuration — the live project can diverge from this file, so a finding based on it should be stated as "per the checked-in schema snapshot," not "per the live database."
- **`database.types.ts`** — generated TypeScript types for that schema. Same caveat applies: it reflects the schema at generation time and may not include schema changes made since.

**Before making any database-related change, or stating anything as fact about database security/RLS/schema, read both files directly** — don't infer protection from this repo's query shape (e.g. a query filtering `.eq('customer_phone', ...)` says nothing about whether RLS actually restricts rows to that phone number; that has to be checked in the schema file itself). If `../bistrovite-database/` isn't accessible in a session, say so explicitly rather than guessing. Any actual database change — schema, RLS policy, or otherwise — requires a reviewed SQL migration and explicit authorization before running against production, per `CLAUDE.md`.

## 6. Internationalization, Fallbacks, RTL, Persistence

Two parallel i18n systems coexist — be careful not to conflate them when editing:

1. **Static UI-chrome strings** — `src/lib/translations.js`, a single large object keyed by string id → `{ en, fr, ar, es }`, accessed via `t(key, lang)`. Also exports a **static** `isRTL(lang) = (lang === 'ar')` and `getDir(lang)`. Used by the legacy screens: `ItemScreen`, `CartScreen`, `CheckoutScreen`, `ConfirmationScreen`, `VenuePortalScreen`.
2. **DB-driven content translations** — `src/lib/i18n.js`, backed by the `languages` / `vendor_languages` tables and per-entity `*_translations` join tables (`category_translations`, `menu_item_translations`, `item_option_group_translations`, grocery equivalents, etc.). `pickTranslation(translations, field, lang, fallbackLang)` fallback order: exact language match → vendor's fallback/default language → first available translation with that field → `null` (callers then fall back further to legacy single-language columns like `name_en`). `isRTLCode(code, languagesList)` looks up a language's `is_rtl` flag from the vendor's enabled-languages list.

**Important divergence**: the *active* flow (`useSession` → `MenuScreen`/`Header`/`CartSheet`/`CheckoutSheet`) uses `useSession().isRTL`, which is derived from the **current vendor's configured language list** (`is_rtl` flag per language, genuinely per-vendor/per-language, not hardcoded to Arabic). The *legacy* screens instead use `translations.js`'s static `isRTL(lang) = lang === 'ar'`. If a vendor configures a non-Arabic RTL language (or a restricted language set), the two code paths can disagree on RTL-ness — confirm which `isRTL` a component is using before editing RTL layout logic.

RTL layout is implemented with inline style branching (no CSS logical properties, no RTL framework) — flipping `direction`, `textAlign`, flex `row`/`row-reverse`, icon offsets, and swapping font-family to `'Noto Naskh Arabic'` for Arabic, repeated per-component (`MenuScreen`, `Header`, `CheckoutSheet`, `CartSheet`, etc.).

**Persistence**: selected language → `sessionStorage['lang']` (cleared when the browser tab/session ends; reset per-vendor via `resolveLangForVendor` if the vendor doesn't offer the saved language). Dine-in table slug/session id → `sessionStorage['bv_dine_in_table_slug']` / `['bv_dine_in_session_id']`. Customer contact info → `localStorage['bv_customer_info']` (persists indefinitely across sessions on that device).

## 7. Stripe and n8n

### Stripe (`src/lib/stripe.js`, `src/components/StripePaymentSection.jsx`)
`getStripe(stripeAccount)` loads `@stripe/stripe-js` scoped to a **Connect account** when `stripeAccount` (= `restaurant.payment_provider_account_id`) is present — i.e. this is set up for **direct-charge Connect payments**, with funds intended to land in the vendor's own Stripe account, not a platform account **(Connect account configuration and charge type are external/unverified beyond what this client code implies)**. `StripePaymentSection` mounts Stripe `Elements` with a `clientSecret` (obtained from n8n, see below) and renders a `PaymentElement` (`layout: 'tabs'`, auto-detects Apple Pay/Google Pay). On submit, `CheckoutSheet` calls `elements.submit()` then `stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: window.location.href }, redirect: 'if_required' })` and requires `paymentIntent.status === 'succeeded'` before treating the order as paid.

### n8n webhooks (both called via `fetch()`, verified only from the request the client sends and the response fields it reads — the workflow logic itself is **external/unverified**)

**1. Create PaymentIntent** — `VITE_N8N_CREATE_PAYMENT_INTENT_URL`, called from `CheckoutSheet` only when payment method is `card` and the vendor supports online payment.
- Request (POST, JSON): `{ vendor_id, amount, currency }` (`amount` = computed order total; `currency` = `restaurant.currency_code || 'CAD'`).
- Expected response: `{ client_secret }` on success, or `{ error }` — client throws using `result.error || 'Could not start payment'` if `!response.ok || !result.client_secret`.

**2. Submit order** — `VITE_N8N_WEBHOOK_URL`, called from both the active `CheckoutSheet` and the legacy `CheckoutScreen`.
- Request (POST, JSON) — shape as sent by `CheckoutSheet` (the active path; the legacy `CheckoutScreen` sends a subset of the same fields):
  ```
  {
    token, vendor_id, customer_phone, customer_name, order_type,
    is_venue_order, venue_spot_id, table_id, dine_in_session_id,
    delivery_address, spot_note, notes,
    items: [{ itemId, name, name_fr, name_ar, translations, options, quantity, unitPrice, total }],
    subtotal, delivery_fee, tax_amount, tax_breakdown, total,
    language, payment_method, payment_status, payment_intent_id
  }
  ```
- Expected response: `{ success, orderNumber, estimatedTime? }` — client throws using `result.error || 'Order failed'` if `!response.ok || !result.success`.
- **This is the only place orders are persisted** — whether/how the n8n workflow writes to the `orders` table, validates prices server-side, or triggers WhatsApp messaging is outside this repo and must be checked in the n8n project directly before assuming any particular server-side behavior (e.g. price re-validation — see §9).

### WhatsApp
No WhatsApp Business API calls originate from this repo. Integration is inferred only from: UA sniffing (`usePlatform.js`'s `isWhatsApp`), deep-link redirects back to WhatsApp (`wa.me/<number>`, `whatsapp://`, Android `intent://` scheme) in `WelcomeScreen`/`ConfirmationScreen`/`usePlatform.js`, and a `restaurant.twilio_number` field. The actual messaging almost certainly happens inside the n8n workflow or a Twilio integration **(external/unverified)**.

## 8. Active vs. Legacy/Unused Code

| Component/Hook | Status | Evidence |
|---|---|---|
| `context/CartContext.jsx` (`useCart`) | **Active** — the only cart implementation actually used | Imported by `MenuScreen`, `ItemScreen`, `CartSheet`, `CheckoutSheet`, `CartScreen`, `CheckoutScreen` |
| `hooks/useCart.js` | **Dead code** | Not imported anywhere in `src/` (grep-verified); near-duplicate of the context implementation but without the quantity-merging signature logic |
| `hooks/useMenu.js` | **Dead code** | Not imported anywhere in `src/` (grep-verified); `MenuScreen` fetches menu data itself instead |
| `CartSheet.jsx` / `CheckoutSheet.jsx` (modals via `Modal.jsx`) | **Active** — the real checkout path, reached from `MenuScreen`'s floating `Cart` bar | Has Stripe, dine-in, venue spots, multi-rate tax |
| `screens/CartScreen.jsx` / `screens/CheckoutScreen.jsx` / routes `/cart`, `/checkout` | **Legacy, apparently unreachable from the UI** | Grep-verified: nothing calls `paths.cart()`/`paths.checkout()` except these two screens linking to each other; still registered in `App.jsx` and reachable by direct URL |
| `screens/ConfirmationScreen.jsx` / route `/confirmation` | Tied to the legacy flow (reads order data from `sessionStorage`, written only by `CheckoutScreen`) | The active `CheckoutSheet` shows its own inline success state instead of navigating here |
| `components/CategoryBar.jsx` | **Appears unused** based on the current import search | Not imported anywhere in `src/` (grep-verified); `MenuScreen.jsx` imports and renders `CategoryTabs.jsx` instead. Treat as a candidate for removal on a future cleanup pass — don't delete it as a side effect of unrelated work, and re-check with a fresh import search before removing, in case something imports it dynamically or it's added back intentionally. |
| `lib/translations.js`'s `isRTL()` vs. `useSession().isRTL` | Both "active" but **inconsistent** — see §6 | Legacy screens use the static one; the current primary flow uses the DB-driven one |

Before modifying cart, checkout, or RTL logic, confirm which implementation a given screen actually uses — don't assume `useCart`/`useMenu` (the hook files) are in play.

## 9. Business Rules and Cross-System Dependencies to Preserve

- **Order totals/tax are computed client-side** (`calculateTax`, `formatPrice`, cart line math) and sent to n8n as part of the order payload. Whether n8n re-derives/validates these server-side before persisting the order is **external/unverified** — don't assume the client total is trusted or re-checked downstream; flag this explicitly to a reviewer if changing anything in the price/tax computation path.
- **Stripe Connect direct-charge**: payments are scoped to `restaurant.payment_provider_account_id`. Changing how `getStripe()` selects an account, or how/when a PaymentIntent is created, directly affects where money settles — treat as high-risk.
- **Dine-in session continuity** depends on `sessionStorage['bv_dine_in_table_slug']`/`['bv_dine_in_session_id']` persisting across navigation within the tab; clearing or renaming these keys breaks order-history scoping and dine-in detection on reload.
- **Multi-tenant scoping**: nearly every Supabase query filters by `vendor_id` (and `venue_id` for venue-scoped data). Any new query must include the correct tenant filter or it will leak cross-vendor data, contingent on RLS actually enforcing it too (RLS itself is **external/unverified** from this repo — see §5).
- **Order-history identity check**: `OrderHistorySheet` scopes by `customer_phone` read from the requesting browser's own `localStorage`, with no server-side proof of phone ownership visible in this repo. Whether this is safe depends entirely on Supabase RLS on `orders`/`customers`/`sessions` — **do not assume it's protected without checking RLS directly**, and do not weaken/bypass any RLS you do find without the explicit approval `CLAUDE.md` requires.
- **WhatsApp session expiry is currently disabled** (the `throw new Error('Session expired')` in `useSession.js` is commented out) — if you re-enable it, confirm with the team first since it changes live link behavior, not just this codebase.
- **Translation fallback chain** (`pickTranslation`) is relied on throughout menu/option/category rendering; changing its precedence order affects every vendor's displayed content, not just one screen.
- **The demo fallback vendor** `dokan-el-kahwa` is hardcoded in `useSession.js` for the "no token, no slug match" case — be aware this exists before assuming all traffic is slug/token-driven.
- **Grocery stock gating differs from the query-level `available` filter.** `ProductCard.jsx` (grocery items only) checks `item.in_stock === false` and blocks `handlePlusClick` from adding the item to the cart when out of stock — this is a second, UI-level gate distinct from the `available=true` filter already applied when `MenuScreen` fetches `grocery_products`. **Restaurant menu items have no equivalent per-item stock check in `MenuItemCard.jsx`** — only the `available` query filter applies to them. Don't assume stock/availability logic is symmetric between the grocery and restaurant item cards when touching either one.

## 10. Validation Commands and Baseline Results

- `npm run lint` → **as last run: 22 errors, 4 warnings** across `CategoryTabs.jsx`, `CheckoutSheet.jsx`, `ItemSheet.jsx`, `CartContext.jsx`, `hooks/useSession.js`, `CheckoutScreen.jsx`, `ConfirmationScreen.jsx`, `ItemScreen.jsx`, `VenuePortalScreen.jsx`, `WelcomeScreen.jsx`. Most are from the `eslint-plugin-react-hooks` "setState-in-effect"/"static-components"/"immutability" rules rather than classic bugs; a few are real (`ConfirmationScreen`'s `InfoCard` defined inside the component body; `CartContext.jsx` mixing component and non-component exports, which breaks Fast Refresh; `ItemScreen`'s `initOptions` used before declaration).
- `npm run build` → **as last run: succeeds**, single JS chunk ~701 kB (~204.5 kB gzip), with a Vite chunk-size warning (no route-based code-splitting/`lazy()` in use anywhere in `App.jsx`).
- **Treat both results as a snapshot from the prior session, not a guarantee of current state** — re-run before relying on them for a specific change.
- No automated test suite exists in this repo (`*.test.*`/`*.spec.*` — none found).
