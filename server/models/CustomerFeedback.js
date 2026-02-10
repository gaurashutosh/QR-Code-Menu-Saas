import mongoose from "mongoose";

const customerFeedbackSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    customerPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
customerFeedbackSchema.index({ restaurant: 1, createdAt: -1 });

const CustomerFeedback = mongoose.model(
  "CustomerFeedback",
  customerFeedbackSchema,
);

export default CustomerFeedback;
