import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    profession: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "trialing", "canceled", "lifetime"],
      default: "inactive",
    },
    razorpayCustomerId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
