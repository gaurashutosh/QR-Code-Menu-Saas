import QRCode from "qrcode";
import Restaurant from "../models/Restaurant.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

/**
 * Generate QR code for a restaurant
 */
export const generateQRCode = async (restaurant) => {
  const menuUrl = `${CLIENT_URL}/menu/${restaurant.slug}`;

  // Generate QR code as base64 data URL
  const qrCode = await QRCode.toDataURL(menuUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Save to restaurant
  restaurant.qrCodeUrl = qrCode;
  await restaurant.save();

  return qrCode;
};

/**
 * Regenerate QR code (e.g., if slug changes)
 */
export const regenerateQRCode = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  return generateQRCode(restaurant);
};
