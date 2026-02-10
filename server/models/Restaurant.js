import mongoose from "mongoose";
import slugify from "slugify";

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    cuisineType: [
      {
        type: String,
        trim: true,
      },
    ],
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
    },
    coverImageUrl: {
      type: String,
      default: "",
    },
    themeColor: {
      type: String,
      default: "#f97316",
    },
    openingHours: {
      monday: { open: String, close: String, isClosed: Boolean },
      tuesday: { open: String, close: String, isClosed: Boolean },
      wednesday: { open: String, close: String, isClosed: Boolean },
      thursday: { open: String, close: String, isClosed: Boolean },
      friday: { open: String, close: String, isClosed: Boolean },
      saturday: { open: String, close: String, isClosed: Boolean },
      sunday: { open: String, close: String, isClosed: Boolean },
    },
    socialLinks: {
      website: String,
      instagram: String,
      facebook: String,
      twitter: String,
    },
    qrCodeUrl: {
      type: String,
      default: "",
    },
    menuViewCount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      showOutOfStock: { type: Boolean, default: true },
      showPrices: { type: Boolean, default: true },
      enableSearch: { type: Boolean, default: true },
      enableCategories: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// Generate slug before saving
restaurantSchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Check for existing slugs
    const Restaurant = mongoose.model("Restaurant");
    while (await Restaurant.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
});

// Index for faster queries
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ slug: 1 });
restaurantSchema.index({ isActive: 1 });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
