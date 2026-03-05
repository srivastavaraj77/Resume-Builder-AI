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
