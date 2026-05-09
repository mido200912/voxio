import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

async function run() {
    await mongoose.connect(MONGO_URI);
    const hash = await bcrypt.hash('password123', 8);
    const res = await mongoose.connection.db.collection('users').updateOne(
        { email: 'mohammedalsyedalsyed12@gmail.com' },
        { $set: { password: hash, otp: '123456', otpExpires: Date.now() + 3600000 } }
    );
    console.log('Update result:', res);
    process.exit(0);
}

run();
