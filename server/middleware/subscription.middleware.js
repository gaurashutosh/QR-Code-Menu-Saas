import Subscription from "../models/Subscription.js";
import Restaurant from "../models/Restaurant.js";

export const subscriptionMiddleware = async (req, res, next) => {
  try {
    // Get restaurant ID from params or body
    let restaurantId = req.params.restaurantId || req.params.id || req.body.restaurant;

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

    const { subscriptionStatus, trialEndDate, subscriptionEndDate } = req.user;
    const now = new Date();
    
    let isActive = false;
    
    if (subscriptionStatus === "active") {
      if (subscriptionEndDate && new Date(subscriptionEndDate) > now) {
        isActive = true;
      }
    } else if (subscriptionStatus === "trial") {
      if (trialEndDate && new Date(trialEndDate) > now) {
        isActive = true;
      }
      // Missing trialEndDate → treated as expired, isActive stays false
    }

    if (!isActive) {
      return res.status(403).json({
        success: false,
        message: "Your subscription has expired. Please renew to continue.",
        subscriptionStatus,
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict public menu access based on restaurant owner's subscription
 */
export const checkRestaurantSubscription = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Missing slug parameter",
      });
    }

    const restaurant = await Restaurant.findOne({ slug }).populate('owner');
    if (!restaurant || !restaurant.owner) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const owner = restaurant.owner;
    const { subscriptionStatus, trialEndDate, subscriptionEndDate } = owner;
    const now = new Date();

    // Deny-by-default: only allow through for explicitly valid states
    let isAccessBlocked = true;

    if (subscriptionStatus === "active") {
      if (subscriptionEndDate && new Date(subscriptionEndDate) > now) {
        isAccessBlocked = false;
      }
    } else if (subscriptionStatus === "trial") {
      if (trialEndDate && new Date(trialEndDate) > now) {
        isAccessBlocked = false;
      }
      // Missing trialEndDate → blocked
    }
    // "expired" or any unknown status → isAccessBlocked stays true

    if (isAccessBlocked) {
      return res.status(403).json({
        success: false,
        message: "This restaurant's menu is temporarily unavailable. The restaurant owner needs to renew their subscription."
      });
    }

    req.restaurant = restaurant; // Pass it along to save DB query in next controller
    next();
  } catch (error) {
    next(error);
  }
};
