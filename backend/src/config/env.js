import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  adminUrl: process.env.ADMIN_URL || "http://localhost:5174",
  adminToken: process.env.ADMIN_TOKEN || "change-this-admin-token",
  adminUsername: process.env.ADMIN_USERNAME || "mdibrahim",
  adminPassword: process.env.ADMIN_PASSWORD || "Mdid@123",
  defaultPartnerLoginId: process.env.DEFAULT_PARTNER_LOGIN_ID || "sonu119",
  defaultPartnerPassword: process.env.DEFAULT_PARTNER_PASSWORD || "Mdid@119",
  jwtSecret: process.env.JWT_SECRET || "change-this-jwt-secret",
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
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  }
};
