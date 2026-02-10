import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload, uploadToCloudinary } from "../services/upload.service.js";

const router = express.Router();

// All upload routes require auth
router.use(authMiddleware);

/**
 * Upload single image
 * POST /api/upload
 */
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const folder = req.body.folder || "qr-menu/general";
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload restaurant logo
 * POST /api/upload/logo
 */
router.post("/logo", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "qr-menu/logos");

    res.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload menu item image
 * POST /api/upload/menu-item
 */
router.post("/menu-item", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "qr-menu/menu-items",
    );

    res.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
