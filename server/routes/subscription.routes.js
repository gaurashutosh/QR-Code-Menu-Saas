import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as subscriptionController from "../controllers/subscription.controller.js";

const router = express.Router();

// Webhook (no auth - called by Stripe)
router.post("/webhook", subscriptionController.handleWebhook);

// Protected routes
router.use(authMiddleware);

// Get subscription status
router.get("/status", subscriptionController.getSubscriptionStatus);

// Create checkout session
router.post("/create-checkout", subscriptionController.createCheckoutSession);

// Get payment history
router.get("/history", subscriptionController.getPaymentHistory);

// Cancel subscription
router.post("/cancel", subscriptionController.cancelSubscription);

export default router;
