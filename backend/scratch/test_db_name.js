import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
console.log("Testing MONGO_URI:", MONGO_URI);

try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");
    console.log("Current DB Name:", mongoose.connection.db.databaseName);
    process.exit(0);
} catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
}
