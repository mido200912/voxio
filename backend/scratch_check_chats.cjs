const mongoose = require('mongoose');

async function checkChats() {
  await mongoose.connect('mongodb+srv://voxio:mido927010@cluster0.u2n0cwo.mongodb.net/?appName=Cluster0');
  
  const chats = await mongoose.connection.db.collection('companychats').find({ platform: 'instagram' }).toArray();
  console.log(`Found ${chats.length} Instagram chats.`);
  if (chats.length > 0) {
    console.log('Latest 5 chats:');
    chats.slice(-5).forEach(c => console.log(`[${c.sender}] ${c.text}`));
  }

  const logs = await mongoose.connection.db.collection('integrations').findOne({ platform: 'instagram' });
  console.log('Logs array length:', logs?.logs?.length || 0);
  if (logs?.logs?.length > 0) {
    console.log('Latest log:', logs.logs[0]);
  }

  await mongoose.disconnect();
}

checkChats().catch(console.error);
