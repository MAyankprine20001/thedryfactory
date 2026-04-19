import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
} from "../controllers/product.controller.js";

import { verifyJwt, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllProducts);
router.route("/:id").get(getProductById);

// Admin routes
router.use(verifyJwt, isAdmin);

router.route("/seed").post(seedProducts);
router.route("/").post(createProduct);

router.route("/:id").put(updateProduct).delete(deleteProduct);

export default router;
