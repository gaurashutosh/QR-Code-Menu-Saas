import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { subscriptionMiddleware } from "../middleware/subscription.middleware.js";
import * as restaurantController from "../controllers/restaurant.controller.js";

import { body } from "express-validator";
import { validateRequest } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const restaurantValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Restaurant name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("slug")
    .optional({ checkFalsy: true })
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      "Handle can only contain lowercase letters, numbers, and hyphens",
    )
    .isLength({ min: 3, max: 50 })
    .withMessage("Handle must be between 3 and 50 characters"),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage("Phone number must be a valid format (e.g., +911234567890)"),
  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),
  // Address validation
  body("address.street")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-zA-Z0-9\s,.-]*$/)
    .withMessage(
      "Street address can only contain alphanumeric characters, spaces, and , . -",
    ),
  body(["address.city", "address.state"])
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage("City and State can only contain alphabets and spaces"),
  body("address.pincode")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage("Pincode must be exactly 6 digits"),
  body("address.country").trim().notEmpty().withMessage("Country is required"),
  // Social links validation
  body("socialLinks.website")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Please provide a valid URL for website"),
  body("socialLinks.instagram")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Please provide a valid URL for instagram"),
  body("socialLinks.facebook")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Please provide a valid URL for facebook"),
  body("socialLinks.twitter")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Please provide a valid URL for twitter"),
];

// All routes require authentication
router.use(authMiddleware);

// Create restaurant
router.post(
  "/",
  restaurantValidation,
  validateRequest,
  restaurantController.createRestaurant,
);

// Get user's restaurant
router.get("/my", restaurantController.getMyRestaurant);

// Get restaurant by ID
router.get("/:id", restaurantController.getRestaurantById);

// Update restaurant (requires subscription)
router.put(
  "/:id",
  subscriptionMiddleware,
  [
    ...restaurantValidation.map((v) => v.optional()), // Make fields optional for update
    validateRequest,
  ],
  restaurantController.updateRestaurant,
);

// Delete restaurant
router.delete("/:id", restaurantController.deleteRestaurant);

// QR Code routes
router.get("/:id/qr", restaurantController.getQRCode);
router.post(
  "/:id/qr/regenerate",
  subscriptionMiddleware,
  restaurantController.regenerateQRCode,
);

export default router;
