import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { environmentVariables } from "./config/config.env.js";

// ─── Existing routers ─────────────────────────────────────────────────────────
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import reviewRouter from "./routes/review.routes.js";
import generalReviewRouter from "./routes/generalReview.routes.js";

// ─── New: Payment router ──────────────────────────────────────────────────────
import paymentRouter from "./routes/payment.routes.js";

// ─── Admin routers ────────────────────────────────────────────────────────────
import adminRouter from "./routes/admin.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import settingsRouter from "./routes/settings.routes.js";

const app = express();

// ─── CORS (existing — unchanged) ──────────────────────────────────────────────
const allowedOrigins = [
  "https://thedryfactory.com",
  "https://www.thedryfactory.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ─── Core middleware (existing — unchanged) ───────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/general-reviews", generalReviewRouter);

// ─── New: Payment routes ──────────────────────────────────────────────────────
app.use("/api/v1/payments", paymentRouter);

// ─── Admin routes ─────────────────────────────────────────────────────────────
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/settings", settingsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date(),
  });
});

export { app };