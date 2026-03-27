const mongoose = require('mongoose');

async function debug() {
  await mongoose.connect('mongodb+srv://refqa:mido927010@cluster0.bjnbwxn.mongodb.net/?appName=Cluster0');
  
  // Get ALL telegram integrations
  const allIntegrations = await mongoose.connection.db.collection('integrations')
    .find({ platform: 'telegram' })
    .toArray();
    
  console.log(`\n=== Found ${allIntegrations.length} Telegram integration(s) ===\n`);
  
  for (const int of allIntegrations) {
    console.log(`--- Integration ID: ${int._id} ---`);
    console.log(`Company ID: ${int.company}`);
    console.log(`Bot Token: ${(int.credentials?.botToken || 'N/A').substring(0, 12)}...`);
    console.log(`Active: ${int.isActive}`);
    console.log(`Commands: ${JSON.stringify(int.settings?.commands || [], null, 2)}`);
    console.log(`Updated: ${int.updatedAt}`);
    console.log('');
  }

  // Also check what company the webhook URL points to
  console.log('=== Webhook Company ID from test: 6980d290290b5292257b994b ===');
  const webhookCompanyIntegration = await mongoose.connection.db.collection('integrations')
    .findOne({ company: new mongoose.Types.ObjectId('6980d290290b5292257b994b'), platform: 'telegram' });
  
  if (webhookCompanyIntegration) {
    console.log('Found integration for webhook company!');
    console.log('Commands:', JSON.stringify(webhookCompanyIntegration.settings?.commands || [], null, 2));
  } else {
    console.log('❌ NO integration found for company 6980d290290b5292257b994b!');
    console.log('This means the webhook URL points to a company that has no Telegram integration.');
  }
  
  process.exit(0);
}

debug();
