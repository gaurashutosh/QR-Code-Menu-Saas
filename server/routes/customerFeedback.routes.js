import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as feedbackController from "../controllers/customerFeedback.controller.js";

const router = express.Router();

// Public routes
router.post("/public/feedback", feedbackController.submitFeedback);

// Protected routes (Restaurant Owners)
router.get(
  "/restaurants/:id/feedback",
  authMiddleware,
  feedbackController.getRestaurantFeedback,
);

export default router;
