import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0';
const email = 'mohammedalsyedalsyed12@gmail.com';

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  
  // Search by variations of the email
  const user = await db.collection('users').findOne({
    email: { $regex: 'mohammedalsyedalsyed12', $options: 'i' }
  });
  
  if (!user) {
    console.log('❌ User not found with that email');
    
    // List all users to help
    const allUsers = await db.collection('users').find({}, { projection: { email: 1, name: 1 } }).limit(20).toArray();
    console.log('\n👥 Users in DB:');
    allUsers.forEach(u => console.log(`  - ${u.name || 'N/A'}: ${u.email || 'N/A'} (${u._id})`));
    
    await mongoose.disconnect();
    return;
  }
  
  console.log('✅ User found!');
  console.log(JSON.stringify(user, null, 2));
  
  // Find company
  const company = await db.collection('companies').findOne({ owner: user._id.toString() });
  if (company) {
    console.log('\n🏢 Company:');
    console.log(`  Name: ${company.name}`);
    console.log(`  Slug: ${company.slug}`);
    console.log(`  API Key: ${company.apiKey}`);
    console.log(`  Chat Token: ${company.chatToken}`);
    if (company.aiSettings) console.log(`  AI Model: ${company.aiSettings.model}`);
    
    // Find integrations
    const integrations = await db.collection('integrations').find({ company: company._id.toString() }).toArray();
    if (integrations.length > 0) {
      console.log('\n🔌 Integrations:');
      for (const int of integrations) {
        console.log(`  [${int.platform}] Active: ${int.isActive}`);
        if (int.credentials) {
          for (const [k, v] of Object.entries(int.credentials)) {
            const val = typeof v === 'string' ? v.substring(0, 30) + '...' : v;
            console.log(`    ${k}: ${val}`);
          }
        }
      }
    } else {
      console.log('\n🔌 No integrations found');
    }
  } else {
    console.log('\n🏢 No company found for this user');
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
