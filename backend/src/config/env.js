import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value != null && String(value).trim() !== "") return value;
  }
  return "";
}

function normalizePrivateKey(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "\n");
}

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
  adminUsername: firstEnv("ADMIN_USERNAME", "ADMIN_LOGIN_ID", "ADMIN_ID") || (isProduction ? "" : "mdibrahim"),
  adminPassword: firstEnv("ADMIN_PASSWORD", "ADMIN_LOGIN_PASSWORD") || (isProduction ? "" : "Mdid@123"),
  defaultPartnerLoginId: firstEnv("DEFAULT_PARTNER_LOGIN_ID", "PARTNER_LOGIN_ID", "PARTNER_USERNAME", "PARTNER_ID") || (isProduction ? "" : "sonu119"),
  defaultPartnerPassword: firstEnv("DEFAULT_PARTNER_PASSWORD", "PARTNER_PASSWORD", "PARTNER_LOGIN_PASSWORD") || (isProduction ? "" : "Mdid@119"),
  jwtSecret: process.env.JWT_SECRET || (isProduction ? "" : "change-this-jwt-secret"),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  serverUrl: firstEnv("BACKEND_URL", "API_BASE_URL", "SERVER_URL"),
  cashfree: {
    clientId: process.env.CASHFREE_CLIENT_ID,
    clientSecret: process.env.CASHFREE_CLIENT_SECRET,
    env: (process.env.CASHFREE_ENV || "PRODUCTION").toUpperCase()
  }
};
