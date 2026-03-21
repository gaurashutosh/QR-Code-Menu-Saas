import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { subscriptionMiddleware } from "../middleware/subscription.middleware.js";
import * as categoryController from "../controllers/category.controller.js";

import { body } from "express-validator";
import { validateRequest } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const categoryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
];

// Get categories (public within auth)
router.get("/:restaurantId", authMiddleware, categoryController.getCategories);

// Protected routes
router.use(authMiddleware);

// Create category
router.post(
  "/",
  subscriptionMiddleware,
  categoryValidation,
  validateRequest,
  categoryController.createCategory,
);

// Update category
router.put(
  "/:id",
  subscriptionMiddleware,
  categoryValidation.map((v) => v.optional()),
  validateRequest,
  categoryController.updateCategory,
);

// Delete category
router.delete("/:id", subscriptionMiddleware, categoryController.deleteCategory);

// Reorder categories
router.patch("/reorder", subscriptionMiddleware, categoryController.reorderCategories);

export default router;
