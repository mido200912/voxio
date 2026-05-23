const https = require('https');
const mongoose = require('mongoose');

async function fixToken() {
  console.log('=== Fix Instagram Token ===\n');
  
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const integration = await mongoose.connection.db.collection('integrations')
    .findOne({ platform: 'instagram', isActive: true });
  
  if (!integration) {
    console.error('No active Instagram integration found!');
    process.exit(1);
  }
  
  const userAccessToken = integration.credentials?.accessToken;
  const userToken2 = integration.credentials?.userAccessToken; // Some flows store it separately
  const pageId = integration.credentials?.pageId;
  
  console.log(`Page ID: ${pageId}`);
  console.log(`Current Token (first 20): ${userAccessToken?.substring(0, 20)}...`);
  console.log(`Stored userAccessToken: ${userToken2 ? userToken2.substring(0, 20) + '...' : 'NOT SET'}`);
  
  // Try to get pages and their access tokens using the current (user) token
  const tokenToUse = userToken2 || userAccessToken;
  
  console.log('\n--- Attempting to get Page Access Token ---');
  try {
    const pagesData = await httpGet(`https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${tokenToUse}`);
    const parsed = JSON.parse(pagesData);
    
    if (parsed.error) {
      console.error('Error getting pages:', parsed.error.message);
      console.log('\n⚠️ The stored token cannot access pages. User needs to re-authenticate via Meta OAuth.');
      process.exit(1);
    }
    
    if (!parsed.data || parsed.data.length === 0) {
      console.log('No pages found for this token.');
      process.exit(1);
    }
    
    console.log(`\nFound ${parsed.data.length} page(s):\n`);
    
    let targetPage = null;
    
    for (const page of parsed.data) {
      console.log(`Page: ${page.name} (ID: ${page.id})`);
      console.log(`  Page Token (first 30): ${page.access_token?.substring(0, 30)}...`);
      console.log(`  IG Business Account: ${JSON.stringify(page.instagram_business_account)}`);
      
      if (page.id === pageId) {
        targetPage = page;
        console.log(`  ✅ THIS IS THE TARGET PAGE!`);
      }
    }
    
    if (targetPage) {
      const pageAccessToken = targetPage.access_token;
      
      // Verify the page token
      console.log('\n--- Verifying Page Token ---');
      const tokenCheck = await httpGet(`https://graph.facebook.com/v20.0/debug_token?input_token=${pageAccessToken}&access_token=${pageAccessToken}`);
      const tokenParsed = JSON.parse(tokenCheck);
      if (tokenParsed.data) {
        console.log(`Token Valid: ${tokenParsed.data.is_valid}`);
        console.log(`Type: ${tokenParsed.data.type}`);
        console.log(`Scopes: ${(tokenParsed.data.scopes || []).join(', ')}`);
      }
      
      // Update the database with the correct Page Token
      console.log('\n--- Updating Database with Page Access Token ---');
      await mongoose.connection.db.collection('integrations').updateOne(
        { _id: integration._id },
        { 
          $set: { 
            'credentials.accessToken': pageAccessToken,
            'credentials.userAccessToken': tokenToUse  // Keep the user token as backup
          } 
        }
      );
      console.log('✅ Database updated successfully!');
      
      // Subscribe to webhooks
      console.log('\n--- Subscribing to Webhooks ---');
      const subData = await httpPost(
        `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps`,
        { 
          subscribed_fields: 'messages,messaging_postbacks,feed',
          access_token: pageAccessToken
        }
      );
      console.log('Subscription result:', subData);
      
    } else {
      console.log(`\n⚠️ Could not find page with ID ${pageId} in user's pages.`);
      console.log('Available page IDs:', parsed.data.map(p => p.id).join(', '));
    }
    
  } catch (e) {
    console.error('Script error:', e.message);
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

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(body).toString();
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + '?' + parsedUrl.searchParams.toString(),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

fixToken().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
