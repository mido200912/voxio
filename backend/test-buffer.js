import axios from 'axios';
import 'dotenv/config';

async function test() {
    try {
        const res = await axios.get('https://www.w3schools.com/html/horse.ogg', {
            responseType: 'arraybuffer'
        });
        
        const buffer = res.data; // It's already a buffer!
        
        const formData = new FormData();
        const blob = new Blob([buffer], { type: "audio/ogg" });
        formData.append("file", blob, "audio.ogg");
        formData.append("model", "whisper-large-v3");

        const apiUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
        const apiKey = process.env.GROQ_API_KEY;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            },
            body: formData
        });

        const result = await response.json();
        console.log("Result:", result);
        
    } catch (e) {
        console.error(e);
    }
}

test();
