import mongoose, { Schema } from "mongoose";

const settingsSchema = new Schema(
  {
    storeName: {
      type: String,
      default: "The Dry Factory",
    },
    storeEmail: {
      type: String,
      default: "support@thedryfactory.com",
    },
    storePhone: {
      type: String,
      default: "+91 12345 67890",
    },
    storeAddress: {
      type: String,
      default: "123, Dry Fruits Street, Mumbai, Maharashtra - 400001, India",
    },
    currency: {
      type: String,
      default: "INR",
    },
    enableTax: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    enableCoupons: {
      type: Boolean,
      default: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    /** Flat delivery fee in ₹ when cart is below freeShippingThreshold */
    deliveryCharge: {
      type: Number,
      default: 50,
      min: 0,
    },
    /** Cart subtotal (₹) at or above this gets ₹0 delivery. Use 0 for free delivery on all orders. */
    freeShippingThreshold: {
      type: Number,
      default: 499,
      min: 0,
    },
    enableCOD: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "We are under maintenance. We'll be back soon!",
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);
