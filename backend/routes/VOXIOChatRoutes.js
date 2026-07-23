import express from 'express';
import axios from 'axios';
import multer from 'multer';
import { extractCorexReply, fetchAiResponse, transcribeAudio } from '../utils/corexHelper.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// معلومات VOXIO (هوية البوت و Agent Instructions)
const VOXIO_CONTEXT = `
You are the official AI Assistant and Copilot for "VOXIO" — a next-generation AI platform for businesses.
Your name is "VOXIO Bot". Be friendly, conversational, and professional.

## 🔴 BEHAVIOR GUIDELINES:
1. You are here to help users understand and use the VOXIO platform. Answer questions about VOXIO naturally and helpfully.
2. Be conversational. Greet users warmly if they greet you.
3. RESTRICTIONS: Refuse to write code, do general programming, write essays, or answer completely off-topic questions (e.g., 'Who won the World Cup?', 'Tell me a joke').
4. REFUSAL MESSAGE: "عذراً، تخصصي هو مساعدتك في استخدام منصة VOXIO وشرح مميزاتها. لا أستطيع تنفيذ هذا الطلب."

## About VOXIO & Features:
- AI Training: Upload PDFs, Docs to train agents.
- Multi-Channel: WhatsApp, Facebook, Shopify, Websites.
- Smart Dashboard: Monitor and takeover chats.

## 🛠️ AGENT COMMANDS (CRITICAL):
You have the ability to CONTROL the user's screen if they ask you to navigate, scroll, or do an action.
To execute an action, output one of the following exact command formats in your reply:

- To navigate to a page: \`[NAVIGATE: /path]\` (e.g., \`[NAVIGATE: /dashboard/ai-training]\` or \`[NAVIGATE: /]\`)
- To scroll to a specific section/element: \`[SCROLL: text_of_element]\` (e.g., \`[SCROLL: Features]\` or \`[SCROLL: Pricing]\`)
- To click a button/link: \`[CLICK: button_text]\` (e.g., \`[CLICK: Get Started]\`)
- To trigger an automatic follow-up prompt from yourself: \`[AUTO_PROMPT: question_text]\`

Always combine a friendly conversational reply with the command if appropriate.
Example: "بالتأكيد! سآخذك الآن إلى صفحة المميزات. [NAVIGATE: /] [SCROLL: Features]"
Example: "جاري نقلك إلى إعدادات واتساب... [NAVIGATE: /dashboard/whatsapp]"

Respond in the same language the user uses (Arabic or English).
`;

router.post('/', async (req, res) => {
    try {
        const { prompt, pageContext } = req.body;

        let contextString = '';
        if (pageContext) {
            contextString = \`
## CURRENT USER CONTEXT:
- URL: \${pageContext.url || 'Unknown'}
- Page Title: \${pageContext.title || 'Unknown'}
- Available Headings (can be scrolled to): \${(pageContext.headings || []).map(h => h.text).join(', ')}
- Available Links/Buttons: \${(pageContext.links || []).map(l => l.text).join(', ')}
\`;
        }

        const fullQuestion = \`\${VOXIO_CONTEXT}\n\${contextString}\nUser Question:\n\${prompt}\`;
        // استخدام الدالة الموحدة المدمج بها Fallback
        const reply = await fetchAiResponse(fullQuestion, "عذراً، أواجه مشكلة تقنية حالياً.");
        res.json({ reply });

    } catch (error) {
        console.error("VOXIO Bot Error:", error?.response?.data || error.message);
        res.status(500).json({ error: "Service unavailable" });
    }
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        
        const text = await transcribeAudio(req.file.buffer, req.file.originalname || 'audio.webm', req.file.mimetype || 'audio/webm');
        res.json({ text });
    } catch (error) {
        console.error("Transcription Error:", error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

export default router;
