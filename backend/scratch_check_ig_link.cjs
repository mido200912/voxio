const https = require('https');

// Use the token from the database
const accessToken = 'EAANmcv5kZBZAYBRvLRO9ZAyMRDgSz';
const pageId = '983134708224155';

// But we need the full token. Let me fetch it from DB
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const fb = await mongoose.connection.db.collection('integrations').findOne({ platform: 'facebook' });
  const fullToken = fb.credentials.accessToken;
  const fullPageId = fb.credentials.pageId;
  
  console.log('Page ID:', fullPageId);
  console.log('Token (first 40):', fullToken.substring(0, 40) + '...');
  
  // Check if page has linked Instagram Business Account
  const url = `https://graph.facebook.com/v20.0/${fullPageId}?fields=instagram_business_account,name,access_token&access_token=${fullToken}`;
  
  console.log('\n=== Checking Instagram Business Account ===');
  
  const axios = require('axios');
  try {
    const { data } = await axios.get(url);
    console.log('Page Name:', data.name);
    console.log('Instagram Business Account:', JSON.stringify(data.instagram_business_account, null, 2));
    
    if (!data.instagram_business_account) {
      console.log('\n❌ NO Instagram Business Account linked to this Facebook Page!');
      console.log('This means the page does not have an Instagram Professional account connected.');
    } else {
      console.log('\n✅ Instagram Business Account found! ID:', data.instagram_business_account.id);
    }
  } catch (e) {
    console.error('API Error:', e.response?.data || e.message);
  }
  
  await mongoose.disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
