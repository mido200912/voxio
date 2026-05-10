import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { requireAuth } from '../middleware/auth.js';
import Integration from '../models/Integration.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import CompanyChat from '../models/CompanyChat.js';
import sendEmail from '../utils/sendEmail.js';
import { generateOtpEmail } from '../utils/emailTemplate.js';

const router = express.Router();

// @route   GET /api/integration-manager
// @desc    Get all integrations for the authenticated user's company
// @access  Private
router.get('/', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const integrations = await Integration.find({ company: company._id });

        // Format the response to include status and basic info
        const formattedIntegrations = integrations.map(int => ({
            id: int._id,
            platform: int.platform,
            isActive: int.isActive,
            createdAt: int.createdAt,
            settings: int.settings,
            // Don't expose sensitive credentials directly
            hasCredentials: !!(int.credentials && (int.credentials.accessToken || int.credentials.botToken || int.credentials.phoneNumberId)),
            hasTelegramToken: !!(int.credentials && int.credentials.botToken)
        }));

        res.json(formattedIntegrations);
    } catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/integration-manager/:platform/settings
// @desc    Get detailed settings for a specific platform
// @access  Private
router.get('/:platform/settings', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) return res.status(404).json({ error: 'Company not found' });

        const integration = await Integration.findOne({ company: company._id, platform: req.params.platform });
        if (!integration) return res.status(404).json({ error: 'Integration not found' });

        res.json({ settings: integration.settings || {} });
    } catch (error) {
        console.error('Error fetching integration settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/integration-manager/:platform/analytics
// @desc    Get analytics for a specific platform
// @access  Private
router.get('/:platform/analytics', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) return res.status(404).json({ error: 'Company not found' });

        const chats = await CompanyChat.find({ company: company._id, platform: req.params.platform });
        
        const totalReceived = chats.filter(c => c.sender === 'user').length;
        const totalSent = chats.filter(c => c.sender === 'ai' || c.sender === 'agent').length;
        // In a real app we'd track actual delivery receipts. For now, estimate based on AI responses sent.
        const deliveryRate = totalSent > 0 ? (totalSent / (totalSent + (chats.filter(c => c.status === 'failed').length || 0))) * 100 : 0; 
        
        res.json({
            totalReceived,
            totalSent,
            deliveryRate: deliveryRate.toFixed(1),
            activeChats: new Set(chats.map(c => c.user)).size
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/integration-manager/:platform/settings
// @desc    Update settings for a specific platform
// @access  Private
router.put('/:platform/settings', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) return res.status(404).json({ error: 'Company not found' });

        let integration = await Integration.findOne({ company: company._id, platform: req.params.platform });
        if (!integration) {
            integration = new Integration({
                company: company._id,
                platform: req.params.platform,
                isActive: true,
                settings: req.body
            });
        } else {
            integration.settings = { ...integration.settings, ...req.body };
        }
        await integration.save();

        res.json({ message: 'Settings updated successfully', settings: integration.settings });
    } catch (error) {
        console.error('Error updating integration settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/integration-manager/:id
// @desc    Delete/disconnect an integration
// @access  Private
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const integration = await Integration.findOne({
            _id: req.params.id,
            company: company._id
        });

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        // TODO: Unregister webhooks from the platform if needed

        await Integration.findByIdAndDelete(integration._id);

        res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
        console.error('Error deleting integration:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PATCH /api/integration-manager/:id/toggle
// @desc    Toggle integration active status
// @access  Private
router.patch('/:id/toggle', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const integration = await Integration.findOne({
            _id: req.params.id,
            company: company._id
        });

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        integration.isActive = !integration.isActive;
        await integration.save();

        res.json({
            message: `Integration ${integration.isActive ? 'activated' : 'deactivated'}`,
            isActive: integration.isActive
        });
    } catch (error) {
        console.error('Error toggling integration:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/integration-manager/whatsapp
// @desc    Manual WhatsApp Business setup with user-provided credentials
// @access  Private
router.post('/whatsapp', requireAuth, async (req, res) => {
    try {
        const { phoneNumberId, accessToken, wabaId } = req.body;

        if (!phoneNumberId || !accessToken || !wabaId) {
            return res.status(400).json({ error: 'Phone Number ID, Access Token, and WABA ID are all required.' });
        }

        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Save to User model
        const user = await User.findById(req.user._id);
        if (user) {
            user.wabaId = wabaId;
            user.phoneNumberId = phoneNumberId;
            user.whatsappAccessToken = accessToken;
            await user.save();
        }

        // Save to Integration
        let integration = await Integration.findOne({ company: company._id, platform: 'whatsapp' });

        if (!integration) {
            integration = await Integration.create({
                company: company._id,
                platform: 'whatsapp',
                credentials: { phoneNumberId, accessToken, wabaId },
                isActive: true
            });
        } else {
            integration.credentials = { phoneNumberId, accessToken, wabaId };
            integration.isActive = true;
            await integration.save();
        }

        console.log(`[WhatsApp Manual] Connected for company ${company._id}: WABA=${wabaId}, Phone=${phoneNumberId}`);
        res.json({ message: 'WhatsApp connected successfully', integration });
    } catch (error) {
        console.error('Error in manual WhatsApp setup:', error);
        res.status(500).json({ error: 'Server error during WhatsApp configuration' });
    }
});

// @route   POST /api/integration-manager/whatsapp/exchange
// @desc    Exchange short-lived token for long-lived and auto-discover WhatsApp IDs
// @access  Private
router.post('/whatsapp/exchange', requireAuth, async (req, res, next) => {
    try {
        const { shortLivedToken, wabaId: providedWabaId, phoneNumberId: providedPhoneNumberId } = req.body;
        
        if (!shortLivedToken) {
            return res.status(400).json({ error: 'Short-lived token is required' });
        }

        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;

        console.log(`[DEBUG] Using App ID: ${appId ? appId.substring(0, 4) + '***' : 'MISSING'}`);
        console.log(`[DEBUG] Provided WABA ID: ${providedWabaId || 'NONE'}`);
        console.log(`[DEBUG] Provided Phone ID: ${providedPhoneNumberId || 'NONE'}`);

        if (!appId || !appSecret) {
            return res.status(500).json({ error: 'Meta App credentials are not configured in backend .env' });
        }

        // 1. Exchange for long-lived token
        const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
        const exchangeRes = await axios.get(exchangeUrl);
        const longLivedToken = exchangeRes.data.access_token;

        if (!longLivedToken) {
            return res.status(400).json({ error: 'Failed to generate long-lived token' });
        }

        // 2. Use provided IDs from Embedded Signup, or fall back to auto-discovery
        let wabaId = providedWabaId || null;
        let phoneNumberId = providedPhoneNumberId || null;

        if (!wabaId) {
            console.log('[DEBUG] No WABA ID from Embedded Signup, trying auto-discovery...');
            try {
                const wabaUrl = `https://graph.facebook.com/v20.0/me?fields=whatsapp_business_accounts&access_token=${longLivedToken}`;
                const wabaRes = await axios.get(wabaUrl);
                const wabaAccounts = wabaRes.data.whatsapp_business_accounts?.data;
                
                if (wabaAccounts && wabaAccounts.length > 0) {
                    wabaId = wabaAccounts[0].id;
                    console.log(`[DEBUG] Found WABA via auto-discovery: ${wabaId}`);
                }
            } catch (err) {
                console.error('[DEBUG] Auto-discovery failed:', err.response?.data?.error?.message || err.message);
            }
        }

        if (!phoneNumberId && wabaId) {
            try {
                const phonesUrl = `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${longLivedToken}`;
                const phonesRes = await axios.get(phonesUrl);
                if (phonesRes.data?.data?.length > 0) {
                    phoneNumberId = phonesRes.data.data[0].id;
                    console.log(`[DEBUG] Found Phone ID via auto-discovery: ${phoneNumberId}`);
                }
            } catch (err) {
                console.error('[DEBUG] Phone discovery failed:', err.response?.data?.error?.message || err.message);
            }
        }

        if (!wabaId) {
            return res.status(400).json({ error: 'No WhatsApp Business Account found. Please complete the signup process fully.' });
        }

        console.log(`[DEBUG] Final WABA ID: ${wabaId}, Phone ID: ${phoneNumberId || 'pending'}`);


        // Save these IDs and the long-lived token to the user document/integration
        
        // As per instructions, save to User's document
        const user = await User.findById(req.user._id);
        if (user) {
            user.wabaId = wabaId;
            user.phoneNumberId = phoneNumberId;
            user.whatsappAccessToken = longLivedToken;
            await user.save();
        }

        // Save to Integration for consistency with the rest of the codebase
        let integration = await Integration.findOne({ company: company._id, platform: 'whatsapp' });

        if (!integration) {
            integration = await Integration.create({
                company: company._id,
                platform: 'whatsapp',
                credentials: { phoneNumberId, accessToken: longLivedToken, wabaId },
                isActive: true
            });
        } else {
            integration.credentials = { 
                phoneNumberId: phoneNumberId, 
                accessToken: longLivedToken,
                wabaId: wabaId
            };
            integration.isActive = true;
            await integration.save();
        }

        res.json({ message: 'WhatsApp integrated successfully via Facebook Embedded Signup', integration });
    } catch (error) {
        const detailedError = error.response?.data || error.message;
        console.error('WhatsApp exchange error:', detailedError);
        
        // Write to a dedicated debug file
        try {
            fs.appendFileSync(path.join(process.cwd(), 'meta_debug.log'), `[${new Date().toISOString()}]\n${JSON.stringify(detailedError, null, 2)}\n---\n`);
        } catch (fsErr) {
            console.error("Failed to write to meta_debug.log", fsErr);
        }

        const metaError = error.response?.data?.error?.message || error.response?.data?.error || error.message;
        const fullMetaError = JSON.stringify(error.response?.data || error.message);
        res.status(400).json({ error: `Meta API Error: ${metaError}`, details: fullMetaError });
    }
});

// @route   POST /api/integration-manager/instagram
// @desc    Manually configure Instagram
// @access  Private
router.post('/instagram', requireAuth, async (req, res) => {
    try {
        const { pageId, igAccountId, accessToken } = req.body;
        
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        let integration = await Integration.findOne({ company: company._id, platform: 'instagram' });

        if (!integration) {
            if (!pageId || !igAccountId || !accessToken) {
                return res.status(400).json({ error: 'Page ID, IG Account ID and Access Token are required for new integration' });
            }
            integration = await Integration.create({
                company: company._id,
                platform: 'instagram',
                credentials: { pageId, igAccountId, accessToken },
                isActive: true
            });
        } else {
            integration.credentials = { 
                pageId: pageId || integration.credentials?.pageId, 
                igAccountId: igAccountId || integration.credentials?.igAccountId, 
                accessToken: accessToken || integration.credentials?.accessToken 
            };
            integration.isActive = true;
            await integration.save();
        }

        res.json({ message: 'Instagram integrated successfully', integration });
    } catch (error) {
        console.error('Instagram integration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/integration-manager/telegram
// @desc    Manually configure Telegram with Bot Token and Custom Commands
// @access  Private
router.post('/telegram', requireAuth, async (req, res) => {
    try {
        const { botToken, commands } = req.body;
        
        if (!botToken) {
            return res.status(400).json({ error: 'Telegram Bot Token is required' });
        }

        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Set webhook for the bot
        const baseUrl = process.env.BASE_URL || 'https://aithor1.vercel.app';
        if (!baseUrl) {
            console.error('❌ BASE_URL is missing in environment variables');
            return res.status(500).json({ error: 'Server configuration error (BASE_URL missing)' });
        }
        
        const webhookUrl = `${baseUrl}/api/integrations/webhooks/telegram/${company._id}`;
        
        try {
            console.log('🔗 Setting Telegram Webhook to:', webhookUrl);
            await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
                url: webhookUrl
            });

            // Set custom commands on Telegram
            if (commands && Array.isArray(commands) && commands.length > 0) {
                const tgCommands = commands
                    .filter(c => c.command) // Ensure command name exists
                    .map(c => ({
                        command: c.command.toLowerCase().replace(/[^a-z0-9_]/g, ''), // Telegram allows only a-z, 0-9 and _
                        description: (c.description || c.category || "فتح " + c.command).substring(0, 255) // Max 256 chars
                    }));

                if (tgCommands.length > 0) {
                    await axios.post(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
                        commands: tgCommands
                    });
                }
            }
        } catch (tgError) {
            console.error('❌ Telegram API error:', tgError.response?.data || tgError.message);
            const tgErrMsg = tgError.response?.data?.description || 'Invalid Bot Token or Telegram error';
            return res.status(400).json({ error: tgErrMsg });
        }

        // Log received commands for debugging
        console.log('📥 Received commands from frontend:', JSON.stringify(commands, null, 2));

        // Sanitize and fully preserve all command fields
        const sanitizedSettingsCommands = (commands || []).map(c => ({
            command: (c.command || '').toLowerCase().replace(/[^a-z0-9_]/g, ''),
            description: c.description || c.category || '',
            category: c.category || '',
            type: c.type || 'ai',
            message: c.message || '',
            successMessage: c.successMessage || '',
            products: c.products || []
        }));

        console.log('💾 Saving sanitized commands:', JSON.stringify(sanitizedSettingsCommands, null, 2));

        // Validate: product_menu commands must have at least 3 products
        const invalidCmd = sanitizedSettingsCommands.find(c => c.type === 'product_menu' && (c.products || []).length < 3);
        if (invalidCmd) {
            return res.status(400).json({ error: `Command /${invalidCmd.command} requires at least 3 products.` });
        }

        let integration = await Integration.findOne({ company: company._id, platform: 'telegram' });
        
        if (!integration) {
            integration = await Integration.create({
                company: company._id,
                platform: 'telegram',
                credentials: { botToken },
                settings: { commands: sanitizedSettingsCommands },
                isActive: true
            });
        } else {
            integration.credentials = { botToken };
            integration.settings = { commands: sanitizedSettingsCommands };
            integration.isActive = true;
            await integration.save();
        }

        res.json({ message: 'Telegram configured and Webhook linked successfully!', integration });
    } catch (error) {
        console.error('Telegram integration error:', error);
        res.status(500).json({ error: 'Server error configure Telegram' });
    }
});

// @route   POST /api/integration-manager/website
// @desc    Manually configure Web Chatbot Commands
// @access  Private
router.post('/website', requireAuth, async (req, res) => {
    try {
        const { commands } = req.body;
        const company = await Company.findOne({ owner: req.user._id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const sanitizedSettingsCommands = (commands || []).map(c => ({
            command: (c.command || '').toLowerCase().replace(/[^a-z0-9_]/g, ''),
            description: c.description || c.category || '',
            category: c.category || '',
            type: c.type || 'ai',
            message: c.message || '',
            successMessage: c.successMessage || '',
            products: c.products || []
        }));

        let integration = await Integration.findOne({ company: company._id, platform: 'website' });
        
        if (!integration) {
            integration = await Integration.create({
                company: company._id,
                platform: 'website',
                credentials: {},
                settings: { commands: sanitizedSettingsCommands },
                isActive: true
            });
        } else {
            integration.settings = { commands: sanitizedSettingsCommands };
            integration.isActive = true;
            await integration.save();
        }

        res.json({ message: 'Website commands configured successfully!', integration });
    } catch (error) {
        console.error('Website integration error:', error);
        res.status(500).json({ error: 'Server error configure Website' });
    }
});

// @route   POST /api/integration-manager/request-reveal-otp
// @desc    Send OTP to user email to reveal sensitive bot token
// @access  Private
router.post('/request-reveal-otp', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        const html = generateOtpEmail(
            "Security Verification",
            "You requested to reveal your Telegram Bot Token. Please use the code below to verify your identity.",
            otp
        );

        await sendEmail({
            email: user.email,
            subject: "VOXIO Security - Bot Token Access",
            message: `Your verification code is: ${otp}`,
            html
        });

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('OTP request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/integration-manager/verify-reveal-otp
// @desc    Verify OTP and return the actual bot token
// @access  Private
router.post('/verify-reveal-otp', requireAuth, async (req, res) => {
    try {
        const { otp, platform } = req.body;
        if (!otp) return res.status(400).json({ error: 'OTP is required' });

        const user = await User.findById(req.user.id);
        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // OTP is valid, clear it
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Get the integration
        const company = await Company.findOne({ owner: user._id });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        
        const integration = await Integration.findOne({ 
            company: company._id, 
            platform: platform || 'telegram' 
        });

        if (!integration) return res.status(404).json({ error: 'Integration not found' });

        res.json({ 
            botToken: integration.credentials?.botToken,
            accessToken: integration.credentials?.accessToken,
            phoneNumberId: integration.credentials?.phoneNumberId,
            pageId: integration.credentials?.pageId,
            igAccountId: integration.credentials?.igAccountId
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
