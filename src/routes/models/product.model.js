import mongoose, { Schema, Types } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    tag: {
      type: String,
      trim: true,
    },
    tagColor: {
      type: String,
      default: "#e84444",
    },
    badge: {
      type: String,
      trim: true,
    },
    accent: {
      type: String,
      default: "#e84444",
    },
    bg: {
      type: String,
      default: "from-[#fff2f2] to-[#ffe0e0]",
    },
    borderColor: {
      type: String,
      default: "#f5c0c0",
    },
    gradientFrom: {
      type: String,
      default: "#e84444",
    },
    gradientTo: {
      type: String,
      default: "#c0392b",
    },
    emoji: {
      type: String,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    path: {
      type: String,
    },
    highlights: {
      type: [String],
      default: [],
    },
    weight: {
      type: String,
      trim: true,
    },
    stock: {
      type: String,
      enum: ["In Stock", "Out of Stock", "Low Stock"],
      default: "In Stock",
    },
    stockCount: {
      type: Number,
      default: 0,
    },
    comboItems: {
      type: [String],
      default: [],
    },
    isGift: {
      type: Boolean,
      default: false,
    },
    giftNote: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    salesCount: {
      type: Number,
      default: 0,
    },
    urgencyLine: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    trustBadges: {
      type: [String],
      default: [],
    },
    relatedProducts: [
      {
        type: Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
