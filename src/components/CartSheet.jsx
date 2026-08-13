import { Trash2, Plus, Minus } from 'lucide-react'
import { useCart }             from '../context/CartContext'
import { t, isRTL }            from '../lib/translations'
import { formatPrice }         from '../lib/currency'
import SheetCloseButton        from './SheetCloseButton'

export default function CartSheet({
  lang, restaurant, onClose, onCheckout
}) {
  const primary = restaurant?.primary_color || '#1A4D3E'
  const rtl     = isRTL(lang)
  const arabicFont = lang === 'ar' ? "'Noto Naskh Arabic', serif" : 'inherit'
  const { cart, subtotal, itemCount, removeItem, updateQuantity } = useCart()

  const isVenueMode = !!restaurant?.is_venue_vendor
  const deliveryFee = isVenueMode ? 0 : (restaurant?.delivery_fee || 3.99)
  const total = subtotal + deliveryFee

  function getItemName(item) {
    if (lang === 'ar') return item.name_ar || item.name
    if (lang === 'fr') return item.name_fr || item.name
    return item.name
  }

  const titleSidePad = { [rtl ? 'paddingLeft' : 'paddingRight']: 40 }

  if (itemCount === 0) {
    return (
      <div
        dir={rtl ? 'rtl' : 'ltr'}
        style={{
          position: 'relative',
          padding: '50px 24px',
          textAlign: 'center'
        }}
      >
        <SheetCloseButton lang={lang} onClose={onClose} />

        <div style={{ fontSize: 44, marginBottom: 14 }}>🛒</div>

        <h3
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 18,
            color: '#1A4D3E',
            marginBottom: 6
          }}
        >
          {t('cart_empty', lang)}
        </h3>

        <p
          style={{
            fontSize: 13,
            opacity: 0.55,
            fontFamily: arabicFont
          }}
        >
          {t('cart_empty_sub', lang)}
        </p>
      </div>
    )
  }

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        position: 'relative',
        padding: '4px 16px 20px'
      }}
    >
      <SheetCloseButton lang={lang} onClose={onClose} />

      <h2
        style={{
          fontFamily:
            arabicFont === 'inherit'
              ? "'Fraunces', serif"
              : arabicFont,
          fontSize: 18,
          fontWeight: 700,
          color: '#1A4D3E',
          margin: '10px 0 14px',
          textAlign: rtl ? 'right' : 'left',
          ...titleSidePad
        }}
      >
        {t('your_cart', lang)} · {itemCount}
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 16
        }}
      >
        {cart.map(item => (
          <div
            key={item.id}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 12,
              border: '1px solid rgba(45,42,38,0.06)'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexDirection: rtl ? 'row-reverse' : 'row'
              }}
            >

              {/* Name + quantity stepper */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: rtl ? 'right' : 'left'
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#2D2A26',
                    marginBottom: 6,
                    fontFamily: arabicFont
                  }}
                >
                  {getItemName(item)}
                </p>

                {/* Quantity control
                    English/French:  -   qty   +
                    Arabic:           qty   +    -
                    
                    This mirrors the English/French arrangement
                    while keeping the quantity on the right in RTL.
                */}
                {rtl ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      justifyContent: 'flex-end'
                    }}
                  >
                    {/* Quantity */}
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 13,
                        width: 16,
                        textAlign: 'center'
                      }}
                    >
                      {item.quantity}
                    </span>

                    {/* + then - in RTL */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: primary,
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus
                          size={12}
                          style={{ margin: 'auto' }}
                        />
                      </button>

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(45,42,38,0.06)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus
                          size={12}
                          style={{ margin: 'auto' }}
                        />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    {/* - */}
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity - 1
                        )
                      }
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(45,42,38,0.06)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus
                        size={12}
                        style={{ margin: 'auto' }}
                      />
                    </button>

                    {/* Quantity */}
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 13,
                        width: 16,
                        textAlign: 'center'
                      }}
                    >
                      {item.quantity}
                    </span>

                    {/* + */}
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity + 1
                        )
                      }
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: primary,
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus
                        size={12}
                        style={{ margin: 'auto' }}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Price + delete column */}
              <div
                style={{
                  textAlign: rtl ? 'left' : 'right'
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: 13,
                    color: primary
                  }}
                >
                  {formatPrice(item.total, restaurant, lang)}
                </p>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    opacity: 0.6,
                    marginTop: 6
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal / delivery / total */}
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 14,
          border: '1px solid rgba(45,42,38,0.06)',
          marginBottom: 16
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            marginBottom: 6,
            flexDirection: rtl ? 'row-reverse' : 'row'
          }}
        >
          <span
            style={{
              opacity: 0.55,
              fontFamily: arabicFont
            }}
          >
            {t('subtotal', lang)}
          </span>

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {formatPrice(subtotal, restaurant, lang)}
          </span>
        </div>

        {!isVenueMode && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              marginBottom: 6,
              flexDirection: rtl ? 'row-reverse' : 'row'
            }}
          >
            <span
              style={{
                opacity: 0.55,
                fontFamily: arabicFont
              }}
            >
              {t('delivery', lang)}
            </span>

            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {formatPrice(deliveryFee, restaurant, lang)}
            </span>
          </div>
        )}

        <div
          style={{
            height: 1,
            background: 'rgba(45,42,38,0.06)',
            margin: '8px 0'
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700,
            flexDirection: rtl ? 'row-reverse' : 'row'
          }}
        >
          <span style={{ fontFamily: arabicFont }}>
            {t('total', lang)}
          </span>

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: primary,
              fontSize: 16
            }}
          >
            {formatPrice(total, restaurant, lang)}
          </span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        style={{
          width: '100%',
          borderRadius: 18,
          padding: '15px 22px',
          background: primary,
          border: 'none',
          color: 'white',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: `0 8px 24px ${primary}44`,
          fontFamily: arabicFont
        }}
      >
        {t('checkout', lang)}
      </button>
    </div>
  )
}