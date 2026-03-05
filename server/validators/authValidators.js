import ApiError from "../utils/ApiError.js";

const normalizeEmail = (email) => String(email).trim().toLowerCase();

export const validateRegisterPayload = (payload) => {
  const name = payload?.name?.trim();
  const email = normalizeEmail(payload?.email || "");
  const password = payload?.password;

  if (!name || !email || !password) {
    throw new ApiError(400, "VALIDATION_ERROR", "name, email and password are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid email format");
  }

  if (password.length < 8) {
    throw new ApiError(400, "VALIDATION_ERROR", "Password must be at least 8 characters");
  }

  return { name, email, password };
};

export const validateLoginPayload = (payload) => {
  const email = normalizeEmail(payload?.email || "");
  const password = payload?.password;

  if (!email || !password) {
    throw new ApiError(400, "VALIDATION_ERROR", "email and password are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid email format");
  }

  return { email, password };
};

export const validateUpdateProfilePayload = (payload) => {
  const allowedFields = ["name", "email", "phone", "location", "profession", "website", "linkedin", "bio"];
  const nextPayload = {};

  for (const field of allowedFields) {
    if (payload?.[field] === undefined) continue;
    nextPayload[field] = String(payload[field]).trim();
  }

  if (Object.keys(nextPayload).length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "At least one profile field is required");
  }

  if (nextPayload.email) {
    nextPayload.email = normalizeEmail(nextPayload.email);
    if (!nextPayload.email.includes("@")) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid email format");
    }
  }

  if (nextPayload.name !== undefined && !nextPayload.name) {
    throw new ApiError(400, "VALIDATION_ERROR", "name cannot be empty");
  }

  return nextPayload;
};

export const validateChangePasswordPayload = (payload) => {
  const currentPassword = String(payload?.currentPassword || "");
  const newPassword = String(payload?.newPassword || "");
  const confirmNewPassword = String(payload?.confirmNewPassword || "");

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "currentPassword, newPassword and confirmNewPassword are required"
    );
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "VALIDATION_ERROR", "New password must be at least 8 characters");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "VALIDATION_ERROR", "New password and confirm password must match");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "VALIDATION_ERROR", "New password must be different from current password");
  }

  return { currentPassword, newPassword };
};
