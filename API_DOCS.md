# VOXIO API Documentation

**Base URL:** `https://aithor1.vercel.app/api`  
**Alternative Base URL:** `https://aithor2.vercel.app/api`  
**Admin Base URL:** `https://aithor1.vercel.app/api/admin` (or `http://localhost:5001/api/admin`)

**Format:** JSON  
**Auth:** JWT Bearer Token (via `Authorization: Bearer <token>` header) or httpOnly cookie

---

## Authentication

Most endpoints require a JWT token obtained from login/register. Add it to requests:

```
Authorization: Bearer <access_token>
```

The server also sets an httpOnly `refreshToken` cookie for silent token refresh.

---

## Table of Contents

1. [Auth](#1-auth-api)
2. [Company](#2-company-api)
3. [AI Training (Uploads)](#3-ai-training-api)
4. [Chat](#4-chat-api)
5. [Public Chat (Widget)](#5-public-chat-api)
6. [VOXIO Chat (Platform Bot)](#6-voxio-chat-api)
7. [Integration Manager](#7-integration-manager-api)
8. [Integrations (OAuth & Webhooks)](#8-integrations-oauth--webhooks-api)
9. [Chatbot Editor](#9-chatbot-editor-api)
10. [Widget Editor](#10-widget-editor-api)
11. [Projects](#11-projects-api)
12. [Support](#12-support-api)
13. [Chat History / Conversations](#13-chat-history-api)
14. [Broadcast](#14-broadcast-api)
15. [Admin API](#15-admin-api)
16. [Utilities](#16-utilities)
17. [Widget JS](#17-widget-javascript-script)
18. [Webhooks](#18-webhooks)

---

## 1. Auth API

### `POST /auth/register`
Register a new user. Sends OTP to email for verification.

**Request:**
```json
{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "mypassword123"
}
```
**Response (OTP sent):**
```json
{
  "message": "OTP sent to email",
  "step": "otp_required",
  "email": "ahmed@example.com"
}
```
**Response (existing unverified user - OTP resent):**
```json
{
  "message": "OTP resent to email",
  "step": "otp_required",
  "email": "ahmed@example.com"
}
```
**Error (email exists):** `400 { "error": "Email already exists" }`

### `POST /auth/login`
Login with email & password. Sends OTP to email.

**Request:**
```json
{
  "email": "ahmed@example.com",
  "password": "mypassword123"
}
```
**Response (OTP sent):**
```json
{
  "message": "OTP sent to email",
  "step": "otp_required",
  "email": "ahmed@example.com"
}
```
**Bypass Account (no OTP required):**
```
Email:    dev@voxio.ai
Password: Dev@2026
```
On success with bypass:
```json
{
  "user": { "id": "...", "name": "dev", "email": "dev@voxio.ai" },
  "token": "<jwt_token>",
  "step": "done"
}
```

### `POST /auth/verify-otp`
Verify OTP and receive JWT token.

**Request:**
```json
{
  "email": "ahmed@example.com",
  "otp": "123456"
}
```
**Response:**
```json
{
  "user": { "id": "...", "name": "Ahmed", "email": "ahmed@example.com" },
  "token": "<jwt_token>"
}
```
Also sets httpOnly `refreshToken` cookie.

### `POST /auth/forgot-password`
Request password reset OTP.

**Request:**
```json
{ "email": "ahmed@example.com" }
```
**Response:**
```json
{
  "message": "OTP sent",
  "step": "otp_required",
  "email": "ahmed@example.com"
}
```

### `POST /auth/reset-password`
Reset password using OTP.

**Request:**
```json
{
  "email": "ahmed@example.com",
  "otp": "123456",
  "newPassword": "newpass12345"
}
```
**Response:** `{ "message": "Password updated successfully. You can now login." }`

### `POST /auth/change-password`
Change password (authenticated users only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456"
}
```
**Response:** `{ "message": "Password changed successfully" }`

### `POST /auth/google-login`
Login/register with Google OAuth.

**Request:**
```json
{ "idToken": "<google_credential_token>" }
```
**Response:**
```json
{
  "user": { "id": "...", "name": "Ahmed", "email": "ahmed@gmail.com", "picture": "..." },
  "token": "<jwt_token>",
  "isNew": false
}
```

### `POST /auth/refresh`
Silently refresh access token using httpOnly cookie.

**Headers:** (cookie automatically sent)  
**Response:** `{ "accessToken": "<new_jwt_token>" }`

### `POST /auth/logout`
Clear refresh token cookie.

**Response:** `{ "message": "Logged out" }`

---

## 2. Company API

All endpoints require `Authorization: Bearer <token>`.

### `GET /company`
Get authenticated user's company profile.

**Response:**
```json
{
  "_id": "...",
  "name": "My Company",
  "owner": "...",
  "industry": "Tech",
  "slug": "my-company-1234",
  "apiKey": "...",
  "chatToken": "vchat_...",
  "vision": "...",
  "mission": "...",
  "values": [],
  "websiteConfig": { ... },
  "knowledgeBase": [],
  "customInstructions": "",
  "extractedKnowledge": "",
  "urlExtractedKnowledge": "",
  "aiSettings": { "model": "inclusionai/ring-2.6-1t" }
}
```

### `POST /company`
Create or update company profile.

**Request:**
```json
{
  "name": "My Company",
  "industry": "E-commerce",
  "size": "10-50",
  "description": "We sell products",
  "vision": "To be the best",
  "mission": "Customer first",
  "values": ["Quality", "Speed"],
  "websiteUrl": "https://mycompany.com",
  "slug": "my-company",
  "logo": "https://...",
  "aiSettings": { "model": "inclusionai/ring-2.6-1t" }
}
```
**Response:** Company object (201 for new, 200 for update)

### `GET /company/apikey`
Get company API key.

**Response:** `{ "apiKey": "..." }`

### `GET /company/fix-apikey`
Generate API key & chat token if missing.

**Response:** `{ "message": "...", "apiKey": "...", "chatToken": "...", "company": {...} }`

### `GET /company/analytics`
Get dashboard analytics.

**Response:**
```json
{
  "totalConversations": 150,
  "activeNow": 3,
  "aiResolutionRate": 85,
  "recentActivity": [...],
  "lineChartData": [{ "label": "Mon", "value": 12 }, ...],
  "donutChartData": [{ "label": "web", "value": 80 }, ...],
  "heatmapData": [{ "hour": 9, "value": 5 }, ...],
  "aiInsight": "أداء ممتاز! البوت يعالج معظم المحادثات بنجاح."
}
```

### `GET /company/public/:slug`
Get public company info by slug (no auth required).

**Response:**
```json
{
  "name": "My Company",
  "slug": "my-company",
  "apiKey": "...",
  "websiteConfig": {
    "themeColor": "#4f46e5",
    "welcomeMessage": "Hello!",
    "botName": "Assistant",
    "font": "Inter"
  }
}
```

### `GET /company/export-website/:slug`
Export company website as HTML+CSS. Returns downloadable content.

### `GET /company/view-website/:slug`
Render company chatbot website as full HTML page (no auth).

**Response:** `text/html` (full webpage)

### `POST /company/update-website-ai`
Modify website using AI.

**Request:**
```json
{
  "prompt": "Change the background to dark blue",
  "currentHtml": "...",
  "currentCss": "...",
  "isDeepSearch": false
}
```
**Response:**
```json
{
  "message": "Changed background to dark blue",
  "config": { "customHtml": "...", "customCss": "...", "themeColor": "#1a237e" }
}
```

### `POST /company/apply-template`
Apply industry template to AI instructions.

**Request:** `{ "templateId": "real_estate" }`  
**Templates:** `real_estate`, `ecommerce`, `clinic`, `restaurant`, `tech_support`, `legal`, `education`, `real_estate_advanced`, `car_showroom`

### `POST /company/whatsapp-setup`
Manually set WhatsApp credentials.

**Request:**
```json
{
  "phoneNumberId": "123456789",
  "accessToken": "EAAx..."
}
```

### `POST /company/external-request`
Send a request via API key (for external integrations).

**Request:**
```json
{
  "apiKey": "company_api_key",
  "customerName": "Ahmed",
  "product": "Shoes",
  "message": "I want to order"
}
```
**Response:**
```json
{
  "success": true,
  "company": "My Company",
  "reply": "..."
}
```

### `POST /company/use-model`
Use AI model via API key.

**Headers:** `x-api-key: <apiKey>`  
**Request:** `{ "prompt": "What do you offer?" }`

### Leads Endpoints

#### `GET /company/leads`
Get leads with pagination & search.

**Query:** `?page=1&limit=50&search=ahmed&status=new`

#### `POST /company/leads`
Create a lead.

**Request:**
```json
{
  "name": "Ahmed",
  "phone": "01001234567",
  "email": "ahmed@example.com",
  "source": "manual",
  "notes": "Interested in product X"
}
```

#### `PUT /company/leads/:id`
Update a lead.

#### `DELETE /company/leads/:id`
Delete a lead.

### Requests Endpoints

#### `GET /company/requests`
Get all customer requests.

#### `POST /company/requests`
Create a manual request.

**Request:**
```json
{
  "customerName": "Ahmed",
  "product": "Shoes",
  "message": "Order details",
  "source": "web"
}
```

#### `DELETE /company/requests/:index`
Delete a request by array index.

---

## 3. AI Training API

All endpoints require `Authorization: Bearer <token>`.

### `POST /ai/upload`
Upload a file (PDF, DOCX, TXT) to the knowledge base. AI extracts & merges content automatically.

**Content-Type:** `multipart/form-data`  
**Field:** `file` (max 10MB)

**Response:**
```json
{
  "message": "File uploaded and analyzed successfully",
  "resource": {
    "id": "1234567890",
    "fileName": "products.pdf",
    "fileUrl": "https://ik.imagekit.io/...",
    "fileType": "pdf"
  },
  "extractedKnowledge": "..."
}
```

### `POST /ai/image`
Upload an image.

**Content-Type:** `multipart/form-data`  
**Field:** `image` (max 5MB)

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://ik.imagekit.io/..."
}
```

### `POST /ai/scrape-url`
Scrape a URL and extract knowledge using Puppeteer+AI.

**Request:**
```json
{ "url": "https://example.com/about" }
```
**Response:**
```json
{
  "message": "URL scraped successfully",
  "urlExtractedKnowledge": "...",
  "customInstructions": "..."
}
```

### `GET /ai`
Get all knowledge base files.

**Response:** `[{ "id": "...", "fileName": "...", "fileUrl": "...", "fileType": "..." }]`

### `GET /ai/extracted-knowledge`
Get extracted knowledge text.

**Response:** `{ "extractedKnowledge": "..." }`

### `PUT /ai/extracted-knowledge`
Update extracted knowledge manually.

**Request:** `{ "extractedKnowledge": "Updated knowledge text..." }`

### `GET /ai/url-extracted-knowledge`
Get URL extracted knowledge.

### `PUT /ai/url-extracted-knowledge`
Update URL extracted knowledge.

**Request:** `{ "urlExtractedKnowledge": "..." }`

### `PUT /ai/instructions`
Update AI custom instructions.

**Request:** `{ "instructions": "Be formal and professional..." }`

### `GET /ai/media-library`
Get all discovered media URLs from chats and requests.

**Response:** `{ "success": true, "images": ["url1", "url2", ...] }`

### `DELETE /ai/:fileId`
Delete a knowledge base file.

---

## 4. Chat API

### `POST /chat`
Chat with your company's AI (authenticated).

**Headers:** `Authorization: Bearer <token>`  
**Request:** `{ "prompt": "What are your working hours?" }`  
**Response:** `{ "reply": "Our working hours are 9 AM to 6 PM." }`

---

## 5. Public Chat API

No authentication required. Used by the website widget & embeddable chat.

### `POST /public/chat`
Send a message to a company's AI.

**Request:**
```json
{
  "apiKey": "company_api_key_or_chat_token",
  "prompt": "Hello, I have a question",
  "sessionId": "sess_abc123",
  "platform": "widget"
}
```
Alternative: use `slug` instead of `apiKey`:
```json
{
  "slug": "my-company",
  "prompt": "Hello",
  "sessionId": "sess_abc123"
}
```
**Response:**
```json
{
  "success": true,
  "company": "My Company",
  "reply": "Hello! How can I help you?"
}
```
**Supports:** Lead capture `[SAVE_LEAD: name | phone | email]`, Human handoff `[HUMAN_HANDOFF]`, Product ordering flow via commands.

### `GET /public/history`
Get chat history for returning visitors.

**Query:** `?apiKey=<chatToken>&sessionId=sess_abc123`  
**Response:** `{ "success": true, "history": [{ "sender": "user", "text": "...", "createdAt": "..." }] }`

### `GET /public/commands/:apiKey`
Get commands/autocomplete suggestions for a company.

**Response:** `{ "success": true, "commands": [{ "command": "products", "description": "View catalog", "type": "product_menu" }] }`

### `GET /public/companies`
Get all public companies (showcase).

**Response:** `{ "success": true, "companies": [...] }`

### `GET /public/company/:apiKey`
Get company info by API key.

### `GET /public/company/slug/:slug`
Get company info by slug.

---

## 6. VOXIO Chat API

### `POST /voxio-chat`
Chat with the VOXIO platform bot (about VOXIO itself).

**Request:** `{ "prompt": "What is VOXIO?" }`  
**Response:** `{ "reply": "VOXIO is a cutting-edge platform..." }`

---

## 7. Integration Manager API

All endpoints require `Authorization: Bearer <token>`.

### `GET /integration-manager`
Get all integrations for the company.

**Response:** `[{ "id": "...", "platform": "telegram", "isActive": true, "credentials": {...}, ... }]`

### `GET /integration-manager/:platform/settings`
Get settings for a specific platform.

**Platforms:** `telegram`, `whatsapp`, `instagram`, `website`, `widget`

### `GET /integration-manager/:platform/analytics`
Get platform analytics (message counts, delivery rate).

### `GET /integration-manager/:platform/chats`
Get recent chats for a platform (last 200).

### `GET /integration-manager/:platform/logs`
Get error logs for a platform.

### `PUT /integration-manager/:platform/settings`
Update platform settings.

**Request:** `{ "key": "value" }` (merged with existing)

### `DELETE /integration-manager/:id`
Delete/disconnect an integration.

### `PATCH /integration-manager/:id/toggle`
Toggle integration active status.

**Response:** `{ "message": "Integration activated", "isActive": true }`

### `POST /integration-manager/telegram`
Configure Telegram bot.

**Request:**
```json
{
  "botToken": "123456:ABC-DEF...",
  "commands": [
    {
      "command": "products",
      "description": "View our products",
      "category": "Shop",
      "type": "product_menu",
      "message": "Choose a product:",
      "successMessage": "Order confirmed!",
      "products": [
        { "name": "Product 1", "price": "$10", "image": "https://..." },
        { "name": "Product 2", "price": "$20", "image": "https://..." },
        { "name": "Product 3", "price": "$30", "image": "https://..." }
      ]
    }
  ]
}
```

### `POST /integration-manager/whatsapp`
Manual WhatsApp setup.

**Request:**
```json
{
  "phoneNumberId": "123456789",
  "accessToken": "EAAx...",
  "wabaId": "987654321"
}
```

### `POST /integration-manager/whatsapp/exchange`
Exchange short-lived token for long-lived + auto-discover WhatsApp IDs.

**Request:**
```json
{
  "shortLivedToken": "EAAx...",
  "wabaId": "optional",
  "phoneNumberId": "optional"
}
```

### `POST /integration-manager/instagram`
Configure Instagram integration.

**Request:**
```json
{
  "pageId": "123456",
  "igAccountId": "789012",
  "accessToken": "EAAx...",
  "commands": [
    { "command": "info", "description": "Get info", "type": "fixed_message", "message": "Welcome!" }
  ]
}
```

### `POST /integration-manager/website`
Configure website chat commands.

### `POST /integration-manager/widget`
Configure widget chat commands.

### `POST /integration-manager/shopify/sync`
Sync products from Shopify (MVP mock).

**Request:**
```json
{
  "shopifyDomain": "mystore.myshopify.com",
  "accessToken": "shpat_..."
}
```

### `POST /integration-manager/request-reveal-otp`
Request OTP to reveal sensitive tokens.

### `POST /integration-manager/verify-reveal-otp`
Verify OTP and reveal bot token.

**Request:** `{ "otp": "123456", "platform": "telegram" }`  
**Response:** `{ "botToken": "123456:ABC...", "accessToken": "...", ... }`

---

## 8. Integrations (OAuth & Webhooks) API

### Meta (Facebook/Instagram/WhatsApp)

| Endpoint | Description |
|---|---|
| `GET /integrations/meta/login?companyId=<id>` | Initiate Meta OAuth |
| `GET /integrations/meta/callback` | Meta OAuth callback |
| `POST /integrations/meta/data-deletion` | Handle Meta data deletion requests |
| `GET /integrations/meta/data-deletion` | Verify Meta data deletion |
| `POST /integrations/webhooks/meta` | Receive Meta webhook events |
| `GET /integrations/webhooks/meta` | Meta webhook verification challenge |
| `GET /integrations/webhooks/meta/test` | Webhook diagnostic test |

### Shopify

| Endpoint | Description |
|---|---|
| `GET /integrations/shopify/login?companyId=<id>&shop=<domain>` | Initiate Shopify OAuth |
| `GET /integrations/shopify/callback` | Shopify OAuth callback |
| `POST /integrations/webhooks/shopify` | Receive Shopify webhooks |

### TikTok

| Endpoint | Description |
|---|---|
| `GET /integrations/tiktok/login?companyId=<id>` | Initiate TikTok OAuth |
| `GET /integrations/tiktok/callback` | TikTok OAuth callback |

### Telegram

| Endpoint | Description |
|---|---|
| `POST /integrations/webhooks/telegram/:companyId` | Receive Telegram bot updates |

### Widget Script

| Endpoint | Description |
|---|---|
| `GET /integrations/widget/script.js` | Legacy embeddable widget JS |

---

## 9. Chatbot Editor API

All endpoints require `Authorization: Bearer <token>`.

### `GET /chatbot-editor/current`
Get current chatbot HTML code.

### `POST /chatbot-editor/edit`
Edit website via AI (legacy, full rewrite mode).

**Request:**
```json
{
  "userRequest": "Make it more modern with a gradient header",
  "history": [{ "role": "user", "content": "..." }],
  "codingModel": "openai/gpt-4o"
}
```

### `POST /chatbot-editor/analyze`
Analyze requested changes before editing (segment-based).

**Request:**
```json
{
  "userRequest": "Change the header color",
  "html": "...",
  "css": "...",
  "js": "...",
  "codingModel": "..."
}
```
**Response:**
```json
{
  "message": "Action plan generated",
  "report": "Detailed plan...",
  "filesToModify": ["css"]
}
```

### `POST /chatbot-editor/edit-segment`
Edit specific segment (html/css/js).

**Request:**
```json
{
  "userRequest": "Change header to blue",
  "targetSegment": "css",
  "currentCode": "/* current CSS */",
  "allSegments": { "html": "...", "css": "...", "js": "..." },
  "codingModel": "...",
  "context": "Action plan from analyze step"
}
```

### `POST /chatbot-editor/reset`
Reset to a template.

**Request:** `{ "templateId": "default" }`  
**Templates:** `default`, `glassmorphism`, `luxury`, `cyberpunk`, `minimal-white`, `startup`, `restaurant`

### `POST /chatbot-editor/save`
Save HTML code manually.

**Request:** `{ "htmlContent": "..." }`

### `POST /chatbot-editor/publish-vercel`
Deploy to Vercel.

**Request:** `{ "htmlContent": "..." }`  
**Response:** `{ "message": "تم النشر بنجاح ✅", "url": "https://voxio-...vercel.app" }`

### `GET /chatbot-editor/templates`
Get available templates.

### `GET /chatbot-editor/page/:slug`
Get public chatbot page data (no auth).

---

## 10. Widget Editor API

### `POST /widget-editor/edit`
Edit floating chat widget via AI.

**Request:**
```json
{
  "userRequest": "Make the button green and add a glow effect",
  "history": []
}
```
**Response:**
```json
{
  "message": "Changed primary color to green...",
  "config": {
    "primaryColor": "#00c853",
    "welcomeMessage": "مرحباً!",
    "customCss": ".vx-bubble { box-shadow: 0 0 20px #00c853; }"
  }
}
```

### `GET /widget-editor/current`
Get current widget config.

**Response:** `{ "primaryColor": "#6C63FF", "welcomeMessage": "...", ... }`

---

## 11. Projects API

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/projects` | Get all projects |
| `POST` | `/projects` | Create project |
| `GET` | `/projects/:id` | Get project by ID |
| `PUT` | `/projects/:id` | Update project |
| `DELETE` | `/projects/:id` | Delete project |

**Request (create/update):**
```json
{
  "name": "My Project",
  "description": "Project description",
  "status": "active"
}
```

---

## 12. Support API

### `POST /support/submit`
Submit a support message (public).

**Request:**
```json
{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "subject": "Integration issue",
  "message": "I can't connect WhatsApp"
}
```
**Response:** `{ "success": true, "message": "Message sent successfully", "data": {...} }`

### `GET /support/all`
Get all support messages (admin).

---

## 13. Chat History API

All endpoints require `Authorization: Bearer <token>`.

### `GET /support-chat/conversations`
Get list of all conversations (unique users).

**Response:** `[{ "id": "...", "name": "زائر 1", "lastMessage": "...", "time": "...", "unread": 0, "platform": "web" }]`

### `GET /support-chat/history/:userId`
Get chat history with a specific user.

### `POST /support-chat/send`
Send a manual reply to a user.

**Request:** `{ "userId": "...", "text": "Hello, how can I help?" }`

### `POST /support-chat/train`
Extract instructions from a chat to improve the AI model.

**Request:** `{ "userId": "..." }`  
**Response:** `{ "success": true, "message": "تم تدريب النموذج بنجاح!", "addedInstruction": "..." }`

---

## 14. Broadcast API

### `GET /broadcast/current`
Get current active system broadcast.

**Response:** `{ "success": true, "broadcast": { "title": "...", "message": "...", "active": true } | null }`

---

## 15. Admin API

**Base:** `https://aithor1.vercel.app/api/admin` (or `http://localhost:5001/api/admin`)  
**Auth:** JWT Bearer token obtained from admin login.

### `POST /admin/login`
**Request:**
```json
{
  "email": "midovoxio@gmail.com",
  "password": "mido927010"
}
```
**Response:** `{ "token": "<admin_jwt>" }`

### `GET /admin/users`
Get all users with companies & integrations.

### `GET /admin/companies/:id`
Get company details.

### `DELETE /admin/users/:userId`
Delete user and all associated data.

### `PUT /admin/users/:userId/suspend`
Toggle user suspension.

### `PUT /admin/companies/:companyId/limit`
Update message limit.

**Request:** `{ "limit": 5000 }`

### `GET /admin/companies/:companyId/ai-config`
Get company AI configuration.

**Response:**
```json
{
  "name": "...",
  "industry": "...",
  "description": "...",
  "vision": "...",
  "mission": "...",
  "values": "...",
  "systemPrompt": "...",
  "extractedKnowledge": "...",
  "urlExtractedKnowledge": "...",
  "websiteUrl": "..."
}
```

### `PUT /admin/companies/:companyId/ai-config`
Update company AI configuration remotely.

```json
{
  "name": "...",
  "industry": "...",
  "description": "...",
  "systemPrompt": "New AI instructions",
  "extractedKnowledge": "..."
}
```

### `GET /admin/agents`
Get all integrations/agents.

### `DELETE /admin/agents/:agentId`
Delete an integration.

### `GET /admin/support-messages`
Get all support messages.

### `PUT /admin/support-messages/:id/read`
Mark message as read.

### `DELETE /admin/support-messages/:id`
Delete a support message.

### `GET /admin/analytics`
Get system analytics.

**Response:** `{ "usersCount": 100, "integrationsCount": 50, "totalAIMessages": 5000 }`

---

## 16. Utilities

### `GET /ping`
Health check.

**Response:** `{ "message": "pong" }`

### `GET /health`
Detailed health check.

**Response:** `{ "status": "ok", "database": "MongoDB", "connection": "Connected" }`

### `POST /test/transcribe`
Test audio transcription.

**Headers:** `Content-Type: audio/*`  
**Body:** Raw audio binary  
**Response:** `{ "text": "transcribed text" }`

---

## 17. Widget JavaScript Script

### `GET /widget.js`
Premium embeddable chat widget script. Include in any website:

```html
<script
  src="https://aithor1.vercel.app/widget.js"
  data-api-key="YOUR_CHAT_TOKEN"
  data-primary-color="#6C63FF"
  data-launcher-color="#1e293b"
></script>
```

### `GET /widget/:apiKey`
Chat widget page (iframe source). Redirects to frontend widget page.

### `GET /api/integrations/widget/script.js`
Legacy widget script (gradient design with product menu support).

---

## 18. Webhooks

### Meta Webhook
- **URL:** `POST /api/integrations/webhooks/meta`
- **Verification:** `GET /api/integrations/webhooks/meta?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>`
- **Handles:** WhatsApp messages, Instagram messages & comments, Facebook messages
- **Security:** HMAC-SHA256 signature verification (`x-hub-signature-256` header)

### Shopify Webhook
- **URL:** `POST /api/integrations/webhooks/shopify`
- **Handles:** Orders, products updates, app uninstall
- **Security:** HMAC-SHA256 signature verification (`x-shopify-hmac-sha256` header)

### Telegram Webhook
- **URL:** `POST /api/integrations/webhooks/telegram/:companyId`
- **Handles:** Messages, callback queries, inline keyboards
- **Set webhook:** Telegram Bot API `setWebhook` with URL `https://aithor1.vercel.app/api/integrations/webhooks/telegram/<companyId>`

---

## Error Response Format

```json
{
  "error": "Error message description",
  "details": "Optional detailed error info"
}
```

## Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / Missing / Invalid fields |
| `401` | Unauthorized / No token |
| `403` | Forbidden / Unauthorized domain |
| `404` | Not found |
| `429` | Too many requests (rate limited) |
| `500` | Server error |

## Rate Limiting

- **General API:** 5,000 requests per 15 minutes per IP
- **Login endpoints:** 100 attempts per 15 minutes per IP

---

## CORS

Allowed origins include:
- `http://localhost:5173`
- `https://voxio-v1.vercel.app`
- `https://voxio0.vercel.app`
- `https://aithor1.vercel.app`
- `https://aithor2.vercel.app`
- Any `*.vercel.app` domain

---

*Generated from VOXIO backend routes · API version 1.0*
