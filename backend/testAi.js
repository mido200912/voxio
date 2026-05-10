import { fetchAiResponse, fetchDesignerAiResponse } from './utils/corexHelper.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        console.log("=== Testing fetchAiResponse ===");
        console.log("Testing with model google/gemini-2.0-flash-001...");
        let reply = await fetchAiResponse("مرحبا", "Fallback", "google/gemini-2.0-flash-001");
        console.log("Final Reply 1:", reply);
        
        console.log("\n=== Testing fetchDesignerAiResponse ===");
        let reply2 = await fetchDesignerAiResponse("You are an expert designer", "Make it beautiful", "Fallback", "google/gemini-2.0-flash-001");
        console.log("Final Reply 2 length:", reply2.length);

    } catch(e) {
        console.error(e);
    }
})();
