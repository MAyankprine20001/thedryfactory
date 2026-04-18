import { Router } from "express";
import {
  register,
  login,
  getMe,
  verifyEmail,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", verifyJwt, getMe);
router.post("/logout", verifyJwt, logout);

export default router;
