import CustomerFeedback from "../models/CustomerFeedback.js";
import Restaurant from "../models/Restaurant.js";

/**
 * Submit customer feedback (Public)
 * POST /api/public/feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { restaurantId, rating, comment, customerName, customerPhone } =
      req.body;

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const feedback = await CustomerFeedback.create({
      restaurant: restaurantId,
      rating,
      comment,
      customerName,
      customerPhone,
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant feedback (Protected)
 * GET /api/restaurants/:id/feedback
 */
export const getRestaurantFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Verify ownership
    // Note: This check assumes req.user is populated by auth middleware
    // and that the route checks for ownership via middleware or here.
    // For simplicity, we rely on the route middleware to ensure the user owns this restaurant
    // or we check it here if needed.
    const restaurant = await Restaurant.findOne({
      _id: id,
      owner: req.user._id,
    });
    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this restaurant's feedback",
      });
    }

    const query = { restaurant: id };
    if (rating) query.rating = parseInt(rating);

    const feedback = await CustomerFeedback.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CustomerFeedback.countDocuments(query);

    // Calculate average rating
    const stats = await CustomerFeedback.aggregate([
      { $match: { restaurant: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
          count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: feedback,
      stats: stats[0] || {
        avgRating: 0,
        total: 0,
        count5: 0,
        count4: 0,
        count3: 0,
        count2: 0,
        count1: 0,
      },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

import mongoose from "mongoose";
