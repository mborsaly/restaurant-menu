import { useState, useEffect } from 'react'
import { supabase }            from '../lib/supabase'

const RESERVED = ['welcome','menu','item','cart','checkout','confirmation']

export function useSession() {
  const [session, setSession]       = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [venue, setVenue]           = useState(null)
  const [customer, setCustomer]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lang, setLang]             = useState('ar')
  const [isVenueMode, setIsVenueMode] = useState(false)
  const [venueSlug, setVenueSlug]     = useState(null)
  const [restaurantSlug, setRestaurantSlug] = useState(null)

  useEffect(() => {
    async function loadSession() {
      try {
        const params = new URLSearchParams(window.location.search)
        const token  = params.get('t')
        const pathParts = window.location.pathname
          .split('/').filter(Boolean)

        // ── VENUE MODE: /:venueSlug/:restaurantSlug ──
        if (!token && pathParts.length >= 2
            && !RESERVED.includes(pathParts[0])) {

          const vSlug = pathParts[0]
          const rSlug = pathParts[1]

          const { data: venueData } = await supabase
            .from('venues')
            .select('*')
            .eq('slug', vSlug)
            .eq('active', true)
            .single()

          if (!venueData) throw new Error('Venue not found')

          const { data: restoData } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', rSlug)
            .eq('venue_id', venueData.id)
            .eq('active', true)
            .single()

          if (!restoData) throw new Error('Restaurant not found')

          setVenue(venueData)
          setRestaurant(restoData)
          setIsVenueMode(true)
          setVenueSlug(vSlug)
          setRestaurantSlug(rSlug)

          const savedLang = sessionStorage.getItem('lang') || 'ar'
          setLang(savedLang)
          setLoading(false)
          return
        }

        // ── No token, no venue path — demo fallback ──
        if (!token) {
          const { data: resto } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', 'dokan-el-kahwa')
            .single()
          setRestaurant(resto)
          setLang(sessionStorage.getItem('lang') || 'ar')
          setLoading(false)
          return
        }

        // ── WHATSAPP TOKEN MODE (unchanged) ──
        const { data: sessionData, error: sessionError } =
          await supabase
            .from('sessions')
            .select('*, restaurants(*)')
            .eq('token', token)
            .single()

        if (sessionError) throw new Error('Session not found')

        const expiresAt = sessionData.expires_at
          .replace(' ', 'T').replace('+00', 'Z')
        if (Date.parse(expiresAt) < Date.now()) {
          // throw new Error('Session expired')
        }

        const sessionLang = sessionData.language
          || sessionStorage.getItem('lang') || 'fr'
        setLang(sessionLang)
        sessionStorage.setItem('lang', sessionLang)

        setSession(sessionData)
        setRestaurant(sessionData.restaurants)

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

  function toggleLang() {
    const cycle = { ar: 'en', en: 'fr', fr: 'ar' }
    const newLang = cycle[lang] || 'ar'
    setLang(newLang)
    sessionStorage.setItem('lang', newLang)
  }
  // Add this return value alongside the existing ones,
  // right next to toggleLang:

  function setLangDirect(newLang) {
    setLang(newLang)
    sessionStorage.setItem('lang', newLang)
  }


  // ── Path helpers — use these instead of
  //    hardcoded '/menu' + searchParams ──
  function basePath() {
    return isVenueMode
      ? `/${venueSlug}/${restaurantSlug}`
      : ''
  }

  function suffix() {
    // token/back params for WhatsApp mode only
    return isVenueMode ? '' : window.location.search
  }

  const paths = {
    menu:         () => `${basePath()}/menu${suffix()}`.replace('//menu','/menu'),
    item:  (id)   => isVenueMode
      ? `${basePath()}/item/${id}`
      : `/item/${id}${suffix()}`,
    cart:         () => isVenueMode
      ? `${basePath()}/cart`
      : `/cart${suffix()}`,
    checkout:     () => isVenueMode
      ? `${basePath()}/checkout`
      : `/checkout${suffix()}`,
    confirmation: () => isVenueMode
      ? `${basePath()}/confirmation`
      : `/confirmation${suffix()}`,
  }

  // In venue mode the "menu" IS the base path
  paths.menu = () => isVenueMode ? basePath() : `/menu${suffix()}`

  return {
    session,
    restaurant,
    venue,
    customer,
    loading,
    error,
    lang,
    toggleLang,
    setLang: setLangDirect,   // ← add this line
    isVenueMode,
    venueSlug,
    restaurantSlug,
    paths,
  }
}