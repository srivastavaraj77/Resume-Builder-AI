import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

const ensureValidResumeId = (resumeId) => {
  if (!mongoose.isValidObjectId(resumeId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid resume id");
  }
};

const ensureObject = (value, fieldName) => {
  if (value !== undefined && (typeof value !== "object" || Array.isArray(value))) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be an object`);
  }
};

const ensureArray = (value, fieldName) => {
  if (value !== undefined && !Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be an array`);
  }
};

export const validateResumeIdParam = (params) => {
  ensureValidResumeId(params?.resumeId);
  return params;
};

export const validateCreateResumePayload = (payload) => {
  const title = payload?.title?.trim() || "Untitled Resume";
  return { title };
};

export const validateUpdateResumePayload = (payload) => {
  const allowedFields = [
    "title",
    "template",
    "accent_color",
    "professional_summary",
    "personal_info",
    "experience",
    "education",
    "project",
    "skills",
    "public",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "At least one valid field is required for update");
  }

  if (updateData.title !== undefined && typeof updateData.title !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", "title must be a string");
  }

  if (updateData.template !== undefined && typeof updateData.template !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", "template must be a string");
  }

  if (updateData.accent_color !== undefined && typeof updateData.accent_color !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", "accent_color must be a string");
  }

  if (
    updateData.professional_summary !== undefined &&
    typeof updateData.professional_summary !== "string"
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", "professional_summary must be a string");
  }

  if (updateData.public !== undefined && typeof updateData.public !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", "public must be a boolean");
  }

  ensureObject(updateData.personal_info, "personal_info");
  ensureArray(updateData.experience, "experience");
  ensureArray(updateData.education, "education");
  ensureArray(updateData.project, "project");
  ensureArray(updateData.skills, "skills");

  return updateData;
};

export const validateVisibilityPayload = (payload) => {
  if (typeof payload?.isPublic !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", "isPublic must be a boolean");
  }

  return { isPublic: payload.isPublic };
};
