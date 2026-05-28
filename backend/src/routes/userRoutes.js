import { Router } from "express";
import { getMyProfile, updateMyProfile } from "../controllers/userController.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", requireUser, asyncHandler(getMyProfile));
router.patch("/me", requireUser, asyncHandler(updateMyProfile));

export default router;
