const mongoose = require('mongoose');
const axios = require('axios');

async function tryAllMethods() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const fb = await mongoose.connection.db.collection('integrations').findOne({ platform: 'facebook' });
  const pageToken = fb.credentials.accessToken;
  const userToken = fb.credentials.userAccessToken;
  const pageId = fb.credentials.pageId;
  
  console.log('=== Trying ALL methods to find Instagram Account ===\n');

  // Method 1: page_backed_instagram_accounts
  console.log('--- Method 1: page_backed_instagram_accounts ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/${pageId}/page_backed_instagram_accounts?fields=id,name,username&access_token=${pageToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data?.error?.message || e.message);
  }

  // Method 2: instagram_accounts edge
  console.log('\n--- Method 2: instagram_accounts edge ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/${pageId}/instagram_accounts?fields=id,username,name&access_token=${pageToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data?.error?.message || e.message);
  }

  // Method 3: connected_instagram_account (singular)
  console.log('\n--- Method 3: connected_instagram_account field ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/${pageId}?fields=connected_instagram_account{id,username,name}&access_token=${pageToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data?.error?.message || e.message);
  }

  // Method 4: Try with ALL available fields
  console.log('\n--- Method 4: Page all IG-related fields ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account,connected_instagram_account,instagram_accounts&access_token=${pageToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data?.error?.message || e.message);
  }

  // Method 5: Try Instagram API directly with user token
  console.log('\n--- Method 5: /me/accounts with page tokens ---');
  try {
    const { data: pagesData } = await axios.get(`https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token&access_token=${userToken}`);
    for (const page of pagesData.data) {
      console.log(`\nPage: ${page.name} (${page.id})`);
      // Try with page's own access_token
      try {
        const { data: igData } = await axios.get(`https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
        console.log('  IG Business Account:', igData.instagram_business_account ? igData.instagram_business_account.id : 'NOT FOUND');
      } catch (e2) {
        console.error('  Error:', e2.response?.data?.error?.message || e2.message);
      }
    }
  } catch (e) {
    console.error('Error:', e.response?.data?.error?.message || e.message);
  }

  // Method 6: Check token debug info
  console.log('\n--- Method 6: Debug token info ---');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/debug_token?input_token=${pageToken}&access_token=${pageToken}`);
    console.log('Token type:', data.data?.type);
    console.log('App ID:', data.data?.app_id);
    console.log('Scopes:', data.data?.scopes);
    console.log('Granular scopes:', JSON.stringify(data.data?.granular_scopes, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data?.error?.message || e.message);
  }

  await mongoose.disconnect();
}

tryAllMethods().catch(e => { console.error(e); process.exit(1); });
