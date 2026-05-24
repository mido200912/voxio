const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  // Check all integrations
  const integrations = await mongoose.connection.db.collection('integrations').find({}).toArray();
  
  console.log('=== ALL INTEGRATIONS ===');
  console.log('Total:', integrations.length);
  
  integrations.forEach((ig, i) => {
    console.log(`\n--- Integration ${i + 1} ---`);
    console.log('Platform:', ig.platform);
    console.log('Company:', ig.company);
    console.log('isActive:', ig.isActive);
    console.log('Credentials keys:', Object.keys(ig.credentials || {}));
    if (ig.credentials?.pageId) console.log('Page ID:', ig.credentials.pageId);
    if (ig.credentials?.igAccountId) console.log('IG Account ID:', ig.credentials.igAccountId);
    if (ig.credentials?.accessToken) console.log('Access Token (first 30):', ig.credentials.accessToken.substring(0, 30) + '...');
  });

  await mongoose.disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
