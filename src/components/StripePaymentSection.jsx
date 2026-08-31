import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '../lib/stripe'

function InnerPaymentForm({ lang, isRTL, onReady, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [ready, setReady] = useState(false)

  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <PaymentElement
        onReady={() => { setReady(true); onReady?.({ stripe, elements }) }}
        onLoadError={(e) => onError?.(e.error?.message)}
        options={{
          layout: 'tabs',
          // Elements auto-detects Apple Pay/Google Pay
          // availability based on device + browser —
          // no separate button code needed
        }}
      />
      {!ready && (
        <p style={{ fontSize: 12, opacity: 0.5, textAlign: 'center', padding: '12px 0' }}>
          {lang === 'ar' ? 'جاري التحميل...' : lang === 'fr' ? 'Chargement...' : lang === 'es' ? 'Cargando...' : 'Loading...'}
        </p>
      )}
    </div>
  )
}

export default function StripePaymentSection({
  clientSecret, connectedAccountId, lang, isRTL, onReady, onError
}) {
  if (!clientSecret) return null

  const stripePromise = getStripe(connectedAccountId)

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#1A4D3E',
            borderRadius: '12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
        },
      }}
    >
      <InnerPaymentForm lang={lang} isRTL={isRTL} onReady={onReady} onError={onError} />
    </Elements>
  )
}