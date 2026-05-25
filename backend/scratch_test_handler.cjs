const mongoose = require('mongoose');
const { handleInstagramWebhook } = require('./controllers/webhookHandler.js');

async function testWebhook() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: '983134708224155', // The Page ID
        time: Math.floor(Date.now() / 1000),
        messaging: [
          {
            sender: { id: '123456789' },
            recipient: { id: '983134708224155' },
            timestamp: Date.now(),
            message: {
              mid: 'mid.123456789',
              text: 'Hello local test!'
            }
          }
        ]
      }
    ]
  };

  try {
    await handleInstagramWebhook(payload);
    console.log('Done processing.');
  } catch (e) {
    console.error('Error:', e);
  }

  await mongoose.disconnect();
}

testWebhook();
