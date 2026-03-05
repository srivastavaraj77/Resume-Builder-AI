import mongoose from "mongoose";

const atsHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    beforeScore: { type: Number, required: true },
    afterScore: { type: Number, required: true },
    applied: { type: Boolean, required: true, default: false },
    changedFields: [{ type: String }],
    targetRole: { type: String, default: "" },
  },
  { timestamps: true }
);

const AtsHistory = mongoose.model("AtsHistory", atsHistorySchema);

export default AtsHistory;
