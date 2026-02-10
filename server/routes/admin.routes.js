import express from "express";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Get dashboard stats
router.get("/stats", adminController.getStats);

// Get analytics data for charts
router.get("/analytics", adminController.getAnalytics);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserDetails);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// Restaurant management
router.get("/restaurants", adminController.getAllRestaurants);
router.patch("/restaurants/:id/toggle", adminController.toggleRestaurantStatus);
router.delete("/restaurants/:id", adminController.deleteRestaurant);

export default router;
