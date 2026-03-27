const mongoose = require('mongoose');

async function fixProducts() {
  await mongoose.connect('mongodb+srv://refqa:mido927010@cluster0.bjnbwxn.mongodb.net/?appName=Cluster0');
  
  // Directly update the integration for the webhook company with real products
  const result = await mongoose.connection.db.collection('integrations').updateOne(
    { 
      company: new mongoose.Types.ObjectId('6980d290290b5292257b994b'), 
      platform: 'telegram' 
    },
    {
      $set: {
        'settings.commands': [
          {
            command: 'shopping',
            description: 'shopping',
            category: 'shopping',
            type: 'product_menu',
            message: 'هنشتري ايه النهارده',
            successMessage: 'مبروك خدت واحد حمدي و خدت عليه واحد هديه',
            products: [
              { name: 'حمدي', price: '100 جنيه' },
              { name: 'شيبسي', price: '50 جنيه' },
              { name: 'كولا', price: '25 جنيه' }
            ]
          }
        ]
      }
    }
  );
  
  console.log('Update result:', result);
  
  // Verify
  const updated = await mongoose.connection.db.collection('integrations').findOne({
    company: new mongoose.Types.ObjectId('6980d290290b5292257b994b'),
    platform: 'telegram'
  });
  
  console.log('\n=== UPDATED DATA ===');
  console.log('Commands:', JSON.stringify(updated.settings.commands, null, 2));
  
  process.exit(0);
}

fixProducts();
