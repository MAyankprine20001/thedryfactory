import { Coupon } from "../models/coupon.model.js";

/** @param {import("mongoose").Document & Record<string, unknown>} coupon */
export function getCouponValidationError(coupon, orderValue) {
    if (!coupon) return "Invalid coupon code";
    if (coupon.status !== "Active") return "Coupon is inactive or expired";
    const now = new Date();
    if (now < new Date(coupon.validFrom)) return "Coupon is not valid yet";
    if (now > new Date(coupon.validTo)) return "Coupon is expired";
    if (coupon.usageLimit > 0 && coupon.currentUsage >= coupon.usageLimit) {
        return "Coupon usage limit reached";
    }
    if (
        orderValue !== undefined &&
        orderValue !== null &&
        !Number.isNaN(Number(orderValue)) &&
        Number(orderValue) < coupon.minOrderValue
    ) {
        return `Minimum order value for this coupon is ₹${coupon.minOrderValue}`;
    }
    return null;
}

/** @param {import("mongoose").Document & Record<string, unknown>} coupon */
export function computeOrderTotalsWithCoupon(subtotal, shipping, coupon) {
    const s = Number(subtotal) || 0;
    const sh = Number(shipping) || 0;
    if (!coupon) {
        return { finalShipping: sh, discount: 0, total: s + sh };
    }
    let itemDiscount = 0;
    let finalShipping = sh;
    const dv = Number(coupon.discountValue) || 0;
    if (coupon.discountType === "Percentage") {
        itemDiscount = Math.round((s * dv) / 100);
        itemDiscount = Math.min(Math.max(0, itemDiscount), s);
    } else if (coupon.discountType === "Flat") {
        itemDiscount = Math.min(Math.max(0, dv), s);
    } else if (coupon.discountType === "Free Shipping") {
        finalShipping = 0;
    }
    const total = Math.max(0, s - itemDiscount + finalShipping);
    const discount = s + sh - total;
    return { finalShipping, discount, total };
}

export async function findAndValidateCoupon(code, orderValue) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return { error: "Invalid coupon code", coupon: null };
    const coupon = await Coupon.findOne({ code: normalized });
    const err = getCouponValidationError(coupon, orderValue);
    if (err) return { error: err, coupon: null };
    return { error: null, coupon };
}
