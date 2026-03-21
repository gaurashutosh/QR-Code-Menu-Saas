import mongoose from "mongoose";

const paymentLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
    },
    subscriptionId: {
      type: String,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

const PaymentLog = mongoose.model("PaymentLog", paymentLogSchema);
export default PaymentLog;
