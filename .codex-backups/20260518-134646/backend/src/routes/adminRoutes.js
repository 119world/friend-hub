import { Router } from "express";
import { createResource, dashboard, listResource, updateResource } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAdmin);
router.get("/dashboard", asyncHandler(dashboard));
router.get("/:resource", asyncHandler(listResource));
router.post("/:resource", asyncHandler(createResource));
router.patch("/:resource/:id", asyncHandler(updateResource));

export default router;
