import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAdminNewUserEmail,
} from "../utils/sendEmail.js";
import { environmentVariables } from "../config/config.env.js";

// ─── Helper: generate both tokens & save refresh to DB ───────────────────────
const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ─── Helper: cookie options ───────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  ...(isProduction && { domain: ".thedryfactory.com" })
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already in use");
  }

  // Create user first
  const user = await User.create({ fullName, email, password });

  // Use model method — hashes internally, saves hashed to DB
  const rawToken = user.generateEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${environmentVariables.CLIENT_URL}/verify-email?token=${rawToken}`;

  const { accessToken, refreshToken } = await generateTokens(user._id);

  // Send email (non-blocking)
// In register controller
try {
  const result = await sendVerificationEmail({ to: email, name: fullName, verifyUrl });
  console.log("✅ Email sent:", result);
} catch (err) {
  console.error("❌ Email error:", err.message); // will show in Vercel logs
}

// Non-blocking: notify admin of new registration
sendAdminNewUserEmail({
  name: fullName,
  email,
  joinedAt: new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }),
}).catch((err) => console.error("❌ Admin notification email error:", err.message));

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      data: {
        token: accessToken,
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          address: user.address,
        },
      },
    });
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  // ✅ Hash incoming raw token to match hashed version in DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired");
  }

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: "Email verified successfully",
    data: {},
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message: "Logged in successfully",
      data: {
        token: accessToken,
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          address: user.address,
        },
      },
    });
});

// ─── GET CURRENT USER (/auth/me) ──────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: {
      id: req.user._id,
      name: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
      address: req.user.address,
    },
  });
});

// ─── REFRESH ACCESS TOKEN ─────────────────────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      environmentVariables.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res
        .status(401)
        .clearCookie("refreshToken", cookieOptions)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user._id,
    );

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "Token refreshed",
        data: { token: accessToken },
      });
  } catch (error) {
    return res
      .status(401)
      .clearCookie("refreshToken", cookieOptions)
      .json({ success: false, message: error?.message || "Invalid refresh token" });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If this email exists, a reset link has been sent",
      data: {},
    });
  }

  // Use model method — hashes internally
  const rawToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${environmentVariables.CLIENT_URL}/reset-password?token=${rawToken}`;

  sendPasswordResetEmail({ to: email, name: user.fullName, resetUrl }).catch(
    console.error,
  );

  return res.status(200).json({
    success: true,
    message: "If this email exists, a reset link has been sent",
    data: {},
  });
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, "Token and new password are required");
  }

  // ✅ Hash incoming raw token to match hashed version in DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or has expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshToken = undefined; // force logout all sessions
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully. Please login.",
    data: {},
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  return res.status(200).clearCookie("refreshToken", cookieOptions).json({
    success: true,
    message: "Logged out successfully",
    data: {},
  });
});

// ─── SEED ADMIN (Temporary Route) ─────────────────────────────────────────────────
export const seedAdmin = asyncHandler(async (req, res) => {
  console.log("Seed Admin route hit!");
  const adminEmail = "hello@thedryfactory.com";
  const adminPassword = "Pass@123";

  try {
    let user = await User.findOne({ email: adminEmail });
    console.log("Checking for existing user:", user ? "Found" : "Not Found");

    if (user) {
      user.role = "admin";
      user.password = adminPassword;
      user.isEmailVerified = true;
      await user.save();
      console.log("Admin user updated successfully");
    } else {
      user = await User.create({
        fullName: "The Dry Factory Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isEmailVerified: true,
      });
      console.log("Admin user created successfully:", user._id);
    }

    return res.status(200).json({
      success: true,
      message: "Admin user seeded successfully",
      data: { email: adminEmail, role: "admin" },
    });
  } catch (error) {
    console.error("SEED ADMIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ─── ADMIN: GET ALL CUSTOMERS ───────────────────────────────────────────
export const getAllCustomers = asyncHandler(async (req, res) => {
  const { Order } = await import("../models/Order.model.js");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

  const query = search
    ? {
        role: "customer",
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : { role: "customer" };

  const [customers, total] = await Promise.all([
    User.find(query)
      .select("fullName email isEmailVerified createdAt address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  // Attach order counts per customer
  const customerIds = customers.map((c) => c._id);
  const orderCounts = await Order.aggregate([
    { $match: { user: { $in: customerIds } } },
    { $group: { _id: "$user", count: { $sum: 1 }, totalSpent: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$total", 0] } } } },
  ]);

  const orderCountMap = {};
  orderCounts.forEach((o) => {
    orderCountMap[o._id.toString()] = { count: o.count, totalSpent: o.totalSpent };
  });

  const data = customers.map((c) => ({
    _id: c._id,
    fullName: c.fullName,
    email: c.email,
    isEmailVerified: c.isEmailVerified,
    createdAt: c.createdAt,
    address: c.address,
    orderCount: orderCountMap[c._id.toString()]?.count || 0,
    totalSpent: orderCountMap[c._id.toString()]?.totalSpent || 0,
  }));

  return res.status(200).json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data,
  });
});
