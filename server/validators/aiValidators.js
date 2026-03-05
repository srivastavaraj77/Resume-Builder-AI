import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

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

export const validateAtsAnalyzePayload = (payload) => {
  const resumeId = payload?.resumeId ? String(payload.resumeId).trim() : "";
  const resumeData = payload?.resumeData;
  const targetRole = payload?.targetRole ? String(payload.targetRole).trim() : "";
  const includeAiFeedback = payload?.includeAiFeedback !== false;

  if (!resumeId && !resumeData) {
    throw new ApiError(400, "VALIDATION_ERROR", "Either resumeId or resumeData is required");
  }

  if (resumeId && !mongoose.isValidObjectId(resumeId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid resume id");
  }

  if (
    resumeData !== undefined &&
    (typeof resumeData !== "object" || resumeData === null || Array.isArray(resumeData))
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", "resumeData must be an object");
  }

  if (targetRole.length > 120) {
    throw new ApiError(400, "VALIDATION_ERROR", "targetRole is too long");
  }

  return {
    resumeId,
    resumeData,
    targetRole,
    includeAiFeedback,
  };
};

export const validateAtsImprovePayload = (payload) => {
  const resumeId = payload?.resumeId ? String(payload.resumeId).trim() : "";
  const resumeData = payload?.resumeData;
  const targetRole = payload?.targetRole ? String(payload.targetRole).trim() : "";

  if (!resumeId && !resumeData) {
    throw new ApiError(400, "VALIDATION_ERROR", "Either resumeId or resumeData is required");
  }

  if (resumeId && !mongoose.isValidObjectId(resumeId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid resume id");
  }

  if (
    resumeData !== undefined &&
    (typeof resumeData !== "object" || resumeData === null || Array.isArray(resumeData))
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", "resumeData must be an object");
  }

  if (targetRole.length > 120) {
    throw new ApiError(400, "VALIDATION_ERROR", "targetRole is too long");
  }

  return {
    resumeId,
    resumeData,
    targetRole,
  };
};

export const validateAtsHistoryParams = (params) => {
  const resumeId = params?.resumeId ? String(params.resumeId).trim() : "";
  if (!resumeId || !mongoose.isValidObjectId(resumeId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid resume id");
  }
  return { resumeId };
};
