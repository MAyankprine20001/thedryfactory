import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  
  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
  });
});

// @desc    Get product by ID
// @route   GET /api/v1/products/:id
// @access  Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "relatedProducts",
    "name image category price subtitle weight urgencyLine trustBadges stock"
  );
  
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: product,
  });
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;

  const product = await Product.create(productData);

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productData = req.body;

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: productData },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    data: {},
  });
});

// @desc    Seed products
// @route   POST /api/v1/products/seed
// @access  Private/Admin
export const seedProducts = asyncHandler(async (req, res) => {
  const products = req.body;

  if (!Array.isArray(products)) {
    throw new ApiError(400, "Invalid products data. Expected an array.");
  }

  // Clear existing products if you want a clean slate
  await Product.deleteMany({});

  const createdProducts = await Product.insertMany(products);

  return res.status(201).json({
    success: true,
    message: `${createdProducts.length} products seeded successfully`,
    data: createdProducts,
  });
});
