import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { environmentVariables } from "./config/config.env.js";
const app = express();

app.use(
  cors({
    origin: environmentVariables.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

export { app };
