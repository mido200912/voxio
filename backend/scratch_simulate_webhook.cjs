const crypto = require('crypto');
const axios = require('axios');

async function sendFakeWebhook() {
  const secret = '57348582b3d4ff50b7822d4e08aec03f';
  
  // Fake Instagram Webhook Payload
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: '983134708224155', // The Page ID we saw in the DB
        time: Math.floor(Date.now() / 1000),
        messaging: [
          {
            sender: { id: '123456789' }, // Fake sender
            recipient: { id: '983134708224155' },
            timestamp: Date.now(),
            message: {
              mid: 'mid.12345',
              text: 'Hello from fake webhook test!'
            }
          }
        ]
      }
    ]
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

  console.log('Sending fake webhook...');
  try {
    const res = await axios.post('https://aithor1.vercel.app/api/integrations/webhooks/meta', payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': `sha256=${signature}`
      }
    });
    console.log('Server response:', res.status, res.data);
  } catch (e) {
    console.error('Webhook Error:', e.response?.status, e.response?.data || e.message);
  }
}

sendFakeWebhook();
