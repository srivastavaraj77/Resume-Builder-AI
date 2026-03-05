import express from "express";
import {
  analyzeAtsScore,
  enhanceSummary,
  getAtsHistory,
  improveAtsWithAi,
} from "../controllers/aiController.js";
import protect from "../middlewares/authMiddleware.js";
import validateRequest, { validateParams } from "../middlewares/validateRequest.js";
import {
  validateAtsAnalyzePayload,
  validateAtsHistoryParams,
  validateAtsImprovePayload,
  validateEnhanceSummaryPayload,
} from "../validators/aiValidators.js";

const aiRouter = express.Router();

aiRouter.use(protect);
aiRouter.post("/enhance-summary", validateRequest(validateEnhanceSummaryPayload), enhanceSummary);
aiRouter.post("/ats-analyze", validateRequest(validateAtsAnalyzePayload), analyzeAtsScore);
aiRouter.post("/ats-improve", validateRequest(validateAtsImprovePayload), improveAtsWithAi);
aiRouter.get("/ats-history/:resumeId", validateParams(validateAtsHistoryParams), getAtsHistory);

export default aiRouter;
