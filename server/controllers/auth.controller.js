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

    // Get subscription if restaurant exists
    let subscription = null;
    if (restaurant) {
      subscription = await Subscription.findOne({
        restaurant: restaurant._id,
        user: req.user._id,
      });
      // console.log("Subscription found:", subscription ? "yes" : "no");
      // if (subscription) {
      //   console.log("Subscription methods:", {
      //     isActive: typeof subscription.isActive,
      //     getDaysRemaining: typeof subscription.getDaysRemaining
      //   });
      // }
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
          }
        : null,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            isActive:
              typeof subscription.isActive === "function"
                ? subscription.isActive()
                : false,
            daysRemaining:
              typeof subscription.getDaysRemaining === "function"
                ? subscription.getDaysRemaining()
                : 0,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
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
