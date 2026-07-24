import 'dotenv/config';
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";

import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import companyRoutes from "./routes/Company.js";
import publicCompanyChatRoutes from "./routes/publicCompanyChat.js";
import integrationRoutes from "./routes/integrationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import chatHistoryRoutes from "./routes/chatHistoryRoutes.js";
import integrationManagerRoutes from "./routes/integrationManagerRoutes.js";
import voxioChatRoutes from "./routes/VOXIOChatRoutes.js";
import chatbotEditorRoutes from "./routes/chatbotEditorRoutes.js";
import widgetEditorRoutes from "./routes/widgetEditorRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import broadcastRoutes from "./routes/broadcastRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import handoffRoutes from "./routes/handoffRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import navigationRoutes from "./routes/navigationRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import gdprRoutes from "./routes/gdprRoutes.js";
import proactiveRoutes from "./routes/proactiveRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import productUploadRoutes from "./routes/productUploadRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import copilotRoutes from "./routes/copilotRoutes.js";

const app = express();

// ⚡ Compression — reduces response sizes by ~70%, much faster load times
app.use(compression());

// ⚡ Cookie parser — needed for refresh token cookies
app.use(cookieParser());

// Logging — lightweight "dev" format, disabled in production
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan("dev"));
}

// ✅ إعداد CORS
const allowedOrigins = [
    "http://localhost:5173",
    "https://voxio-v1.vercel.app",
    "https://voxio0.vercel.app",
    "https://aithor1.vercel.app",
    "https://aithor2.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "ngrok-skip-browser-warning"],
    credentials: true
}));

// 🛑 إعداد Raw Body للـ Webhooks
app.use('/api/integrations/webhooks/shopify', express.raw({ type: '*/*' }));
app.use('/api/integrations/webhooks/meta', express.raw({ type: '*/*' }));
app.use('/api/integrations/meta/data-deletion', express.raw({ type: '*/*' }));

// ✅ إعداد JSON Body
app.use(express.json({ limit: '2mb' }));
app.use(hpp());
app.use(mongoSanitize()); // Prevent NoSQL Injection globally
// Custom XSS Middleware (Prevents Node 20+ getter error)
const skipKeys = ['password', 'htmlContent', 'customHtml', 'customCss', 'code', 'userRequest', 'prompt'];

const sanitizeObj = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (let key in obj) {
    if (skipKeys.includes(key)) continue; // Skip sanitization for code fields
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/<[^>]*>?/gm, ''); // simple strip tags
    } else if (typeof obj[key] === 'object') {
      sanitizeObj(obj[key]);
    }
  }
};
app.use((req, res, next) => {
  // Completely skip sanitization for chatbot editor routes that rely on HTML
  if (req.originalUrl && req.originalUrl.includes('/chatbot-editor')) {
      return next();
  }

  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);
  next();
});

// ✅ إعداد حماية أكبر للموقع (Security Middlewares)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://connect.facebook.net", "https://*.facebook.com", "*.fontawesome.com", "https://cdnjs.cloudflare.com"],
            frameSrc: ["'self'", "https://accounts.google.com", "https://*.facebook.com", "https://*.facebook.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com", "*.fontawesome.com"],
            fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com", "*.fontawesome.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.googleusercontent.com", "https://*.facebook.com", "*.vercel.app", "https://res.cloudinary.com"],
            connectSrc: ["'self'", "https://accounts.google.com", "https://graph.facebook.com", "https://*.facebook.com", "*.vercel.app", "http://localhost:5000", "https://openrouter.ai", "https://dev-c7z.pantheonsite.io"],
            frameAncestors: ["'self'", "http://localhost:5173", "*.vercel.app"],
        },
    },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Allowed for Google/Facebook Login popup communication
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false // Disabled to allow cross-origin requests (like FontAwesome/Google)
}));

app.set('trust proxy', 1);
const limiter = rateLimit({
    max: 800, // Reduced from 5000 to prevent DoS attacks
    windowMs: 15 * 60 * 1000,
    message: "Too many requests from this IP, please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Reduced for standard login
    message: "Too many login attempts, please try again later."
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google-login", authLimiter);

const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Very strict for password resets
    message: "Too many password reset attempts, please try again later."
});
app.use("/api/auth/forgot-password", strictAuthLimiter);
app.use("/api/auth/reset-password", strictAuthLimiter);
app.use("/api/auth/register", strictAuthLimiter);

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Strict for OTP verification
    message: "Too many OTP attempts, please try again later."
});
app.use("/api/auth/verify-otp", otpLimiter);

// ✅ Routes (Load Balanced based on SERVICE_TYPE)
const serviceType = (process.env.SERVICE_TYPE || 'all').trim(); // can be 'core', 'webhook', or 'all'
console.log(`🔧 SERVICE_TYPE: "${serviceType}"`);

if (serviceType === 'core' || serviceType === 'all') {
    // 🖥️ Core Dashboard API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/company", companyRoutes);
    app.use("/api/public", publicCompanyChatRoutes);
    app.use("/api/integration-manager", integrationManagerRoutes);
    app.use("/api/chatbot-editor", chatbotEditorRoutes);
    app.use("/api/widget-editor", widgetEditorRoutes);
    app.use("/api/support", supportRoutes);
    app.use("/api/ai", uploadRoutes); // Uploads are usually dashboard side
    app.use("/api/support-chat", chatHistoryRoutes);
    app.use("/api/broadcast", broadcastRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/analytics", analyticsRoutes);
    app.use("/api/handoff", handoffRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/navigate", navigationRoutes);
    app.use("/api/learning", learningRoutes);
    app.use("/api/ratings", ratingRoutes);
    app.use("/api/bookings", bookingRoutes);
    app.use("/api/audit", auditRoutes);
    app.use("/api/gdpr", gdprRoutes);
    app.use("/api/proactive", proactiveRoutes);
    app.use("/api/summaries", summaryRoutes);
    app.use("/api/products", productUploadRoutes);
    app.use("/api/recommendations", recommendationRoutes);
    app.use("/api/team", teamRoutes);
    app.use("/api/copilot", copilotRoutes);
}

if (serviceType === 'webhook' || serviceType === 'all') {
    // 🤖 Webhook & Chat Routes (Heavy AI processing)
    app.use("/api/integrations", integrationRoutes); // Contains WhatsApp & IG Webhooks
    app.use("/api/chat", chatRoutes); // Widget Chat
    app.use("/api/voxio-chat", voxioChatRoutes);
}

// ✅ Route افتراضي
app.get("/", (req, res) => {
    res.send("VOXIO API is running");
});

// ✅ Serve Widget JS Direct Content (Premium Redesigned Version)
app.get('/widget.js', (req, res) => {
    // ⚡ Cache widget JS for 1 hour — it rarely changes
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'application/javascript');
    const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:5173';
    const widgetCode = `
(function() {
    const script = document.currentScript;
    const apiKey = script.getAttribute('data-api-key');
    const primaryColor = script.getAttribute('data-primary-color') || '#6C63FF';
    const launcherColor = script.getAttribute('data-launcher-color') || '#1e293b';
    
    if (!apiKey) {
        console.error('VOXIO Widget Error: data-api-key is missing.');
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = \`
        :root { --vx-primary: \${primaryColor}; --vx-launcher: \${launcherColor}; }
        #voxio-w-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 2147483647;
            font-family: 'Inter', 'Cairo', sans-serif;
            direction: rtl;
        }
        #voxio-w-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--vx-launcher);
            color: #fff;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        #voxio-w-btn:hover { transform: scale(1.05) rotate(5deg); }
        #voxio-w-btn i { font-size: 24px; transition: all 0.3s; }
        #voxio-w-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 400px;
            height: 600px;
            max-width: calc(100vw - 48px);
            max-height: calc(100vh - 120px);
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
            transform-origin: bottom right;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0;
            transform: scale(0.8) translateY(40px);
        }
        #voxio-w-window.vx-open {
            display: flex;
            opacity: 1;
            transform: scale(1) translateY(0);
        }
        #voxio-w-window iframe {
            border: none;
            width: 100%;
            height: 100%;
            background: transparent;
        }
    \`;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'voxio-w-container';
    document.body.appendChild(container);

    const button = document.createElement('button');
    button.id = 'voxio-w-btn';
    button.innerHTML = '<i class="fas fa-comment-dots"></i>';
    container.appendChild(button);

    const win = document.createElement('div');
    win.id = 'voxio-w-window';
    win.innerHTML = '<iframe src="${baseUrl}/widget/' + apiKey + '" title="VOXIO Chat"></iframe>';
    container.appendChild(win);

    let isOpen = false;
    button.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            win.style.display = 'flex';
            setTimeout(() => win.classList.add('vx-open'), 10);
            button.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            win.classList.remove('vx-open');
            button.innerHTML = '<i class="fas fa-comment-dots"></i>';
            setTimeout(() => { if(!isOpen) win.style.display = 'none'; }, 400);
        }
    };

    // 🤖 VOXIO AGENT MODE: Listen to actions from the iframe
    function findElement(selector) {
        if (!selector) return null;
        try {
            // Priority 1: try as CSS selector
            let el = document.querySelector(selector);
            if (el) return el;
            // Priority 2: try by ID if missing #
            el = document.getElementById(selector);
            if (el) return el;
            // Priority 3: text content matching for buttons/links
            const allElements = [...document.querySelectorAll('a, button, [role="button"]')];
            return allElements.find(e => e.innerText.trim().toLowerCase() === selector.toLowerCase());
        } catch(e) { return null; }
    }

    function showAiCursor(targetEl) {
        let cursor = document.getElementById('voxio-ai-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'voxio-ai-cursor';
            cursor.innerHTML = '🤖';
            cursor.style.cssText = \`
                position: fixed; width: 40px; height: 40px; pointer-events: none; z-index: 2147483646;
                font-size: 28px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            \`;
            document.body.appendChild(cursor);
        }
        
        const rect = targetEl.getBoundingClientRect();
        cursor.style.left = (rect.left + rect.width/2 - 20) + 'px';
        cursor.style.top = (rect.top + rect.height/2 - 20) + 'px';
        setTimeout(() => cursor.remove(), 2500);
    }

    function typeWithEffect(input, text) {
        if (!input || !text) return;
        input.value = '';
        let i = 0;
        const interval = setInterval(() => {
            input.value += text[i];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            i++;
            if (i >= text.length) clearInterval(interval);
        }, 50);
    }

    window.addEventListener('message', (e) => {
        if (!e.data?.type?.startsWith('VOXIO_')) return;
        const iframeWindow = win.querySelector('iframe')?.contentWindow;
        
        switch(e.data.type) {
            case 'VOXIO_REQ_CONTEXT':
                if (iframeWindow) {
                    iframeWindow.postMessage({
                        type: 'VOXIO_PAGE_CONTEXT',
                        data: {
                            url: window.location.href,
                            title: document.title,
                            links: [...document.querySelectorAll('a[href]')].slice(0,25).map(a=>({text:a.innerText.trim().slice(0,40),href:a.getAttribute('href'),id:a.id})),
                            buttons: [...document.querySelectorAll('button,[role="button"]')].slice(0,20).map(b=>({text:b.innerText.trim().slice(0,30),id:b.id,cls:b.className.split(' ')[0]})),
                            forms: [...document.querySelectorAll('form')].slice(0,5).map(f=>({id:f.id,fields:[...f.querySelectorAll('input,textarea,select')].map(i=>({type:i.type,name:i.name,id:i.id,placeholder:i.placeholder}))})),
                            headings: [...document.querySelectorAll('h1,h2,h3')].slice(0,10).map(h=>({tag:h.tagName,text:h.innerText.trim().slice(0,50),id:h.id})),
                        }
                    }, '*');
                }
                break;
                
            case 'VOXIO_NAVIGATE':
                setTimeout(() => { window.location.href = e.data.target; }, 1000);
                break;
                
            case 'VOXIO_SCROLL':
                const scrollEl = findElement(e.data.selector);
                if (scrollEl) {
                    showAiCursor(scrollEl);
                    setTimeout(() => scrollEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 600);
                }
                break;
                
            case 'VOXIO_CLICK':
                const clickEl = findElement(e.data.selector);
                if (clickEl) {
                    showAiCursor(clickEl);
                    clickEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { clickEl.click(); }, 800);
                }
                break;
                
            case 'VOXIO_FILL':
                const fillEl = findElement(e.data.selector);
                if (fillEl) {
                    showAiCursor(fillEl);
                    fillEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        fillEl.focus();
                        typeWithEffect(fillEl, e.data.value);
                    }, 600);
                }
                break;
                
            case 'VOXIO_HIGHLIGHT':
                const hlEl = findElement(e.data.selector);
                if (hlEl) {
                    hlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    hlEl.style.transition = 'all 0.3s ease';
                    hlEl.style.outline = '3px solid var(--vx-primary)';
                    hlEl.style.boxShadow = '0 0 0 6px rgba(108,99,255,0.2)';
                    setTimeout(() => { hlEl.style.outline = ''; hlEl.style.boxShadow = ''; }, 3500);
                }
                break;
        }
    });

})();`;
    res.send(widgetCode);
});

// ✅ Route to handle iframe redirect
app.get('/widget/:apiKey', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/widget/${req.params.apiKey}`);
});

// 🎙️ Test endpoint for audio transcription
import { transcribeAudio } from "./utils/corexHelper.js";
app.post('/api/test/transcribe', (req, res, next) => {
    const ct = req.get('content-type') || '';
    if (!ct.startsWith('audio/')) {
        return res.status(400).json({ error: 'Content-Type must be audio/*, got: ' + ct });
    }
    next();
}, express.raw({ type: 'audio/*', limit: '25mb' }), async (req, res) => {
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        console.error('[Test STT] Empty body received');
        return res.status(400).json({ text: '[رسالة صوتية: الملف فارغ]' });
    }
    const rawContentType = req.get('content-type') || 'audio/ogg';
    const cleanMime = rawContentType.split(';')[0].trim();
    const extMap = {
        'audio/ogg': 'ogg', 'audio/oga': 'oga',
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
        'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
        'audio/wav': 'wav', 'audio/x-wav': 'wav',
        'audio/webm': 'webm', 'audio/flac': 'flac'
    };
    const ext = extMap[cleanMime] || cleanMime.split('/').pop() || 'ogg';
    const fileName = 'audio.' + ext;
    console.log(`[Test STT] Received ${req.body.length} bytes, type: "${rawContentType}" → clean: "${cleanMime}", file: "${fileName}"`);
    try {
        const result = await transcribeAudio(req.body, fileName, cleanMime);
        res.json({ text: result });
    } catch (e) {
        console.error('[Test STT] Error:', e.message);
        res.status(500).json({ text: '[رسالة صوتية: خطأ في المعالجة: ' + e.message + ']' });
    }
});
app.get('/test-stt', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'test-stt.html'));
});

app.get('/api/ping', (req, res) => {
    res.json({ message: "pong" });
});

// 🩺 Health check
app.get('/api/health', async (req, res) => {
    try {
        const mongoose = (await import('mongoose')).default;
        const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
        res.json({ 
            status: "ok", 
            database: "MongoDB",
            connection: dbStatus 
        });
    } catch {
        res.json({ status: "ok", database: "MongoDB", connection: "Unknown" });
    }
});

// ✅ التعامل مع الأخطاء
app.use((err, req, res, next) => {
    const errorLog = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack || err.message}\n\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'error.log'), errorLog);
    } catch (fsErr) {
        console.error("Failed to write to error.log", fsErr);
    }
    console.error("❌ Global Error Handler:", err.stack || err.message);
    res.status(500).json({ 
        success: false, 
        error: "Internal Server Error", 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

// ✅ [AUTO-RECOVERY] Prevent server from crashing permanently
process.on('uncaughtException', (err) => {
    console.error('🔥 CRITICAL: Uncaught Exception!', err.stack || err);
    // In a real production app, we might want to restart the process via PM2.
    // For now, we log it and keep the server running.
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voxio';

// ⚡ Mongoose performance optimizations
mongoose.set('strictQuery', false); // Allow querying by fields not in schema (dynamic)

if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGO_URI, {
        // ⚡ Connection pool — reuse connections instead of creating new ones
        maxPoolSize: 5,           // Reduced from default 100 — lighter for shared hosting
        minPoolSize: 1,           // Keep at least 1 connection alive
        serverSelectionTimeoutMS: 10000,  // Fail fast if DB is unreachable
        socketTimeoutMS: 45000,   // Close stale sockets
        // ⚡ Heartbeat — less frequent pings = less overhead
        heartbeatFrequencyMS: 30000,
        // Disable autoIndex in production to prevent buffering timeouts on serverless
        autoIndex: process.env.NODE_ENV !== 'production'
    })
        .then(() => {
            console.log('🍃 Connected to MongoDB (Main Server)');
            app.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err.message);
            // Fallback: Start server anyway so webhooks don't die if Mongo is down briefly
            app.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT} (Warning: MongoDB disconnected)`);
            });
        });
} else {
    console.log('🍃 MongoDB already connected via Models');
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

// ⚡ Graceful shutdown — clean up on hosting restarts/deploys
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    try {
        await mongoose.connection.close();
        console.log('🍃 MongoDB connection closed.');
    } catch (e) {
        console.error('Error closing MongoDB:', e.message);
    }
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
