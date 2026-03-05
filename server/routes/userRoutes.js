import express from "express";
import {
  changeUserPassword,
  getUserById,
  getUserResumes,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  validateChangePasswordPayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateUpdateProfilePayload,
} from "../validators/authValidators.js";

const userRouter = express.Router();

userRouter.post("/register", validateRequest(validateRegisterPayload), registerUser);
userRouter.post("/login", validateRequest(validateLoginPayload), loginUser);
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
