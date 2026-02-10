import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripePriceId: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: ["trial", "basic", "pro"],
      default: "trial",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "trial"],
      default: "trial",
    },
    status: {
      type: String,
      enum: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
      ],
      default: "trialing",
    },
    trialStart: {
      type: Date,
      default: Date.now,
    },
    trialEnd: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      },
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Check if subscription is active
subscriptionSchema.methods.isActive = function () {
  if (this.status === "active") return true;
  if (this.status === "trialing" && this.trialEnd > new Date()) return true;
  return false;
};

// Get days remaining
subscriptionSchema.methods.getDaysRemaining = function () {
  const endDate =
    this.status === "trialing" ? this.trialEnd : this.currentPeriodEnd;
  if (!endDate) return 0;
  const diff = endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ restaurant: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
