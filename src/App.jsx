import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider }        from './context/CartContext'
import WelcomeScreen           from './screens/WelcomeScreen'
import MenuScreen              from './screens/MenuScreen'
import ItemScreen              from './screens/ItemScreen'
import CartScreen              from './screens/CartScreen'
import CheckoutScreen          from './screens/CheckoutScreen'
import ConfirmationScreen      from './screens/ConfirmationScreen'
import VendorOrVenueRouter     from './screens/VendorOrVenueRouter'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>

          {/* ── WhatsApp token flow ── */}
          <Route path="/welcome"      element={<WelcomeScreen />} />
          <Route path="/menu"         element={<MenuScreen />} />
          <Route path="/item/:id"     element={<ItemScreen />} />
          <Route path="/cart"         element={<CartScreen />} />
          <Route path="/checkout"     element={<CheckoutScreen />} />
          <Route path="/confirmation" element={<ConfirmationScreen />} />

          {/* ── Venue vendor: /:venueSlug/:vendorSlug ──
              Must be registered BEFORE the standalone
              sub-routes below so a real venue+vendor
              pair (e.g. /esc-giza/dokan-el-kahwa) isn't
              accidentally caught by a static-segment
              standalone route first. React Router ranks
              static segments higher than dynamic ones,
              so this ordering is for readability, not
              strictly required — but keep it for clarity. */}
          <Route path="/:venueSlug/:vendorSlug"
            element={<MenuScreen />} />
          <Route path="/:venueSlug/:vendorSlug/item/:id"
            element={<ItemScreen />} />
          <Route path="/:venueSlug/:vendorSlug/cart"
            element={<CartScreen />} />
          <Route path="/:venueSlug/:vendorSlug/checkout"
            element={<CheckoutScreen />} />
          <Route path="/:venueSlug/:vendorSlug/confirmation"
            element={<ConfirmationScreen />} />

          {/* ── Standalone vendor sub-routes
              (static second segment wins matching
              priority over the dynamic route above) ── */}
          <Route path="/:vendorSlug/item/:id"
            element={<ItemScreen />} />
          <Route path="/:vendorSlug/cart"
            element={<CartScreen />} />
          <Route path="/:vendorSlug/checkout"
            element={<CheckoutScreen />} />
          <Route path="/:vendorSlug/confirmation"
            element={<ConfirmationScreen />} />

          {/* ── Single segment: could be a venue portal
              OR a standalone vendor — resolved at runtime.
              MUST be registered so this actually renders,
              not MenuScreen directly. ── */}
          <Route path="/:slug" element={<VendorOrVenueRouter />} />

        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}