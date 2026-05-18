import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomeScreen from './screens/WelcomeScreen'
import MenuScreen from './screens/MenuScreen'
import ItemScreen from './screens/ItemScreen'
import CartScreen from './screens/CartScreen'
import CheckoutScreen from './screens/CheckoutScreen'
import ConfirmationScreen from './screens/ConfirmationScreen'

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/menu" element={<MenuScreen />} />
          <Route path="/item/:id" element={<ItemScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/confirmation" element={<ConfirmationScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

