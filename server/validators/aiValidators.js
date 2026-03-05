import ApiError from "../utils/ApiError.js";

export const validateEnhanceSummaryPayload = (payload) => {
  const summary = payload?.summary?.trim();

  if (!summary) {
    throw new ApiError(400, "VALIDATION_ERROR", "summary is required");
  }

  if (summary.length < 20) {
    throw new ApiError(400, "VALIDATION_ERROR", "summary should be at least 20 characters");
  }

  if (summary.length > 2000) {
    throw new ApiError(400, "VALIDATION_ERROR", "summary is too long");
  }

  return { summary };
};
