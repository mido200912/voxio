import express from 'express';
import {
    metaLogin,
    metaCallback,
    shopifyLogin,
    shopifyCallback,
    metaWebhook,
    shopifyWebhook,
    getWidgetScript,
    metaDataDeletion,
    tiktokLogin,
    tiktokCallback
} from '../controllers/integrationController.js';
import { handleTelegramWebhook } from '../controllers/webhookHandler.js';

const router = express.Router();

// 🌐 Meta (Facebook/Instagram/WhatsApp) Auth
// @route GET /api/integrations/meta/login
router.get('/meta/login', metaLogin);
// @route GET /api/integrations/meta/callback
router.get('/meta/callback', metaCallback);

// @route POST /api/integrations/meta/data-deletion (الاستلام الفعلي للطلب)
router.post('/meta/data-deletion', metaDataDeletion);
// @route GET /api/integrations/meta/data-deletion (قد يُطلب للتحقق)
router.get('/meta/data-deletion', metaDataDeletion);

// 🛍️ Shopify Auth
// @route GET /api/integrations/shopify/login
router.get('/shopify/login', shopifyLogin);
// @route GET /api/integrations/shopify/callback
router.get('/shopify/callback', shopifyCallback);

// 📱 TikTok Auth
// @route GET /api/integrations/tiktok/login
router.get('/tiktok/login', tiktokLogin);
// @route GET /api/integrations/tiktok/callback
router.get('/tiktok/callback', tiktokCallback);

// 🔔 Webhooks (التحقق من التوقيع والأمان يتم في الـ Controller)
// @route POST /api/integrations/webhooks/meta (استلام البيانات)
router.post('/webhooks/meta', metaWebhook);
// @route GET /api/integrations/webhooks/meta (تحقق Meta)
router.get('/webhooks/meta', metaWebhook);

// 🧪 Webhook diagnostic test endpoint
router.get('/webhooks/meta/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Meta webhook endpoint is alive and reachable!',
        verifyToken: process.env.META_VERIFY_TOKEN ? 'SET' : 'MISSING',
        metaAppSecret: process.env.META_APP_SECRET ? 'SET' : 'MISSING',
        timestamp: new Date().toISOString()
    });
});

// @route POST /api/integrations/webhooks/shopify
router.post('/webhooks/shopify', shopifyWebhook);

// @route POST /api/integrations/webhooks/telegram/:companyId
// Webhook for Telegram messages specific to a company
router.post('/webhooks/telegram/:companyId', handleTelegramWebhook);

// 🖥️ No-Code Widget Script
// @route GET /api/integrations/widget/script.js
router.get('/widget/script.js', getWidgetScript);

export default router;