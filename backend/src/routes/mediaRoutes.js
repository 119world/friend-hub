import { Router } from "express";
import { uploadMedia } from "../controllers/mediaController.js";
import { requireUser } from "../middleware/auth.js";
import { requirePartner } from "../middleware/partnerAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/upload", requireUser, asyncHandler(uploadMedia));
router.post("/partner-upload", requirePartner, (req, res, next) => {
  req.user = { uid: req.partner?.partnerId || req.partner?.accountId || "partner" };
  next();
}, asyncHandler(uploadMedia));

export default router;
