import { Router } from "express";
import { adminLogin, adminSession } from "../controllers/adminAuthController.js";
import { clearResource, createResource, dashboard, deleteResource, listResource, updateResource } from "../controllers/adminController.js";
import { uploadMedia } from "../controllers/mediaController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/login", asyncHandler(adminLogin));
router.use(requireAdmin);
router.get("/session", adminSession);
router.get("/dashboard", asyncHandler(dashboard));
router.post("/upload-media", asyncHandler(uploadMedia));
router.get("/:resource", asyncHandler(listResource));
router.post("/:resource", asyncHandler(createResource));
router.patch("/:resource/:id", asyncHandler(updateResource));
router.delete("/:resource", asyncHandler(clearResource));
router.delete("/:resource/:id", asyncHandler(deleteResource));

export default router;
