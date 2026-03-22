import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      default: "",
    },
    photoURL: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    cashfreeCustomerId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired"],
      default: "trial",
    },
    trialStartDate: {
      type: Date,
      default: null,
    },
    trialEndDate: {
      type: Date,
      default: null,
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    planType: {
      type: String,
      enum: ["monthly", "yearly"],
      default: null,
    },
  },
  { timestamps: true },
);

// Ensure trial users always have consistent trial dates
userSchema.pre('save', function (next) {
  if (this.isNew && this.subscriptionStatus === 'trial' && !this.trialStartDate) {
    this.trialStartDate = new Date();
    this.trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
