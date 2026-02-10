import express from "express";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/auth.middleware.js";
import * as feedbackController from "../controllers/feedback.controller.js";

const router = express.Router();

// Public/User routes
// Note: authMiddleware is optional for public feedback if you want to support anonymous,
// but for now let's make it optional in the controller logic (req.user check)
// Here we apply authMiddleware but it should be flexible or we can have separate public route.
// Let's allow unauthenticated for public form, but if token present utilize it.
// Standard approach: use authMiddleware separately for authenticated vs public.
// For simplicity, let's make the create route public but check header manually or use a "soft" auth middleware
// For now, let's keep it simple: Anyone can post.

router.post("/", feedbackController.createFeedback);

// Admin routes
router.use("/admin", authMiddleware, adminMiddleware);

router.get("/admin", feedbackController.getAllFeedback);
router.patch("/admin/:id", feedbackController.updateFeedbackStatus);
router.delete("/admin/:id", feedbackController.deleteFeedback);

export default router;
