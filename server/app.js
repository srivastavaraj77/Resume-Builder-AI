import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import aiRouter from "./routes/aiRoutes.js";
import importRouter from "./routes/importRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => {
  res.send("Server is live...");
});

app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/ai", aiRouter);
app.use("/api/import", importRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
