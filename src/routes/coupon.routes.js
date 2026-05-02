import { Router } from "express";
import { 
  getAllCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  validateCoupon 
} from "../controllers/coupon.controller.js";

const router = Router();

// Public route
router.get("/validate/:code", validateCoupon);

// Admin routes (should have verifyAdmin middleware in a real app)
router.get("/", getAllCoupons);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
