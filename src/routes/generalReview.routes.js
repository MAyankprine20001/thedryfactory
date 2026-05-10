import { Router } from "express";
import {
  getGeneralReviews,
  addGeneralReview,
  markHelpful,
} from "../controllers/generalReview.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getGeneralReviews).post(upload.single("image"), addGeneralReview);
router.route("/:id/helpful").post(markHelpful);

export default router;
