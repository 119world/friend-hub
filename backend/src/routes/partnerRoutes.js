import { Router } from "express";
import {
  partnerLogin,
  partnerMe,
  updatePartnerCredential,
  updatePartnerProfile
} from "../controllers/partnerController.js";
import { requirePartner } from "../middleware/partnerAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", asyncHandler(partnerLogin));
router.get("/me", requirePartner, asyncHandler(partnerMe));
router.patch("/profile", requirePartner, asyncHandler(updatePartnerProfile));
router.patch("/credentials", requirePartner, asyncHandler(updatePartnerCredential));

export default router;
