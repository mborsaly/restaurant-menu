import { useState, useEffect } from 'react'
import { supabase }            from '../lib/supabase'

const RESERVED   = ['welcome','menu','item','cart','checkout','confirmation']
const SUB_ROUTES = ['cart','checkout','confirmation','item']

function resolveLang(vendorData, requestedLang) {
  const allowed = vendorData?.supported_languages?.length
    ? vendorData.supported_languages
    : ['en', 'fr', 'ar']
  if (allowed.includes(requestedLang)) return requestedLang
  return allowed[0]
}

export function useSession() {
  const [session, setSession]       = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [venue, setVenue]           = useState(null)
  const [customer, setCustomer]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lang, setLangState]        = useState('ar')
  const [isVenueMode, setIsVenueMode] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [venueSlug, setVenueSlug]     = useState(null)
  const [restaurantSlug, setRestaurantSlug] = useState(null)

  // ── Dine-in (QR per table) state ──
  const [dineInTable, setDineInTable] = useState(null)
  const [isDineIn, setIsDineIn]       = useState(false)

  useEffect(() => {
    async function loadSession() {
      try {
        const params = new URLSearchParams(window.location.search)
        const token  = params.get('t')
        const tableSlug = params.get('table')
          || sessionStorage.getItem('bv_dine_in_table_slug')

        const pathParts = window.location.pathname
          .split('/').filter(Boolean)

        const slug1 = pathParts[0]
        const slug2 = pathParts[1]

        const looksLikeVenuePair =
          !!slug1 && !RESERVED.includes(slug1) &&
          !!slug2 && !SUB_ROUTES.includes(slug2)

        const looksLikeStandalone =
          !!slug1 && !RESERVED.includes(slug1) &&
          (!slug2 || SUB_ROUTES.includes(slug2))

        // ── VENUE MODE: /:venueSlug/:vendorSlug ──
        if (!token && looksLikeVenuePair) {
          const { data: venueData } = await supabase
            .from('venues')
            .select('*')
            .eq('slug', slug1)
            .eq('active', true)
            .single()

          if (venueData) {
            const { data: vendorData } = await supabase
              .from('vendors')
              .select('*')
              .eq('slug', slug2)
              .eq('venue_id', venueData.id)
              .eq('active', true)
              .single()

            if (vendorData) {
              setVenue(venueData)
              setRestaurant(vendorData)
              setIsVenueMode(true)
              setVenueSlug(slug1)
              setRestaurantSlug(slug2)

              const savedLang = sessionStorage.getItem('lang') || 'ar'
              const finalLang = resolveLang(vendorData, savedLang)
              setLangState(finalLang)
              sessionStorage.setItem('lang', finalLang)
              setLoading(false)
              return
            }
          }
        }

        // ── STANDALONE VENDOR: /:vendorSlug[/sub-route] ──
        if (!token && looksLikeStandalone) {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('slug', slug1)
            .eq('active', true)
            .single()

          if (vendorData) {
            setRestaurant(vendorData)
            setIsVenueMode(!!vendorData.venue_id)
            setIsStandalone(!vendorData.venue_id)
            setRestaurantSlug(slug1)

            if (vendorData.venue_id) {
              const { data: venueData } = await supabase
                .from('venues')
                .select('slug')
                .eq('id', vendorData.venue_id)
                .single()
              if (venueData) setVenueSlug(venueData.slug)
            }

            // ── Resolve dine-in table if a table
            //    slug is present in the URL or was
            //    already stored this session ──
            if (tableSlug && vendorData.supports_dine_in) {
              const { data: tableData } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('qr_code_slug', tableSlug)
                .eq('vendor_id', vendorData.id)
                .eq('active', true)
                .single()

              if (tableData) {
                setDineInTable(tableData)
                setIsDineIn(true)
                sessionStorage.setItem('bv_dine_in_table_slug', tableSlug)
              }
            }

            const savedLang = sessionStorage.getItem('lang') || 'ar'
            const finalLang = resolveLang(vendorData, savedLang)
            setLangState(finalLang)
            sessionStorage.setItem('lang', finalLang)
            setLoading(false)
            return
          }
        }

        // ── No token, no matching path — demo fallback ──
        if (!token) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('*')
            .eq('slug', 'dokan-el-kahwa')
            .single()
          setRestaurant(vendor)
          const savedLang = sessionStorage.getItem('lang') || 'ar'
          const finalLang = resolveLang(vendor, savedLang)
          setLangState(finalLang)
          sessionStorage.setItem('lang', finalLang)
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

        const vendorData    = sessionData.vendors
        const requestedLang = sessionData.language
          || sessionStorage.getItem('lang') || 'fr'
        const finalLang = resolveLang(vendorData, requestedLang)
        setLangState(finalLang)
        sessionStorage.setItem('lang', finalLang)

        setSession(sessionData)
        setRestaurant(vendorData)

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
    const allowed = restaurant?.supported_languages?.length
      ? restaurant.supported_languages
      : ['ar', 'en', 'fr']
    const currentIndex = allowed.indexOf(lang)
    const nextLang = allowed[(currentIndex + 1) % allowed.length]
    setLangState(nextLang)
    sessionStorage.setItem('lang', nextLang)
  }

  function setLang(newLang) {
    const allowed = restaurant?.supported_languages?.length
      ? restaurant.supported_languages
      : ['ar', 'en', 'fr']
    if (!allowed.includes(newLang)) return
    setLangState(newLang)
    sessionStorage.setItem('lang', newLang)
  }

  function basePath() {
    if (isVenueMode && venueSlug && restaurantSlug) return `/${venueSlug}/${restaurantSlug}`
    if (isStandalone && restaurantSlug) return `/${restaurantSlug}`
    return ''
  }

  function suffix() {
    return (isVenueMode || isStandalone) ? '' : window.location.search
  }

  const usesCleanPath = isVenueMode || isStandalone

  const paths = {
    menu:         () => usesCleanPath ? basePath() : `/menu${suffix()}`,
    item:  (id)   => usesCleanPath
      ? `${basePath()}/item/${id}`
      : `/item/${id}${suffix()}`,
    cart:         () => usesCleanPath
      ? `${basePath()}/cart`
      : `/cart${suffix()}`,
    checkout:     () => usesCleanPath
      ? `${basePath()}/checkout`
      : `/checkout${suffix()}`,
    confirmation: () => usesCleanPath
      ? `${basePath()}/confirmation`
      : `/confirmation${suffix()}`,
  }

  const vendorType = restaurant?.vendor_type || 'restaurant'
  const isGrocery   = vendorType === 'grocery' || vendorType === 'kiosk'

  return {
    session,
    restaurant,
    vendor: restaurant,
    venue,
    customer,
    loading,
    error,
    lang,
    toggleLang,
    setLang,
    isVenueMode,
    isStandalone,
    venueSlug,
    restaurantSlug,
    vendorType,
    isGrocery,
    isDineIn,
    dineInTable,
    paths,
  }
}