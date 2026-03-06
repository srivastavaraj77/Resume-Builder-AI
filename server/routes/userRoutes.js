import express from "express";
import {
  changeUserPassword,
  getUserById,
  getUserResumes,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithOtp,
  updateUserProfile,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  validateChangePasswordPayload,
  validateLoginPayload,
  validatePasswordResetPayload,
  validatePasswordResetRequestPayload,
  validateRegisterPayload,
  validateUpdateProfilePayload,
} from "../validators/authValidators.js";

const userRouter = express.Router();

userRouter.post("/register", validateRequest(validateRegisterPayload), registerUser);
userRouter.post("/login", validateRequest(validateLoginPayload), loginUser);
userRouter.post(
  "/forgot-password",
  validateRequest(validatePasswordResetRequestPayload),
  requestPasswordReset
);
userRouter.post(
  "/reset-password",
  validateRequest(validatePasswordResetPayload),
  resetPasswordWithOtp
);
userRouter.get("/data", protect, getUserById);
userRouter.get("/resumes", protect, getUserResumes);
userRouter.put("/profile", protect, validateRequest(validateUpdateProfilePayload), updateUserProfile);
userRouter.patch(
  "/change-password",
  protect,
  validateRequest(validateChangePasswordPayload),
  changeUserPassword
);

export default userRouter;
