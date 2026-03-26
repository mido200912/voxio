const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://refqa:mido927010@cluster0.bjnbwxn.mongodb.net/?appName=Cluster0');
  
  const integration = await mongoose.connection.db.collection('integrations')
    .find({ platform: 'telegram' })
    .sort({ $natural: -1 })
    .limit(1)
    .next();
    
  if (!integration) {
    console.log('No Telegram integration found in DB');
    process.exit(0);
  }
  
  const token = integration.credentials.botToken;
  console.log('Bot Token found:', token.substring(0, 10) + '...');
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    console.log('Webhook Info:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
  
  process.exit(0);
}

check();
