import { Router } from "express";
import { verifyJwt, isAdmin } from "../middlewares/auth.middleware.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";

const router = Router();

router.get("/", getSettings);
router.put("/", verifyJwt, isAdmin, updateSettings);

export default router;
