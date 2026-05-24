const mongoose = require('mongoose');
const axios = require('axios');

async function deepCheck() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const fb = await mongoose.connection.db.collection('integrations').findOne({ platform: 'facebook' });
  const pageToken = fb.credentials.accessToken;
  const userToken = fb.credentials.userAccessToken;
  const pageId = fb.credentials.pageId;
  
  console.log('=== DEEP Instagram Diagnosis ===\n');

  // 1. Check token permissions
  console.log('--- Step 1: Token Permissions ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/me/permissions?access_token=${userToken}`);
    console.log('Granted permissions:');
    data.data.forEach(p => console.log(`  ${p.permission}: ${p.status}`));
  } catch (e) {
    console.error('Permissions check error:', e.response?.data || e.message);
  }

  // 2. Check page with instagram_business_account using PAGE token
  console.log('\n--- Step 2: Page Token -> instagram_business_account ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account,name,connected_instagram_account&access_token=${pageToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Page token error:', e.response?.data || e.message);
  }

  // 3. Try with USER token instead
  console.log('\n--- Step 3: User Token -> instagram_business_account ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account,name,connected_instagram_account&access_token=${userToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('User token error:', e.response?.data || e.message);
  }

  // 4. Try me/accounts with instagram_business_account using USER token
  console.log('\n--- Step 4: All Pages with IG fields ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/me/accounts?fields=id,name,instagram_business_account,connected_instagram_account,access_token&access_token=${userToken}`);
    data.data.forEach((page, i) => {
      console.log(`\nPage ${i + 1}: ${page.name} (${page.id})`);
      console.log('  instagram_business_account:', page.instagram_business_account ? page.instagram_business_account.id : 'NOT FOUND');
      console.log('  connected_instagram_account:', page.connected_instagram_account ? page.connected_instagram_account.id : 'NOT FOUND');
    });
  } catch (e) {
    console.error('All pages error:', e.response?.data || e.message);
  }

  // 5. Try Instagram Graph API directly
  console.log('\n--- Step 5: Try /me?fields=accounts{instagram_business_account} ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/me?fields=accounts{instagram_business_account}&access_token=${userToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }

  await mongoose.disconnect();
}

deepCheck().catch(e => { console.error(e); process.exit(1); });
