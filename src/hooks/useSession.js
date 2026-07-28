import { useState, useEffect } from 'react'
import { supabase }            from '../lib/supabase'

const RESERVED = ['welcome','menu','item','cart','checkout','confirmation']

export function useSession() {
  const [session, setSession]       = useState(null)
  const [restaurant, setRestaurant] = useState(null) // kept as `restaurant` for
                                                       // backward-compat with
                                                       // existing components;
                                                       // now sourced from `vendors`
  const [venue, setVenue]           = useState(null)
  const [customer, setCustomer]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lang, setLangState]        = useState('ar')
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

        // ── VENUE MODE: /:venueSlug/:vendorSlug ──
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

          const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('slug', rSlug)
            .eq('venue_id', venueData.id)
            .eq('active', true)
            .single()

          if (!vendorData) throw new Error('Vendor not found')

          setVenue(venueData)
          setRestaurant(vendorData)
          setIsVenueMode(true)
          setVenueSlug(vSlug)
          setRestaurantSlug(rSlug)

          const savedLang = sessionStorage.getItem('lang') || 'ar'
          setLangState(savedLang)
          setLoading(false)
          return
        }

        // ── No token, no venue path — demo fallback ──
        if (!token) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('*')
            .eq('slug', 'dokan-el-kahwa')
            .single()
          setRestaurant(vendor)
          setLangState(sessionStorage.getItem('lang') || 'ar')
          setLoading(false)
          return
        }

        // ── WHATSAPP TOKEN MODE ──
        const { data: sessionData, error: sessionError } =
          await supabase
            .from('sessions')
            .select('*, vendors(*)')
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
        setLangState(sessionLang)
        sessionStorage.setItem('lang', sessionLang)

        setSession(sessionData)
        setRestaurant(sessionData.vendors)

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
    setLangState(newLang)
    sessionStorage.setItem('lang', newLang)
  }

  function setLang(newLang) {
    setLangState(newLang)
    sessionStorage.setItem('lang', newLang)
  }

  function basePath() {
    return isVenueMode
      ? `/${venueSlug}/${restaurantSlug}`
      : ''
  }

  function suffix() {
    return isVenueMode ? '' : window.location.search
  }

  const paths = {
    menu:  () => isVenueMode ? basePath() : `/menu${suffix()}`,
    item:  (id) => isVenueMode
      ? `${basePath()}/item/${id}`
      : `/item/${id}${suffix()}`,
    cart:  () => isVenueMode
      ? `${basePath()}/cart`
      : `/cart${suffix()}`,
    checkout: () => isVenueMode
      ? `${basePath()}/checkout`
      : `/checkout${suffix()}`,
    confirmation: () => isVenueMode
      ? `${basePath()}/confirmation`
      : `/confirmation${suffix()}`,
  }

  // vendor_type drives which product table/UI to use
  const vendorType = restaurant?.vendor_type || 'restaurant'
  const isGrocery   = vendorType === 'grocery' || vendorType === 'kiosk'

  return {
    session,
    restaurant,       // vendor row (kept name for compatibility)
    vendor: restaurant,
    venue,
    customer,
    loading,
    error,
    lang,
    toggleLang,
    setLang,
    isVenueMode,
    venueSlug,
    restaurantSlug,
    vendorType,
    isGrocery,
    paths,
  }
}