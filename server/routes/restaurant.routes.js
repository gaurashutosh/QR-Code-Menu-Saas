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
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9+\-() ]*$/)
    .withMessage("Phone number can only contain digits and + - ( )"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),
  // Address validation
  body([
    "address.street",
    "address.city",
    "address.state",
    "address.pincode",
    "address.country",
  ])
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9\s,.-]*$/)
    .withMessage(
      "Address fields can only contain alphanumeric characters, spaces, and , . -",
    ),
  // Social links validation
  body([
    "socialLinks.website",
    "socialLinks.instagram",
    "socialLinks.facebook",
    "socialLinks.twitter",
  ])
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Please provide a valid URL for social links"),
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
