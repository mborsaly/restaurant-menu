import { useState, useEffect } from 'react'
import { supabase }            from '../lib/supabase'

export function useSession() {
  const [session, setSession]       = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [customer, setCustomer]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lang, setLang]             = useState('fr')

  useEffect(() => {
    async function loadSession() {
      try {
        const params = new URLSearchParams(
          window.location.search
        )
        const token = params.get('t')

        // No token — use demo restaurant
        if (!token) {
          const { data: resto } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', 'dokan-el-kahwa')
            .single()
          setRestaurant(resto)

          // Load lang from sessionStorage
          const savedLang =
            sessionStorage.getItem('lang') || 'fr'
          setLang(savedLang)

          setLoading(false)
          return
        }

        // Load session by token
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from('sessions')
          .select('*, restaurants(*)')
          .eq('token', token)
          .single()

        if (sessionError) throw new Error(
          'Session not found'
        )

        // Check expiry
        const expiresAt = sessionData.expires_at
          .replace(' ', 'T')
          .replace('+00', 'Z')

        if (Date.parse(expiresAt) < Date.now()) {
          // throw new Error('Session expired')
        }

        // Set language from session or sessionStorage
        const sessionLang =
          sessionData.language
          || sessionStorage.getItem('lang')
          || 'fr'

        setLang(sessionLang)
        sessionStorage.setItem('lang', sessionLang)

        setSession(sessionData)
        setRestaurant(sessionData.restaurants)

        // Load customer
        if (sessionData.customer_phone) {
          const { data: customerData } =
            await supabase
              .from('customers')
              .select('*')
              .eq('phone',
                sessionData.customer_phone)
              .single()
          setCustomer(customerData)
        }

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  // Toggle language and persist
  function toggleLang() {
    const newLang = lang === 'en' ? 'fr' : 'en'
    setLang(newLang)
    sessionStorage.setItem('lang', newLang)
  }

  return {
    session,
    restaurant,
    customer,
    loading,
    error,
    lang,
    toggleLang,
  }
}