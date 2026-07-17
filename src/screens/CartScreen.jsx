import { useNavigate }              from 'react-router-dom'
import { ChevronLeft, ChevronRight,
         Trash2, Plus, Minus }      from 'lucide-react'
import { useCart }                  from '../context/CartContext'
import { useSession }               from '../hooks/useSession'
import { t, isRTL }                 from '../lib/translations'

export default function CartScreen() {
  const navigate = useNavigate()
  const { restaurant, lang, paths } = useSession()
  const {
    cart, subtotal, itemCount,
    removeItem, updateQuantity,
  } = useCart()

  const primary     = restaurant?.primary_color || '#1A4D3E'
  const coral       = '#FF7A47'
  const rtl         = isRTL(lang)
  const BackIcon    = rtl ? ChevronRight : ChevronLeft
  const arabicFont  = lang === 'ar'
    ? "'Noto Naskh Arabic', serif" : 'inherit'

  const isVenueMode = !!restaurant?.is_venue_vendor
  const deliveryFee = isVenueMode
    ? 0 : (restaurant?.delivery_fee || 3.99)
  const total = subtotal + deliveryFee

  function getItemName(item) {
    if (lang === 'ar') return item.name_ar || item.name
    if (lang === 'fr') return item.name_fr || item.name
    return item.name
  }

  if (itemCount === 0) {
    return (
      <div style={{
        minHeight:      '100dvh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        32,
        textAlign:      'center',
        background:     '#FFF8F0',
        direction:      rtl ? 'rtl' : 'ltr',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          🛒
        </div>
        <h2 style={{
          fontFamily:   arabicFont === 'inherit'
            ? "'Fraunces', serif" : arabicFont,
          fontSize:     20,
          color:        '#1A4D3E',
          marginBottom: 8,
        }}>
          {t('cart_empty', lang)}
        </h2>
        <p style={{
          fontSize:     14,
          color:        '#2D2A26',
          opacity:      0.6,
          marginBottom: 24,
          fontFamily:   arabicFont,
        }}>
          {t('cart_empty_sub', lang)}
        </p>
        <button
          onClick={() => navigate(paths.menu())}
          style={{
            padding:      '12px 28px',
            borderRadius: 14,
            background:   primary,
            color:        'white',
            fontWeight:   600,
            border:       'none',
            cursor:       'pointer',
            fontSize:     14,
            fontFamily:   arabicFont,
          }}
        >
          {t('browse_menu', lang)}
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:     '100dvh',
      display:       'flex',
      flexDirection: 'column',
      background:    '#FFF8F0',
      direction:     rtl ? 'rtl' : 'ltr',
    }}>

      {/* Header */}
      <div style={{
        position:     'sticky',
        top:          0,
        zIndex:       10,
        background:   '#FFF8F0',
        borderBottom: '1px solid rgba(45,42,38,0.08)',
        padding:      '14px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
      }}>
        <button
          onClick={() => navigate(paths.menu())}
          style={{
            width:          36,
            height:         36,
            borderRadius:   '50%',
            background:     'rgba(45,42,38,0.06)',
            border:         'none',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          <BackIcon size={20}
            style={{ color: '#2D2A26' }} />
        </button>

        <h1 style={{
          fontFamily: arabicFont === 'inherit'
            ? "'Fraunces', serif" : arabicFont,
          fontSize:   18,
          fontWeight: 600,
          color:      '#1A4D3E',
          margin:     0,
        }}>
          {t('your_cart', lang)}
        </h1>

        <span style={{
          [rtl ? 'marginRight' : 'marginLeft']: 'auto',
          fontFamily:  "'JetBrains Mono', monospace",
          fontSize:    13,
          fontWeight:  700,
          color:       coral,
        }}>
          {itemCount}{' '}
          {itemCount === 1
            ? t('item', lang)
            : t('items', lang)
          }
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex:          1,
        overflowY:     'auto',
        paddingBottom: 120,
      }}>

        {/* Cart items */}
        <div style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {cart.map(item => (
            <div
              key={item.id}
              style={{
                background:   'white',
                borderRadius: 20,
                padding:      16,
                border:       '1px solid rgba(45,42,38,0.06)',
              }}
            >
              <div style={{
                display: 'flex',
                gap:     12,
                flexDirection: rtl ? 'row-reverse' : 'row',
              }}>
                <div style={{ flex: 1, minWidth: 0, textAlign: rtl ? 'right' : 'left' }}>
                  <h3 style={{
                    fontWeight:   700,
                    fontSize:     14,
                    color:        '#2D2A26',
                    marginBottom: 2,
                    fontFamily:   arabicFont,
                  }}>
                    {getItemName(item)}
                  </h3>

                  {item.options &&
                   Object.keys(item.options).length > 0
                   && (
                    <p style={{
                      fontSize:     12,
                      color:        '#2D2A26',
                      opacity:      0.5,
                      marginBottom: 8,
                      fontFamily:   arabicFont,
                    }}>
                      {Object.values(item.options)
                        .map(o => lang === 'ar'
                          ? (o.option_name_ar || o.option_name_en)
                          : lang === 'fr'
                            ? (o.option_name_fr || o.option_name_en)
                            : o.option_name_en
                        )
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}

                  {/* Qty controls — always LTR */}
                  <div style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        12,
                    marginTop:  8,
                    direction:  'ltr',
                    justifyContent: rtl ? 'flex-end' : 'flex-start',
                  }}>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity - 1
                        )
                      }
                      style={{
                        width:          28,
                        height:         28,
                        borderRadius:   '50%',
                        background:     'rgba(45,42,38,0.06)',
                        border:         'none',
                        cursor:         'pointer',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Minus size={14} />
                    </button>

                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize:   14,
                      width:      16,
                      textAlign:  'center',
                    }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity + 1
                        )
                      }
                      style={{
                        width:          28,
                        height:         28,
                        borderRadius:   '50%',
                        background:     primary,
                        border:         'none',
                        cursor:         'pointer',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        color:          'white',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Price + remove */}
                <div style={{
                  textAlign:  rtl ? 'left' : 'right',
                  flexShrink: 0,
                }}>
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize:   14,
                    color:      primary,
                  }}>
                    ${Number(item.total).toFixed(2)}
                  </p>
                  <button
                    onClick={() =>
                      removeItem(item.id)
                    }
                    style={{
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      color:      '#2D2A26',
                      opacity:    0.3,
                      marginTop:  8,
                      padding:    0,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price summary */}
        <div style={{
          margin:       '0 16px',
          background:   'white',
          borderRadius: 20,
          padding:      16,
          border:       '1px solid rgba(45,42,38,0.06)',
        }}>
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           10,
          }}>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              fontSize:       14,
              flexDirection:  rtl ? 'row-reverse' : 'row',
            }}>
              <span style={{ opacity: 0.55, fontFamily: arabicFont }}>
                {t('subtotal', lang)}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            {!isVenueMode && (
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                fontSize:       14,
                flexDirection:  rtl ? 'row-reverse' : 'row',
              }}>
                <span style={{ opacity: 0.55, fontFamily: arabicFont }}>
                  {t('delivery', lang)}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  ${deliveryFee.toFixed(2)}
                </span>
              </div>
            )}

            <div style={{
              height:     1,
              background: 'rgba(45,42,38,0.06)',
            }} />

            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              fontWeight:     700,
              flexDirection:  rtl ? 'row-reverse' : 'row',
            }}>
              <span style={{ color: '#2D2A26', fontFamily: arabicFont }}>
                {t('total', lang)}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                color:      primary,
                fontSize:   18,
              }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Checkout button */}
      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        maxWidth:   448,
        margin:     '0 auto',
        padding:    16,
        background: '#FFF8F0',
      }}>
        <button
          onClick={() => navigate(paths.checkout())}
          style={{
            width:          '100%',
            borderRadius:   18,
            padding:        '16px 24px',
            background:     primary,
            boxShadow:      `0 8px 30px ${primary}44`,
            border:         'none',
            cursor:         'pointer',
            color:          'white',
            fontWeight:     600,
            fontSize:       16,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: arabicFont }}>
            {t('checkout', lang)}
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
          }}>
            ${total.toFixed(2)}
          </span>
        </button>
      </div>

    </div>
  )
}