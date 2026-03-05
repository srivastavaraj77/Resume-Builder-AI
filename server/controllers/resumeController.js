import Resume from "../models/resume.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { assertDownloadAccess, assertTemplateAccess } from "../utils/entitlements.js";
import { sendSuccess } from "../utils/sendResponse.js";

export const createResume = async (req, res, next) => {
  try {
    const { title } = req.validatedBody;
    const newResume = await Resume.create({
      userId: req.userId,
      title: title || "Untitled Resume",
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Resume created successfully",
      data: { resume: newResume },
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 });
    return sendSuccess(res, {
      message: "Resumes fetched successfully",
      data: { resumes },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteResume = async (req, res, next) => {
  try {
    const { resumeId } = req.validatedParams || req.params;
    const deletedResume = await Resume.findOneAndDelete({
      _id: resumeId,
      userId: req.userId,
    });

    if (!deletedResume) {
      throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found");
    }

    return sendSuccess(res, {
      message: "Resume deleted successfully",
      data: { resume: deletedResume },
    });
  } catch (error) {
    return next(error);
  }
};

export const getResumeById = async (req, res, next) => {
  try {
    const { resumeId } = req.validatedParams || req.params;
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.userId,
    });

    if (!resume) {
      throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found");
    }

    return sendSuccess(res, {
      message: "Resume fetched successfully",
      data: { resume },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPublicResumeById = async (req, res, next) => {
  try {
    const { resumeId } = req.validatedParams || req.params;
    const resume = await Resume.findOne({
      _id: resumeId,
      public: true,
    });

    if (!resume) {
      throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found");
    }

    return sendSuccess(res, {
      message: "Public resume fetched successfully",
      data: { resume },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateResume = async (req, res, next) => {
  try {
    const { resumeId } = req.validatedParams || req.params;
    const updateData = req.validatedBody;

    if (updateData.template) {
      const user = await User.findById(req.userId);
      if (!user) {
        throw new ApiError(404, "USER_NOT_FOUND", "User not found");
      }
      assertTemplateAccess(user, updateData.template);
    }

    const updatedResume = await Resume.findOneAndUpdate(
      { _id: resumeId, userId: req.userId },
      updateData,
      { new: true }
    );

    if (!updatedResume) {
      throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found");
    }

    return sendSuccess(res, {
      message: "Resume updated successfully",
      data: { resume: updatedResume },
    });
  } catch (error) {
    return next(error);
  }
};

export const checkDownloadAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    assertDownloadAccess(user);

    return sendSuccess(res, {
      message: "Download allowed",
      data: { allowed: true },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateResumeVisibility = async (req, res, next) => {
  try {
    const { resumeId } = req.validatedParams || req.params;
    const { isPublic } = req.validatedBody;

    const updatedResume = await Resume.findOneAndUpdate(
      { _id: resumeId, userId: req.userId },
      { public: isPublic },
      { new: true }
    );

    if (!updatedResume) {
      throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found");
    }

    return sendSuccess(res, {
      message: "Resume visibility updated successfully",
      data: { resume: updatedResume },
    });
  } catch (error) {
    return next(error);
  }
};
