import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { environmentVariables } from "../config/config.env.js";

// ─── 1. Full JWT verification (existing — unchanged) ──────────────────────────
export const verifyJwt = async (req, res, next) => {
  try {
    const token =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.cookies?.accessToken;

    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized - No token" });
    }

    const decoded = jwt.verify(token, environmentVariables.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized - User not found" });
    }

    req.user = user; // full Mongoose user doc attached
    next();
  } catch (error) {
    console.error("JWT verification failed", error);
    return res
      .status(401)
      .json({ status: false, message: "Unauthorized - Invalid token" });
  }
};

// ─── 2. Admin guard (existing — unchanged) ────────────────────────────────────
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Forbidden - Admin access required",
    });
  }
};

// ─── 3. Optional auth — NEW (for guest checkout) ─────────────────────────────
// Attaches req.user if a valid token is present, but never blocks the request.
// Use on payment routes that support both logged-in users AND guests.
export const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.cookies?.accessToken;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, environmentVariables.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    req.user = user || null;
  } catch (_) {
    // Invalid or expired token → treat as guest, don't block the request
    req.user = null;
  }
  next();
};