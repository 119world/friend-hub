import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  adminUrl: process.env.ADMIN_URL || "http://localhost:5174",
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminToken: process.env.ADMIN_TOKEN || (isProduction ? "" : "change-this-admin-token"),
  adminUsername: process.env.ADMIN_USERNAME || (isProduction ? "" : "mdibrahim"),
  adminPassword: process.env.ADMIN_PASSWORD || (isProduction ? "" : "Mdid@123"),
  defaultPartnerLoginId: process.env.DEFAULT_PARTNER_LOGIN_ID || (isProduction ? "" : "sonu119"),
  defaultPartnerPassword: process.env.DEFAULT_PARTNER_PASSWORD || (isProduction ? "" : "Mdid@119"),
  jwtSecret: process.env.JWT_SECRET || (isProduction ? "" : "change-this-jwt-secret"),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    fallbackPaymentUrl: process.env.RAZORPAY_FALLBACK_PAYMENT_URL || process.env.RAZORPAY_PAYMENT_LINK_URL || ""
  }
};
