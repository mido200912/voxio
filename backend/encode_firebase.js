import fs from 'fs';

const creds = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
const base64 = Buffer.from(JSON.stringify(creds)).toString('base64');

console.log("\n\n=== COPY THE FOLLOWING TEXT AND PUT IT IN VERCEL AS FIREBASE_BASE64_KEY ===\n\n");
console.log(base64);
console.log("\n\n=======================================================================\n\n");
