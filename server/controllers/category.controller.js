import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";

/**
 * Get all categories for a restaurant
 * GET /api/categories/:restaurantId
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      restaurant: req.params.restaurantId,
      isActive: true,
    }).sort("sortOrder");

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a category
 * POST /api/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const { restaurant, name, description, imageUrl } = req.body;

    // Verify restaurant ownership
    const rest = await Restaurant.findById(restaurant);
    if (!rest || rest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get next sort order
    const lastCategory = await Category.findOne({ restaurant }).sort(
      "-sortOrder",
    );
    const sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

    const category = await Category.create({
      restaurant,
      name,
      description,
      imageUrl,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * PUT /api/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "restaurant",
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check ownership
    if (category.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { name, description, imageUrl, isActive, sortOrder } = req.body;

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (imageUrl !== undefined) category.imageUrl = imageUrl;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    await category.save();

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "restaurant",
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check ownership
    if (category.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete all items in this category
    await MenuItem.deleteMany({ category: category._id });

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder categories
 * PATCH /api/categories/reorder
 */
export const reorderCategories = async (req, res, next) => {
  try {
    const { restaurant, categoryIds } = req.body;

    // Verify restaurant ownership
    const rest = await Restaurant.findById(restaurant);
    if (!rest || rest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update sort order for each category
    const updates = categoryIds.map((id, index) =>
      Category.findByIdAndUpdate(id, { sortOrder: index }),
    );

    await Promise.all(updates);

    res.json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    next(error);
  }
};
