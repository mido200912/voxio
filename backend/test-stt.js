import 'dotenv/config';
import { transcribeAudio } from './utils/corexHelper.js';
import fs from 'fs';

async function runTest() {
    console.log("Testing STT with dummy buffer...");
    try {
        // Create a small dummy buffer
        const dummyBuffer = Buffer.from("dummy data");
        const res = await transcribeAudio(dummyBuffer, "test.ogg", "audio/ogg");
        console.log("Result:", res);
    } catch (e) {
        console.error("Test Error:", e);
    }
}

runTest();
