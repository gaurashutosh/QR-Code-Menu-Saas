import crypto from "crypto";
import cashfree from "../config/cashfree.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import PaymentLog from "../models/PaymentLog.js";
import { PLAN_IDS } from "../config/plans.js";

/**
 * Create checkout session
 * POST /api/subscription/create-checkout
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { plan } = req.body; // "monthly" or "yearly"

    const planInfo = PLAN_IDS[plan];
    if (!planInfo) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // Get user's restaurant
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: "Please create a restaurant first",
      });
    }

    // Check if user already has an active paid subscription
    const existingSubscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (
      existingSubscription &&
      existingSubscription.isActive() &&
      existingSubscription.plan !== "trial"
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have an active premium subscription",
      });
    }

    // Enforce phone number for fraud protection
    if (!restaurant.phone) {
      return res.status(400).json({
        success: false,
        message: "Restaurant phone number is required for premium subscription",
      });
    }

    const subscriptionId = `sub_${crypto.randomBytes(12).toString("hex")}`;

    // Create subscription in Cashfree
    const subscriptionRequest = {
      subscription_id: subscriptionId,
      plan_details: {
        plan_id: planInfo.cfPlanId,
      },
      customer_details: {
        customer_name: req.user.displayName,
        customer_email: req.user.email,
        customer_phone: restaurant.phone,
      },
      subscription_meta: {
        return_url: `${process.env.CLIENT_URL}/dashboard?tab=subscription&success=true`,
      }
    };

    const response = await cashfree.post("/subscriptions", subscriptionRequest);
    console.log("Cashfree Subscription Response:", JSON.stringify(response.data, null, 2));
    
    // Save partial subscription info to DB
    await Subscription.findOneAndUpdate(
      { restaurant: restaurant._id },
      {
        user: req.user._id,
        cfSubscriptionId: subscriptionId,
        cfPlanId: planInfo.cfPlanId,
        plan: "Premium",
        billingCycle: plan === "yearly" ? "yearly" : "monthly",
        status: "incomplete",
      },
      { upsert: true }
    );

    // Log the event
    await PaymentLog.create({
      event: "PAYMENT_INITIATED",
      subscriptionId,
      restaurant: restaurant._id,
      status: "incomplete",
      payload: { plan, planId: planInfo.cfPlanId }
    });

    res.json({
      success: true,
      data: { 
        url: response.data.auth_url || 
             response.data.authLink || 
             response.data.authorization_link || 
             response.data.subscription_url ||
             response.data.payment_link
      },
    });
  } catch (error) {
    console.error("Cashfree Error:", error.response?.data || error.message);
    next(error);
  }
};

/**
 * Handle Cashfree webhook
 * POST /api/subscription/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    if (!signature || !timestamp) {
      console.warn("⚠️ Missing webhook signature or timestamp");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Capture raw body (Buffer) and verify signature
    const rawBody = req.body.toString();
    const dataToVerify = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(dataToVerify)
      .digest("base64");

    if (signature !== expectedSignature) {
      console.error("❌ Webhook signature verification failed");
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    // Parse verified payload
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log(`🔔 Verified Webhook received: ${event}`);

    // Log verified webhook
    await PaymentLog.create({
      event: `WEBHOOK_${event}`,
      subscriptionId: data.subscription?.subscription_id,
      payload: payload,
      status: "verified",
      ipAddress: req.ip
    });

    switch (event) {
      case "SUBSCRIPTION_STATUS_CHANGE": {
        const { subscription_id, status, current_period_start, current_period_end } = data.subscription;
        
        const existingSub = await Subscription.findOne({ cfSubscriptionId: subscription_id });
        
        // Idempotency: Don't allow downgrade if already active
        if (existingSub && existingSub.status === "active" && status.toLowerCase() !== "active") {
          console.log(`ℹ️ Ignoring status change for active subscription: ${subscription_id}`);
          return res.json({ success: true });
        }

        await Subscription.findOneAndUpdate(
          { cfSubscriptionId: subscription_id },
          {
            status: status.toLowerCase() === "active" ? "active" : status.toLowerCase(),
            currentPeriodStart: new Date(current_period_start),
            currentPeriodEnd: new Date(current_period_end),
          }
        );
        break;
      }
      case "SUBSCRIPTION_PAYMENT_SUCCESS": {
        const { subscription_id } = data.subscription;
        const sub = await Subscription.findOne({ cfSubscriptionId: subscription_id });
        if (sub) {
          // Prevent duplicate activation logic
          if (sub.status !== "active") {
            sub.status = "active";
            await sub.save();
          }
        }
        break;
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.status(400).json({ success: false, message: "Invalid payload" });
  }
};

/**
 * Get subscription status
 * GET /api/subscription/status
 */
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No restaurant found",
      });
    }

    const subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    res.json({
      success: true,
      data: {
        plan: subscription.plan,
        status: subscription.status,
        isActive: subscription.isActive(),
        daysRemaining: subscription.getDaysRemaining(),
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 * POST /api/subscription/cancel
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    // Cancel in Cashfree
    await cashfree.patch(`/subscriptions/${subscription.cfSubscriptionId}`, {
      status: "CANCEL",
    });

    subscription.status = "canceled";
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription canceled successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history (invoices from Stripe)
 * GET /api/subscription/history
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (!subscription || !subscription.cfSubscriptionId) {
      return res.json({ success: true, data: [] });
    }

    // Cashfree history implementation
    const response = await cashfree.get(`/subscriptions/${subscription.cfSubscriptionId}/payments`);
    const payments = response.data || [];

    const history = payments.map((p) => ({
      id: p.cf_payment_id,
      amount: p.payment_amount,
      currency: "INR",
      status: p.payment_status.toLowerCase(),
      date: new Date(p.payment_time),
      pdfUrl: "", // Cashfree doesn't provide direct PDF link like Stripe easily
      number: p.cf_payment_id,
      planName: "Premium Plan",
    }));

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reconcile subscription plan (fix inconsistencies)
 * POST /api/subscription/reconcile
 */
export const reconcileSubscription = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No restaurant found",
      });
    }

    let subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription session found",
      });
    }

    console.log(
      `🔍 Reconciling subscription for ${restaurant.name} [Local Plan: ${subscription.plan}]`,
    );

    let updated = false;

    // Reconcile with Cashfree
    if (subscription.cfSubscriptionId) {
      const response = await cashfree.get(`/subscriptions/${subscription.cfSubscriptionId}`);
      const cfSub = response.data;

      if (cfSub.status.toLowerCase() === "active") {
        subscription.plan = "Premium";
        subscription.status = "active";
        subscription.currentPeriodEnd = new Date(cfSub.current_period_end);
        await subscription.save();
        updated = true;
      }
    }

    res.json({
      success: true,
      message: updated
        ? "Subscription reconciled successfully"
        : "No changes needed",
      data: {
        plan: subscription.plan,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("❌ Reconciliation failed:", error);
    next(error);
  }
};
