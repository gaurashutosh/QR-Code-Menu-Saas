import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { subscriptionMiddleware } from "../middleware/subscription.middleware.js";
import * as menuController from "../controllers/menu.controller.js";

import { body } from "express-validator";
import { validateRequest } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const menuItemValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Item name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number"),
];

// Get menu items
router.get("/:restaurantId", authMiddleware, menuController.getMenuItems);

// Get single item
router.get("/item/:id", authMiddleware, menuController.getMenuItem);

// Protected routes
router.use(authMiddleware);

// Create menu item
router.post(
  "/",
  menuItemValidation,
  validateRequest,
  menuController.createMenuItem,
);

// Update menu item
router.put(
  "/:id",
  menuItemValidation.map((v) => v.optional()),
  validateRequest,
  menuController.updateMenuItem,
);

// Delete menu item
router.delete("/:id", menuController.deleteMenuItem);

// Toggle availability
router.patch("/:id/toggle", menuController.toggleAvailability);

export default router;
