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

    const orderId = `ord_${crypto.randomBytes(12).toString("hex")}`;

    // Create Order in Cashfree for non-recurring payment
    const orderRequest = {
      order_id: orderId,
      order_amount: planInfo.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: req.user.firebaseUid.substring(0, 50),
        customer_name: req.user.displayName || "Customer",
        customer_email: req.user.email,
        customer_phone: restaurant.phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/api/cashfree/return?order_id={order_id}&cf_status={order_status}`,
      },
      order_tags: {
        plan: plan,
        userId: req.user._id.toString(),
      }
    };

    const response = await cashfree.post("/orders", orderRequest);
    const cfResponse = response.data;
    console.log("Cashfree Order Response:", JSON.stringify(cfResponse, null, 2));

    // Log the event
    await PaymentLog.create({
      event: "PAYMENT_INITIATED",
      subscriptionId: orderId, // using orderId here
      restaurant: restaurant._id,
      status: "incomplete",
      payload: { plan, planId: planInfo.cfPlanId, orderId }
    });

    // Return session ID for Cashfree JS SDK checkout
    const sessionId = cfResponse.payment_session_id;
    const directUrl = cfResponse.payment_link;
    
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
        cfSubscriptionId: orderId,
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
    const event = payload.type || payload.event || payload.cf_event;
    const eventData = payload.data || {};
    const orderDetails = eventData.order || {};
    const paymentDetails = eventData.payment || {};
    
    const orderId = orderDetails.order_id || payload.orderId;
    
    console.log(`🔔 Webhook received — Event: "${event}" | Order: ${orderId}`);

    // Log to database for audit trail
    await PaymentLog.create({
      event: `WEBHOOK_${event || 'UNKNOWN'}`,
      subscriptionId: orderId,
      payload: payload,
      status: "verified",
      ipAddress: req.ip
    });

    if (!event || event === "WEBHOOK") {
      return res.status(200).json({ success: true, message: "Test webhook received" });
    }

    if (event === "PAYMENT_SUCCESS_WEBHOOK" || event === "ORDER_PAY_SUCCESS") {
      // Payment Successful - We need to activate the subscription on the User
      const orderTags = orderDetails.order_tags || {};
      const plan = orderTags.plan; // "monthly" or "yearly"
      const userId = orderTags.userId;

      if (!userId) {
        console.error("❌ Webhook missing userId in order_tags");
        return res.status(400).json({ success: false, message: "Missing userId" });
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error(`❌ User ${userId} not found for order ${orderId}`);
        return res.status(404).json({ success: false, message: `User ${userId} not found` });
      }

      try {
        const now = new Date();
        const endDate = new Date(now);
        
        if (plan === "yearly") {
          endDate.setDate(endDate.getDate() + 365);
        } else {
          endDate.setDate(endDate.getDate() + 30); // Default monthly
        }

        // Update User model (source of truth)
        user.subscriptionStatus = "active";
        user.subscriptionStartDate = now;
        user.subscriptionEndDate = endDate;
        user.planType = plan || "monthly";
        await user.save();

        // Also upsert Subscription model for backward-compat with status/history/cancel endpoints
        const restaurant = await Restaurant.findOne({ owner: user._id });
        if (restaurant) {
          await Subscription.findOneAndUpdate(
            { restaurant: restaurant._id },
            {
              user: user._id,
              plan: "Premium",
              status: "active",
              billingCycle: plan === "yearly" ? "yearly" : "monthly",
              currentPeriodStart: now,
              currentPeriodEnd: endDate,
            },
            { upsert: true }
          );
        }

        console.log(`✅ User ${user._id} subscription activated until ${endDate}`);

        try {
          const { sendSubscriptionActivatedEmail } = await import("../services/emailService.js");
          await sendSubscriptionActivatedEmail(user, plan, now, endDate);
        } catch (emailErr) {
          console.error("⚠️ Failed to send activation email:", emailErr.message);
        }
      } catch (saveErr) {
        console.error(`❌ Failed to activate subscription for user ${userId}:`, saveErr.message);
        return res.status(500).json({ success: false, message: "Failed to activate subscription" });
      }
    } else if (event === "PAYMENT_FAILED_WEBHOOK" || event === "ORDER_PAY_FAILED") {
      console.warn(`❌ Payment FAILED for ${orderId}`);
    } else {
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
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "No restaurant found" });
    }

    const subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: "No subscription found" });
    }

    // If there's a real Cashfree subscription (not just a trial), cancel it via API
    if (subscription.cfSubscriptionId && subscription.status === "active") {
      try {
        // Cashfree uses POST /subscriptions/{id}/manage with { action: "CANCEL" }
        await cashfree.post(`/subscriptions/${subscription.cfSubscriptionId}/manage`, {
          action: "CANCEL",
        });
        console.log(`🚫 Cashfree subscription ${subscription.cfSubscriptionId} cancelled via API`);
      } catch (cfError) {
        // Log but don't block — still cancel locally
        console.warn("⚠️ Cashfree cancel API error:", cfError.response?.data || cfError.message);
      }
    }

    // Cancel locally regardless of Cashfree API result
    subscription.status = "canceled";
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("❌ Cancel subscription error:", error.message);
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
