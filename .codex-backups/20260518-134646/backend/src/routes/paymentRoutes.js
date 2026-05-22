import { Router } from "express";
import { createOrder } from "../controllers/paymentController.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/create-order", requireUser, asyncHandler(createOrder));

export default router;
