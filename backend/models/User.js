import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "owner" }, // owner, admin, etc.
  otp: { type: String }, // For login and verification
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false }, // To verify email later if needed
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
