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
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: [env.clientUrl, env.adminUrl], credentials: true }));
app.use(morgan("dev"));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res, next) => {
  req.rawBody = req.body.toString("utf8");
  req.body = JSON.parse(req.rawBody);
  next();
}, asyncHandler(webhook));
app.use(express.json({ limit: "2mb" }));
app.use(apiLimiter);

app.get("/health", (req, res) => res.json({ ok: true, app: "Friend Hub API" }));
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);
