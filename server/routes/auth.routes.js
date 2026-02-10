import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as authController from "../controllers/auth.controller.js";

import { body } from "express-validator";
import { validateRequest } from "../middleware/validation.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get current user profile
router.get("/me", authController.getMe);

// Update user profile
router.put(
  "/me",
  [
    body("displayName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Display name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email"),
    validateRequest,
  ],
  authController.updateMe,
);

export default router;
