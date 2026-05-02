import { Coupon } from "../models/coupon.model.js";

// GET /api/coupons (Admin only)
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons (Admin only)
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/coupons/:id (Admin only)
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/coupons/:id (Admin only)
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/validate/:code (Public - for checkout)
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderValue } = req.query;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon code" });
    if (coupon.status !== "Active") return res.status(400).json({ success: false, message: "Coupon is inactive or expired" });
    if (new Date() < new Date(coupon.validFrom)) return res.status(400).json({ success: false, message: "Coupon is not valid yet" });
    if (new Date() > new Date(coupon.validTo)) return res.status(400).json({ success: false, message: "Coupon is expired" });
    if (coupon.usageLimit > 0 && coupon.currentUsage >= coupon.usageLimit) return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    if (orderValue && Number(orderValue) < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}` });

    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
