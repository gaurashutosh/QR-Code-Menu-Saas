import Subscription from "../models/Subscription.js";
import Restaurant from "../models/Restaurant.js";

/**
 * Middleware to check if user has an active subscription
 */
export const subscriptionMiddleware = async (req, res, next) => {
  try {
    // Get restaurant ID from params or body
    const restaurantId =
      req.params.restaurantId || req.params.id || req.body.restaurant;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required",
      });
    }

    // Find the restaurant
    const restaurant = await Restaurant.findById(restaurantId);
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
