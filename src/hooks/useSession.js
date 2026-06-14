	import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSession() {
  const [session, setSession] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadSession() {
      try {
        // Get token from URL
        const params = new URLSearchParams(window.location.search)
        const token = params.get('t')

        // No token — use demo restaurant for testing
        if (!token) {
          const { data: resto } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', 'mechwi-grillades')
            .single()
          setRestaurant(resto)
          setLoading(false)
          return
        }

        // Load session by token
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*, restaurants(*)')
          .eq('token', token)
          .single()

        if (sessionError) throw new Error('Session not found')

        // Check if session expired
        const expiresAt = sessionData.expires_at.replace(' ', 'T').replace('+00', 'Z')
        
	console.log('expiresAt:', expiresAt)
	console.log('parsed date:', new Date(expiresAt))
	console.log('timestamp:', Date.parse(expiresAt))
	console.log('now:', Date.now())
	
	if (Date.parse(expiresAt) < Date.now()) {
        //   throw new Error('Session expired')
        }

        setSession(sessionData)
        setRestaurant(sessionData.restaurants)

        // Load customer if phone exists
        if (sessionData.customer_phone) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', sessionData.customer_phone)
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

  return { session, restaurant, customer, loading, error }
}

