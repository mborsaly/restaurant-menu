import { useState, useEffect } from 'react'
import { supabase }            from '../lib/supabase'
import { getVendorLanguages, getAllLanguages, pickTranslation } from '../lib/i18n'

const RESERVED   = ['welcome','menu','item','cart','checkout','confirmation']
const SUB_ROUTES = ['cart','checkout','confirmation','item']

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
  const [dineInTable, setDineInTable]         = useState(null)
  const [isDineIn, setIsDineIn]               = useState(false)
  const [dineInSessionId, setDineInSessionId] = useState(null)

  // ── New: dynamic language support ──
  const [vendorLanguages, setVendorLanguages] = useState([]) // full language objects for this vendor
  const [allLanguages, setAllLanguages]       = useState([]) // full catalog, for reference

  async function resolveLangForVendor(vendorId, requestedLang) {
    const langs = await getVendorLanguages(vendorId)
    setVendorLanguages(langs)

    if (langs.length === 0) return requestedLang || 'en'

    const codes = langs.map(l => l.code)
    if (codes.includes(requestedLang)) return requestedLang

    const defaultLang = langs.find(l => l.is_default)
    return defaultLang?.code || codes[0]
  }

  useEffect(() => {
    async function loadSession() {
      try {
        const catalog = await getAllLanguages()
        setAllLanguages(catalog)

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
              const finalLang = await resolveLangForVendor(vendorData.id, savedLang)
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

                let sid = sessionStorage.getItem('bv_dine_in_session_id')
                if (!sid) {
                  sid = `dine-${tableData.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                  sessionStorage.setItem('bv_dine_in_session_id', sid)
                }
                setDineInSessionId(sid)
              }
            }

            const savedLang = sessionStorage.getItem('lang') || 'ar'
            const finalLang = await resolveLangForVendor(vendorData.id, savedLang)
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
          if (vendor) {
            const savedLang = sessionStorage.getItem('lang') || 'ar'
            const finalLang = await resolveLangForVendor(vendor.id, savedLang)
            setLangState(finalLang)
            sessionStorage.setItem('lang', finalLang)
          }
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
        const finalLang = await resolveLangForVendor(vendorData.id, requestedLang)
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
    const codes = vendorLanguages.map(l => l.code)
    if (codes.length === 0) return
    const currentIndex = codes.indexOf(lang)
    const nextLang = codes[(currentIndex + 1) % codes.length]
    setLangState(nextLang)
    sessionStorage.setItem('lang', nextLang)
  }

  function setLang(newLang) {
    const codes = vendorLanguages.map(l => l.code)
    if (codes.length > 0 && !codes.includes(newLang)) return
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

  // Convenience: is the CURRENT active lang RTL?
  const isRTL = !!vendorLanguages.find(l => l.code === lang)?.is_rtl

  return {
    session,
    restaurant,
    vendor: restaurant,
    venue,
    customer,
    loading,
    error,
    lang,
    isRTL,
    toggleLang,
    setLang,
    vendorLanguages,
    allLanguages,
    isVenueMode,
    isStandalone,
    venueSlug,
    restaurantSlug,
    vendorType,
    isGrocery,
    isDineIn,
    dineInTable,
    dineInSessionId,
    paths,
  }
}