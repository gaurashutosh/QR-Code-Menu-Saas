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
    
    // Get current subscription to check status and avoid cutting off access
    const currentSub = await Subscription.findOne({ restaurant: restaurant._id });
    const isCurrentlyActive = currentSub && (
      currentSub.status === "active" || 
      (currentSub.status === "trialing" && currentSub.trialEnd > new Date())
    );

    // Save partial subscription info to DB
    await Subscription.findOneAndUpdate(
      { restaurant: restaurant._id },
      {
        user: req.user._id,
        cfSubscriptionId: subscriptionId,
        cfPlanId: planInfo.cfPlanId,
        plan: "Premium",
        billingCycle: plan === "yearly" ? "yearly" : "monthly",
        status: isCurrentlyActive ? currentSub.status : "incomplete",
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
 * 
 * Cashfree Subscription Webhook Payload Structure (v2023-08-01):
 * {
 *   "type": "SUBSCRIPTION_STATUS_CHANGE",
 *   "event_time": "2024-01-01T00:00:00Z",
 *   "data": {
 *     "subscription_details": {
 *       "cf_subscription_id": "123",
 *       "subscription_id": "sub_xxx",
 *       "subscription_status": "ACTIVE",
 *       ...
 *     },
 *     "payment_details": { ... }  // present for payment events
 *   }
 * }
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    if (!signature || !timestamp) {
      console.warn("⚠️ Missing webhook signature or timestamp");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Capture raw body (Buffer) and verify HMAC SHA256 signature
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
    
    // === EVENT TYPE EXTRACTION ===
    // Cashfree uses "type" for newer versions, "cf_event" for legacy
    const event = payload.type || payload.event || payload.cf_event;
    
    // === DATA EXTRACTION ===
    // v2023+: data.subscription_details / data.payment_details
    // Legacy: data.subscription / flat cf_ fields
    const eventData = payload.data || {};
    const subDetails = eventData.subscription_details || eventData.subscription || eventData;
    const paymentDetails = eventData.payment_details || eventData.payment || {};
    
    // === SUBSCRIPTION ID EXTRACTION ===
    // Try all known field paths across Cashfree API versions
    const subscriptionId = 
      subDetails.subscription_id ||           // v2023: data.subscription_details.subscription_id
      subDetails.cf_subscription_id ||        // v2023: data.subscription_details.cf_subscription_id
      eventData.subscription_id ||            // flat: data.subscription_id
      payload.cf_subscriptionId ||            // legacy: cf_subscriptionId
      payload.cf_subReferenceId ||            // legacy: cf_subReferenceId
      null;
    
    // Log everything for production debugging
    console.log(`🔔 Webhook received — Event: "${event}" | Sub: ${subscriptionId}`);
    console.log(`📦 Top-level keys: [${Object.keys(payload).join(", ")}]`);
    console.log(`📦 Data keys: [${Object.keys(eventData).join(", ")}]`);
    if (eventData.subscription_details) {
      console.log(`📦 subscription_details keys: [${Object.keys(eventData.subscription_details).join(", ")}]`);
    }
    // Full payload dump for debugging (remove in production once stable)
    console.log(`📋 Full payload: ${JSON.stringify(payload, null, 2)}`);

    // Log to database for audit trail
    await PaymentLog.create({
      event: `WEBHOOK_${event || 'UNKNOWN'}`,
      subscriptionId: subscriptionId,
      payload: payload,
      status: "verified",
      ipAddress: req.ip
    });

    // === HANDLE TEST WEBHOOKS ===
    // Cashfree dashboard "Test" button sends: { type: "WEBHOOK", data: { test_object: {...} } }
    if (!event || event === "WEBHOOK") {
      console.log("✅ Test webhook received and acknowledged.");
      return res.status(200).json({ success: true, message: "Test webhook received" });
    }

    // === PROCESS REAL EVENTS ===
    const subStatus = (subDetails.subscription_status || subDetails.status || payload.cf_status || "").toUpperCase();

    switch (event) {
      // ── Subscription Status Changes ──
      case "SUBSCRIPTION_STATUS_CHANGE":
      case "SUBSCRIPTION_STATUS_CHANGED": {
        console.log(`📋 Status change → ${subStatus} for ${subscriptionId}`);

        if (subStatus === "ACTIVE") {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subscriptionId },
            { 
              status: "active",
              currentPeriodStart: subDetails.current_period_start ? new Date(subDetails.current_period_start) : new Date(),
              currentPeriodEnd: subDetails.current_period_end ? new Date(subDetails.current_period_end) : null,
            }
          );
          console.log(`✅ Subscription ${subscriptionId} ACTIVATED`);
        } else if (["CANCELLED", "CUSTOMER_CANCELLED", "EXPIRED", "COMPLETED"].includes(subStatus)) {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subscriptionId },
            { status: "canceled", cancelAtPeriodEnd: true }
          );
          console.log(`🚫 Subscription ${subscriptionId} → ${subStatus}`);
        } else if (["ON_HOLD", "PAST_DUE", "BANK_APPROVAL_PENDING"].includes(subStatus)) {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subscriptionId },
            { status: "past_due" }
          );
          console.log(`⚠️ Subscription ${subscriptionId} → ${subStatus}`);
        }
        break;
      }

      // ── Payment Success ──
      case "SUBSCRIPTION_PAYMENT_SUCCESS":
      case "SUBSCRIPTION_NEW_PAYMENT_SUCCESS": {
        await Subscription.findOneAndUpdate(
          { cfSubscriptionId: subscriptionId },
          { status: "active" }
        );
        console.log(`💰 Payment SUCCESS for ${subscriptionId}`);
        break;
      }

      // ── Payment Failed ──
      case "SUBSCRIPTION_PAYMENT_FAILED":
      case "SUBSCRIPTION_NEW_PAYMENT_FAILED": {
        console.warn(`❌ Payment FAILED for ${subscriptionId}`);
        // Don't deactivate immediately — Cashfree will retry
        break;
      }

      // ── Auth Status (checkout completed) ──
      case "SUBSCRIPTION_AUTH_STATUS": {
        const authStatus = (subDetails.authorization_status || subDetails.auth_status || "").toUpperCase();
        console.log(`🔑 Auth status → ${authStatus} for ${subscriptionId}`);
        
        if (authStatus === "ACTIVE" || authStatus === "APPROVED") {
          await Subscription.findOneAndUpdate(
            { cfSubscriptionId: subscriptionId },
            { status: "active" }
          );
          console.log(`✅ Auth approved → Subscription ${subscriptionId} ACTIVATED`);
        }
        break;
      }

      // ── Payment Cancelled ──
      case "SUBSCRIPTION_PAYMENT_CANCELLED": {
        console.log(`🚫 Payment cancelled for ${subscriptionId}`);
        break;
      }

      // ── Refund ──
      case "SUBSCRIPTION_REFUND_STATUS": {
        console.log(`💸 Refund event for ${subscriptionId}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: "${event}"`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message, error.stack);
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
