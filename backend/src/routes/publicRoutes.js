import { Router } from "express";
import { publicPlans, publicProfiles, publicReplyConfig, publicWelcome } from "../controllers/publicController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/profiles", asyncHandler(publicProfiles));
router.get("/partner-profiles", asyncHandler(publicProfiles));
router.get("/plans", asyncHandler(publicPlans));
router.get("/welcome", asyncHandler(publicWelcome));
router.get("/reply-config", asyncHandler(publicReplyConfig));

export default router;
