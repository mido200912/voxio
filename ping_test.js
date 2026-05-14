import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

async function testConnection() {
    console.log(`🔍 Testing connection to ${BACKEND_URL}...`);
    try {
        const res = await axios.get(`${BACKEND_URL}/ping`);
        console.log('✅ Backend is UP!');
        console.log('Response:', res.data);
    } catch (err) {
        console.error('❌ Backend is DOWN or unreachable.');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.log('\n💡 Suggested Actions:');
        console.log('1. Go to the "backend" folder: cd backend');
        console.log('2. Start the backend: npm run dev');
        console.log('3. Ensure port 5000 is not blocked by a firewall.');
    }
}

testConnection();
