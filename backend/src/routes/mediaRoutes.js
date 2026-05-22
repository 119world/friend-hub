import { Router } from "express";
import { uploadMedia } from "../controllers/mediaController.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/upload", requireUser, asyncHandler(uploadMedia));

export default router;
