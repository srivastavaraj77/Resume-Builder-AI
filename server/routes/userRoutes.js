import express from "express";
import {
  getUserById,
  getUserResumes,
  loginUser,
  registerUser,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  validateLoginPayload,
  validateRegisterPayload,
} from "../validators/authValidators.js";

const userRouter = express.Router();

userRouter.post("/register", validateRequest(validateRegisterPayload), registerUser);
userRouter.post("/login", validateRequest(validateLoginPayload), loginUser);
userRouter.get("/data", protect, getUserById);
userRouter.get("/resumes", protect, getUserResumes);

export default userRouter;
