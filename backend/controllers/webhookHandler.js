import axios from 'axios';
import Integration from '../models/Integration.js';
import Company from '../models/company.js';
import CompanyChat from '../models/CompanyChat.js';
import { fetchAiResponse } from '../utils/corexHelper.js';
import { getChatHistory, formatHistoryForPrompt } from '../utils/chatHistoryHelper.js';
import { getCompanyAIContext } from '../utils/promptHelper.js';

// تتبع الرسائل المعالجة لمنع التكرار
const processedMessages = new Set();

// تتبع حالات الطلب المؤقتة (في الانتاج يفضل Redis)
const orderSessions = {};

// ─── Helper: send Telegram message ──────────────────────────────────────────
async function tgSend(botToken, chatId, text, extra = {}) {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...extra
    });
}

// ─── Helper: send product menu with inline buttons ──────────────────────────
async function tgSendProductMenu(botToken, chatId, products, introText = 'اختر المنتج:') {
    // Send intro text first
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: introText,
        parse_mode: 'HTML'
    });

    // Send each product as a separate message
    for (const p of products) {
        const caption = `<b>${p.name}</b>\n${p.price ? `💰 السعر: ${p.price}\n` : ''}${p.description ? `\n📝 ${p.description}` : ''}`;
        const keyboard = [[{
            text: `🛒 طلب ${p.name}`,
            callback_data: `order:${p.name}`
        }]];

        if (p.imageUrl) {
            try {
                await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                    chat_id: chatId,
                    photo: p.imageUrl,
                    caption: caption,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: keyboard }
                });
            } catch (e) {
                console.error('Failed to send photo, fallback to text', e.message);
                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    chat_id: chatId,
                    text: caption,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: keyboard },
                    disable_web_page_preview: false
                });
            }
        } else {
            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                text: caption,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: keyboard },
                disable_web_page_preview: false
            });
        }
    }
}

// ─── Save chat message to DB ────────────────────────────────────────────────
async function saveChatMsg(companyId, userId, text, sender, platform = 'telegram') {
    await CompanyChat.create({ company: companyId, user: userId, text, sender, platform });
}

/**
 * WhatsApp Webhook Handler
 */
export const handleWhatsAppMessage = async (body) => {
    try {
        console.log(`[WhatsApp Debug] Full Webhook Body:`, JSON.stringify(body));

        if (body.object !== 'whatsapp_business_account') {
            console.log(`[WhatsApp Debug] Object is not whatsapp_business_account, it is: ${body.object}`);
            return;
        }

        for (const entry of body.entry) {
            console.log(`[WhatsApp Debug] Processing Entry ID: ${entry.id}`);
            for (const change of entry.changes) {
                console.log(`[WhatsApp Debug] Change Field: ${change.field}`);
                if (change.field === 'messages') {
                    const value = change.value;
                    if (value.statuses) {
                        console.log(`[WhatsApp Debug] Received a status update (read/delivered), ignoring.`);
                        continue;
                    }

                    if (value.messages && value.messages.length > 0) {
                        const message = value.messages[0];
                        const messageId = message.id;
                        const from = message.from;
                        const messageText = message.text?.body || '[Non-text message]';
                        const phoneNumberId = value.metadata.phone_number_id;
                        const displayPhoneNumber = value.metadata.display_phone_number;
                        
                        console.log(`[WhatsApp Webhook] Message from ${from} to ${phoneNumberId}. Text: ${messageText}`);

                        if (processedMessages.has(messageId)) {
                            console.log(`[WhatsApp Debug] Message ${messageId} already processed, skipping.`);
                            continue;
                        }
                        processedMessages.add(messageId);

                        const allWaIntegrations = await Integration.find({
                            platform: 'whatsapp',
                            isActive: true
                        });

                        console.log(`[WhatsApp Debug] Looking for integration with Phone ID: ${phoneNumberId} or Display: ${displayPhoneNumber}`);

                        let integration = allWaIntegrations.find(int => 
                            int.credentials?.phoneNumberId === phoneNumberId || 
                            int.credentials?.phoneNumberId === displayPhoneNumber ||
                            (displayPhoneNumber && int.credentials?.phoneNumberId === displayPhoneNumber.replace(/[^0-9]/g, ''))
                        );

                        if (!integration && allWaIntegrations.length > 0) {
                            console.log(`[WhatsApp Debug] No direct match found. Active integrations count: ${allWaIntegrations.length}`);
                            console.log(`[WhatsApp Debug] First integration in DB has Phone ID: ${allWaIntegrations[0].credentials?.phoneNumberId}`);
                            integration = allWaIntegrations[0];
                            console.log(`[WhatsApp Debug] Falling back to the first available integration for Company: ${integration.company}`);
                        }

                        if (!integration || !integration.company) {
                            console.log(`[WhatsApp Debug] CRITICAL: No active integration found for this message. Stopping.`);
                            continue;
                        }

                        try {
                            const company = await Company.findById(integration.company);
                            if (!company) {
                                console.log(`[WhatsApp Webhook] Associated company not found in DB!`);
                                continue;
                            }
                            const accessToken = integration.credentials.accessToken;

                            const context = await getCompanyAIContext(company, integration);
                            const history = await getChatHistory(company._id, from, 'whatsapp', 5);
                            const historyContext = formatHistoryForPrompt(history);

                            // Save user message to DB
                            await CompanyChat.create({ company: company._id, user: from, text: messageText, sender: 'user', platform: 'whatsapp' }).catch(e => console.error("DB Save Err:", e.message));

                            console.log(`[WhatsApp Webhook] Fetching AI response...`);
                            
                            // ✅ Mark message as read (Meta Standard)
                            await axios.post(
                                `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
                                { messaging_product: "whatsapp", status: "read", message_id: messageId },
                                { headers: { Authorization: `Bearer ${accessToken}` } }
                            ).catch(e => console.warn("Read Status Err:", e.message));

                            const reply = await fetchAiResponse(`${context}\n\n${historyContext}User Question:\n${messageText}`, "AI_ERROR_RETRY_LATER");
                            
                            if (reply === "AI_ERROR_RETRY_LATER") {
                                throw new Error("AI Assistant failed to generate a response (Both CoreX and OpenRouter failed). Please check API keys.");
                            }

                            console.log(`[WhatsApp Webhook] AI generated response: ${reply.substring(0, 30)}...`);

                            // Send AI Reply
                            await axios.post(
                                `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
                                { messaging_product: "whatsapp", to: from, type: "text", text: { body: reply } },
                                { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
                            );
                            await CompanyChat.create({ company: company._id, user: from, text: reply, sender: 'ai', platform: 'whatsapp' });

                        } catch (msgError) {
                            console.error(`❌ WhatsApp Message Error:`, msgError.message);
                            
                            // Construct error message for the user
                            const errorMsg = `⚠️ *WhatsApp Bot Error*\n\n*Error:* ${msgError.message}\n${msgError.response?.data ? `*Details:* ${JSON.stringify(msgError.response.data)}` : ''}\n\n_Fix this to restore AI responses._`;

                            // Try to send error back to user
                            if (integration?.credentials?.accessToken) {
                                try {
                                    await axios.post(
                                        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
                                        { messaging_product: "whatsapp", to: from, type: "text", text: { body: errorMsg } },
                                        { headers: { Authorization: `Bearer ${integration.credentials.accessToken}`, "Content-Type": "application/json" } }
                                    );
                                } catch (reportErr) {
                                    console.error("Failed to send error report to WA:", reportErr.response?.data || reportErr.message);
                                }
                            }

                            // Log to DB
                            if (integration?.company) {
                                await CompanyChat.create({ 
                                    company: integration.company, 
                                    user: 'SYSTEM_ERROR', 
                                    text: `Loop Error: ${msgError.message}`, 
                                    sender: 'ai', 
                                    platform: 'whatsapp' 
                                }).catch(() => {});
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Error handling WhatsApp message:', error.message);
        try {
            // Attempt to write the fatal error to DB so the developer can see it
            const ints = await Integration.find({ platform: 'whatsapp' });
            if (ints.length > 0) {
                 await CompanyChat.create({ company: ints[0].company, user: 'FATAL_ERROR', text: error.message, sender: 'ai', platform: 'whatsapp' });
            }
        } catch (e) { }
        throw error;
    }
};

/**
 * Instagram Webhook Handler
 */
export const handleInstagramWebhook = async (body) => {
    try {
        // Meta webhooks for Instagram usually have object === 'page' or 'instagram'
        if (body.object !== 'page' && body.object !== 'instagram') return;

        for (const entry of body.entry) {
            // "id" here is usually the Facebook Page ID or IG Account ID
            const receiverId = entry.id;

            // Handle Messages (DM)
            if (entry.messaging) {
                for (const event of entry.messaging) {
                    if (event.message && event.message.text && !event.message.is_echo) {
                        const senderId = event.sender.id;
                        const messageText = event.message.text;
                        const messageId = event.message.mid;

                        if (processedMessages.has(messageId)) continue;
                        processedMessages.add(messageId);
                        if (processedMessages.size > 1000) processedMessages.delete(processedMessages.values().next().value);

                        // Find integration using the page ID or IG account ID
                        const allIgIntegrations = await Integration.find({
                            platform: 'instagram',
                            isActive: true
                        });

                        let integration = allIgIntegrations.find(int => 
                            int.credentials?.pageId === receiverId || 
                            int.credentials?.igAccountId === receiverId
                        );

                        if (!integration || !integration.company) continue;

                        const accessToken = integration.credentials.accessToken;
                        const settings = integration.settings || {};
                        const chatbotRules = settings.chatbotRules || [];

                        await CompanyChat.create({ company: integration.company, user: senderId, text: messageText, sender: 'user', platform: 'instagram' });

                        let replyMsg = null;

                        // 1. Check if matches any exact rule
                        const rule = chatbotRules.find(r => r.trigger.toLowerCase() === messageText.trim().toLowerCase());
                        if (rule) {
                            replyMsg = rule.response;
                        } else {
                            // 2. AI Fallback
                            const company = await Company.findById(integration.company);
                            if (company) {
                                const context = await getCompanyAIContext(company, integration);
                                replyMsg = await fetchAiResponse(`${context}\n\nClient asking on Instagram: ${messageText}`);
                            }
                        }

                        if (replyMsg) {
                            try {
                                await axios.post(
                                    `https://graph.facebook.com/v18.0/${integration.credentials.pageId}/messages`,
                                    { recipient: { id: senderId }, message: { text: replyMsg } },
                                    { params: { access_token: accessToken } }
                                );
                                await CompanyChat.create({ company: integration.company, user: senderId, text: replyMsg, sender: 'ai', platform: 'instagram', status: 'delivered' });
                            } catch (err) {
                                console.error('Error sending IG DM:', err.response?.data || err.message);
                                await CompanyChat.create({ company: integration.company, user: senderId, text: replyMsg, sender: 'ai', platform: 'instagram', status: 'failed' });
                            }
                        }
                    }
                }
            }

            // Handle Comments
            if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'comments') {
                        const commentValue = change.value;
                        const commentId = commentValue.id;
                        const commentText = commentValue.text;
                        const fromId = commentValue.from?.id;

                        if (!fromId || !commentText) continue;

                        if (processedMessages.has(commentId)) continue;
                        processedMessages.add(commentId);
                        if (processedMessages.size > 1000) processedMessages.delete(processedMessages.values().next().value);

                        const allIgIntegrations = await Integration.find({
                            platform: 'instagram',
                            isActive: true
                        });

                        let integration = allIgIntegrations.find(int => 
                            int.credentials?.pageId === receiverId || 
                            int.credentials?.igAccountId === receiverId
                        );

                        if (!integration || !integration.company) continue;

                        const accessToken = integration.credentials.accessToken;
                        const settings = integration.settings || {};
                        const globalRules = settings.globalCommentRules || [];
                        const dmClosedFallback = settings.dmClosedFallback || '';

                        // Check global rules
                        const matchedRule = globalRules.find(r => commentText.toLowerCase().includes(r.keyword.toLowerCase()));

                        if (matchedRule) {
                            let canSendDm = true;
                            let isFollower = true; // TODO: Implement real follower check via IG Graph API

                            if (matchedRule.requireFollow) {
                                // ⚠️ Graph API limitation: Cannot easily check if arbitrary user follows you without their token.
                                // Some platforms use private APIs or workaround to check this.
                                // For MVP, we assume true, but the flow is ready to block if false.
                                // isFollower = await checkUserFollows(integration.credentials.igAccountId, fromId, accessToken);
                                
                                if (!isFollower) {
                                    canSendDm = false;
                                }
                            }

                            if (!canSendDm) {
                                // They don't follow, send the not-following reply if exists
                                if (matchedRule.notFollowingReply) {
                                    try {
                                        await axios.post(
                                            `https://graph.facebook.com/v18.0/${commentId}/replies`,
                                            { message: matchedRule.notFollowingReply },
                                            { params: { access_token: accessToken } }
                                        );
                                    } catch (replyErr) {
                                        console.error('Failed to reply (not following):', replyErr.response?.data || replyErr.message);
                                    }
                                }
                            } else {
                                let dmSuccess = false;

                                // 1. Try to send DM first
                                try {
                                    await axios.post(
                                        `https://graph.facebook.com/v18.0/${integration.credentials.pageId}/messages`,
                                        { recipient: { id: fromId }, message: { text: matchedRule.dmReply } },
                                        { params: { access_token: accessToken } }
                                    );
                                    await CompanyChat.create({ company: integration.company, user: fromId, text: matchedRule.dmReply, sender: 'ai', platform: 'instagram', status: 'delivered' });
                                    dmSuccess = true;
                                } catch (dmErr) {
                                    console.error('Failed to send DM for comment:', dmErr.response?.data || dmErr.message);
                                    await CompanyChat.create({ company: integration.company, user: fromId, text: matchedRule.dmReply, sender: 'ai', platform: 'instagram', status: 'failed' });
                                    dmSuccess = false;
                                }

                                // 2. Reply to comment (success reply or fallback if DM failed)
                                const commentReplyText = dmSuccess ? matchedRule.commentReply : (dmClosedFallback || matchedRule.commentReply);
                                
                                try {
                                    await axios.post(
                                        `https://graph.facebook.com/v18.0/${commentId}/replies`,
                                        { message: commentReplyText },
                                        { params: { access_token: accessToken } }
                                    );
                                } catch (replyErr) {
                                    console.error('Failed to reply to IG comment:', replyErr.response?.data || replyErr.message);
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Error handling Instagram webhook:', error.message);
    }
};

/**
 * Telegram Webhook Handler
 * Supports: AI replies, fixed messages, product menus, callback queries, phone validation
 */
export const handleTelegramWebhook = async (req, res) => {
    try {
        const { companyId } = req.params;
        const body = req.body;

        // ══════════════════════════════════════════════════════════════════════
        // ══ CALLBACK QUERY (button click on product) ═════════════════════════
        // ══════════════════════════════════════════════════════════════════════
        if (body.callback_query) {
            const cb = body.callback_query;
            const chatId = cb.message.chat.id;
            const data = cb.data || '';
            const user = cb.from?.username || cb.from?.first_name || 'عميل';
            const userId = chatId.toString();

            if (data.startsWith('order:')) {
                const productName = data.replace('order:', '');

                // Use lean() for reading only - we don't need Mongoose methods here
                const integration = await Integration.findOne({
                    company: companyId,
                    platform: 'telegram',
                    isActive: true
                });

                if (!integration) return res.sendStatus(200);

                const botToken = integration.credentials.botToken;

                // Answer callback to remove loading spinner
                await axios.post(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    callback_query_id: cb.id
                }).catch(() => {});

                // Find the command config that has this product to get successMessage
                const matchedCmd = (integration.settings?.commands || []).find(c =>
                    c.type === 'product_menu' && (c.products || []).some(p => p.name === productName)
                );
                const successMessage = matchedCmd?.successMessage || '';

                // Start Order Session - wait for phone number
                orderSessions[chatId] = {
                    productName,
                    customerName: user,
                    userId,
                    companyId,
                    successMessage,
                    timestamp: Date.now()
                };

                // Ask for phone number
                const requestPhoneMsg = `جميل جداً! أنت اخترت: <b>${productName}</b>.\n\nمن فضلك أرسل <b>رقم الموبايل</b> الخاص بك (11 رقم) لتأكيد طلبك وسنتواصل معك فوراً. 📱`;
                await tgSend(botToken, chatId, requestPhoneMsg);
                await saveChatMsg(companyId, userId, requestPhoneMsg, 'ai');
            }

            return res.sendStatus(200);
        }

        // ══════════════════════════════════════════════════════════════════════
        // ══ REGULAR MESSAGE ═══════════════════════════════════════════════════
        // ══════════════════════════════════════════════════════════════════════
        if (!body.message) return res.sendStatus(200);

        const chatId = body.message.chat.id;
        const text = body.message.text || '';
        const user = body.message.from?.username || body.message.from?.first_name || 'مستخدم تليجرام';
        const userId = chatId.toString();

        // Deduplicate messages
        const messageId = `tg_${body.message.message_id}`;
        if (processedMessages.has(messageId)) return res.sendStatus(200);
        processedMessages.add(messageId);
        if (processedMessages.size > 1000) processedMessages.delete(processedMessages.values().next().value);

        // Get integration data (lean for reading)
        const integration = await Integration.findOne({
            company: companyId,
            platform: 'telegram',
            isActive: true
        });

        if (!integration) return res.sendStatus(200);

        const botToken = integration.credentials.botToken;

        // ── CHECK: Order Session (Waiting for phone) ────────────────────────
        if (orderSessions[chatId]) {
            const session = orderSessions[chatId];
            const phoneRegex = /^[0-9]{11}$/;
            const isValidPhone = phoneRegex.test(text.trim());

            if (!isValidPhone) {
                const errorMsg = `❌ ده مش رقم صحيح. لازم الرقم يتكون من 11 رقم بالضبط (أرقام فقط).\n\nمن فضلك أرسل الرقم الصحيح لطلب: ${session.productName}`;
                await tgSend(botToken, chatId, errorMsg);
                return res.sendStatus(200);
            }

            // Phone is valid! Complete the order
            const phoneNumber = text.trim();

            // Save order to dashboard (use Company model directly, NOT lean object)
            const companyDoc = await Company.findById(companyId);
            if (companyDoc) {
                companyDoc.requests.push({
                    customerName: `${session.customerName} (${phoneNumber})`,
                    product: session.productName,
                    message: `📦 طلب جديد!\nالمنتج: ${session.productName}\nالعميل: @${session.customerName}\nرقم الموبايل: ${phoneNumber}`,
                    date: new Date()
                });
                await companyDoc.save();
            }

            await saveChatMsg(companyId, userId, `رقم الموبايل: ${phoneNumber}`, 'user');

            // Send Confirmation (Custom or Default)
            let confirmMsg = session.successMessage || `✅ تم بنجاح طلب <b>${session.productName}</b>!\n\nسيتواصل معك فريقنا قريباً على الرقم: ${phoneNumber}\nشكراً لك! 🙏`;
            confirmMsg = confirmMsg.replace('{{product}}', session.productName).replace('{{phone}}', phoneNumber);

            await tgSend(botToken, chatId, confirmMsg);
            await saveChatMsg(companyId, userId, confirmMsg, 'ai');

            delete orderSessions[chatId];
            return res.sendStatus(200);
        }

        // ── Match Command ────────────────────────────────────────────────────
        const cleanText = text.trim().toLowerCase().replace('/', '');
        const commands = integration.settings?.commands || [];
        const commandConfig = commands.find(c =>
            cleanText === c.command || text === `/${c.command}`
        );

        if (commandConfig) {
            console.log(`🎯 Command matched: ${commandConfig.command} | Type: ${commandConfig.type} | Products: ${(commandConfig.products || []).length}`);
            const cmdType = commandConfig.type || 'ai';

            // Save incoming command to chat history
            await saveChatMsg(companyId, userId, text, 'user');

            if (cmdType === 'fixed_message') {
                const replyMsg = commandConfig.message || `مرحباً! أنت في قسم: ${commandConfig.category || commandConfig.description}.`;
                await tgSend(botToken, chatId, replyMsg);
                await saveChatMsg(companyId, userId, replyMsg, 'ai');

                // Save as dashboard request
                const companyDoc = await Company.findById(companyId);
                if (companyDoc) {
                    companyDoc.requests.push({
                        customerName: user,
                        product: commandConfig.category || commandConfig.command,
                        message: text,
                        date: new Date()
                    });
                    await companyDoc.save();
                }

            } else if (cmdType === 'product_menu') {
                const products = commandConfig.products || [];
                if (products.length === 0) {
                    await tgSend(botToken, chatId, `عذراً، لا توجد منتجات متاحة حالياً.`);
                    return res.sendStatus(200);
                }
                const introText = commandConfig.message || `🛍️ اختر المنتج الذي تريده من <b>${commandConfig.category || 'قائمتنا'}</b>:`;
                await tgSendProductMenu(botToken, chatId, products, introText);
                await saveChatMsg(companyId, userId, introText, 'ai');

            } else {
                // AI type
                const companyDoc = await Company.findById(companyId);
                const context = await getCompanyAIContext(companyDoc, integration);
                const history = await getChatHistory(companyId, userId, 'telegram', 5);
                const historyContext = formatHistoryForPrompt(history);
                const reply = await fetchAiResponse(`${context}\n\n${historyContext}User Question:\n${text}`);
                await tgSend(botToken, chatId, reply);
                await saveChatMsg(companyId, userId, reply, 'ai');

                if (companyDoc) {
                    companyDoc.requests.push({
                        customerName: user,
                        product: commandConfig.category || commandConfig.command,
                        message: text,
                        date: new Date()
                    });
                    await companyDoc.save();
                }
            }

            return res.sendStatus(200);
        }

        // ── No command matched → Default AI reply ───────────────────────────
        const companyDoc = await Company.findById(companyId);
        const context = await getCompanyAIContext(companyDoc, integration);

        await saveChatMsg(companyId, userId, text, 'user');
        const history = await getChatHistory(companyId, userId, 'telegram', 5);
        const historyContext = formatHistoryForPrompt(history);
        const reply = await fetchAiResponse(`${context}\n\n${historyContext}User Question:\n${text}`);
        await tgSend(botToken, chatId, reply);
        await saveChatMsg(companyId, userId, reply, 'ai');

        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling Telegram Webhook:', error.message);
        res.sendStatus(500);
    }
};
