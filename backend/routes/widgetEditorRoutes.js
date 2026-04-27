import express from "express";
import Company from "../models/company.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchDesignerAiResponse } from "../utils/corexHelper.js";

const router = express.Router();

/*-------------------------------
  AI-powered WIDGET editor
-------------------------------*/
router.post("/edit", requireAuth, async (req, res) => {
  try {
    const { userRequest, history } = req.body;
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const currentConfig = company.widgetConfig || {
        primaryColor: "#6C63FF",
        welcomeMessage: "مرحباً! كيف يمكنني مساعدتك؟",
        avatar: "",
        customCss: ""
    };

    const systemPrompt = `You are "VOXIO Widget Architect". You specialize in designing the floating chat bubble widget.
The user wants to modify their FLOATING CHAT WIDGET (the small bubble at the corner of their site).

Style Guidelines:
- The widget should be premium, modern, and high-end.
- Focus on the launcher button, the chat bubbles, and the overall color scheme.

CRITICAL: You must return JSON only:
{
  "message": "Description of changes in user language",
  "config": {
    "primaryColor": "Hex color",
    "welcomeMessage": "New welcome text",
    "customCss": "CSS rules to inject into the widget iframe to achieve the look"
  }
}

The CSS should target classes like:
.vx-bubble, .vx-widget-header, .vx-input-area, .vx-avatar-main, etc.`;

    const userPrompt = `Current Config: ${JSON.stringify(currentConfig)}
User Request: ${userRequest}
History: ${JSON.stringify(history)}`;

    const aiResult = await fetchDesignerAiResponse(systemPrompt, userPrompt, "Failed to process.");
    
    let parsed;
    try {
        const cleaned = aiResult.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
    } catch (e) {
        return res.status(500).json({ error: "AI response error" });
    }

    // Save to Firestore
    company.widgetConfig = parsed.config;
    await Company.collection.doc(company._id).set({ widgetConfig: parsed.config }, { merge: true });

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/current", requireAuth, async (req, res) => {
    const company = await Company.findOne({ owner: req.user._id });
    res.json(company?.widgetConfig || { primaryColor: "#6C63FF", welcomeMessage: "Welcome!" });
});

export default router;
