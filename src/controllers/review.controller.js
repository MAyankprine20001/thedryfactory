import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .populate("user", "fullName email") // Populate user name
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

// @desc    Add a review
// @route   POST /api/v1/reviews/product/:productId
// @access  Private (Logged in user)
export const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!rating || !comment) {
    throw new ApiError(400, "Rating and comment are required");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Handle image upload if provided
  let imageUrl = null;
  if (req.file) {
    const localFilePath = req.file.path;
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
    if (!cloudinaryResponse) {
      throw new ApiError(500, "Failed to upload image");
    }
    imageUrl = cloudinaryResponse.url;
  }

  // Create review
  const review = await Review.create({
    user: userId,
    product: productId,
    rating: Number(rating),
    comment,
    image: imageUrl,
  });

  // Calculate new average rating for product
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const avgRating =
    reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

  product.rating = avgRating;
  product.reviews = numReviews;
  await product.save();

  // Populate user before returning
  await review.populate("user", "fullName email");

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review added successfully"));
});
