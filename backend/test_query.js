import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");
  

  const emailToTest = 'random.email12345@test.com';
  console.log("Testing email:", emailToTest);

  const exists = await User.findOne({ email: emailToTest });
  console.log("EXISTS RESULT:", exists);

  const testUser = await User.findOne({ email: 'test@test.com' });
  console.log("TEST USER RESULT:", testUser ? "FOUND" : "NOT FOUND");

  process.exit(0);
}

run().catch(console.error);
