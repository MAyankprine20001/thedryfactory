import { Settings } from "../models/settings.model.js";

const ALLOWED_UPDATE_KEYS = new Set([
  "storeName",
  "storeEmail",
  "storePhone",
  "storeAddress",
  "currency",
  "enableTax",
  "taxRate",
  "enableCoupons",
  "minOrderAmount",
  "deliveryCharge",
  "freeShippingThreshold",
  "enableCOD",
  "maintenanceMode",
  "maintenanceMessage",
]);

function sanitizeSettingsPatch(body) {
  const patch = {};
  if (!body || typeof body !== "object") return patch;
  for (const key of ALLOWED_UPDATE_KEYS) {
    if (!(key in body)) continue;
    let v = body[key];
    if (
      key === "taxRate" ||
      key === "minOrderAmount" ||
      key === "deliveryCharge" ||
      key === "freeShippingThreshold"
    ) {
      v = Math.max(0, Number(v) || 0);
    }
    if (key === "enableTax" || key === "enableCoupons" || key === "enableCOD" || key === "maintenanceMode") {
      v = Boolean(v);
    }
    if (typeof v === "string" && ["storeName", "storeEmail", "storePhone", "storeAddress", "currency", "maintenanceMessage"].includes(key)) {
      v = String(v).trim();
    }
    patch[key] = v;
  }
  return patch;
}

// GET /api/v1/settings — public (storefront + admin read)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/settings — admin only (see routes)
export const updateSettings = async (req, res) => {
  try {
    const patch = sanitizeSettingsPatch(req.body);
    if (Object.keys(patch).length === 0) {
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create({});
      return res.status(200).json({ success: true, data: settings });
    }
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(patch);
    } else {
      settings = await Settings.findOneAndUpdate({}, { $set: patch }, { new: true });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
