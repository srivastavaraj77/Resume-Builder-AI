import express from "express";
import { enhanceSummary } from "../controllers/aiController.js";
import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { validateEnhanceSummaryPayload } from "../validators/aiValidators.js";

const aiRouter = express.Router();

aiRouter.use(protect);
aiRouter.post("/enhance-summary", validateRequest(validateEnhanceSummaryPayload), enhanceSummary);

export default aiRouter;
