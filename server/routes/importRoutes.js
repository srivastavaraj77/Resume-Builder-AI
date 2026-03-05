import express from "express";
import multer from "multer";
import {
  confirmImportedResume,
  previewImportedResume,
} from "../controllers/importController.js";
import protect from "../middlewares/authMiddleware.js";

const importRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are supported"));
      return;
    }
    cb(null, true);
  },
});

importRouter.use(protect);
importRouter.post("/resume-preview", upload.single("resume"), previewImportedResume);
importRouter.post("/resume-confirm", confirmImportedResume);

export default importRouter;
