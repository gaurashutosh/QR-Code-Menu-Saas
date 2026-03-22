import express from "express";
import * as publicController from "../controllers/public.controller.js";
import { checkRestaurantSubscription } from "../middleware/subscription.middleware.js";

const router = express.Router();

// Get restaurant by slug
router.get("/restaurant/:slug", checkRestaurantSubscription, publicController.getRestaurantBySlug);

// Get full menu
router.get("/menu/:slug", checkRestaurantSubscription, publicController.getPublicMenu);

// Record scan
router.post("/menu/:slug/scan", publicController.recordScan);

export default router;
