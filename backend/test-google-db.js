import mongoose from "mongoose";
import dotenv from "dotenv";
import { FirestoreModel } from "./config/firestoreModel.js";
import User from "./models/User.js";

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/voxio");
    console.log("✅ Connected!");

    console.log("Simulating Google Login DB logic...");
    const email = "test.google@example.com";
    const googleId = "123456789";
    const name = "Test User";

    let user = await User.findOne({ email });
    let isNew = false;

    if (user) {
      console.log("User found. Updating...");
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      console.log("User not found. Creating...");
      isNew = true;
      user = await User.create({ name, email, googleId, isVerified: true });
    }

    console.log("✅ DB Logic Success! User ID:", user._id);
    process.exit(0);

  } catch (err) {
    console.error("❌ Test Failed (500 Error Cause):", err.message);
    process.exit(1);
  }
};

runTest();
