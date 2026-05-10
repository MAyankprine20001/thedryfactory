import { GeneralReview } from "../models/generalReview.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendAdminNewReviewEmail } from "../utils/sendEmail.js";

// @desc    Get all general reviews
// @route   GET /api/v1/general-reviews
// @access  Public
export const getGeneralReviews = asyncHandler(async (req, res) => {
  const { category, sort, tag } = req.query;

  const filter = {};
  if (category && category !== "all") {
    filter.category = category;
  }
  if (tag) {
    filter.tags = tag;
  }

  let sortOption = { createdAt: -1 };
  if (sort === "helpful") sortOption = { helpful: -1, createdAt: -1 };
  else if (sort === "highest") sortOption = { rating: -1, createdAt: -1 };
  else if (sort === "lowest") sortOption = { rating: 1, createdAt: -1 };

  const reviews = await GeneralReview.find(filter).sort(sortOption);

  // Calculate aggregate stats
  const allReviews = await GeneralReview.find({});
  const total = allReviews.length;
  const average =
    total > 0
      ? Math.round((allReviews.reduce((acc, r) => acc + r.rating, 0) / total) * 10) / 10
      : 0;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = allReviews.filter((r) => r.rating === stars).length;
    return { stars, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });

  return res.status(200).json(
    new ApiResponse(200, { reviews, stats: { average, total, breakdown } }, "Reviews fetched successfully")
  );
});

// @desc    Add a general review (no auth required)
// @route   POST /api/v1/general-reviews
// @access  Public
export const addGeneralReview = asyncHandler(async (req, res) => {
  const { name, email, location, product, category, title, comment, rating, tags } = req.body;

  if (!name || !email || !title || !comment || !rating) {
    throw new ApiError(400, "Name, email, title, comment, and rating are required");
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // Handle optional image upload
  let imageUrl = null;
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse) {
      throw new ApiError(500, "Failed to upload image");
    }
    imageUrl = cloudinaryResponse.url;
  }

  // Parse tags if sent as JSON string
  let parsedTags = [];
  if (tags) {
    try {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    } catch {
      parsedTags = Array.isArray(tags) ? tags : [];
    }
  }

  const review = await GeneralReview.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    location: location?.trim() || "",
    product: product?.trim() || "",
    category: category || "other",
    title: title.trim(),
    comment: comment.trim(),
    rating: Number(rating),
    tags: parsedTags,
    image: imageUrl,
  });

  // Send admin notification email (non-blocking)
  sendAdminNewReviewEmail({
    name: review.name,
    email: review.email,
    location: review.location,
    product: review.product,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    tags: review.tags,
  }).catch((err) => console.error("Admin review email error:", err));

  return res.status(201).json(new ApiResponse(201, review, "Review submitted successfully"));
});

// @desc    Mark a review as helpful
// @route   POST /api/v1/general-reviews/:id/helpful
// @access  Public
export const markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await GeneralReview.findByIdAndUpdate(
    id,
    { $inc: { helpful: 1 } },
    { new: true }
  );

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  return res.status(200).json(new ApiResponse(200, { helpful: review.helpful }, "Marked as helpful"));
});
