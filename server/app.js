import cors from "cors";
import express from "express";
import { handleRazorpayWebhook } from "./controllers/paymentController.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import aiRouter from "./routes/aiRoutes.js";
import importRouter from "./routes/importRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import userRouter from "./routes/userRoutes.js";
import mongoose from "mongoose";

const app = express();

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const allowedOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0 && process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (_req, res) => {
  res.send("Resume Builder API is live");
});

app.get("/healthz", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    ok: dbReady,
    service: "resume-builder-api",
    dbState: mongoose.connection.readyState,
  });
});

app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/ai", aiRouter);
app.use("/api/import", importRouter);
app.use("/api/payments", paymentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
