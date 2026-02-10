import cloudinary from "../config/cloudinary.js";
import fs from "fs";

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the file
 * @param {string} folder - Folder in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (filePath, folder = "qr-menu") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Upload image from base64
 * @param {string} base64String - Base64 encoded image
 * @param {string} folder - Folder in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadBase64Image = async (base64String, folder = "qr-menu") => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 */
export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
  }
};
