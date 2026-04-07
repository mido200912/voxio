import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from './backend/models/company.js';
import { getDefaultChatbotTemplate } from './backend/utils/defaultChatbotTemplate.js';

dotenv.config({ path: './backend/.env' });

async function fix() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        const companies = await Company.find();
        let fixed = 0;
        for (const company of companies) {
            const defaultHtml = getDefaultChatbotTemplate(company);
            if (!company.websiteConfig) {
                company.websiteConfig = {};
            }
            company.websiteConfig.htmlContent = defaultHtml;
            await company.save();
            fixed++;
        }
        console.log(`Successfully reset ${fixed} companies to perfectly clean template.`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fix();
