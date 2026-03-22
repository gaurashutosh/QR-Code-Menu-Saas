import cron from "node-cron";
import User from "../models/User.js";
import { sendExpiryReminderEmail, sendSubscriptionExpiredEmail } from "../services/emailService.js";

/**
 * Daily Subscription Expiry & Reminder Cron Job
 * Runs every day at 00:00 (midnight server time)
 */
export const startSubscriptionCron = () => {
  console.log("⏰ Initializing daily subscription cron job...");

  cron.schedule("0 0 * * *", async () => {
    console.log("⏳ Running daily subscription checks...");
    const now = new Date();

    try {
      // 1. Bulk-expire active subscriptions that are past their end date
      const expiredActiveFilter = {
        subscriptionStatus: "active",
        subscriptionEndDate: { $lt: now }
      };
      const expiredActiveUsers = await User.find(expiredActiveFilter);
      if (expiredActiveUsers.length > 0) {
        const ids = expiredActiveUsers.map(u => u._id);
        await User.updateMany({ _id: { $in: ids } }, { $set: { subscriptionStatus: "expired" } });
        console.log(`🚫 ${expiredActiveUsers.length} active subscription(s) expired`);

        for (const user of expiredActiveUsers) {
          try {
            await sendSubscriptionExpiredEmail(user);
          } catch (emailErr) {
            console.error(`❌ Failed to send expiry email to ${user._id}:`, emailErr.message);
          }
        }
      }

      // 2. Bulk-expire free trials that are past their end date
      const expiredTrialFilter = {
        subscriptionStatus: "trial",
        trialEndDate: { $lt: now }
      };
      const expiredTrialUsers = await User.find(expiredTrialFilter);
      if (expiredTrialUsers.length > 0) {
        const ids = expiredTrialUsers.map(u => u._id);
        await User.updateMany({ _id: { $in: ids } }, { $set: { subscriptionStatus: "expired" } });
        console.log(`🚫 ${expiredTrialUsers.length} free trial(s) expired`);

        for (const user of expiredTrialUsers) {
          try {
            await sendSubscriptionExpiredEmail(user);
          } catch (emailErr) {
            console.error(`❌ Failed to send trial expiry email to ${user._id}:`, emailErr.message);
          }
        }
      }

      // 3. Send 3-Day Expiry Reminders (for both active AND trial users)
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      const twoDaysFromNow = new Date(now);
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(23, 59, 59, 999);

      // Active subscriptions expiring in ~3 days
      const expiringActiveUsers = await User.find({
        subscriptionStatus: "active",
        subscriptionEndDate: {
          $gt: twoDaysFromNow,
          $lte: threeDaysFromNow
        }
      });

      // Trial users expiring in ~3 days
      const expiringTrialUsers = await User.find({
        subscriptionStatus: "trial",
        trialEndDate: {
          $gt: twoDaysFromNow,
          $lte: threeDaysFromNow
        }
      });

      const allExpiringUsers = [...expiringActiveUsers, ...expiringTrialUsers];

      for (const user of allExpiringUsers) {
        try {
          console.log(`⚠️ User ${user._id} expiring in ~3 days. Sending reminder.`);
          await sendExpiryReminderEmail(user, 3);
        } catch (emailErr) {
          console.error(`❌ Failed to send reminder email to ${user._id}:`, emailErr.message);
        }
      }

      console.log("✅ Daily subscription checks completed");
    } catch (error) {
      console.error("❌ Cron Job Error:", error);
    }
  });
};
