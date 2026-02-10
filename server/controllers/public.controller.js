import Restaurant from "../models/Restaurant.js";
import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import Subscription from "../models/Subscription.js";

/**
 * Get restaurant by slug (public)
 * GET /api/public/restaurant/:slug
 */
export const getRestaurantBySlug = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
      isActive: true,
    }).select("-owner -__v");

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check if restaurant has active subscription
    const subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (!subscription || !subscription.isActive()) {
      return res.status(403).json({
        success: false,
        message: "This restaurant's menu is currently unavailable",
      });
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full menu (public)
 * GET /api/public/menu/:slug
 */
export const getPublicMenu = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
      isActive: true,
    }).select("-owner -__v");

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check subscription
    const subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (!subscription || !subscription.isActive()) {
      return res.status(403).json({
        success: false,
        message: "This restaurant's menu is currently unavailable",
      });
    }

    // Get categories with items
    const categories = await Category.find({
      restaurant: restaurant._id,
      isActive: true,
    }).sort("sortOrder");

    const menuData = await Promise.all(
      categories.map(async (category) => {
        // Build query - only filter by availability if showOutOfStock is false
        const query = { category: category._id };
        if (!restaurant.settings?.showOutOfStock) {
          query.isAvailable = true;
        }

        const items = await MenuItem.find(query)
          .select("-restaurant -__v")
          .sort("sortOrder");

        return {
          _id: category._id,
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
          items,
        };
      }),
    );

    // Increment view count
    restaurant.menuViewCount += 1;
    await restaurant.save();

    res.json({
      success: true,
      data: {
        restaurant,
        categories: menuData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a QR scan
 * POST /api/public/menu/:slug/scan
 */
export const recordScan = async (req, res, next) => {
  try {
    await Restaurant.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { menuViewCount: 1 } },
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
