const https = require('https');

// Get the access token from the integration
const mongoose = require('mongoose');

async function checkMeta() {
  console.log('=== Meta API Diagnostics ===\n');
  
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const integration = await mongoose.connection.db.collection('integrations')
    .findOne({ platform: 'instagram', isActive: true });
  
  if (!integration) {
    console.error('No active Instagram integration found!');
    process.exit(1);
  }
  
  const accessToken = integration.credentials?.accessToken;
  const pageId = integration.credentials?.pageId;
  
  console.log(`Page ID: ${pageId}`);
  console.log(`Access Token (first 20): ${accessToken?.substring(0, 20)}...`);
  
  // 1. Check if token is valid
  console.log('\n--- 1. Token Validation ---');
  try {
    const tokenData = await httpGet(`https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`);
    const parsed = JSON.parse(tokenData);
    if (parsed.data) {
      console.log(`Token Valid: ${parsed.data.is_valid}`);
      console.log(`App ID: ${parsed.data.app_id}`);
      console.log(`Type: ${parsed.data.type}`);
      console.log(`Expires: ${parsed.data.expires_at ? new Date(parsed.data.expires_at * 1000).toLocaleString() : 'Never'}`);
      console.log(`Scopes: ${(parsed.data.scopes || []).join(', ')}`);
    } else {
      console.log('Token debug response:', tokenData.substring(0, 300));
    }
  } catch (e) {
    console.error('Token check failed:', e.message);
  }
  
  // 2. Check page subscriptions
  console.log('\n--- 2. Webhook Subscriptions ---');
  try {
    const subData = await httpGet(`https://graph.facebook.com/v20.0/${pageId}/subscribed_apps?access_token=${accessToken}`);
    const parsed = JSON.parse(subData);
    console.log('Subscribed Apps:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.error('Subscription check failed:', e.message);
  }
  
  // 3. Check app subscriptions
  console.log('\n--- 3. App Webhook Configuration ---');
  const appId = '957069010467222';
  const appSecret = '57348582b3d4ff50b7822d4e08aec03f';
  try {
    const appTokenData = await httpGet(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`);
    const appToken = JSON.parse(appTokenData).access_token;
    
    const subData = await httpGet(`https://graph.facebook.com/v20.0/${appId}/subscriptions?access_token=${appToken}`);
    const parsed = JSON.parse(subData);
    console.log('App Subscriptions:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.error('App subscription check failed:', e.message);
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

checkMeta().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
