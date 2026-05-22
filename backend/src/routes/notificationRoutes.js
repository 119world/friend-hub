import { Router } from "express";
import { sendNotification } from "../controllers/notificationController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/send", requireAdmin, asyncHandler(sendNotification));

export default router;
