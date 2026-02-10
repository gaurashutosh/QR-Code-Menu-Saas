import express from "express";
import * as publicController from "../controllers/public.controller.js";

const router = express.Router();

// Get restaurant by slug
router.get("/restaurant/:slug", publicController.getRestaurantBySlug);

// Get full menu
router.get("/menu/:slug", publicController.getPublicMenu);

// Record scan
router.post("/menu/:slug/scan", publicController.recordScan);

export default router;
