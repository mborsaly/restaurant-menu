import { useState, useEffect } from 'react'
import { supabase }            from '../lib/supabase'

export function useSession() {
  const [session, setSession]       = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [customer, setCustomer]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lang, setLang]             = useState('ar') // default Arabic for Egypt

  useEffect(() => {
    async function loadSession() {
      try {
        const params = new URLSearchParams(
          window.location.search
        )
        const token = params.get('t')

        if (!token) {
          const { data: resto } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', 'dokan-el-kahwa') // Egypt demo default
            .single()
          setRestaurant(resto)

          const savedLang =
            sessionStorage.getItem('lang') || 'ar'
          setLang(savedLang)
          setLoading(false)
          return
        }

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

        const expiresAt = sessionData.expires_at
          .replace(' ', 'T')
          .replace('+00', 'Z')

        if (Date.parse(expiresAt) < Date.now()) {
          // throw new Error('Session expired')
        }

        // Detect language from session or storage
        const sessionLang =
          sessionData.language
          || sessionStorage.getItem('lang')
          || 'ar'

        setLang(sessionLang)
        sessionStorage.setItem('lang', sessionLang)

        setSession(sessionData)
        setRestaurant(sessionData.restaurants)

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

  function toggleLang() {
    // Cycle: ar → en → fr → ar
    const cycle = { ar: 'en', en: 'fr', fr: 'ar' }
    const newLang = cycle[lang] || 'ar'
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