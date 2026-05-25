import { Router } from "express";
import {
  attachPartnerMedia,
  createPartnerProfile,
  deletePartnerProfile,
  getManagedPartnerProfile,
  listManagedPartnerProfiles,
  partnerLogin,
  partnerSubLogin,
  partnerMe,
  replacePartnerProfile,
  setPartnerProfileStatus,
  updatePartnerCredential,
  updatePartnerProfile
} from "../controllers/partnerController.js";
import { requirePartner } from "../middleware/partnerAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", asyncHandler(partnerLogin));
router.post("/sub-login", asyncHandler(partnerSubLogin));
router.get("/me", requirePartner, asyncHandler(partnerMe));
router.get("/profiles", requirePartner, asyncHandler(listManagedPartnerProfiles));
router.post("/profiles", requirePartner, asyncHandler(createPartnerProfile));
router.get("/profiles/:id", requirePartner, asyncHandler(getManagedPartnerProfile));
router.put("/profiles/:id", requirePartner, asyncHandler(replacePartnerProfile));
router.patch("/profiles/:id/status", requirePartner, asyncHandler(setPartnerProfileStatus));
router.delete("/profiles/:id", requirePartner, asyncHandler(deletePartnerProfile));
router.post("/profiles/:id/media", requirePartner, asyncHandler(attachPartnerMedia));
router.patch("/profile", requirePartner, asyncHandler(updatePartnerProfile));
router.patch("/credentials", requirePartner, asyncHandler(updatePartnerCredential));

export default router;
