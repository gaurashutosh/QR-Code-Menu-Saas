import Restaurant from "../models/Restaurant.js";
import Subscription from "../models/Subscription.js";
import { generateQRCode } from "../services/qr.service.js";

/**
 * Create a new restaurant
 * POST /api/restaurants
 */
export const createRestaurant = async (req, res, next) => {
  try {
    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({
      owner: req.user._id,
    });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: "You already have a restaurant. Upgrade to add more.",
      });
    }

    const restaurant = await Restaurant.create({
      ...req.body,
      owner: req.user._id,
    });

    // Generate QR code
    await generateQRCode(restaurant);

    // Create trial subscription automatically
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7 day trial

    const subscription = await Subscription.create({
      user: req.user._id,
      restaurant: restaurant._id,
      plan: "trial",
      status: "trialing",
      trialStart: new Date(),
      trialEnd,
    });

    res.status(201).json({
      success: true,
      data: {
        restaurant,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          trialEnd: subscription.trialEnd,
        },
      },
    });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    next(error);
  }
};

/**
 * Get user's restaurant
 * GET /api/restaurants/my
 */
export const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No restaurant found",
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
 * Get restaurant by ID
 * GET /api/restaurants/:id
 */
export const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
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
 * Update restaurant
 * PUT /api/restaurants/:id
 */
export const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "owner" && key !== "_id") {
        restaurant[key] = req.body[key];
      }
    });

    await restaurant.save();

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete restaurant (soft delete)
 * DELETE /api/restaurants/:id
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

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    restaurant.isActive = false;
    await restaurant.save();

    res.json({
      success: true,
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get QR code for restaurant
 * GET /api/restaurants/:id/qr
 */
export const getQRCode = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: restaurant.qrCodeUrl,
        menuUrl: `${process.env.CLIENT_URL}/menu/${restaurant.slug}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate QR code
 * POST /api/restaurants/:id/qr/regenerate
 */
export const regenerateQRCode = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await generateQRCode(restaurant);

    res.json({
      success: true,
      data: {
        qrCode: restaurant.qrCodeUrl,
        menuUrl: `${process.env.CLIENT_URL}/menu/${restaurant.slug}`,
      },
    });
  } catch (error) {
    next(error);
  }
};
