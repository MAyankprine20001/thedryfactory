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
//
// Resolves user from access JWT (header or accessToken cookie), then falls back to
// the httpOnly refreshToken cookie (same validation as /auth/refresh-token). This
// fixes checkout when the SPA has not yet attached the in-memory access token but
// the browser already sent the refresh cookie (e.g. race after page load).
export const optionalAuth = async (req, res, next) => {
  req.user = null;
  try {
    const accessToken =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.cookies?.accessToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          environmentVariables.ACCESS_TOKEN_SECRET,
        );
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // expired/invalid access — try refresh cookie below
      }
    }

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          environmentVariables.REFRESH_TOKEN_SECRET,
        );
        const user = await User.findById(decoded.id).select("+refreshToken");
        if (user?.refreshToken === refreshToken) {
          req.user = await User.findById(decoded.id);
        }
      } catch {
        // invalid refresh — stay guest
      }
    }
  } catch {
    req.user = null;
  }
  next();
};