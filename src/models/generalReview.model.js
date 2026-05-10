import mongoose, { Schema } from "mongoose";

const generalReviewSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    product: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: ["powder", "chunks", "chocolate", "combo", "gift", "other"],
      default: "other",
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    tags: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: null,
    },
    helpful: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "generalreviews" }
);

export const GeneralReview = mongoose.model("GeneralReview", generalReviewSchema);
