import crypto from "crypto"; // ← ADD THIS
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { environmentVariables } from "../config/config.env.js";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide your password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: {
      type: String,
      select: false,
    },
    emailVerifyExpiry: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare plain password with hashed
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Generate short-lived Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    environmentVariables.ACCESS_TOKEN_SECRET,
    { expiresIn: environmentVariables.ACCESS_TOKEN_EXPIRES_IN || "1d" },
  );
};

// Generate long-lived Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    environmentVariables.REFRESH_TOKEN_SECRET,
    { expiresIn: environmentVariables.REFRESH_TOKEN_EXPIRES_IN || "7d" },
  );
};

// Generate Email Verification Token — hashes before saving to DB
userSchema.methods.generateEmailVerifyToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  // Save hashed version in DB
  this.emailVerifyToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return rawToken; // return raw → sent in email link
};

// Generate Password Reset Token — hashes before saving to DB
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  // Save hashed version in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1hr
  return rawToken; // return raw → sent in email link
};

export const User = mongoose.model("User", userSchema);