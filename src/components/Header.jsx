import { useState, useRef, useEffect } from 'react'
import { t, isRTL } from '../lib/translations'
import LangSwitcher from './LangSwitcher'
import { t, isRTL } from '../lib/translations'

const LANGUAGES = [
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
]

export default function Header({
  restaurant, lang, onLangSelect
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const emoji   = restaurant?.logo_emoji    || '🍽️'
  const rtl     = isRTL(lang)

  const logoBlock = (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: `${primary}18`, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 20, flexShrink: 0,
    }}>
      {restaurant?.logo_url ? (
        <img src={restaurant.logo_url} alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
      ) : emoji}
    </div>
  )

  const textBlock = (
    <div style={{ textAlign: rtl ? 'right' : 'left' }}>
      <h1 style={{
        fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Fraunces', serif",
        fontWeight: 600, fontSize: 14, color: '#1A4D3E', margin: 0, lineHeight: 1.2,
      }}>
        {restaurant?.name || 'BistroVite'}
      </h1>
      <p style={{
        fontSize: 12, fontWeight: 600, color: primary, margin: '2px 0 0',
        fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : 'inherit',
      }}>
        {t('open_now', lang)}
      </p>
    </div>
  )

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{
      flexShrink: 0, background: '#FFF8F0',
      borderBottom: '1px solid rgba(45,42,38,0.08)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', maxWidth: 448, margin: '0 auto', flexDirection: 'row',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row' }}>
          {logoBlock}
          {textBlock}
        </div>

        <LangSwitcher lang={lang} onSelect={onLangSelect} primary={primary} />
      </div>
    </div>
  )
}