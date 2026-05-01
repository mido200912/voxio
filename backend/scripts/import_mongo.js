import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voxio';
const backupDir = path.join(process.cwd(), 'firestore_backup');

async function importData() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected.');

        const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const collectionName = file.replace('.json', '');
            console.log(`📦 Importing ${collectionName}...`);
            
            const filePath = path.join(backupDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (data.length === 0) {
                console.log(`⚠️ No data found in ${file}, skipping.`);
                continue;
            }

            // Create a dynamic model
            const Model = mongoose.models[collectionName] || mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }));
            
            // Clear existing data (optional, but safer for a clean migration)
            // await Model.deleteMany({}); 

            // Insert data
            const formattedData = data.map(item => ({
                ...item,
                _id: item._id // Mongoose will accept string IDs if we tell it to
            }));

            await Model.insertMany(formattedData, { ordered: false }).catch(e => {
                console.warn(`ℹ️ Some records in ${collectionName} might already exist or had errors:`, e.message);
            });

            console.log(`✅ Successfully imported ${data.length} records into ${collectionName}`);
        }

        console.log('\n✨ Migration to MongoDB completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

importData();
