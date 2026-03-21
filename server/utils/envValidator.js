/**
 * Validates existence of required environment variables
 */
const validateEnv = () => {
  const requiredEnv = [
    "MONGODB_URI",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "CASHFREE_CLIENT_ID",
    "CASHFREE_CLIENT_SECRET",
    "CASHFREE_ENV",
    "CLIENT_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ];

  const missing = requiredEnv.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error("❌ CRITICAL: Missing required environment variables:");
    missing.forEach((m) => console.error(`   - ${m}`));
    
    if (process.env.NODE_ENV === "production") {
      console.error("Halting server startup due to missing configuration.");
      process.exit(1);
    } else {
      console.warn("⚠️ Continuing in development mode with missing configuration...");
    }
  } else {
    console.log("✅ All required environment variables are present.");
  }
};

export default validateEnv;
