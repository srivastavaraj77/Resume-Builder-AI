import express from "express";
import multer from "multer";
import {
  confirmImportedResume,
  previewImportedResume,
} from "../controllers/importController.js";
import protect from "../middlewares/authMiddleware.js";
import ApiError from "../utils/ApiError.js";

const importRouter = express.Router();
const parsedLimitMb = Number(process.env.IMPORT_MAX_FILE_SIZE_MB || 10);
const maxUploadSizeMb = Number.isFinite(parsedLimitMb) && parsedLimitMb > 0 ? parsedLimitMb : 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const mimeType = String(file.mimetype || "").toLowerCase();
    const fileName = String(file.originalname || "");
    const allowedMimeTypes = new Set([
      "application/pdf",
      "application/x-pdf",
      "application/acrobat",
      "applications/vnd.pdf",
      "text/pdf",
      "text/x-pdf",
      "application/octet-stream",
    ]);
    const hasPdfExtension = /\.pdf$/i.test(fileName);

    if (!allowedMimeTypes.has(mimeType) && !hasPdfExtension) {
      cb(new ApiError(400, "VALIDATION_ERROR", "Only PDF files are supported"));
      return;
    }
    cb(null, true);
  },
});

importRouter.use(protect);
importRouter.post("/resume-preview", upload.single("resume"), previewImportedResume);
importRouter.post("/resume-confirm", confirmImportedResume);

export default importRouter;
