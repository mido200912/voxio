import { fetchAiResponse } from './utils/corexHelper.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        console.log("Testing with model inclusionai/ring-2.6-1t:free...");
        let reply = await fetchAiResponse("مرحبا، كيف حالك؟", "Fallback", "inclusionai/ring-2.6-1t:free");
        console.log("Final Reply:", reply);
    } catch(e) {
        console.error(e);
    }
})();
