import 'dotenv/config';
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
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
    crossOriginOpenerPolicy: { policy: "unsafe-none" }, // ضروري جداً لعمل Google/Facebook Login
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.set('trust proxy', 1);
const limiter = rateLimit({
    max: 5000, // رفع الحد لضمان عدم حظر الطلبات في الـ Dashboard
    windowMs: 15 * 60 * 1000,
    message: "Too many requests from this IP, please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increase to 100 attempts
    message: "Too many attempts, please try again later."
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google-login", authLimiter); // Also apply to Google login

// ✅ Routes 
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/public", publicCompanyChatRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/ai", uploadRoutes);
app.use("/api/support-chat", chatHistoryRoutes);
app.use("/api/integration-manager", integrationManagerRoutes);
app.use("/api/voxio-chat", voxioChatRoutes);
app.use("/api/chatbot-editor", chatbotEditorRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/widget-editor", widgetEditorRoutes);

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
})();`;
    res.send(widgetCode);
});

// ✅ Route to handle iframe redirect
app.get('/widget/:apiKey', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/widget/${req.params.apiKey}`);
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
