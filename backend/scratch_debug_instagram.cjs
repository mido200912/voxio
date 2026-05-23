const mongoose = require('mongoose');

async function debug() {
  console.log('Connecting to database...');
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  // 1. Show Instagram integration details
  const allIntegrations = await mongoose.connection.db.collection('integrations')
    .find({ platform: 'instagram' })
    .toArray();
    
  console.log(`\n=== Found ${allIntegrations.length} Instagram integration(s) ===\n`);
  
  for (const int of allIntegrations) {
    console.log(`--- Integration ID: ${int._id} ---`);
    console.log(`Company ID: ${int.company}`);
    console.log(`Page ID: ${int.credentials?.pageId}`);
    console.log(`IG Account ID: ${int.credentials?.igAccountId}`);
    console.log(`Access Token (first 20): ${(int.credentials?.accessToken || 'N/A').substring(0, 20)}...`);
    console.log(`Active: ${int.isActive}`);
    console.log(`Settings Keys:`, Object.keys(int.settings || {}));
    console.log(`chatbotRules:`, JSON.stringify(int.settings?.chatbotRules || [], null, 2));
    console.log(`globalCommentRules:`, JSON.stringify(int.settings?.globalCommentRules || [], null, 2));
    console.log(`dmClosedFallback:`, int.settings?.dmClosedFallback || '(not set)');
    console.log(`Logs:`, JSON.stringify(int.logs || [], null, 2));
    console.log('');
  }

  // 2. Show recent Instagram chat messages
  const recentChats = await mongoose.connection.db.collection('companychats')
    .find({ platform: 'instagram' })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
    
  console.log(`\n=== Last ${recentChats.length} Instagram chat messages ===\n`);
  for (const chat of recentChats) {
    const date = chat.createdAt ? new Date(chat.createdAt).toLocaleString() : 'N/A';
    console.log(`[${date}] ${chat.sender} (user: ${chat.user}): ${(chat.text || '').substring(0, 80)} | status: ${chat.status || 'N/A'}`);
  }
  
  process.exit(0);
}

debug().catch(err => {
  console.error('Debug script failed:', err);
  process.exit(1);
});
