import { Router } from "express";
import { getProductReviews, addReview } from "../controllers/review.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public route to get reviews
router.route("/product/:productId").get(getProductReviews);

// Protected route to add review with image upload
router.route("/product/:productId").post(
  verifyJwt,
  upload.single("image"),
  addReview
);

export default router;
