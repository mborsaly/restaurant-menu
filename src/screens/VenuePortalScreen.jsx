import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase }            from '../lib/supabase'
import LoadingScreen           from '../components/LoadingScreen'
import LangSwitcher            from '../components/LangSwitcher'
import { isRTL }                from '../lib/translations'

export default function VenuePortalScreen() {
  const params = useParams()
  // Accept either param name — this screen can be
  // reached via /:venueSlug directly OR via
  // VendorOrVenueRouter's /:slug wrapper
  const venueSlug = params.venueSlug || params.slug

  const navigate = useNavigate()

  const [venue, setVenue]     = useState(null)
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [lang, setLangState]  = useState(sessionStorage.getItem('lang') || 'ar')

  const rtl        = isRTL(lang)
  const arabicFont = lang === 'ar' ? "'Noto Naskh Arabic', serif" : 'inherit'

  useEffect(() => {
    if (!venueSlug) {
      setError('No venue slug provided')
      setLoading(false)
      return
    }

    async function load() {
      try {
        const { data: venueData, error: venueErr } = await supabase
          .from('venues')
          .select('*')
          .eq('slug', venueSlug)
          .eq('active', true)
          .single()

        if (venueErr || !venueData) throw new Error('Venue not found')

        const { data: vendorRows } = await supabase
          .from('vendors')
          .select('*')
          .eq('venue_id', venueData.id)
          .eq('active', true)
          .order('name')

        setVenue(venueData)
        setVendors(vendorRows || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [venueSlug])

  function setLang(newLang) {
    setLangState(newLang)
    sessionStorage.setItem('lang', newLang)
  }

  function getVenueName() {
    if (!venue) return ''
    if (lang === 'ar') return venue.name_ar || venue.name
    if (lang === 'fr') return venue.name_fr || venue.name
    return venue.name
  }

  function getVendorName(v) {
    if (lang === 'ar') return v.name_ar || v.name
    if (lang === 'fr') return v.name_fr || v.name
    return v.name
  }

  function getCuisine(v) {
    if (lang === 'ar') return v.cuisine_type_ar || v.cuisine_type
    return v.cuisine_type
  }

  function getVendorTypeIcon(v) {
    const map = { restaurant: '🍽️', grocery: '🛒', kiosk: '🏪', pharmacy: '💊' }
    return map[v.vendor_type] || '🍽️'
  }

  const texts = {
    title: { ar: getVenueName() || 'المطاعم', en: getVenueName() || 'Vendors', fr: getVenueName() || 'Vendeurs' },
    subtitle: {
      ar: 'اختر مكانك المفضل واطلب دلوقتي',
      en: 'Pick a spot and order now',
      fr: 'Choisissez un endroit et commandez',
    },
    empty: { ar: 'لا يوجد بائعين متاحين حالياً', en: 'No vendors available right now', fr: 'Aucun vendeur disponible' },
    notFound: { ar: 'النادي غير موجود', en: 'Venue not found', fr: 'Lieu introuvable' },
    orderNow: { ar: 'اطلب الآن', en: 'Order Now', fr: 'Commander' },
    poweredBy: { ar: 'بدعم من', en: 'Powered by', fr: 'Propulsé par' },
  }

  if (loading) return (
    <LoadingScreen message={lang === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
  )

  if (error || !venue) return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 32, textAlign: 'center', background: '#FFF8F0',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: '#1A4D3E' }}>
        {texts.notFound[lang]}
      </h2>
    </div>
  )

  const primary = venue.primary_color || '#1A4D3E'
  const coral   = '#FF7A47'

  return (
    <div style={{ minHeight: '100dvh', background: '#FFF8F0', direction: rtl ? 'rtl' : 'ltr' }}>

      <div style={{ background: primary, padding: '40px 24px 32px', textAlign: 'center', position: 'relative' }}>

        <div style={{
          position: 'absolute', top: 16,
          [rtl ? 'left' : 'right']: 16,
        }}>
          <LangSwitcher
            lang={lang}
            onSelect={setLang}
            primary="#FFFFFF"
          />
        </div>

        {venue.logo_url ? (
          <img src={venue.logo_url} alt={getVenueName()}
            style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover', marginBottom: 16, boxShadow: '0 8px 24px rgba(0,0,0,.2)' }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
            margin: '0 auto 16px',
          }}>
            🏛️
          </div>
        )}

        <h1 style={{
          fontFamily: arabicFont === 'inherit' ? "'Fraunces', serif" : arabicFont,
          fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 6px',
        }}>
          {getVenueName()}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0, fontFamily: arabicFont }}>
          {texts.subtitle[lang]}
        </p>
      </div>

      <div style={{ maxWidth: 448, margin: '0 auto', padding: 20 }}>
        {vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <p style={{ fontFamily: arabicFont, fontSize: 14 }}>{texts.empty[lang]}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => navigate(`/${venueSlug}/${v.slug}`)}
                style={{
                  background: 'white', borderRadius: 20, border: '1px solid rgba(45,42,38,0.06)',
                  padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  textAlign: rtl ? 'right' : 'left', flexDirection: rtl ? 'row-reverse' : 'row', width: '100%',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: `${v.primary_color || primary}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {v.logo_url ? (
                    <img src={v.logo_url} alt={getVendorName(v)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (v.logo_emoji || getVendorTypeIcon(v))}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontFamily: arabicFont === 'inherit' ? "'Fraunces', serif" : arabicFont,
                    fontSize: 16, fontWeight: 700, color: '#1A4D3E', margin: '0 0 2px',
                  }}>
                    {getVendorName(v)}
                  </h3>
                  {getCuisine(v) && (
                    <p style={{ fontSize: 12, color: '#2D2A26', opacity: 0.55, margin: 0, fontFamily: arabicFont }}>
                      {getCuisine(v)}
                    </p>
                  )}
                </div>

                <div style={{
                  padding: '8px 14px', borderRadius: 100, background: `${coral}12`, color: coral,
                  fontSize: 12, fontWeight: 700, fontFamily: arabicFont, flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {texts.orderNow[lang]}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '24px 20px 40px' }}>
        <p style={{ fontSize: 11, color: '#2D2A26', opacity: 0.35, fontFamily: arabicFont, marginBottom: 4 }}>
          {texts.poweredBy[lang]}
        </p>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: '#2D2A26', opacity: 0.5 }}>
          Bistro<span style={{ fontStyle: 'italic', color: coral }}>Vite</span>
        </div>
      </div>

    </div>
  )
}