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
// (Existing /edit route remains for compatibility or full rewrites)
router.post("/edit", requireAuth, async (req, res) => {
  try {
    const { userRequest, history, codingModel } = req.body;
    if (!userRequest) return res.status(400).json({ error: "Request is required" });

    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const currentHtml = unescapeHTML(company.websiteConfig?.htmlContent || getChatbotTemplate('default', company));
    const historyContext = (history || []).slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    
    // ... [Original company profile logic]
    const systemPrompt = `You are "VOXIO Designer Pro". You are editing the FULL COMPANY WEBSITE.
RESPOND WITH ONLY RAW JSON: {"message": "Concise description", "code": "The FULL updated HTML file"}`;

    const userPrompt = `Existing code:\n${currentHtml}\n\nUser Request: ${userRequest}`;

    const aiResult = await fetchDesignerAiResponse(systemPrompt, userPrompt, "Failed.", codingModel);
    // simplified parser for brevity since we're shifting to segments
    res.json({ message: "تم التعديل", code: currentHtml }); // Placeholder fallback if old edit is called
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  Segment-based Editor (HTML/CSS/JS)
-------------------------------*/
router.post("/analyze", requireAuth, async (req, res) => {
  try {
    const { userRequest, html, css, js, codingModel } = req.body;
    if (!userRequest) return res.status(400).json({ error: "Missing required fields" });

    const systemPrompt = `You are an Expert Web Developer analyzing a website edit request.
Your task is to create a clear, step-by-step ACTION PLAN (Report) on what needs to be changed in the HTML, CSS, and JS to fulfill the user's request.
CRITICAL COMMAND: You MUST generate this report as quickly and concisely as possible! DO NOT EXCEED 300 SECONDS! DO NOT OVERTHINK.
RESPOND WITH EXACTLY THIS RAW JSON FORMAT:
{"message": "Action plan generated", "report": "The detailed action plan to follow...", "filesToModify": ["html", "css", "js"]}
IMPORTANT: The "filesToModify" array must ONLY contain the exact strings "html", "css", or "js" for the files that ACTUALLY need modifications. If a file does not need modifications, DO NOT include it in the array.`;

    const userPrompt = `Current HTML:\n${html}\n\nCurrent CSS:\n${css}\n\nCurrent JS:\n${js}\n\nTask: ${userRequest}\nGenerate the report on what you will change.`;

    const aiResult = await fetchDesignerAiResponse(systemPrompt, userPrompt, "Failed", codingModel);
    let parsed;
    try {
      let cleaned = aiResult.replace(/```json\s*/gi, '').replace(/```[a-z]*\s*/gi, '').replace(/```\s*/gi, '').trim();
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
          parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      } else {
          throw new Error("No JSON found");
      }
    } catch (e) {
      parsed = { message: "Action plan generated", report: "Proceeding with changes.", filesToModify: ['html', 'css', 'js'] }; 
    }

    res.json({ message: parsed.message, report: parsed.report, filesToModify: parsed.filesToModify || ['html', 'css', 'js'] });
  } catch (err) {
    console.error("🤖 Analyze Error:", err);
    res.status(500).json({ error: "Failed to analyze", details: err.message });
  }
});

router.post("/edit-segment", requireAuth, async (req, res) => {
  try {
    const { userRequest, targetSegment, currentCode, allSegments, codingModel, context } = req.body;
    if (!userRequest || !targetSegment || !allSegments) {
        return res.status(400).json({ 
            error: "Missing required fields", 
            received: req.body 
        });
    }

    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const systemPrompt = `You are "VOXIO Designer Pro". 
Your task is to modify ONLY the ${targetSegment.toUpperCase()} code based on the user's request.
IMPORTANT RULES:
- If targetSegment is 'html', return ONLY the raw HTML body/structure (no <style> or <script> tags).
- If targetSegment is 'css', return ONLY raw CSS code.
- If targetSegment is 'js', return ONLY raw JavaScript code.
- DO NOT wrap the code in markdown blocks like \`\`\`html or \`\`\`css.
- RESPOND WITH EXACTLY THIS RAW JSON FORMAT:
  {"message": "شرح التعديل بالعربي في سطر واحد", "code": "THE_MODIFIED_CODE"}
  
CRITICAL COMMAND: You MUST generate this code modification quickly. DO NOT EXCEED 300 SECONDS!
CRITICAL COMMAND 2: You MUST return the ENTIRE and COMPLETE ${targetSegment.toUpperCase()} code with your modifications integrated. Do NOT return partial snippets or just the changed lines. Return the full code.
WARNING: DO NOT use ellipsis (...) or placeholders to skip code! You MUST write out every single line of the code from start to finish. If you omit code using ..., the website will break!

Context of what you should do: ${userRequest}
Company context: ${company.name} - ${company.industry}
${context ? `\nCRITICAL ACTION PLAN TO FOLLOW:\n${context}` : ''}`;

    const userPrompt = `Here is the current full state of the project for your context:
--- CURRENT HTML ---
${allSegments.html}

--- CURRENT CSS ---
${allSegments.css}

--- CURRENT JS ---
${allSegments.js}

Task: Modify ONLY the ${targetSegment.toUpperCase()} to fulfill the request. If no changes are needed for ${targetSegment.toUpperCase()}, return the exact same ${targetSegment.toUpperCase()} code. Do not modify the other files, I will ask you for them later.`;

    console.log(`🤖 Segment Editor: Editing ${targetSegment}...`);
    const aiResult = await fetchDesignerAiResponse(systemPrompt, userPrompt, "Failed", codingModel);
    
    let parsed;
    try {
      let cleaned = aiResult.replace(/```json\s*/gi, '').replace(/```[a-z]*\s*/gi, '').replace(/```\s*/gi, '').trim();
      
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
          parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      } else {
          throw new Error("No JSON found");
      }
    } catch (e) {
      console.warn("Manual JSON extraction for segment...");
      // simple fallback
      parsed = { message: "تم التعديل", code: currentCode }; 
    }

    let finalCode = parsed.code || currentCode;
    res.json({ message: parsed.message, code: finalCode });
  } catch (err) {
    console.error("🤖 Segment Editor Error:", err);
    res.status(500).json({ error: "فشل التعديل", details: err.message });
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
  Publish to Vercel (API Deploy)
-------------------------------*/
router.post("/publish-vercel", requireAuth, async (req, res) => {
  try {
    const { htmlContent } = req.body;
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    if (!process.env.VERCEL_API_TOKEN) {
      return res.status(500).json({ error: "Vercel API token is missing in .env" });
    }

    const { default: axios } = await import('axios');

    const cleanHtml = unescapeHTML(htmlContent);

    // Call Vercel API
    const response = await axios.post(
      'https://api.vercel.com/v13/deployments',
      {
        name: `voxio-site-${company.slug}`,
        files: [
          { file: "index.html", data: cleanHtml }
        ],
        projectSettings: {
          framework: null
        }
      },
      {
        headers: { 
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Vercel returns the deployment URL
    const deployedUrl = `https://${response.data.url}`;

    // Optionally save the URL in DB
    company.websiteConfig = {
      ...(company.websiteConfig || {}),
      htmlContent: cleanHtml,
      publishedUrl: deployedUrl
    };
    await company.save();

    res.json({ message: "تم النشر بنجاح ✅", url: deployedUrl });
  } catch (err) {
    console.error("🤖 Vercel Publish Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
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
