import stripe from "../config/stripe.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

const PRICE_IDS = {
  monthly: "price_1SzD0cFFIKPWDHvRyDpvOwtH",
  yearly: "price_1SzD2AFFIKPWDHvR4jVqhDLw",
};

/**
 * Create checkout session
 * POST /api/subscription/create-checkout
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { plan } = req.body; // "monthly" or "yearly"

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
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

    // Get or create Stripe customer
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.displayName,
        metadata: {
          userId: req.user._id.toString(),
        },
      });
      customerId = customer.id;

      await User.findByIdAndUpdate(req.user._id, {
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        userId: req.user._id.toString(),
        restaurantId: restaurant._id.toString(),
        plan: "Premium",
      },
    });

    res.json({
      success: true,
      data: { url: session.url },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhook
 * POST /api/subscription/webhook
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await handleSubscriptionCanceled(subscription);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await handlePaymentFailed(invoice);
      break;
    }
  }

  res.json({ received: true });
};

async function handleCheckoutComplete(session) {
  const { userId, restaurantId, plan } = session.metadata;

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription,
  );

  // Update or create subscription in database
  await Subscription.findOneAndUpdate(
    { restaurant: restaurantId },
    {
      user: userId,
      stripeSubscriptionId: session.subscription,
      stripeCustomerId: session.customer,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      plan: plan,
      billingCycle:
        stripeSubscription.items.data[0].price.recurring.interval === "year"
          ? "yearly"
          : "monthly",
      status: "active",
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
    { upsert: true, new: true },
  );
}

async function handleSubscriptionUpdate(subscription) {
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  );
}

async function handleSubscriptionCanceled(subscription) {
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    { status: "canceled" },
  );
}

async function handlePaymentFailed(invoice) {
  const subscription = await Subscription.findOne({
    stripeCustomerId: invoice.customer,
  });
  if (subscription) {
    subscription.status = "past_due";
    await subscription.save();
  }
}

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

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No active subscription to cancel",
      });
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription will be canceled at the end of billing period",
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
    const user = await User.findById(req.user._id);
    if (!user || !user.stripeCustomerId) {
      return res.json({ success: true, data: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 12,
    });

    const history = invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      pdfUrl: invoice.invoice_pdf,
      number: invoice.number,
      planName: invoice.lines.data[0]?.description || "Subscription Plan",
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

    const subscription = await Subscription.findOne({
      restaurant: restaurant._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    let updated = false;

    // Self-healing: If there's a Stripe ID but plan is trial, it means we missed the update
    if (
      subscription.plan === "trial" &&
      subscription.stripeSubscriptionId &&
      subscription.status === "active"
    ) {
      subscription.plan = "Premium";
      await subscription.save();
      updated = true;
    }

    res.json({
      success: true,
      message: updated ? "Subscription reconciled" : "No changes needed",
      data: {
        plan: subscription.plan,
        status: subscription.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
