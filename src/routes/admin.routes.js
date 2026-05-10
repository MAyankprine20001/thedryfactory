import { Router } from "express";
import { verifyJwt, isAdmin } from "../middlewares/auth.middleware.js";
import { 
  getDashboardStats, 
  getAnalytics, 
  getCustomersList, 
  getInventory, 
  getAllOrders, 
  updateOrderStatus 
} from "../controllers/admin.controller.js";
import { deleteGeneralReview } from "../controllers/generalReview.controller.js";

const router = Router();

router.use(verifyJwt, isAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/analytics", getAnalytics);
router.get("/customers", getCustomersList);
router.get("/inventory", getInventory);
router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.delete("/general-reviews/:id", deleteGeneralReview);

export default router;
