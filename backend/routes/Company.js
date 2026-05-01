import express from "express";
import axios from "axios";
import crypto from "crypto";
import Company from "../models/company.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyApiKey } from "../middleware/verifyApiKey.js";
import { extractCorexReply, fetchAiResponse, fetchDesignerAiResponse } from "../utils/corexHelper.js";

const router = express.Router();

/*-------------------------------
  تصدير الموقع (Download ZIP)
-------------------------------*/
router.get("/export-website/:slug", requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug, owner: req.user._id });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const config = company.websiteConfig || {};
    const htmlBody = config.customHtml || `
      <header><h1>${company.name}</h1></header>
      <main><p>Welcome to our new website built with VOXIO.</p></main>
    `;
    const cssContent = config.customCss || `
      body { font-family: sans-serif; background: #fff; color: #000; margin: 0; padding: 20px; }
      header { background: ${config.themeColor || '#4f46e5'}; color: white; padding: 20px; border-radius: 8px; }
    `;

    // Widget injection (Dynamic inline chat script connecting directly to the API)
    const widgetScript = `
    <!-- VOXIO Full-Screen Chat Logic -->
    <script>
      const API_URL = (typeof process !== 'undefined' && process.env.BASE_URL) ? process.env.BASE_URL + "/api" : "http://localhost:5000/api";
      const API_KEY = "${company.apiKey}";

      document.addEventListener('DOMContentLoaded', () => {
        const chatContainer = document.getElementById('voxio-chat-container');
        const inputField = document.getElementById('voxio-chat-input');
        const sendBtn = document.getElementById('voxio-chat-send');
        
        if (!chatContainer || !inputField || !sendBtn) {
            console.warn("VOXIO Chat UI elements not found. Please ensure elements with IDs: voxio-chat-container, voxio-chat-input, and voxio-chat-send exist in your HTML.");
            return;
        }

        async function sendMessage() {
            const text = inputField.value.trim();
            if (!text) return;

            // Append User Message
            const userMsg = document.createElement('div');
            userMsg.className = "flex gap-4 max-w-3xl self-end ml-auto flex-row-reverse mb-4";
            userMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg text-white"><i class="fas fa-user"></i></div><div class="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-xl text-white">' + text.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>';
            chatContainer.appendChild(userMsg);
            
            inputField.value = '';
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Append Typing Indicator
            const typingId = 'typing-' + Date.now();
            const typingMsg = document.createElement('div');
            typingMsg.id = typingId;
            typingMsg.className = "flex gap-4 max-w-3xl mb-4";
            typingMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white"><i class="fas fa-robot"></i></div><div class="bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-xl text-gray-200"><span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span></div>';
            chatContainer.appendChild(typingMsg);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            try {
                const res = await fetch(API_URL + "/public/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ apiKey: API_KEY, prompt: text })
                });
                const data = await res.json();
                
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                
                const aiMsg = document.createElement('div');
                aiMsg.className = "flex gap-4 max-w-3xl mb-4";
                aiMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-blue-500/20"><i class="fas fa-robot"></i></div><div class="bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-xl border border-gray-700/50 text-gray-200" style="white-space: pre-wrap;">' + (data.reply || "Error").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\n/g, "<br>") + '</div>';
                chatContainer.appendChild(aiMsg);
                
            } catch(e) {
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                
                const errorMsg = document.createElement('div');
                errorMsg.className = "flex gap-4 max-w-3xl mb-4";
                errorMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"><i class="fas fa-exclamation-triangle"></i></div><div class="bg-red-900/30 text-red-400 p-4 rounded-2xl rounded-tl-none border border-red-500/30">Network error.</div>';
                chatContainer.appendChild(errorMsg);
            }
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        sendBtn.addEventListener('click', sendMessage);
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
      });
    </script>
    `;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${company.name} | Built with VOXIO</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
      ${cssContent}
    </style>
</head>
<body>
    ${htmlBody}
    
    ${widgetScript}
</body>
</html>`;

    res.json({
        html: fullHtml,
        css: cssContent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  عرض الموقع مباشرة (Pure HTML View)
-------------------------------*/
router.get("/view-website/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug });

    if (!company) {
      return res.status(404).send("<h1>Website Not Found</h1>");
    }

    const config = company.websiteConfig || {};
    const htmlBody = config.customHtml || `
<div class="h-screen w-full flex flex-col bg-gray-900 text-white font-sans">
  <header class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
    <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">${company.name} AI Agent</h1>
    <div class="text-sm text-gray-400"><i class="fas fa-circle text-green-500 text-xs mr-2 animate-pulse"></i> Online</div>
  </header>
  
  <main class="flex-1 overflow-y-auto p-6 flex flex-col gap-6" id="voxio-chat-container">
    <div class="flex gap-4 max-w-3xl">
      <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-lg shadow-lg shadow-blue-500/20"><i class="fas fa-robot text-white"></i></div>
      <div class="bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-xl border border-gray-700/50 text-gray-200">
        مرحباً بك! أنا الذكي الاصطناعي لشركه ${company.name}. كيف يمكنني مساعدتك اليوم؟
      </div>
    </div>
  </main>
  
  <footer class="p-6 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md pb-10">
    <div class="max-w-4xl mx-auto flex gap-4 w-full">
      <input type="text" id="voxio-chat-input" placeholder="Type your message here..." class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-gray-500">
      <button id="voxio-chat-send" class="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-4 font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
        <span>Send</span> <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </footer>
</div>
    `;
    const cssContent = config.customCss || ``;

    const widgetScript = `
    <!-- VOXIO Full-Screen Chat Logic -->
    <script>
      const API_URL = (typeof process !== 'undefined' && process.env.BASE_URL) ? process.env.BASE_URL + "/api" : "http://localhost:5000/api";
      const API_KEY = "${company.apiKey}";

      document.addEventListener('DOMContentLoaded', () => {
        const chatContainer = document.getElementById('voxio-chat-container');
        const inputField = document.getElementById('voxio-chat-input');
        const sendBtn = document.getElementById('voxio-chat-send');
        
        if (!chatContainer || !inputField || !sendBtn) {
            console.warn("VOXIO Chat UI elements not found. Please ensure elements with IDs: voxio-chat-container, voxio-chat-input, and voxio-chat-send exist in your HTML.");
            return;
        }

        async function sendMessage() {
            const text = inputField.value.trim();
            if (!text) return;

            // Append User Message
            const userMsg = document.createElement('div');
            userMsg.className = "flex gap-4 max-w-3xl self-end ml-auto flex-row-reverse mb-4";
            userMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg text-white"><i class="fas fa-user"></i></div><div class="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-xl text-white">' + text.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>';
            chatContainer.appendChild(userMsg);
            
            inputField.value = '';
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Append Typing Indicator
            const typingId = 'typing-' + Date.now();
            const typingMsg = document.createElement('div');
            typingMsg.id = typingId;
            typingMsg.className = "flex gap-4 max-w-3xl mb-4";
            typingMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white"><i class="fas fa-robot"></i></div><div class="bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-xl text-gray-200"><span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span></div>';
            chatContainer.appendChild(typingMsg);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            try {
                // Determine Session ID
                let sid = localStorage.getItem('voxio_sess_' + API_KEY);
                if (!sid) { sid = 'sess_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('voxio_sess_' + API_KEY, sid); }

                const res = await fetch(API_URL + "/public/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ apiKey: API_KEY, prompt: text, sessionId: sid })
                });
                const data = await res.json();
                
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                
                const aiMsg = document.createElement('div');
                aiMsg.className = "flex gap-4 max-w-3xl mb-4";
                aiMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-blue-500/20"><i class="fas fa-robot"></i></div><div class="bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-xl border border-gray-700/50 text-gray-200" style="white-space: pre-wrap;">' + (data.reply || "Error").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\n/g, "<br>") + '</div>';
                chatContainer.appendChild(aiMsg);
                
            } catch(e) {
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                
                const errorMsg = document.createElement('div');
                errorMsg.className = "flex gap-4 max-w-3xl mb-4";
                errorMsg.innerHTML = '<div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"><i class="fas fa-exclamation-triangle"></i></div><div class="bg-red-900/30 text-red-400 p-4 rounded-2xl rounded-tl-none border border-red-500/30">Network error.</div>';
                chatContainer.appendChild(errorMsg);
            }
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        sendBtn.addEventListener('click', sendMessage);
        
        // --- Slash Commands Logic ---
        const MOCK_COMMANDS = [{cmd: "/support", desc: "Talk to human"}, {cmd: "/products", desc: "View catalog"}, {cmd: "/faq", desc: "Get answers"}];
        let menuDiv = null;

        inputField.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.startsWith('/')) {
                if (!menuDiv) {
                    menuDiv = document.createElement('div');
                    menuDiv.style.position = 'absolute';
                    menuDiv.style.bottom = '100%';
                    menuDiv.style.left = '0';
                    menuDiv.style.width = '250px';
                    menuDiv.style.background = '#1e293b';
                    menuDiv.style.border = '1px solid #334155';
                    menuDiv.style.borderRadius = '8px';
                    menuDiv.style.padding = '8px';
                    menuDiv.style.color = 'white';
                    menuDiv.style.zIndex = '1000';
                    inputField.parentElement.style.position = 'relative'; // Ensure relative parent
                    inputField.parentElement.appendChild(menuDiv);
                }
                menuDiv.innerHTML = '<div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Commands</div>';
                MOCK_COMMANDS.filter(c => c.cmd.includes(val)).forEach(c => {
                    const item = document.createElement('div');
                    item.style.padding = '8px';
                    item.style.cursor = 'pointer';
                    item.style.borderBottom = '1px solid #334155';
                    item.innerHTML = '<span style="color:#3b82f6;font-family:monospace;font-weight:bold">' + c.cmd + '</span> <span style="font-size:12px;color:#cbd5e1">' + c.desc + '</span>';
                    item.onclick = () => { inputField.value = c.cmd + ' '; menuDiv.remove(); menuDiv = null; inputField.focus(); };
                    menuDiv.appendChild(item);
                });
            } else if (menuDiv) {
                menuDiv.remove();
                menuDiv = null;
            }
        });

        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (menuDiv) { menuDiv.remove(); menuDiv = null; }
                sendMessage();
            }
        });
      });
    </script>
    `;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${company.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
      ${cssContent}
    </style>
</head>
<body>
    ${htmlBody}
    
    ${widgetScript}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.send(fullHtml);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});
router.get("/public/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // نرسل فقط البيانات العامة اللازمة للموقع
    res.json({
      name: company.name,
      slug: company.slug,
      apiKey: company.apiKey,
      websiteConfig: company.websiteConfig || {
        themeColor: "#4f46e5",
        backgroundColor: "#000000",
        welcomeMessage: "Hello! How can I help you today?",
        botName: company.name || "Assistant",
        layout: "centered",
        font: "Inter"
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  تحديث الموقع بواسطة الذكاء الاصطناعي (AI Editor) - HTML/CSS Mode
-------------------------------*/
router.post("/update-website-ai", requireAuth, async (req, res) => {
  try {
    const { prompt, isDeepSearch, currentHtml, currentCss } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const baseHtml = currentHtml || `
<div class="h-screen w-full flex flex-col bg-gray-900 text-white font-sans">
  <header class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
    <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">${company.name} AI Agent</h1>
    <div class="text-sm text-gray-400"><i class="fas fa-circle text-green-500 text-xs mr-2 animate-pulse"></i> Online</div>
  </header>
  
  <main class="flex-1 overflow-y-auto p-6 flex flex-col gap-6" id="voxio-chat-container">
    <div class="flex gap-4 max-w-3xl">
      <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-lg shadow-lg shadow-blue-500/20"><i class="fas fa-robot text-white"></i></div>
      <div class="bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-xl border border-gray-700/50 text-gray-200">
        مرحباً بك! أنا الذكي الاصطناعي لشركه ${company.name}. كيف يمكنني مساعدتك اليوم؟
      </div>
    </div>
  </main>
  
  <footer class="p-6 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md">
    <div class="max-w-4xl mx-auto flex gap-4 w-full">
      <input type="text" id="voxio-chat-input" placeholder="Type your message here..." class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-gray-500">
      <button id="voxio-chat-send" class="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-4 font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
        <span>Send</span> <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </footer>
</div>`;

    const baseCss = currentCss || `
/* Add custom CSS here. Tailwind handles most styling. */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #4b5563; }
#voxio-chat-container { scroll-behavior: smooth; }
.typing-dot { animation: blink 1.4s infinite both; font-size: 1.5rem; line-height: 0.5; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
`;

    // SYSTEM INSTRUCTIONS (sent as system message - never truncated)
    const systemInstructions = `You are "Corex Designer", an elite Frontend Developer and UX/UI Designer AI.
You speak ALL languages fluently. Always reply in the SAME language the user used.
The user owns a company called "${company.name}".

You will receive the current HTML and CSS of their chatbot page, plus their modification request.
Your job: READ their code, UNDERSTAND their request, and MODIFY the code exactly as they asked.

${isDeepSearch ? "🔥 DEEP SEARCH MODE: Create jaw-dropping premium design with Glassmorphism, gradients, micro-animations." : "Apply the user's specific request carefully and professionally."}

RESPOND WITH ONLY RAW JSON (no markdown, no backticks):
{"message":"describe what you changed in user's language","html":"full modified HTML body","css":"full modified CSS","themeColor":"#hex"}

RULES:
- "message": Describe changes in the user's language. Be specific.
- "html": body content only, no <html>/<head>/<body> tags.
- PRESERVE these IDs: voxio-chat-container, voxio-chat-input, voxio-chat-send
- Use Tailwind CSS + FontAwesome icons.
- ACTUALLY DO what the user asked. Orange = ORANGE. Sidebar = ADD sidebar.
- Return COMPLETE code, not snippets.`;

    // USER CONTEXT (sent as user message - full code + request)
    const userContext = `Here is my current chatbot code:

=== HTML ===
${baseHtml}
=== END HTML ===

=== CSS ===
${baseCss}
=== END CSS ===

My request: ${prompt}`;

    console.log("🤖 Sending to Designer AI. System:", systemInstructions.length, "User:", userContext.length);
    const aiResult = await fetchDesignerAiResponse(systemInstructions, userContext, "Failed to connect to AI.");
    console.log("🤖 Designer AI responded, length:", aiResult.length);

    let newConfig;
    let aiMessage = "";
    try {
      const startIndex = aiResult.indexOf('{');
      const endIndex = aiResult.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        const jsonStr = aiResult.substring(startIndex, endIndex + 1);
        newConfig = JSON.parse(jsonStr);
        aiMessage = newConfig.message || "Changes applied successfully.";
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (e) {
      console.error("AI returned un-parseable JSON:", aiResult.substring(0, 500));
      return res.status(500).json({ error: "AI response parsing error", details: aiResult.substring(0, 300) });
    }

    // Save to database
    company.websiteConfig = {
        ...company.websiteConfig,
        customHtml: newConfig.html,
        customCss: newConfig.css,
        themeColor: newConfig.themeColor || "#4f46e5"
    };

    await company.save();

    res.json({ 
      message: aiMessage,
      config: company.websiteConfig 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  Public company info by slug (NO auth required)
  Used by /chat/:slug customer page
-------------------------------*/
router.get("/public/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Return only safe public data
    res.json({
      name: company.name,
      slug: company.slug,
      apiKey: company.apiKey,
      websiteConfig: {
        themeColor: company.websiteConfig?.themeColor,
        welcomeMessage: company.websiteConfig?.welcomeMessage,
        botName: company.websiteConfig?.botName,
        font: company.websiteConfig?.font,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  إنشاء أو تحديث بيانات الشركة
-------------------------------*/
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      name, industry, size, companySize, description,
      vision, mission, values, websiteUrl, allowedDomains, logo
    } = req.body;

    const safeData = {
      name, industry, description, vision, mission, logo,
      size: size || companySize || "",
      websiteUrl: websiteUrl || "",
      values: Array.isArray(values) ? values : [],
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
    };

    const existing = await Company.findOne({ owner: req.user._id });

    if (existing) {
      if (!existing.apiKey) {
        existing.apiKey = crypto.randomBytes(24).toString("hex");
      }
      if (!existing.chatToken) {
        existing.chatToken = `vchat_${crypto.randomBytes(16).toString("hex")}`;
      }
      if (!existing.slug && name) {
        existing.slug = name.toLowerCase().replace(/ /g, "-") + "-" + Date.now().toString().slice(-4);
      }
      Object.assign(existing, safeData);
      await existing.save();
      return res.json(existing);
    }

    const apiKey = crypto.randomBytes(24).toString("hex");
    const slug = name ? name.toLowerCase().replace(/ /g, "-") + "-" + Date.now().toString().slice(-4) : `company-${Date.now()}`;
    const company = await Company.create({
      ...safeData,
      owner: req.user._id,
      apiKey,
      slug,
      requests: [],
    });

    res.status(201).json(company);
  } catch (err) {
    console.error("POST /company error:", err);
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  الحصول على بيانات الشركة
-------------------------------*/
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    
    // Auto-generate slug for legacy users
    let updated = false;
    if (!company.slug) {
        company.slug = company.name ? company.name.toLowerCase().replace(/ /g, "-") + "-" + Date.now().toString().slice(-4) : `company-${Date.now()}`;
        updated = true;
    }

    if (!company.chatToken) {
        company.chatToken = `vchat_${crypto.randomBytes(16).toString("hex")}`;
        updated = true;
    }

    if (updated) await company.save();
    
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  Debug: Fix API Key if missing
-------------------------------*/
router.get("/fix-apikey", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    if (!company.apiKey) {
      company.apiKey = crypto.randomBytes(24).toString("hex");
      company.chatToken = `vchat_${crypto.randomBytes(16).toString("hex")}`;
      await company.save();
      return res.json({
        message: "API keys generated successfully!",
        apiKey: company.apiKey,
        chatToken: company.chatToken,
        company
      });
    }

    if (!company.chatToken) {
        company.chatToken = `vchat_${crypto.randomBytes(16).toString("hex")}`;
        await company.save();
    }

    res.json({
      message: "API key already exists",
      apiKey: company.apiKey,
      company
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  إعداد WhatsApp يدوياً
-------------------------------*/
router.post("/whatsapp-setup", requireAuth, async (req, res) => {
  try {
    const { phoneNumberId, accessToken } = req.body;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ error: "Phone Number ID and Access Token are required" });
    }

    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    // حفظ أو تحديث Integration
    const Integration = (await import('../models/Integration.js')).default;

    let integration = await Integration.findOne({ company: company._id, platform: 'whatsapp' });
    if (!integration) {
      integration = await Integration.create({
        company: company._id,
        platform: 'whatsapp',
        credentials: { phoneNumberId, accessToken },
        isActive: true
      });
    } else {
      integration.credentials = { phoneNumberId, accessToken };
      integration.isActive = true;
      await integration.save();
    }

    res.json({
      success: true,
      message: "WhatsApp integration configured successfully",
      integration
    });
  } catch (err) {
    console.error("WhatsApp setup error:", err);
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  تحليلات لوحة القيادة (Analytics)
-------------------------------*/
router.get("/analytics", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const requests = company.requests || [];
    const totalConversations = requests.length;

    // Active Now: Number of unique requests in the last hour (Approximation)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeRequests = requests.filter(r => new Date(r.date) > oneHourAgo).length;

    // AI Resolution: Hardcoded logic for now, or based on presence of aiReply
    // Assuming if aiReply exists, it's AI resolved.
    const aiResolvedCount = requests.filter(r => r.aiReply).length;
    const aiResolutionRate = totalConversations > 0
      ? Math.round((aiResolvedCount / totalConversations) * 100)
      : 100;

    // Recent Activity: Last 5 requests
    const recentActivity = [...requests]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(r => ({
        id: r._id,
        action: `محادثة مع ${r.customerName || 'عميل'}`,
        time: r.date,
        details: r.message.substring(0, 50) + '...'
      }));

    res.json({
      totalConversations,
      activeNow: activeRequests,
      aiResolutionRate,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  إضافة طلب عميل جديد (يدوياً)
-------------------------------*/
router.post("/requests", requireAuth, async (req, res) => {
  try {
    const { customerName, product, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const newRequest = {
      customerName: customerName || "عميل غير معروف",
      product: product || "عام",
      message,
      date: new Date()
    };

    company.requests.push(newRequest);
    await company.save();

    res.status(201).json({ success: true, request: newRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  جلب جميع الطلبات
-------------------------------*/
router.get("/requests", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company.requests || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  حذف طلب محدد
-------------------------------*/
router.delete("/requests/:index", requireAuth, async (req, res) => {
  try {
    const { index } = req.params;
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    if (index < 0 || index >= company.requests.length)
      return res.status(400).json({ error: "Invalid request index" });

    company.requests.splice(index, 1);
    await company.save();

    res.json({ success: true, requests: company.requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  جلب الـ API Key للشركة
-------------------------------*/
router.get("/apikey", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json({ apiKey: company.apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  استقبال طلبات العملاء من API خارجي
  وتشغيل الذكاء الاصطناعي تلقائياً
-------------------------------*/
router.post("/external-request", async (req, res) => {
  try {
    const { apiKey, customerName, product, message } = req.body;

    if (!apiKey || !message)
      return res
        .status(400)
        .json({ error: "apiKey and message are required" });

    const company = await Company.findOne({ apiKey });
    if (!company) return res.status(403).json({ error: "Invalid API key" });

    // بناء السياق الخاص بالشركة
    let context = `You are an AI assistant representing the company "${company.name}".`;
    if (company.industry) context += ` Industry: ${company.industry}.`;
    if (company.description) context += ` Description: ${company.description}.`;
    if (company.vision) context += ` Vision: ${company.vision}.`;
    if (company.mission) context += ` Mission: ${company.mission}.`;
    context += ` Respond in Arabic, using a professional and helpful tone.`;

    // إرسال الطلب لنموذج الذكاء الاصطناعي مع نظام Fallback
    const fullQuestion = `${context}\n\nUser Question:\n${message}`;
    const reply = await fetchAiResponse(fullQuestion, "عذرًا، لم أتمكن من معالجة الطلب الآن.");

    // حفظ الطلب والرد في قاعدة البيانات
    company.requests.push({
      customerName,
      product,
      message,
      aiReply: reply,
      date: new Date(),
    });
    await company.save();

    res.json({
      success: true,
      company: company.name,
      reply,
    });
  } catch (err) {
    console.error("External request error:", err.response?.data || err.message);
    res.status(500).json({
      error: "حدث خطأ أثناء معالجة الطلب عبر الذكاء الاصطناعي",
    });
  }
});
router.post("/use-model", verifyApiKey, async (req, res) => {
  try {
    const { prompt } = req.body;
    const { company } = req;

    const responseText = `تم استقبال طلبك: "${prompt}" من الشركة ${company.name}`;
    company.requests.push({
      customerName: "عميل API خارجي",
      product: "API Interaction",
      message: prompt,
      aiReply: responseText,
      date: new Date(),
    });
    await company.save();

    res.json({ success: true, reply: responseText });
  } catch (err) {
    console.error("use-model error:", err.message);
    res.status(500).json({ error: "خطأ أثناء تشغيل النموذج" });
  }
});

export default router;
