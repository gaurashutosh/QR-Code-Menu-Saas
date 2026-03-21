import Subscription from "../models/Subscription.js";
import Restaurant from "../models/Restaurant.js";

/**
 * Middleware to check if user has an active subscription
 */
export const subscriptionMiddleware = async (req, res, next) => {
  try {
    // Get restaurant ID from params or body
    let restaurantId =
      req.params.restaurantId || req.params.id || req.body.restaurant;

    let restaurant;
    if (!restaurantId) {
      // Fallback: Find restaurant owned by the user
      restaurant = await Restaurant.findOne({ owner: req.user._id });
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found. Please create one first.",
        });
      }
      restaurantId = restaurant._id;
    } else {
      restaurant = await Restaurant.findById(restaurantId);
    }
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check if user owns the restaurant
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      restaurant: restaurantId,
      user: req.user._id,
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "No subscription found for this restaurant",
      });
    }

    // Check if subscription is active
    if (!subscription.isActive()) {
      return res.status(403).json({
        success: false,
        message: "Your subscription has expired. Please renew to continue.",
        subscriptionStatus: subscription.status,
      });
    }

    req.restaurant = restaurant;
    req.subscription = subscription;
    next();
  } catch (error) {
    next(error);
  }
};
