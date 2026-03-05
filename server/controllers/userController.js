import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Resume from "../models/resume.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendResponse.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "USER_ALREADY_EXISTS", "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id);
    const safeUser = newUser.toObject();
    delete safeUser.password;

    return sendSuccess(res, {
      statusCode: 201,
      message: "User created successfully",
      data: { token, user: safeUser },
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user || !user.comparePassword(password)) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const token = generateToken(user._id);
    const safeUser = user.toObject();
    delete safeUser.password;

    return sendSuccess(res, {
      message: "Login successful",
      data: { token, user: safeUser },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    return sendSuccess(res, {
      message: "User fetched successfully",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({
      updatedAt: -1,
    });

    return sendSuccess(res, {
      message: "Resumes fetched successfully",
      data: { resumes },
    });
  } catch (error) {
    return next(error);
  }
};
