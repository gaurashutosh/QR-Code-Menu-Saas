import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Subscription from "../models/Subscription.js";
import MenuItem from "../models/MenuItem.js";
import Category from "../models/Category.js";
import CustomerFeedback from "../models/CustomerFeedback.js";
import admin from "../config/firebase-admin.js";

// Utility to escape regex special characters
const escapeRegex = (string) => {
  if (typeof string !== "string") {
    return "";
  }
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * Get admin dashboard stats
 * GET /api/admin/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalRestaurants,
      activeRestaurants,
      totalSubscriptions,
      activeSubscriptionDocs, // Changed to docs for MRR calc
      trialSubscriptions,
      paidSubscriptions,
      totalMenuItems,
      totalViews,
      recentUsers,
      recentRestaurants,
      recentSubscriptions, // Added for activity feed
    ] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ isActive: true }),
      Subscription.countDocuments(),
      Subscription.find({
        status: { $in: ["active", "trialing"] },
      }).select("plan billingCycle status"),
      Subscription.countDocuments({ plan: { $regex: /^trial$/i } }),
      Subscription.countDocuments({
        plan: { $in: [/Premium/i, /basic/i, /pro/i] },
      }),
      MenuItem.countDocuments(),
      Restaurant.aggregate([
        { $group: { _id: null, total: { $sum: "$menuViewCount" } } },
      ]),
      User.find()
        .sort("-createdAt")
        .limit(5)
        .select("email displayName createdAt"),
      Restaurant.find()
        .sort("-createdAt")
        .limit(5)
        .select("name slug createdAt menuViewCount"),
      Subscription.find()
        .sort("-createdAt")
        .limit(5)
        .populate("user", "displayName email")
        .select("plan status createdAt user"),
    ]);

    // Calculate MRR
    let mrr = 0;
    activeSubscriptionDocs.forEach((sub) => {
      if (sub.status === "active" && sub.plan !== "trial") {
        if (sub.billingCycle === "yearly") {
          mrr += 416.66; // 5000 / 12
        } else {
          mrr += 499;
        }
      }
    });

    // Construct Recent Activity
    const activity = [
      ...recentUsers.map((u) => ({
        type: "user_signup",
        message: `New user signed up: ${u.displayName || u.email}`,
        timestamp: u.createdAt,
        details: u,
      })),
      ...recentRestaurants.map((r) => ({
        type: "restaurant_created",
        message: `New restaurant created: ${r.name}`,
        timestamp: r.createdAt,
        details: r,
      })),
      ...recentSubscriptions.map((s) => ({
        type: "subscription_started",
        message: `New ${s.plan} subscription (${s.status})`,
        timestamp: s.createdAt,
        details: s,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: 0, // Placeholder, implementation specific
          growth: 0, // Placeholder
        },
        restaurants: {
          total: totalRestaurants,
          active: activeRestaurants,
          growth: 0,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptionDocs.length,
          mrr: Math.round(mrr),
          growth: 0,
          trial: trialSubscriptions,
          paid: paidSubscriptions,
        },
        menuItems: {
          total: totalMenuItems,
        },
        menuViews: {
          // Renamed from views to menuViews for frontend consistency
          total: totalViews[0]?.total || 0,
          today: 0,
          growth: 0,
        },
        recentActivity: activity, // Flattened activity feed
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all restaurants (admin)
 * GET /api/admin/restaurants
 */
export const getAllRestaurants = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { slug: { $regex: escapedSearch, $options: "i" } },
      ];
    }
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .populate("owner", "email displayName")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit)),
      Restaurant.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle restaurant status (admin)
 * PATCH /api/admin/restaurants/:id/toggle
 */
export const toggleRestaurantStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json({
      success: true,
      data: { isActive: restaurant.isActive },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin)
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { email: { $regex: escapedSearch, $options: "i" } },
        { displayName: { $regex: escapedSearch, $options: "i" } },
      ];
    }
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-__v")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    // Optimized bulk fetching to avoid N+1 queries
    const userIds = users.map((u) => u._id);

    // Fetch all restaurants for these users
    const allRestaurants = await Restaurant.find({
      owner: { $in: userIds },
    }).select("name slug isActive menuViewCount owner");

    // Create map for easy lookup
    const restaurantMap = {};
    allRestaurants.forEach((r) => {
      restaurantMap[r.owner.toString()] = r;
    });

    // Fetch all subscriptions for these restaurants
    const restaurantIds = allRestaurants.map((r) => r._id);
    const allSubscriptions = await Subscription.find({
      restaurant: { $in: restaurantIds },
    }).select("plan status trialEnd restaurant");

    // Create map for easy lookup
    const subscriptionMap = {};
    allSubscriptions.forEach((s) => {
      subscriptionMap[s.restaurant.toString()] = s;
    });

    const usersWithDetails = users.map((user) => {
      const restaurant = restaurantMap[user._id.toString()];
      const subscription = restaurant
        ? subscriptionMap[restaurant._id.toString()]
        : null;

      return {
        ...user.toObject(),
        restaurant: restaurant || null,
        subscription: subscription || null,
      };
    });

    res.json({
      success: true,
      data: usersWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user details (admin)
 * GET /api/admin/users/:id
 */
export const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const restaurant = await Restaurant.findOne({ owner: user._id });
    const subscription = restaurant
      ? await Subscription.findOne({ restaurant: restaurant._id })
      : null;
    const menuItems = restaurant
      ? await MenuItem.countDocuments({ restaurant: restaurant._id })
      : 0;

    res.json({
      success: true,
      data: {
        user,
        restaurant,
        subscription,
        stats: {
          menuItems,
          views: restaurant?.menuViewCount || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (admin)
 * PATCH /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics data for charts
 * GET /api/admin/analytics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get restaurant growth over time
    const restaurantGrowth = await Restaurant.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get subscription distribution by plan
    const subscriptionsByPlan = await Subscription.aggregate([
      {
        $group: {
          _id: { $toLower: "$plan" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: {
            $concat: [
              { $toUpper: { $substr: ["$_id", 0, 1] } },
              { $substr: ["$_id", 1, -1] },
            ],
          },
          count: 1,
        },
      },
    ]);

    // Get subscription status distribution
    const subscriptionsByStatus = await Subscription.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get top restaurants by views
    const topRestaurants = await Restaurant.find()
      .sort("-menuViewCount")
      .limit(10)
      .select("name slug menuViewCount");

    // Get menu items by category distribution
    const menuItemsByCategory = await MenuItem.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get recent signups by day of week
    const signupsByDayOfWeek = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format data for charts
    const formatGrowthData = (data, days) => {
      const result = [];
      const dataMap = new Map(data.map((d) => [d._id, d.count]));

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        result.push({
          date: dateStr,
          count: dataMap.get(dateStr) || 0,
        });
      }
      return result;
    };

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    res.json({
      success: true,
      data: {
        userGrowth: formatGrowthData(userGrowth, days),
        restaurantGrowth: formatGrowthData(restaurantGrowth, days),
        subscriptionsByPlan: subscriptionsByPlan.map((s) => ({
          name: s._id || "Unknown",
          value: s.count,
        })),
        subscriptionsByStatus: subscriptionsByStatus.map((s) => ({
          name: s._id || "Unknown",
          value: s.count,
        })),
        topRestaurants: topRestaurants.map((r) => ({
          name: r.name,
          views: r.menuViewCount || 0,
        })),
        menuItemsByCategory: menuItemsByCategory.map((c) => ({
          name: c._id || "Uncategorized",
          count: c.count,
        })),
        signupsByDayOfWeek: signupsByDayOfWeek.map((d) => ({
          day: dayNames[d._id - 1] || "Unknown",
          count: d.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete restaurant and all associated data (admin)
 * DELETE /api/admin/restaurants/:id
 */
export const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // 1. Delete all menu items and categories
    await MenuItem.deleteMany({ restaurant: restaurant._id });
    await Category.deleteMany({ restaurant: restaurant._id });

    // 2. Delete subscription
    await Subscription.findOneAndDelete({ restaurant: restaurant._id });

    // 3. Delete customer feedback
    await CustomerFeedback.deleteMany({ restaurant: restaurant._id });

    // 4. Delete the restaurant itself
    await Restaurant.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Restaurant and all associated data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user and their restaurant (admin)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 1. Find and delete their restaurant (if any)
    const restaurant = await Restaurant.findOne({ owner: user._id });
    if (restaurant) {
      await MenuItem.deleteMany({ restaurant: restaurant._id });
      await Category.deleteMany({ restaurant: restaurant._id });
      await Subscription.findOneAndDelete({ restaurant: restaurant._id });
      await CustomerFeedback.deleteMany({ restaurant: restaurant._id });
      await Restaurant.findByIdAndDelete(restaurant._id);
    }

    // 2. Delete user from Firebase Auth
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        console.error("Error deleting user from Firebase:", firebaseError);
        // Continue even if Firebase deletion fails (e.g., user already deleted)
      }
    }

    // 3. Delete user from database
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User and associated data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
