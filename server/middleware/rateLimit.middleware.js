import rateLimit from "express-rate-limit";

// General API rate limit: 100 requests per 10 minutes
export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 10 minutes",
  },
  standardHeaders: true, // Return rate limit info in the sets of `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limit for auth routes: 10 requests per 10 minutes
// Helps prevent brute force attacks on login/signup
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 10 to allow frequent polling/refreshes
  message: {
    success: false,
    message: "Too many login attempts, please try again after 10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
