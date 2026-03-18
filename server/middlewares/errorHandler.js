import ApiError from "../utils/ApiError.js";

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  if (error?.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Resume file is too large. Please upload a PDF smaller than 5MB.",
          details: null,
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.message || "Invalid upload request",
        details: null,
      },
    });
  }

  if (error?.type === "entity.too.large" || error?.status === 413) {
    return res.status(413).json({
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Uploaded image is too large. Please use a smaller image.",
        details: null,
      },
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle common mongoose validation issues in a consistent contract format.
  if (error?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.errors,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    },
  });
};
