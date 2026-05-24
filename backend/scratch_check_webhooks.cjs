const mongoose = require('mongoose');
const axios = require('axios');

async function checkWebhooks() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const fb = await mongoose.connection.db.collection('integrations').findOne({ platform: 'instagram' });
  if (!fb) return console.log('No IG integration');
  
  const pageToken = fb.credentials.accessToken;
  const pageId = fb.credentials.pageId;
  
  console.log('=== Checking Page Subscriptions ===');
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/${pageId}/subscribed_apps?access_token=${pageToken}`);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data?.error?.message || e.message);
  }

  await mongoose.disconnect();
}

checkWebhooks().catch(e => { console.error(e); process.exit(1); });
