const mongoose = require('mongoose');

async function debug() {
  console.log('Connecting to database...');
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const allIntegrations = await mongoose.connection.db.collection('integrations')
    .find({ platform: 'instagram' })
    .toArray();
    
  console.log(`\n=== Found ${allIntegrations.length} Instagram integration(s) ===\n`);
  
  for (const int of allIntegrations) {
    console.log(`--- Integration ID: ${int._id} ---`);
    console.log(`Company ID: ${int.company}`);
    console.log(`Page ID: ${int.credentials?.pageId}`);
    console.log(`IG Account ID: ${int.credentials?.igAccountId}`);
    console.log(`Access Token: ${int.credentials?.accessToken || 'N/A'}`);
    console.log(`User Access Token (fallback): ${int.credentials?.userAccessToken || 'N/A'}`);
    console.log('');
  }

  process.exit(0);
}

debug().catch(err => {
  console.error('Debug script failed:', err);
  process.exit(1);
});
