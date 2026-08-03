import { useState, useEffect } from 'react'
import { useParams }           from 'react-router-dom'
import { supabase }            from '../lib/supabase'
import LoadingScreen           from '../components/LoadingScreen'
import MenuScreen              from './MenuScreen'
import VenuePortalScreen       from './VenuePortalScreen'

export default function VendorOrVenueRouter() {
  const { slug } = useParams()
  const [resolved, setResolved] = useState(null) // 'venue' | 'vendor' | 'notfound'
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function resolve() {
      const { data: venueData } = await supabase
        .from('venues')
        .select('id')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle()

      if (venueData) {
        setResolved('venue')
        setLoading(false)
        return
      }

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle()

      setResolved(vendorData ? 'vendor' : 'notfound')
      setLoading(false)
    }

    resolve()
  }, [slug])

  if (loading) return <LoadingScreen message="Loading..." />

  if (resolved === 'venue')  return <VenuePortalScreen />
  if (resolved === 'vendor') return <MenuScreen />

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32,
      textAlign: 'center', background: '#FFF8F0',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: '#1A4D3E' }}>
        Page not found
      </h2>
    </div>
  )
}