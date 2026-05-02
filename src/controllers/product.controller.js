import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  encodeCursor,
  decodeCursor,
  compoundLtFilter,
  escapeRegex,
} from "../utils/cursorPagination.js";

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

// @desc    Admin catalog — cursor pagination + search + optional stock tab
// @route   GET /api/v1/products/admin/catalog
// @access  Private/Admin
export const getAdminProductCatalog = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const cursorParam = req.query.cursor || null;
  const search = String(req.query.search || "").trim();
  const stockTab = String(req.query.stock || "").trim();

  const filter = {};
  if (search.length > 0) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { category: { $regex: escapeRegex(search), $options: "i" } },
      { sku: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }
  if (stockTab && stockTab !== "All Products") {
    filter.stock = stockTab;
  }

  const cursorDoc = decodeCursor(cursorParam);
  const lt = compoundLtFilter(cursorDoc);
  const parts = [];
  if (Object.keys(filter).length > 0) parts.push(filter);
  if (Object.keys(lt).length > 0) parts.push(lt);
  const mongoFilter =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0] : { $and: parts };

  const docs = await Product.find(mongoFilter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);

  const hasNextPage = docs.length > limit;
  const slice = hasNextPage ? docs.slice(0, limit) : docs;
  const nextCursor =
    hasNextPage && slice.length > 0 ? encodeCursor(slice[slice.length - 1]) : null;

  const countFilter = {};
  if (search.length > 0) countFilter.$or = filter.$or;
  if (stockTab && stockTab !== "All Products") countFilter.stock = stockTab;
  const total = await Product.countDocuments(
    Object.keys(countFilter).length ? countFilter : {}
  );

  return res.status(200).json({
    success: true,
    data: slice,
    nextCursor,
    hasNextPage,
    limit,
    total,
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
