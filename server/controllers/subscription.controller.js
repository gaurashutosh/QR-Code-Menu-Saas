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
    const cfResponse = response.data;
    console.log("Cashfree Subscription Response:", JSON.stringify(cfResponse, null, 2));
    
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

    // Return session ID for Cashfree JS SDK checkout
    // Also try to find a direct URL as fallback
    const sessionId = cfResponse.subscription_session_id;
    const directUrl = cfResponse.auth_url || cfResponse.authLink || cfResponse.authorization_link;
    
    if (!sessionId && !directUrl) {
      console.error("❌ Cashfree returned no session ID or URL:", Object.keys(cfResponse));
      return res.status(500).json({
        success: false,
        message: "Payment gateway did not return checkout details",
      });
    }

    res.json({
      success: true,
      data: { 
        sessionId: sessionId,
        url: directUrl,
        cfSubscriptionId: subscriptionId,
        environment: process.env.CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox",
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
    
    // Cashfree uses "type" as the event field (confirmed from actual payloads)
    // Also support legacy "event" and "cf_event" for compatibility
    const event = payload.type || payload.event || payload.cf_event;
    const eventData = payload.data || {};
    
    // Extract subscription ID from multiple possible locations
    const subscriptionId = 
      eventData.subscription?.subscription_id ||
      eventData.subscription_id ||
      payload.cf_subscriptionId ||
      eventData.cf_subscriptionId ||
      null;
    
    console.log(`🔔 Verified Webhook received: ${event} for Sub: ${subscriptionId}`);
    console.log(`📦 Payload keys: ${Object.keys(payload).join(", ")}`);

    // Log verified webhook with full payload for debugging
    await PaymentLog.create({
      event: `WEBHOOK_${event || 'UNKNOWN'}`,
      subscriptionId: subscriptionId,
      payload: payload,
      status: "verified",
      ipAddress: req.ip
    });

    if (!event || event === "WEBHOOK") {
      // "WEBHOOK" is the test event type sent from Cashfree dashboard
      console.log("ℹ️ Received test webhook or unidentified event type");
      return res.status(200).json({ success: true, message: "Webhook received" });
    }

    switch (event) {
      case "SUBSCRIPTION_STATUS_CHANGE": {
        const subData = eventData.subscription || eventData;
        const status = subData.subscription_status || subData.status || payload.cf_status;
        const subId = subData.subscription_id || subscriptionId;

        console.log(`📋 Status change: ${status} for ${subId}`);

        if (status === "ACTIVE") {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subId },
            { 
              status: "active",
              currentPeriodStart: subData.current_period_start ? new Date(subData.current_period_start) : new Date(),
              currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end) : null,
            }
          );
          console.log(`✅ Subscription ${subId} activated via webhook`);
        } else if (["CANCELLED", "CUSTOMER_CANCELLED", "EXPIRED", "COMPLETED"].includes(status)) {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subId },
            { status: "canceled", cancelAtPeriodEnd: true }
          );
          console.log(`🚫 Subscription ${subId} status: ${status}`);
        } else if (status === "ON_HOLD" || status === "PAST_DUE") {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subId },
            { status: "past_due" }
          );
          console.log(`⚠️ Subscription ${subId} is ${status}`);
        }
        break;
      }

      case "SUBSCRIPTION_PAYMENT_SUCCESS":
      case "SUBSCRIPTION_NEW_PAYMENT_SUCCESS": {
        const subData = eventData.subscription || eventData;
        const subId = subData.subscription_id || subscriptionId;
        
        await Subscription.findOneAndUpdate(
          { cfSubscriptionId: subId },
          { status: "active" }
        );
        console.log(`💰 Payment success for ${subId}`);
        break;
      }

      case "SUBSCRIPTION_PAYMENT_FAILED":
      case "SUBSCRIPTION_NEW_PAYMENT_FAILED": {
        const subData = eventData.subscription || eventData;
        const subId = subData.subscription_id || subscriptionId;
        console.warn(`❌ Payment failed for subscription: ${subId}`);
        break;
      }

      case "SUBSCRIPTION_AUTH_STATUS": {
        const subData = eventData.subscription || eventData;
        const subId = subData.subscription_id || subscriptionId;
        const authStatus = subData.authorization_status || subData.auth_status;
        console.log(`🔑 Auth status for ${subId}: ${authStatus}`);
        
        if (authStatus === "ACTIVE" || authStatus === "APPROVED") {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subId },
            { status: "active" }
          );
        }
        break;
      }

      default:
        console.log(`ℹ️ Webhook event "${event}" received — no specific handler.`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message);
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
 * Get payment history
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

    let history = [];

    // Try to get payment history from Cashfree API
    try {
      const response = await cashfree.get(`/subscriptions/${subscription.cfSubscriptionId}/payments`);
      const payments = response.data || [];
      
      // Handle both array and object responses
      const paymentList = Array.isArray(payments) ? payments : (payments.payments || []);

      history = paymentList.map((p) => ({
        id: p.cf_payment_id || p.payment_id || String(Date.now()),
        amount: p.payment_amount || p.amount || 0,
        currency: "INR",
        status: (p.payment_status || p.status || "unknown").toLowerCase(),
        date: new Date(p.payment_time || p.created_at || Date.now()),
        pdfUrl: "",
        number: p.cf_payment_id || p.payment_id || `INV-${Date.now()}`,
        planName: subscription.billingCycle === "yearly" ? "Premium Yearly" : "Premium Monthly",
      }));
    } catch (cfError) {
      console.warn("⚠️ Could not fetch history from Cashfree API, using local logs:", cfError.message);
      
      // Fallback: use local PaymentLog
      const logs = await PaymentLog.find({
        restaurant: restaurant._id,
        event: "PAYMENT_INITIATED",
      }).sort({ createdAt: -1 }).limit(20);

      history = logs.map((log) => ({
        id: log._id.toString(),
        amount: PLAN_IDS[log.payload?.plan]?.amount || 0,
        currency: "INR",
        status: log.status || "initiated",
        date: log.createdAt,
        pdfUrl: "",
        number: `INV-${log._id.toString().slice(-8).toUpperCase()}`,
        planName: PLAN_IDS[log.payload?.plan]?.name || "Premium Plan",
      }));
    }

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("❌ Payment history error:", error.message);
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
      try {
        const response = await cashfree.get(`/subscriptions/${subscription.cfSubscriptionId}`);
        const cfSub = response.data;
        
        // Cashfree uses subscription_status, not just status
        const cfStatus = (cfSub.subscription_status || cfSub.status || "").toUpperCase();
        console.log(`📋 Cashfree status for ${subscription.cfSubscriptionId}: ${cfStatus}`);

        if (cfStatus === "ACTIVE") {
          subscription.plan = "Premium";
          subscription.status = "active";
          if (cfSub.current_period_end) {
            subscription.currentPeriodEnd = new Date(cfSub.current_period_end);
          }
          if (cfSub.current_period_start) {
            subscription.currentPeriodStart = new Date(cfSub.current_period_start);
          }
          await subscription.save();
          updated = true;
        } else if (["CANCELLED", "EXPIRED", "COMPLETED"].includes(cfStatus)) {
          subscription.status = "canceled";
          subscription.cancelAtPeriodEnd = true;
          await subscription.save();
          updated = true;
        }
      } catch (cfError) {
        console.warn("⚠️ Could not fetch subscription from Cashfree:", cfError.response?.data || cfError.message);
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
