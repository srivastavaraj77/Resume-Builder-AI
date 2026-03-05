import express from "express";
import {
  createResume,
  checkDownloadAccess,
  deleteResume,
  getMyResumes,
  getPublicResumeById,
  getResumeById,
  updateResume,
  updateResumeVisibility,
} from "../controllers/resumeController.js";
import protect from "../middlewares/authMiddleware.js";
import validateRequest, { validateParams } from "../middlewares/validateRequest.js";
import {
  validateCreateResumePayload,
  validateResumeIdParam,
  validateUpdateResumePayload,
  validateVisibilityPayload,
} from "../validators/resumeValidators.js";

const resumeRouter = express.Router();

resumeRouter.get("/public/:resumeId", validateParams(validateResumeIdParam), getPublicResumeById);

resumeRouter.use(protect);

resumeRouter.get("/", getMyResumes);
resumeRouter.post("/", validateRequest(validateCreateResumePayload), createResume);
resumeRouter.get(
  "/:resumeId/download-access",
  validateParams(validateResumeIdParam),
  checkDownloadAccess
);
resumeRouter.get("/:resumeId", validateParams(validateResumeIdParam), getResumeById);
resumeRouter.put(
  "/:resumeId",
  validateParams(validateResumeIdParam),
  validateRequest(validateUpdateResumePayload),
  updateResume
);
resumeRouter.patch(
  "/:resumeId/visibility",
  validateParams(validateResumeIdParam),
  validateRequest(validateVisibilityPayload),
  updateResumeVisibility
);
resumeRouter.delete("/:resumeId", validateParams(validateResumeIdParam), deleteResume);

export default resumeRouter;
