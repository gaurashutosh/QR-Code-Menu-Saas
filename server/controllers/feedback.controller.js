import Feedback from "../models/Feedback.js";

/**
 * Create new feedback
 * POST /api/feedback
 */
export const createFeedback = async (req, res, next) => {
  try {
    const { type, subject, message, email, name, priority } = req.body;

    const feedback = await Feedback.create({
      user: req.user ? req.user.uid : null, // Store user ID if logged in
      type,
      subject,
      message,
      email,
      name,
      priority: priority || "medium",
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all feedback (Admin)
 * GET /api/feedback/admin
 */
export const getAllFeedback = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "displayName email photoURL");

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: feedback,
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

/**
 * Update feedback status (Admin)
 * PATCH /api/feedback/admin/:id
 */
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const updates = {};

    if (status) updates.status = status;
    if (adminNotes) updates.adminNotes = adminNotes;
    if (status === "resolved" || status === "closed") {
      updates.resolvedAt = new Date();
    }

    const feedback = await Feedback.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.json({
      success: true,
      data: feedback,
      message: "Feedback updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete feedback (Admin)
 * DELETE /api/feedback/admin/:id
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
