import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { webhook } from "./controllers/paymentController.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import partnerRoutes from "./routes/partnerRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";

export const app = express();

const allowedOrigins = new Set([
  env.clientUrl,
  env.adminUrl,
  ...env.corsOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
].filter(Boolean));
const vercelOriginPatterns = [
  /^https:\/\/friend-hub(?:-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/friend-hub-admin(?:-[a-z0-9-]+)?\.vercel\.app$/i
];

app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.has(origin) || vercelOriginPatterns.some((pattern) => pattern.test(origin))) {
      return cb(null, true);
    }
    return cb(new Error("CORS origin blocked"));
  },
  credentials: true
}));
app.use(morgan("dev"));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res, next) => {
  req.rawBody = req.body.toString("utf8");
  req.body = JSON.parse(req.rawBody);
  next();
}, asyncHandler(webhook));
app.use(express.json({ limit: "70mb" }));
app.use(apiLimiter);

app.get("/health", (req, res) => res.json({ ok: true, app: "Friend Hub API" }));
app.get("/", (req, res) => res.json({
  ok: true,
  app: "Friend Hub API",
  health: "/health",
  publicProfiles: "/api/public/profiles",
  myProfile: "/api/users/me",
  publicPlans: "/api/public/plans"
}));
app.use("/api/admin", adminRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);
