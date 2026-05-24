const mongoose = require('mongoose');
const axios = require('axios');

async function check() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const fb = await mongoose.connection.db.collection('integrations').findOne({ platform: 'facebook' });
  const userToken = fb.credentials.userAccessToken;
  
  // Get ALL pages for this user
  console.log('=== ALL Facebook Pages for this User ===\n');
  
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v20.0/me/accounts?fields=id,name,instagram_business_account&access_token=${userToken}`);
    
    if (!data.data || data.data.length === 0) {
      console.log('No pages found!');
    } else {
      data.data.forEach((page, i) => {
        console.log(`Page ${i + 1}:`);
        console.log('  Name:', page.name);
        console.log('  ID:', page.id);
        console.log('  Instagram Business Account:', page.instagram_business_account ? page.instagram_business_account.id : '❌ NOT LINKED');
        console.log('');
      });
    }
  } catch (e) {
    console.error('API Error:', e.response?.data || e.message);
  }
  
  await mongoose.disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
