import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { environmentVariables } from "./config/config.env.js";
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import uploadRouter from "./routes/upload.routes.js";

const allowedOrigins = [
  "https://thedryfactory.com",
  "https://www.thedryfactory.com",
  "http://localhost:5173", // for local dev
  "http://localhost:3000", // for local dev
];

const app = express();
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/upload", uploadRouter);

export { app };
