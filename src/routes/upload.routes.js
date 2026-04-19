import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyJwt, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/image").post(
  verifyJwt,
  isAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const localFilePath = req.file?.path;

    if (!localFilePath) {
      throw new ApiError(400, "Image file is required");
    }

    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResponse) {
      throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { url: cloudinaryResponse.url }, "Image uploaded successfully")
      );
  })
);

export default router;
