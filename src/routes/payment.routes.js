import { Router } from "express";
import {
    createOrder,
    verifyPayment,
    getMyOrders,
    getOrderById,
    getAdminOrderStats,
    getAllOrders,
    paymentErrorHandler,
} from "../controllers/payment.controller.js";

// ✅ verifyJwt (lowercase t) — matches your auth.middleware.js export
import { verifyJwt, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── Public / Guest-friendly ──────────────────────────────────────────────────
router.post("/create-order", optionalAuth, createOrder);
router.post("/verify", optionalAuth, verifyPayment);

// ─── Protected (must be logged in) ───────────────────────────────────────────
router.get("/my-orders", verifyJwt, getMyOrders);
router.get("/order/:orderId", verifyJwt, getOrderById);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.get("/admin/orders/stats", verifyJwt, getAdminOrderStats);
router.get("/admin/orders", verifyJwt, getAllOrders);

// ─── Error handler (must be last) ─────────────────────────────────────────────
router.use(paymentErrorHandler);

export default router;