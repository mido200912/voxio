async function test() {
  const r = await fetch('https://voxio0.vercel.app/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'test' })
  });
  const text = await r.text();
  console.log('Status: ' + r.status);
  console.log('Body: ' + text);
}
test();
