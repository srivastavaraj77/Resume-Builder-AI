import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Resume from "../models/resume.js";
import User from "../models/User.js";
import { getEntitlements } from "../utils/entitlements.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendResponse.js";
import { sendEmail } from "../utils/email.js";

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
      data: { token, user: safeUser, entitlements: getEntitlements(safeUser) },
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
      data: { token, user: safeUser, entitlements: getEntitlements(safeUser) },
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
      data: { user, entitlements: getEntitlements(user) },
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

export const updateUserProfile = async (req, res, next) => {
  try {
    const updates = req.validatedBody;

    if (updates.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: req.userId },
      });
      if (existingUser) {
        throw new ApiError(409, "USER_ALREADY_EXISTS", "Email is already in use");
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    return sendSuccess(res, {
      message: "Profile updated successfully",
      data: { user, entitlements: getEntitlements(user) },
    });
  } catch (error) {
    return next(error);
  }
};

export const changeUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validatedBody;

    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    if (!user.comparePassword(currentPassword)) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return sendSuccess(res, {
      message: "Password updated successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const buildOtpHash = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const OTP_EXPIRATION_MS = 10 * 60 * 1000;

export const requestPasswordReset = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.validatedBody.email);
    const user = await User.findOne({ email });

    if (user) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.resetOtp = buildOtpHash(otp);
      user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRATION_MS);
      await user.save();

      const message = `Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.`;
      const subject = "Reset your Resume Builder password";
      try {
        await sendEmail({
          to: email,
          subject,
          html: `<p>${message}</p><p>If you didn't request this, you can ignore this email.</p>`,
          text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
        });
      } catch (sendError) {
        console.error("Failed to send OTP email", sendError);
      }
    }

    return sendSuccess(res, {
      message:
        "If an account exists we sent an OTP to the registered email address. Please check your inbox.",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.validatedBody;
    const normalizedEmail = normalizeEmail(email);
    const hashedOtp = buildOtpHash(otp);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.resetOtp) {
      throw new ApiError(400, "INVALID_OTP", "Invalid OTP or email");
    }

    if (user.resetOtpExpires && user.resetOtpExpires < new Date()) {
      throw new ApiError(400, "OTP_EXPIRED", "The OTP has expired");
    }

    if (user.resetOtp !== hashedOtp) {
      throw new ApiError(400, "INVALID_OTP", "Invalid OTP or email");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpires = undefined;
    await user.save();

    return sendSuccess(res, {
      message: "Password reset successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};
