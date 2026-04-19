import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";
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
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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
  sendVerificationEmail({ to: email, name: fullName, verifyUrl }).catch((err) =>
    console.error("Verification email failed:", err)
  );

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
    },
  });
});

// ─── REFRESH ACCESS TOKEN ─────────────────────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  const decoded = jwt.verify(
    incomingRefreshToken,
    environmentVariables.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);

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

  sendPasswordResetEmail({ to: email, name: user.fullName, resetUrl }).catch(console.error);

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

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json({
      success: true,
      message: "Logged out successfully",
      data: {},
    });
});