import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Subscription from "../models/Subscription.js";

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    // console.log("getMe called for user:", req.user._id);
    const user = await User.findById(req.user._id).select("-__v");
    // console.log("User found:", user ? "yes" : "no");

    // Get user's restaurant
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    // console.log("Restaurant found:", restaurant ? restaurant._id : "no");

    // Subscription logic is now handled directly on the User model
    const now = new Date();
    let isActive = false;
    let daysRemaining = 0;

    if (user.subscriptionStatus === "active") {
      if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
        isActive = true;
        const diff = new Date(user.subscriptionEndDate) - now;
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    } else if (user.subscriptionStatus === "trial") {
      if (user.trialEndDate && new Date(user.trialEndDate) > now) {
        isActive = true;
        const diff = new Date(user.trialEndDate) - now;
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    }

    const userData = {
      user,
      restaurant: restaurant
        ? {
            _id: restaurant._id,
            name: restaurant.name,
            slug: restaurant.slug,
            logoUrl: restaurant.logoUrl,
            isActive: restaurant.isActive,
            menuViewCount: restaurant.menuViewCount,
          }
        : null,
      subscription: {
        status: user.subscriptionStatus,
        plan: user.planType || "trial",
        isActive,
        daysRemaining,
        currentPeriodEnd: user.subscriptionStatus === "active" ? user.subscriptionEndDate : user.trialEndDate,
        billingCycle: user.planType || "trial",
      },
    };

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/me
 */
export const updateMe = async (req, res, next) => {
  try {
    const { displayName, photoURL } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { displayName, photoURL },
      { new: true, runValidators: true },
    ).select("-__v");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
