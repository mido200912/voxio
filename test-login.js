import fetch from 'node-fetch';

async function test() {
  const r = await fetch('https://voxio1.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
  });
  const text = await r.text();
  console.log('Status:', r.status);
  console.log('Response:', text);
}
test();
