import MenuItem from "../models/MenuItem.js";
import Category from "../models/Category.js";
import Restaurant from "../models/Restaurant.js";

/**
 * Get all menu items for a restaurant
 * GET /api/menu/:restaurantId
 */
export const getMenuItems = async (req, res, next) => {
  try {
    const { category, search, isVeg, isAvailable } = req.query;
    const filter = { restaurant: req.params.restaurantId };

    if (category) filter.category = category;
    if (isVeg === "true") filter.isVeg = true;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";
    if (search) {
      filter.$text = { $search: search };
    }

    const items = await MenuItem.find(filter)
      .populate("category", "name")
      .sort("category sortOrder");

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single menu item
 * GET /api/menu/item/:id
 */
export const getMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate(
      "category",
      "name",
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create menu item
 * POST /api/menu
 */
export const createMenuItem = async (req, res, next) => {
  try {
    const { restaurant, category } = req.body;

    // Verify restaurant ownership
    const rest = await Restaurant.findById(restaurant);
    if (!rest || rest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Verify category exists and belongs to restaurant
    const cat = await Category.findById(category);
    if (!cat || cat.restaurant.toString() !== restaurant) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Get next sort order
    const lastItem = await MenuItem.findOne({ category }).sort("-sortOrder");
    const sortOrder = lastItem ? lastItem.sortOrder + 1 : 0;

    const item = await MenuItem.create({
      ...req.body,
      sortOrder,
    });

    await item.populate("category", "name");

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update menu item
 * PUT /api/menu/:id
 */
export const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate({
      path: "restaurant",
      select: "owner",
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Check ownership
    if (item.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "restaurant" && key !== "_id") {
        item[key] = req.body[key];
      }
    });

    await item.save();
    await item.populate("category", "name");

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete menu item
 * DELETE /api/menu/:id
 */
export const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate({
      path: "restaurant",
      select: "owner",
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Check ownership
    if (item.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle item availability
 * PATCH /api/menu/:id/toggle
 */
export const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate({
      path: "restaurant",
      select: "owner",
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Check ownership
    if (item.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      success: true,
      data: { isAvailable: item.isAvailable },
    });
  } catch (error) {
    next(error);
  }
};
