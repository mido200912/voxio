import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Replicate firebase-admin init logic from backend/config/firebase.js
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"|"$/g, '') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: "googleapis.com"
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const backupDir = path.join(process.cwd(), 'firestore_backup');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const collections = ['users', 'companies', 'integrations', 'projects', 'company_chats', 'broadcasts'];

async function exportCollections() {
    console.log('🚀 Starting Firestore Export...');
    
    for (const collectionName of collections) {
        try {
            console.log(`📦 Exporting collection: ${collectionName}...`);
            const snapshot = await db.collection(collectionName).get();
            
            const data = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            
            const filePath = path.join(backupDir, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            console.log(`✅ Exported ${data.length} documents to ${collectionName}.json`);
        } catch (error) {
            console.error(`❌ Error exporting ${collectionName}:`, error.message);
        }
    }
    
    console.log('\n✨ Export completed successfully! All files are in the "firestore_backup" folder.');
    process.exit(0);
}

exportCollections();
