import { Router } from "express";
import { 
  getDashboardStats, 
  getAnalytics, 
  getCustomersList, 
  getInventory, 
  getAllOrders, 
  updateOrderStatus 
} from "../controllers/admin.controller.js";

const router = Router();

// In a real application, you would add an admin middleware here
// router.use(verifyAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/analytics", getAnalytics);
router.get("/customers", getCustomersList);
router.get("/inventory", getInventory);
router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
