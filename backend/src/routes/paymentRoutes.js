import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/create-order", requireUser, asyncHandler(createOrder));
router.post("/verify", requireUser, asyncHandler(verifyPayment));

export default router;
