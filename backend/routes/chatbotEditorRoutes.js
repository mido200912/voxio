import express from "express";
import Company from "../models/CompanyModel.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchDesignerAiResponse } from "../utils/corexHelper.js";
import { getChatbotTemplate } from "../utils/chatbotTemplates.js";

const router = express.Router();

function unescapeHTML(str) {
  if (!str) return str;
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}


/*-------------------------------
  Get current chatbot code (for editor)
-------------------------------*/
router.get("/current", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    let htmlContent = company.websiteConfig?.htmlContent || getChatbotTemplate('default', company);
    htmlContent = unescapeHTML(htmlContent);

    res.json({
      htmlContent,
      slug: company.slug,
      name: company.name,
      logo: company.logo || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  AI-powered website editor
  Now passes ALL company data to AI
-------------------------------*/
router.post("/edit", requireAuth, async (req, res) => {
  try {
    const { userRequest, history, codingModel } = req.body;
    if (!userRequest) return res.status(400).json({ error: "Request is required" });

    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const currentHtml = unescapeHTML(company.websiteConfig?.htmlContent || getChatbotTemplate('default', company));

    // Format chat history for context
    const historyContext = (history || [])
      .slice(-6) // Keep last 6 messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // ─── Gather ALL company data for the AI ───
    const companyProfile = `
=== COMPANY PROFILE (Use this data to personalize the website) ===
Company Name: ${company.name || 'N/A'}
Industry: ${company.industry || 'N/A'}
Company Size: ${company.size || 'N/A'}
Description: ${company.description || 'N/A'}
Vision: ${company.vision || 'N/A'}
Mission: ${company.mission || 'N/A'}
Values: ${company.values ? company.values.join(', ') : 'N/A'}
Website URL: ${company.websiteUrl || 'N/A'}
Logo URL: ${company.logo || 'No logo uploaded'}
=== END COMPANY PROFILE ===

=== AI TRAINING DATA (Knowledge the company provided) ===
Custom Instructions: ${company.customInstructions || 'None'}
PDF/Document Knowledge: ${(company.extractedKnowledge || 'None').substring(0, 3000)}
URL Extracted Knowledge: ${(company.urlExtractedKnowledge || 'None').substring(0, 3000)}
=== END TRAINING DATA ===`;

    const systemPrompt = `You are "VOXIO Designer Pro", a world-class UI/UX Designer and Lead Frontend Engineer.
You specialize in creating "stunning", "premium", and "state-of-the-art" web interfaces.
You speak all languages fluently. Always reply in the same language the user uses.

The user owns a company called "${company.name}". You are editing their FULL COMPANY WEBSITE/PORTFOLIO.
This is NOT just a chatbot page — it's a complete single-page website with sections like Hero, About, Services, Contact, etc.
The site also includes an embedded AI chatbot widget (floating chat button in the corner).

${companyProfile}

IMPORTANT: You MUST use the company data above to fill in the website content. Replace placeholder text with REAL company data:
- Use the company name, description, vision, mission, and values in the appropriate sections.
- If a logo URL exists, use it as the company logo <img>.
- Use the training data (knowledge base) to understand the company's products/services and display them.
- If the user asks to change something, understand the CONTEXT from the company data.

GOAL: Modify the provided HTML code to fulfill the user's request while maintaining a high-end, premium aesthetic.

STYLE GUIDELINES for "Premium" Design:
1. COLORS: Use sophisticated palettes. Avoid flat colors. Use gradients, deep shadows, and glows.
2. GLASSMORPHISM: Use backdrop-filter: blur(), subtle borders, and semi-transparent backgrounds.
3. TYPOGRAPHY: Use 'Cairo' for Arabic and 'Inter' or 'Poppins' for English. Ensure hierarchy.
4. ANIMATIONS: Add smooth transitions, hover effects, and subtle entry animations.
5. RESPONSIVENESS: Ensure the design looks perfect on all screen sizes.

CRITICAL TECHNICAL RULES:
- RESPOND WITH ONLY RAW JSON (NO EXPLANATION, NO MARKDOWN):
  {"message": "Concise description of changes in the user's language", "code": "The FULL updated HTML file"}
- PRESERVE THE CHATBOT WIDGET: Never remove the floating chat widget and its script. The IDs chat-box, user-input, send-btn must be preserved.
- COMPLETE CODE: Always return the full HTML starting from <!DOCTYPE html>.
- NO ESCAPING: Use raw < and > characters. DO NOT use HTML entities.
- CREATIVITY: If the user says "make it better", use your designer expertise to add professional touches.`;

    const userPrompt = `Existing code:
${currentHtml}

Conversation history for context:
${historyContext}

Current User Request: ${userRequest}

Remember: Modify the code to fulfill the current request while respecting the context of previous changes. Use real company data from the profile above.`;

    console.log(`🤖 Website Editor: Sending to AI... (Model: ${codingModel || 'default'})`);
    const aiResult = await fetchDesignerAiResponse(systemPrompt, userPrompt, "Failed to process request.", codingModel);
    
    // Parse AI response JSON
    let parsed;
    try {
      let cleaned = aiResult;
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```html\s*/gi, '').replace(/```\s*/gi, '');

      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (e) {
      console.error("🤖 AI Parse Error:", aiResult.substring(0, 500));
      return res.status(500).json({ error: "فشل التعديل، حاول تاني", details: aiResult.substring(0, 300) });
    }

    if (!parsed.message || !parsed.code) {
      return res.status(500).json({ error: "فشل التعديل، حاول تاني" });
    }

    // Clean any markdown formatting inside the generated code
    let finalCode = parsed.code;
    if (typeof finalCode === 'string') {
        finalCode = finalCode.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    }
    finalCode = unescapeHTML(finalCode);

    // Save updated HTML using the instance method
    company.websiteConfig = {
      ...company.websiteConfig,
      htmlContent: finalCode
    };
    await company.save();

    res.json({ message: parsed.message, code: finalCode });
  } catch (err) {
    console.error("🤖 Website Editor Error:", err);
    res.status(500).json({ error: "فشل التعديل، حاول تاني", details: err.message });
  }
});

/*-------------------------------
  Reset to template
-------------------------------*/
router.post("/reset", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { templateId } = req.body;
    const defaultHtml = getChatbotTemplate(templateId || 'default', company);
    company.websiteConfig = {
      ...company.websiteConfig,
      htmlContent: defaultHtml
    };
    await company.save();

    res.json({ message: "تم تطبيق القالب بنجاح ✅", code: defaultHtml });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  Public chatbot page data
-------------------------------*/
router.get("/page/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json({ error: "Company not found" });

    let htmlContent = company.websiteConfig?.htmlContent || getChatbotTemplate('default', company);
    htmlContent = unescapeHTML(htmlContent);

    res.json({
      htmlContent,
      name: company.name,
      logo: company.logo || '',
      slug: company.slug
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  Manual Save code
-------------------------------*/
router.post("/save", requireAuth, async (req, res) => {
  try {
    const { htmlContent } = req.body;
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    company.websiteConfig = {
      ...(company.websiteConfig || {}),
      htmlContent: unescapeHTML(htmlContent)
    };
    await company.save();

    res.json({ message: "تم حفظ الكود بنجاح ✅" });
  } catch (err) {
    console.error("🤖 Website Editor Save Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  Get available templates (7 templates)
-------------------------------*/
router.get("/templates", requireAuth, async (req, res) => {
  res.json({
    templates: [
      { id: 'default', name: 'كلاسيك دارك — Classic Dark' },
      { id: 'glassmorphism', name: 'الزجاجي — Glass Aurora' },
      { id: 'luxury', name: 'الملكي — Royal Gold' },
      { id: 'cyberpunk', name: 'المستقبلي — Cyber Neon' },
      { id: 'minimal-white', name: 'الأبيض الأنيق — Minimal White' },
      { id: 'startup', name: 'شركة ناشئة — Startup SaaS' },
      { id: 'restaurant', name: 'مطعم فاخر — Restaurant' }
    ]
  });
});

export default router;
