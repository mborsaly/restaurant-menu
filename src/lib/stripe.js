import { loadStripe } from '@stripe/stripe-js'

const stripePromiseCache = {}

// stripeAccount = the VENDOR's connected Stripe
// account ID — required for direct-charge Connect
// payments so funds land in the vendor's account,
// not BistroVite's
export function getStripe(stripeAccount) {
  const cacheKey = stripeAccount || 'platform'
  if (!stripePromiseCache[cacheKey]) {
    stripePromiseCache[cacheKey] = loadStripe(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      stripeAccount ? { stripeAccount } : undefined
    )
  }
  return stripePromiseCache[cacheKey]
}