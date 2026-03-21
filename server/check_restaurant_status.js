import mongoose from "mongoose";
import "dotenv/config";
import Restaurant from "./models/Restaurant.js";
import Subscription from "./models/Subscription.js";

const checkRestaurant = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const slug = "spicy-treat-1487";
    const restaurant = await Restaurant.findOne({ slug });
    
    if (!restaurant) {
      console.log(`Restaurant with slug "${slug}" not found.`);
      process.exit(0);
    }
    
    console.log("\n--- Restaurant Info ---");
    console.log("Name:", restaurant.name);
    console.log("Slug:", restaurant.slug);
    console.log("Is Active (isActive):", restaurant.isActive);
    console.log("Owner ID:", restaurant.owner);
    
    const subscription = await Subscription.findOne({ restaurant: restaurant._id });
    
    if (!subscription) {
      console.log("\n--- Subscription Info ---");
      console.log("No subscription record found.");
    } else {
      console.log("\n--- Subscription Info ---");
      console.log("Status:", subscription.status);
      console.log("Trial End:", subscription.trialEnd);
      console.log("Current Period End:", subscription.currentPeriodEnd);
      
      // Mimic the isActive() method
      const now = new Date();
      const isActive = subscription.status === "active" || 
                      (subscription.status === "trialing" && subscription.trialEnd > now);
      
      console.log("Is Active (calculated):", isActive);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkRestaurant();
