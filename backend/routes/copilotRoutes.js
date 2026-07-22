import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import CompanyChat from "../models/CompanyChat.js";
import CopilotHistory from "../models/CopilotHistory.js";
import { fetchAiResponse } from "../utils/corexHelper.js";

const router = express.Router();

// ─── Helper: build context from recent failed conversations ────────────────
async function buildCopilotContext(companyId, days = 30) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Use string-based company ID for consistent matching across collections
    const companyIdStr = String(companyId);

    const allChats = await CompanyChat.find({ company: companyIdStr });

    // Filter by date in JS (safer than relying on $gte with dynamic schema)
    const recentChats = allChats.filter(c => new Date(c.createdAt) >= cutoff);

    const totalMsgs = recentChats.length;
    const userMsgs = recentChats.filter(c => c.sender === "user").length;
    const aiMsgs = recentChats.filter(c => c.sender === "ai").length;

    // Group by session
    const sessions = {};
    for (const chat of recentChats) {
      const key = String(chat.user || chat.sessionId || 'unknown');
      if (!sessions[key]) sessions[key] = [];
      sessions[key].push(chat);
    }

    const failureKeywords = [
      "i don't know", "i'm not sure", "cannot help", "contact support",
      "لا أعلم", "لا أستطيع", "تواصل مع", "غير متأكد",
    ];

    const failedSessions = [];
    for (const [, msgs] of Object.entries(sessions)) {
      const sorted = msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const lastAI = sorted.filter(m => m.sender === "ai").pop();
      if (lastAI) {
        const text = (lastAI.text || "").toLowerCase();
        const failed = failureKeywords.some(kw => text.includes(kw));
        if (failed) {
          failedSessions.push(sorted.slice(0, 6).map(m => ({
            sender: m.sender,
            text: (m.text || "").substring(0, 300),
          })));
        }
      }
    }

    return {
      stats: { totalMsgs, userMsgs, aiMsgs, failedCount: failedSessions.length },
      failedSamples: failedSessions.slice(0, 5),
    };
  } catch (err) {
    console.error("[Copilot] buildCopilotContext error:", err.message);
    // Return empty context rather than crashing the whole request
    return {
      stats: { totalMsgs: 0, userMsgs: 0, aiMsgs: 0, failedCount: 0 },
      failedSamples: [],
    };
  }
}

// ─── GET /api/copilot/history ──────────────────────────────────────────────
router.get("/history", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const companyIdStr = String(company._id);
    const history = await CopilotHistory.find({ company: companyIdStr });
    const sorted = history
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-60);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/copilot/clear (fix string ID) ─────────────────────────────
router.post("/clear", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const companyIdStr = String(company._id);
    const history = await CopilotHistory.find({ company: companyIdStr });
    for (const h of history) {
      await CopilotHistory.findByIdAndDelete(h._id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Copilot] /clear error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/copilot/chat ────────────────────────────────────────────────
router.post("/chat", requireAuth, async (req, res) => {
  try {
    console.log("[Copilot] /chat called, user:", req.user?._id);

    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const companyIdStr = String(company._id);
    console.log("[Copilot] Company:", company.name, companyIdStr);

    const { message, quickAction } = req.body;
    const userText = ((quickAction || message) || "").trim();
    if (!userText) {
      return res.status(400).json({ error: "message is required" });
    }

    // 1. Save user message
    await CopilotHistory.create({
      company: companyIdStr,
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    });

    // 2. Gather performance context (resilient — won't crash on error)
    const ctx = await buildCopilotContext(companyIdStr, 30);
    console.log("[Copilot] Context stats:", ctx.stats);

    const failuresSummary = ctx.failedSamples.length > 0
      ? ctx.failedSamples.map((sess, i) =>
          `--- Failed Conversation ${i + 1} ---\n` +
          sess.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")
        ).join("\n\n")
      : "No clear failures detected in the last 30 days.";

    // 3. Build the system prompt with performance data
    const systemPrompt = `You are VOXIO AI Copilot — an intelligent business consultant for the owner of a chatbot business called "${company.name || "this company"}".

Your role is to:
1. Analyze the chatbot's performance data and identify weak spots
2. Suggest concrete, actionable improvements to the bot's system prompt and knowledge base
3. Help the business owner understand their customer behavior patterns
4. Recommend strategies to improve AI resolution rate and customer satisfaction

Current Bot Performance (Last 30 Days):
- Total Messages: ${ctx.stats.totalMsgs}
- User Messages: ${ctx.stats.userMsgs}
- AI Replies: ${ctx.stats.aiMsgs}
- Failed Conversations Detected: ${ctx.stats.failedCount}

Sample Failed Conversations:
${failuresSummary}

Guidelines:
- Be specific and actionable, not generic
- When suggesting prompt improvements, write the actual improved text
- Speak as a trusted advisor, not a robot
- Be concise but thorough — no filler words
- Respond in the same language the user writes in (Arabic or English)`;

    // 4. Call LLM
    console.log("[Copilot] Calling LLM for:", userText.substring(0, 60));
    const aiReply = await fetchAiResponse(
      userText,
      "I'm unable to respond right now. Please try again.",
      null,
      null,
      systemPrompt
    );
    console.log("[Copilot] LLM reply length:", aiReply.length);

    // 5. Save AI reply
    await CopilotHistory.create({
      company: companyIdStr,
      role: "assistant",
      content: aiReply,
      timestamp: new Date().toISOString(),
    });

    res.json({ reply: aiReply, stats: ctx.stats });
  } catch (err) {
    console.error("[Copilot] /chat error:", err.message, "\n", err.stack);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/copilot/page-insight ────────────────────────────────────────
router.post("/page-insight", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { page, dataContext } = req.body;
    if (!page) {
      return res.status(400).json({ error: "page is required" });
    }

    const systemPrompt = `You are VOXIO AI Copilot — an intelligent business consultant for the owner of a chatbot business called "${company.name || "this company"}".
Your goal is to analyze the data currently visible to the business owner on the "${page}" page and provide 3-5 concise, actionable bullet points of insights.

Data Context:
${dataContext ? JSON.stringify(dataContext).substring(0, 5000) : "No specific data provided."}

Guidelines:
- Start directly with the insights, no introductory fluff.
- Be highly specific to the provided data.
- Mention numbers, names, or trends where applicable.
- Suggest direct actions the owner should take based on this data.
- Respond in Arabic unless the prompt implies English.`;

    const userText = `Please analyze my current data on the ${page} page.`;

    const aiReply = await fetchAiResponse(
      userText,
      "عذراً، لم أتمكن من تحليل البيانات حالياً.",
      null,
      null,
      systemPrompt
    );

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("[Copilot] /page-insight error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

