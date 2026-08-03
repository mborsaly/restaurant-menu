import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider }        from './context/CartContext'
import WelcomeScreen           from './screens/WelcomeScreen'
import MenuScreen              from './screens/MenuScreen'
import ItemScreen              from './screens/ItemScreen'
import CartScreen              from './screens/CartScreen'
import CheckoutScreen          from './screens/CheckoutScreen'
import ConfirmationScreen      from './screens/ConfirmationScreen'
import VenuePortalScreen       from './screens/VenuePortalScreen'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>

          {/* ── WhatsApp token flow (unchanged) ── */}
          <Route path="/welcome"      element={<WelcomeScreen />} />
          <Route path="/menu"         element={<MenuScreen />} />
          <Route path="/item/:id"     element={<ItemScreen />} />
          <Route path="/cart"         element={<CartScreen />} />
          <Route path="/checkout"     element={<CheckoutScreen />} />
          <Route path="/confirmation" element={<ConfirmationScreen />} />

          {/* ── Standalone vendor direct URL: /:vendorSlug ── */}
          <Route path="/:vendorSlug"
            element={<MenuScreen />} />
          <Route path="/:vendorSlug/item/:id"
            element={<ItemScreen />} />
          <Route path="/:vendorSlug/cart"
            element={<CartScreen />} />
          <Route path="/:vendorSlug/checkout"
            element={<CheckoutScreen />} />
          <Route path="/:vendorSlug/confirmation"
            element={<ConfirmationScreen />} />

          {/* ── Venue QR flow: /:venueSlug/:vendorSlug ── */}
          <Route path="/:venueSlug/:restaurantSlug"
            element={<VenuePortalScreen />} />
          <Route path="/:venueSlug/:restaurantSlug/item/:id"
            element={<ItemScreen />} />
          <Route path="/:venueSlug/:restaurantSlug/cart"
            element={<CartScreen />} />
          <Route path="/:venueSlug/:restaurantSlug/checkout"
            element={<CheckoutScreen />} />
          <Route path="/:venueSlug/:restaurantSlug/confirmation"
            element={<ConfirmationScreen />} />

        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}