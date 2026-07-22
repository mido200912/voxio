import 'dotenv/config';
import Company from '../models/CompanyModel.js';
import Request from '../models/Request.js';
import KnowledgeFile from '../models/KnowledgeFile.js';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voxio';

async function migrate() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies to migrate.`);

    for (const company of companies) {
        console.log(`\nMigrating company: ${company.name || company._id}`);
        let migratedRequests = 0;
        let migratedKB = 0;

        // Migrate requests
        if (company.requests && company.requests.length > 0) {
            for (const req of company.requests) {
                await Request.create({
                    company: company._id.toString(),
                    customerName: req.customerName,
                    product: req.product,
                    message: req.message,
                    source: req.source,
                    date: req.date
                });
                migratedRequests++;
            }
            company.requests = []; // Clear array
        }

        // Migrate knowledgeBase
        if (company.knowledgeBase && company.knowledgeBase.length > 0) {
            for (const file of company.knowledgeBase) {
                await KnowledgeFile.create({
                    company: company._id.toString(),
                    fileName: file.fileName,
                    url: file.fileUrl || file.url,
                    fileType: file.fileType || file.type,
                    uploadDate: new Date().toISOString() // Or use existing if they had it
                });
                migratedKB++;
            }
            company.knowledgeBase = []; // Clear array
        }

        if (migratedRequests > 0 || migratedKB > 0) {
            await company.save();
            console.log(`Migrated ${migratedRequests} requests and ${migratedKB} knowledge files.`);
        } else {
            console.log("Nothing to migrate for this company.");
        }
    }

    console.log("\nMigration complete.");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
