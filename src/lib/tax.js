// Computes tax based on the vendor's own registered
// rates — never derived from customer location.
// Returns a breakdown array (supports multi-rate
// jurisdictions like Quebec's GST+QST) plus the total.

export function calculateTax(subtotal, deliveryFee, vendor) {
  if (!vendor?.tax_enabled) {
    return { lines: [], totalTax: 0 }
  }

  const taxableBase = vendor.tax_applies_to === 'subtotal_plus_delivery'
    ? subtotal + deliveryFee
    : subtotal

  const lines = []

  if (vendor.tax_rate_1_pct) {
    lines.push({
      name: vendor.tax_rate_1_name || 'Tax',
      pct: Number(vendor.tax_rate_1_pct),
      amount: taxableBase * (Number(vendor.tax_rate_1_pct) / 100),
    })
  }

  if (vendor.tax_rate_2_pct) {
    lines.push({
      name: vendor.tax_rate_2_name || 'Tax 2',
      pct: Number(vendor.tax_rate_2_pct),
      amount: taxableBase * (Number(vendor.tax_rate_2_pct) / 100),
    })
  }

  const totalTax = lines.reduce((sum, l) => sum + l.amount, 0)

  return { lines, totalTax }
}