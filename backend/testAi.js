import { fetchAiResponse, fetchDesignerAiResponse } from './utils/corexHelper.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        console.log("=== Testing fetchAiResponse ===");
        console.log("Testing with model openrouter/owl-alpha...");
        let reply = await fetchAiResponse("مرحبا", "Fallback", "openrouter/owl-alpha");
        console.log("Final Reply 1:", reply);
        
        console.log("\n=== Testing fetchDesignerAiResponse ===");
        let reply2 = await fetchDesignerAiResponse("You are an expert designer", "Make it beautiful", "Fallback", "openrouter/owl-alpha");
        console.log("Final Reply 2 length:", reply2.length);

    } catch(e) {
        console.error(e);
    }
})();
