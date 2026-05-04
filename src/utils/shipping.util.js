import { Settings } from "../models/settings.model.js";

/** Load delivery rules from store settings (single document). */
export async function resolveShippingRates() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  const deliveryCharge = Math.max(0, Number(settings.deliveryCharge ?? 50));
  const freeShippingThreshold = Math.max(0, Number(settings.freeShippingThreshold ?? 499));
  return { deliveryCharge, freeShippingThreshold };
}

/**
 * @param {number} subtotal - cart line total in ₹
 * @param {{ deliveryCharge: number, freeShippingThreshold: number }} rates
 * @returns {number} shipping in ₹ (0 if free)
 * If freeShippingThreshold is 0, every non-empty cart gets free delivery (no minimum).
 */
export function shippingFromSubtotal(subtotal, rates) {
  const s = Math.max(0, Number(subtotal) || 0);
  const threshold = Math.max(0, Number(rates.freeShippingThreshold) || 0);
  const fee = Math.max(0, Number(rates.deliveryCharge) || 0);
  if (s <= 0) return 0;
  if (threshold === 0) return 0;
  if (s >= threshold) return 0;
  return fee;
}

/** Sum line totals from checkout payload items. */
export function subtotalFromItems(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const price = Number(item.price ?? item.unitPrice ?? 0);
    const qty = Math.max(0, Number(item.quantity) || 0);
    return sum + price * qty;
  }, 0);
}
