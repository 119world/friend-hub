import { Router } from "express";
import { createOrder, createSubscription, verifyPayment } from "../controllers/paymentController.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/create-order", requireUser, asyncHandler(createOrder));
router.post("/verify", requireUser, asyncHandler(verifyPayment));
router.post("/create-subscription", requireUser, asyncHandler(createSubscription));

export default router;
