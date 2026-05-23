const https = require('https');
const mongoose = require('mongoose');

async function debugMeta() {
  console.log('=== Meta / Instagram Final Diagnostic ===\n');
  
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const allIntegrations = await mongoose.connection.db.collection('integrations')
    .find({ platform: 'instagram', isActive: true })
    .toArray();
  
  if (allIntegrations.length === 0) {
    console.error('❌ No active Instagram integrations found in DB!');
    process.exit(1);
  }
  
  for (const int of allIntegrations) {
    console.log(`\n--- Checking Integration: ${int._id} ---`);
    const accessToken = int.credentials?.accessToken;
    const pageId = int.credentials?.pageId;
    
    console.log(`Page ID in DB: ${pageId}`);
    
    // Check Rules
    const globalRules = int.settings?.globalCommentRules || [];
    console.log(`Global Comment Rules count: ${globalRules.length}`);
    if (globalRules.length > 0) {
      console.log('Rules:', JSON.stringify(globalRules, null, 2));
    } else {
      console.log('⚠️ Warning: No Global Comment Rules set! Auto-reply to comments will NOT work without rules.');
    }
    
    if (!accessToken) {
      console.log('❌ Error: No access token found!');
      continue;
    }
    
    // Check Token with Meta API
    console.log('\n🔍 Verifying Token with Meta...');
    try {
      const tokenData = await httpGet(`https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`);
      const parsed = JSON.parse(tokenData);
      
      if (parsed.data) {
        console.log(`Token Valid: ${parsed.data.is_valid}`);
        console.log(`Token Type: ${parsed.data.type}`); // CRITICAL: Must be PAGE
        console.log(`Scopes: ${(parsed.data.scopes || []).join(', ')}`);
        
        if (parsed.data.type !== 'PAGE') {
          console.log('\n❌ CRITICAL ERROR: The token is a USER token, not a PAGE token.');
          console.log('This means Voxio cannot send messages or reply to comments on behalf of the page.');
          console.log('Action required: The login flow in the dashboard must be fixed to request and store the PAGE access token.');
        } else {
          console.log('\n✅ Token is correctly a PAGE token.');
        }
      } else {
        console.log('❌ Token verification failed:', tokenData);
      }
    } catch (e) {
      console.error('Failed to contact Meta API:', e.message);
    }
  }

  process.exit(0);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

debugMeta().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
