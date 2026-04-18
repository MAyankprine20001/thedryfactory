import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { environmentVariables } from "../config/config.env.js";

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
    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error("JWT verification failed", error);
    return res
      .status(401)
      .json({ status: false, message: "Unauthorized - Invalid token" });
  }
};
