import { Router } from "express";
import { bill, preview } from "../controllers/voiceController.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/preview", requireUser, asyncHandler(preview));
router.post("/bill", requireUser, asyncHandler(bill));

export default router;
