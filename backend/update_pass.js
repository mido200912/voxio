import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const hash = await bcrypt.hash('Test@123456', 8);
  await db.collection('users').updateOne(
    { email: 'mohammedalsyedalsyed12@gmail.com' },
    { $set: { password: hash, isVerified: true } }
  );
  
  console.log('✅ Password updated successfully!');
  await mongoose.disconnect();
}

run().catch(console.error);
