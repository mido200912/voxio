import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import './Docs.css';

const sections = [
  { id: 'overview',       fa: 'fa-compass',        en: 'Overview',            ar: 'نظرة عامة' },
  { id: 'quickstart',    fa: 'fa-bolt',           en: 'Quick Start',          ar: 'البداية السريعة' },
  { id: 'authentication',fa: 'fa-lock',           en: 'Authentication',       ar: 'المصادقة' },
  { id: 'public-chat',   fa: 'fa-comments',       en: 'Public Chat API',      ar: 'Chat API العام' },
  { id: 'company',       fa: 'fa-building',       en: 'Company Endpoints',    ar: 'نقاط نهاية الشركة' },
  { id: 'integrations',  fa: 'fa-plug',           en: 'Integrations',         ar: 'التكاملات' },
  { id: 'webhooks',      fa: 'fa-satellite-dish', en: 'Webhooks',             ar: 'Webhooks' },
  { id: 'errors',        fa: 'fa-triangle-exclamation', en: 'Error Codes',   ar: 'أكواد الأخطاء' },
  { id: 'sdks',          fa: 'fa-box',            en: 'SDKs & Examples',      ar: 'SDKs والأمثلة' },
];

const Docs = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [active, setActive] = useState('overview');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    setActive(id);
  };

  useEffect(() => {
    const onScroll = () => {
      for (const s of [...sections].reverse()) {
        const el = document.getElementById(s.id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActive(s.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const t = (en, ar) => (isAr ? ar : en);

  return (
    <div className="docs-page" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ─── TOP NAV BAR ─── */}
      <nav className="docs-topbar">
        <Link to="/" className="docs-logo">
          <img src="/logo.png" alt="VOXIO" />
          <span>VOXIO</span>
        </Link>
        <div className="docs-topbar-right">
          <span className="docs-version-badge">v1.0</span>
          <a href="mailto:voxio049@gmail.com" className="docs-contact-link">
            {t('Support', 'الدعم')}
          </a>
        </div>
      </nav>

      <div className="docs-layout">
        {/* ─── SIDEBAR ─── */}
        <aside className="docs-sidebar">
          <p className="docs-sidebar-label">{t('Documentation', 'التوثيق')}</p>
          <nav className="docs-sidebar-nav">
            {sections.map(s => (
              <button
                key={s.id}
                className={`docs-sidebar-item ${active === s.id ? 'active' : ''}`}
                onClick={() => scrollTo(s.id)}
              >
                <i className={`fas ${s.fa} docs-sidebar-icon`} />
                <span>{isAr ? s.ar : s.en}</span>
                {active === s.id && <span className="docs-sidebar-indicator" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="docs-main">

          {/* ══ OVERVIEW ══ */}
          <section id="overview" className="docs-section">
            <div className="docs-section-hero">
              <div className="docs-hero-badge"><i className="fas fa-compass" /> {t('Overview', 'نظرة عامة')}</div>
              <h1>{t('Welcome to VOXIO API', 'مرحباً بك في VOXIO API')}</h1>
              <p className="docs-lead">
                {t(
                  'VOXIO is an AI-powered customer communication platform. It lets you train a smart chatbot on your own company data, then deploy it across WhatsApp, Facebook, Instagram, Shopify, and your own website — all through a single unified API.',
                  'VOXIO منصة ذكاء اصطناعي لإدارة تواصل الشركات مع العملاء. تتيح لك تدريب بوت ذكي على بيانات شركتك ونشره عبر WhatsApp وFacebook وInstagram وShopify وموقعك الخاص — كل ذلك من خلال API موحد واحد.'
                )}
              </p>
              <div className="docs-cta-row">
                <button className="docs-btn-primary" onClick={() => scrollTo('quickstart')}>
                  <i className="fas fa-bolt" /> {t('Quick Start', 'البداية السريعة')}
                </button>
                <button className="docs-btn-secondary" onClick={() => scrollTo('authentication')}>
                  <i className="fas fa-lock" /> {t('Authentication', 'المصادقة')}
                </button>
              </div>
            </div>

            <div className="docs-cards-grid">
              {[
                { fa: 'fa-robot',        title: t('AI Chatbot', 'بوت ذكي'),               desc: t('Powered by Meta Llama 3.3 70B via OpenRouter, your bot learns your company context deeply.', 'مدعوم بـ Meta Llama 3.3 70B عبر OpenRouter، يتعلم البوت سياق شركتك بعمق.') },
                { fa: 'fa-network-wired',title: t('Multi-Channel', 'متعدد القنوات'),        desc: t('One API powering WhatsApp, Facebook Messenger, Instagram DMs, Shopify, and web widgets.', 'API واحد يشغّل WhatsApp وFacebook وInstagram وShopify وودجت الموقع.') },
                { fa: 'fa-chart-line',   title: t('Analytics Dashboard', 'لوحة التحليلات'), desc: t('Monitor all conversations, measure AI resolution rate, and take over chats manually.', 'راقب كل المحادثات وقس معدل الحل بالذكاء الاصطناعي وتولَّ المحادثات يدوياً.') },
                { fa: 'fa-shield-halved',title: t('Secure by Design', 'آمن بالتصميم'),      desc: t('JWT auth, bcrypt-hashed passwords, HMAC webhook verification, and per-company API keys.', 'مصادقة JWT، كلمات مرور مشفرة بـ bcrypt، تحقق HMAC للـ webhooks، ومفاتيح API لكل شركة.') },
              ].map((card, i) => (
                <div key={i} className="docs-feature-card">
                  <div className="docs-feature-icon"><i className={`fas ${card.fa}`} /></div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ══ QUICK START ══ */}
          <section id="quickstart" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-bolt" /></div>
              <div>
                <h2>{t('Quick Start', 'البداية السريعة')}</h2>
                <p>{t('Get your AI chatbot running in 4 steps.', 'شغّل بوتك الذكي في 4 خطوات سريعة.')}</p>
              </div>
            </div>

            <div className="docs-steps">
              {[
                {
                  num: '01',
                  title: t('Register & Get API Key', 'سجّل واحصل على مفتاح API'),
                  desc: t('Create a free account, complete onboarding, and copy your API Key from Settings → API Key.', 'أنشئ حساباً مجانياً، أكمل الإعداد الأولي، وانسخ مفتاح الـ API من الإعدادات.'),
                  action: t('Go to Register', 'سجّل الآن'),
                  link: '/register',
                },
                {
                  num: '02',
                  title: t('Train Your Bot', 'درّب البوت'),
                  desc: t('Upload PDFs, DOCX, or TXT files about your company. The AI extracts and learns from your content automatically.', 'ارفع ملفات PDF أو DOCX أو TXT عن شركتك. الذكاء الاصطناعي يستخرج المعلومات ويتعلم منها تلقائياً.'),
                  action: t('Go to AI Training', 'الذهاب للتدريب'),
                  link: '/dashboard/ai-training',
                },
                {
                  num: '03',
                  title: t('Test Your Bot', 'اختبر البوت'),
                  desc: t('Use the Model Test page in the dashboard to chat with your trained bot and verify it responds correctly.', 'استخدم صفحة اختبار النموذج في لوحة التحكم للتحدث مع البوت والتحقق من ردوده.'),
                  action: t('Open Model Test', 'اختبار النموذج'),
                  link: '/dashboard/model-test',
                },
                {
                  num: '04',
                  title: t('Embed or Integrate', 'ادمج أو اربط'),
                  desc: t('Embed the chat widget on your site using your API key, or connect WhatsApp / Facebook from the Integrations page.', 'ادمج ودجت المحادثة في موقعك باستخدام مفتاح الـ API، أو اربط WhatsApp/Facebook من صفحة التكاملات.'),
                  action: t('See Integrations', 'رؤية التكاملات'),
                  link: '/dashboard/integrations',
                },
              ].map((step) => (
                <div key={step.num} className="docs-step">
                  <div className="docs-step-num">{step.num}</div>
                  <div className="docs-step-body">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                    <Link to={step.link} className="docs-step-link">{step.action} →</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ AUTHENTICATION ══ */}
          <section id="authentication" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-lock" /></div>
              <div>
                <h2>{t('Authentication', 'المصادقة')}</h2>
                <p>{t('VOXIO uses two separate auth systems depending on the endpoint type.', 'يستخدم VOXIO نظامين مختلفين للمصادقة حسب نوع الـ endpoint.')}</p>
              </div>
            </div>

            <div className="docs-auth-grid">
              <div className="docs-auth-card">
                <div className="docs-auth-badge jwt">JWT</div>
                <h3>{t('JWT Bearer Token (Dashboard)', 'JWT Bearer Token (لوحة التحكم)')}</h3>
                <p>{t('Required for all dashboard operations (company settings, AI training, inbox, etc.).', 'مطلوب لكل عمليات لوحة التحكم (إعدادات الشركة، التدريب، الرسائل، إلخ).')}</p>
                <div className="docs-code-block">
                  <div className="docs-code-header">
                    <span>POST /api/auth/login</span>
                  </div>
                  <pre>{`// Request
{
  "email": "you@company.com",
  "password": "••••••••"
}

// Response
{
  "user": { "id": "...", "name": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}`}</pre>
                </div>
                <div className="docs-code-block">
                  <div className="docs-code-header"><span>{t('Usage', 'الاستخدام')}</span></div>
                  <pre>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}</pre>
                </div>
              </div>

              <div className="docs-auth-card">
                <div className="docs-auth-badge apikey">API KEY</div>
                <h3>{t('API Key (Public Chat)', 'مفتاح API (المحادثة العامة)')}</h3>
                <p>{t('Used when embedding the chat widget externally. No user login needed.', 'يُستخدم عند تضمين ودجت المحادثة خارجياً. لا يحتاج تسجيل دخول.')}</p>
                <div className="docs-code-block">
                  <div className="docs-code-header"><span>{t('Get your key from', 'احصل على مفتاحك من')} Settings → API Key</span></div>
                  <pre>{`// Format: 48-character hex string
"apiKey": "a1b2c3d4e5f6..."

// Send in request body
{
  "apiKey": "a1b2c3d4e5f6...",
  "message": "Hello!"
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* ══ PUBLIC CHAT API ══ */}
          <section id="public-chat" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-comments" /></div>
              <div>
                <h2>{t('Public Chat API', 'Chat API العام')}</h2>
                <p>{t('The core endpoint powering your AI chatbot. No user auth required — just your API key.', 'نقطة النهاية الأساسية لتشغيل بوتك الذكي. لا تحتاج مصادقة مستخدم — فقط مفتاح الـ API.')}</p>
              </div>
            </div>

            <div className="docs-endpoint">
              <div className="docs-endpoint-header">
                <span className="docs-method post">POST</span>
                <span className="docs-path">/api/public/chat</span>
                <button className="docs-copy-btn" onClick={() => navigator.clipboard?.writeText('/api/public/chat')}>Copy</button>
              </div>
              <div className="docs-endpoint-body">
                <div className="docs-params">
                  <h4>{t('Request Body', 'جسم الطلب')}</h4>
                  <table className="docs-table">
                    <thead><tr><th>{t('Field', 'الحقل')}</th><th>{t('Type', 'النوع')}</th><th>{t('Required', 'مطلوب')}</th><th>{t('Description', 'الوصف')}</th></tr></thead>
                    <tbody>
                      <tr><td><code>apiKey</code></td><td>string</td><td className="req">✅</td><td>{t('Your company API key from Settings.', 'مفتاح شركتك من الإعدادات.')}</td></tr>
                      <tr><td><code>message</code></td><td>string</td><td className="req">✅</td><td>{t("The user's message / question.", 'رسالة المستخدم / السؤال.')}</td></tr>
                      <tr><td><code>conversationId</code></td><td>string</td><td>—</td><td>{t('Optional. Keeps context across messages.', 'اختياري. يحتفظ بالسياق عبر الرسائل.')}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="docs-code-block">
                  <div className="docs-code-header"><span>cURL</span></div>
                  <pre>{`curl -X POST https://aithor1.vercel.app/api/public/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "YOUR_API_KEY",
    "message": "What products do you offer?",
    "conversationId": "user-session-123"
  }'`}</pre>
                </div>
                <div className="docs-code-block">
                  <div className="docs-code-header"><span>JavaScript (fetch)</span></div>
                  <pre>{`const res = await fetch('https://aithor1.vercel.app/api/public/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'YOUR_API_KEY',
    message: 'What is your return policy?',
  }),
});
const { reply } = await res.json();
console.log(reply); // AI response`}</pre>
                </div>
                <div className="docs-code-block success">
                  <div className="docs-code-header"><span><i className="fas fa-circle-check" style={{color:'#22c55e'}} /> {t('Response 200', 'الاستجابة 200')}</span></div>
                  <pre>{`{
  "reply": "Our return policy allows returns within 30 days...",
  "conversationId": "user-session-123"
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* ══ COMPANY ENDPOINTS ══ */}
          <section id="company" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-building" /></div>
              <div>
                <h2>{t('Company Endpoints', 'نقاط نهاية الشركة')}</h2>
                <p>{t('Manage your company profile, training data, and API key.', 'إدارة ملف شركتك وبيانات التدريب ومفتاح الـ API.')}</p>
              </div>
            </div>

            {[
              { method: 'GET',   path: '/api/company',         desc: t('Get your company profile', 'جلب ملف شركتك'), auth: 'JWT' },
              { method: 'POST',  path: '/api/company',         desc: t('Create / update company profile', 'إنشاء أو تحديث ملف الشركة'), auth: 'JWT' },
              { method: 'GET',   path: '/api/company/apikey',  desc: t('Retrieve your API key', 'استرجاع مفتاح الـ API'), auth: 'JWT' },
              { method: 'GET',   path: '/api/company/analytics', desc: t('Dashboard analytics (conversations, AI rate)', 'تحليلات لوحة التحكم'), auth: 'JWT' },
              { method: 'POST',  path: '/api/ai/upload',       desc: t('Upload PDF/DOCX/TXT to train bot', 'رفع ملف PDF/DOCX/TXT لتدريب البوت'), auth: 'JWT' },
              { method: 'POST',  path: '/api/ai/custom-instructions', desc: t('Save custom bot instructions', 'حفظ تعليمات البوت المخصصة'), auth: 'JWT' },
            ].map((ep, i) => (
              <div key={i} className="docs-endpoint-row">
                <span className={`docs-method ${ep.method.toLowerCase()}`}>{ep.method}</span>
                <code className="docs-path-inline">{ep.path}</code>
                <span className="docs-ep-desc">{ep.desc}</span>
                <span className="docs-auth-tag">{ep.auth}</span>
              </div>
            ))}
          </section>

          {/* ══ INTEGRATIONS ══ */}
          <section id="integrations" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-plug" /></div>
              <div>
                <h2>{t('Integrations', 'التكاملات')}</h2>
                <p>{t('Connect VOXIO to your existing communication channels.', 'اربط VOXIO بقنواتك التواصلية الحالية.')}</p>
              </div>
            </div>

            <div className="docs-integrations-grid">
              {[
                { name: 'Facebook Messenger', icon: '🔵', status: t('Coming Soon', 'قريباً'), color: '#1877f2', desc: t('Auto-reply to page messages with your AI.', 'رد تلقائي على رسائل صفحتك بالذكاء الاصطناعي.') },
                { name: 'WhatsApp Business', icon: '🟢', status: t('Coming Soon', 'قريباً'), color: '#25d366', desc: t('AI-powered WhatsApp bot for business accounts.', 'بوت WhatsApp مدعوم بالذكاء الاصطناعي لحسابات البيزنس.') },
                { name: 'Instagram DMs', icon: '🟣', status: t('Coming Soon', 'قريباً'), color: '#e4405f', desc: t('Handle Instagram direct messages automatically.', 'معالجة رسائل Instagram المباشرة تلقائياً.') },
                { name: 'Shopify', icon: '🟡', status: t('Coming Soon', 'قريباً'), color: '#96bf48', desc: t('Connect store data — products, orders, FAQs.', 'ربط بيانات المتجر — المنتجات والطلبات والأسئلة الشائعة.') },
                { name: 'TikTok', icon: '⚫', status: t('Coming Soon', 'قريباً'), color: '#010101', desc: t('Manage TikTok messages through one dashboard.', 'إدارة رسائل TikTok من لوحة تحكم واحدة.') },
                { name: 'Website Widget', icon: '🌐', status: t('Available', 'متاح'), color: '#6C63FF', desc: t('Embed VOXIO chat widget on any page with one script tag.', 'ادمج ودجت VOXIO في أي صفحة بسطر واحد من الكود.') },
              ].map((int, i) => (
                <div key={i} className="docs-int-card">
                  <div className="docs-int-top">
                    <span style={{ fontSize: '2rem' }}>{int.icon}</span>
                    <span className={`docs-int-status ${int.status === 'Available' || int.status === 'متاح' ? 'available' : 'soon'}`}>
                      {int.status}
                    </span>
                  </div>
                  <h4>{int.name}</h4>
                  <p>{int.desc}</p>
                </div>
              ))}
            </div>

            <div className="docs-callout info">
              <i className="fas fa-circle-info" />
              <p>{t('Integration endpoints use OAuth flows. Redirect your user to the connect URL, and VOXIO handles the rest.', 'نقاط نهاية التكاملات تستخدم تدفقات OAuth. وجّه مستخدمك لرابط الاتصال، وسيتولى VOXIO الباقي.')}</p>
            </div>
          </section>

          {/* ══ WEBHOOKS ══ */}
          <section id="webhooks" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-satellite-dish" /></div>
              <div>
                <h2>{t('Webhooks', 'Webhooks')}</h2>
                <p>{t('VOXIO receives real-time events from connected platforms via webhooks.', 'يستقبل VOXIO الأحداث الفورية من المنصات المتصلة عبر webhooks.')}</p>
              </div>
            </div>

            <div className="docs-endpoint-row">
              <span className="docs-method get">GET</span>
              <code className="docs-path-inline">/api/webhooks/meta</code>
              <span className="docs-ep-desc">{t('Meta webhook verification (GET) + message handling (POST)', 'التحقق من webhook الـ Meta (GET) + معالجة الرسائل (POST)')}</span>
              <span className="docs-auth-tag">HMAC</span>
            </div>
            <div className="docs-endpoint-row">
              <span className="docs-method post">POST</span>
              <code className="docs-path-inline">/api/webhooks/shopify</code>
              <span className="docs-ep-desc">{t('Shopify order/product event handler', 'معالج أحداث Shopify للطلبات والمنتجات')}</span>
              <span className="docs-auth-tag">HMAC</span>
            </div>

            <div className="docs-callout warning">
              <i className="fas fa-triangle-exclamation" />
              <p>{t('All webhook requests are verified using HMAC signatures to prevent spoofing. Raw body parsing is applied before JSON parsing for webhook routes only.', 'جميع طلبات الـ webhook تُتحقق منها بتواقيع HMAC لمنع الانتحال. يُطبَّق تحليل Raw Body قبل JSON فقط على مسارات الـ webhook.')}</p>
            </div>
          </section>

          {/* ══ ERROR CODES ══ */}
          <section id="errors" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-triangle-exclamation" /></div>
              <div>
                <h2>{t('Error Codes', 'أكواد الأخطاء')}</h2>
                <p>{t('All errors return a structured JSON response.', 'جميع الأخطاء تعيد استجابة JSON منظمة.')}</p>
              </div>
            </div>

            <table className="docs-table">
              <thead>
                <tr><th>{t('Status', 'الحالة')}</th><th>{t('Code', 'الكود')}</th><th>{t('Cause', 'السبب')}</th><th>{t('Fix', 'الحل')}</th></tr>
              </thead>
              <tbody>
                {[
                  { status: '400', code: 'BAD_REQUEST',        cause: t('Missing required fields', 'حقول مطلوبة ناقصة'),                     fix: t('Check the request body.', 'راجع جسم الطلب.') },
                  { status: '401', code: 'UNAUTHORIZED',       cause: t('Missing or invalid JWT token', 'JWT مفقود أو غير صالح'),             fix: t('Re-login and use fresh token.', 'سجّل الدخول مجدداً.')  },
                  { status: '403', code: 'FORBIDDEN',          cause: t('Invalid API key', 'مفتاح API غير صالح'),                            fix: t('Check your API key in Settings.', 'راجع مفتاح الـ API في الإعدادات.') },
                  { status: '404', code: 'NOT_FOUND',          cause: t('Resource not found', 'المورد غير موجود'),                            fix: t('Check the endpoint path.', 'راجع مسار الـ endpoint.') },
                  { status: '500', code: 'SERVER_ERROR',       cause: t('Unexpected server error (often AI service timeout)', 'خطأ بالسيرفر (كثيراً يكون timeout من خدمة الـ AI)'), fix: t('Wait and retry. Check AI service quota.', 'انتظر وأعد المحاولة. راجع حصة خدمة الـ AI.') },
                ].map((r, i) => (
                  <tr key={i}>
                    <td><span className={`docs-status-code ${r.status.startsWith('4') || r.status.startsWith('5') ? 'error' : 'ok'}`}>{r.status}</span></td>
                    <td><code>{r.code}</code></td>
                    <td>{r.cause}</td>
                    <td>{r.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="docs-code-block">
              <div className="docs-code-header"><span>{t('Error Response Format', 'تنسيق رسالة الخطأ')}</span></div>
              <pre>{`{
  "error": "Company not found"
  // or for validation errors:
  "message": "Password must be at least 8 characters"
}`}</pre>
            </div>
          </section>

          {/* ══ SDKs ══ */}
          <section id="sdks" className="docs-section">
            <div className="docs-section-header">
              <div className="docs-section-icon"><i className="fas fa-box" /></div>
              <div>
                <h2>{t('SDKs & Code Examples', 'SDKs والأمثلة البرمجية')}</h2>
                <p>{t('Ready-to-use snippets in different languages and frameworks.', 'مقاطع جاهزة للاستخدام بلغات وأطر عمل مختلفة.')}</p>
              </div>
            </div>

            <div className="docs-code-block">
              <div className="docs-code-header"><span>HTML — {t('Embed Chat Widget (Fastest)', 'تضمين ودجت المحادثة (الأسرع)')}</span></div>
              <p style={{ padding: '0 15px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                {t('Simply paste this script before the closing </body> tag. It will inject a floating chat button at the bottom right corner.', 'الصق هذا الكود قبل وسم </body> في موقعك. سيقوم تلقائياً بإضافة زر محادثة عائم في الزاوية السفلى.')}
              </p>
              <pre>{`<!-- VOXIO Web Widget -->
<script 
  src="https://voxio-v1.vercel.app/widget.js" 
  data-api-key="YOUR_API_KEY"
  data-base-url="https://voxio-v1.vercel.app"
  async
></script>
`}</pre>
            </div>

            <div className="docs-code-block">
              <div className="docs-code-header"><span>Python</span></div>
              <pre>{`import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://aithor1.vercel.app/api"

def chat(message, conversation_id=None):
    payload = {
        "apiKey": API_KEY,
        "message": message,
    }
    if conversation_id:
        payload["conversationId"] = conversation_id
    
    res = requests.post(f"{BASE_URL}/public/chat", json=payload)
    return res.json()["reply"]

# Usage
reply = chat("What products do you offer?")
print(reply)`}</pre>
            </div>

            <div className="docs-code-block">
              <div className="docs-code-header"><span>React Hook</span></div>
              <pre>{`import { useState } from 'react';

export function useVOXIOChat(apiKey) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text }]);
    
    const res = await fetch('https://aithor1.vercel.app/api/public/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, message: text }),
    });
    const { reply } = await res.json();
    
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    setLoading(false);
  };

  return { messages, loading, sendMessage };
}`}</pre>
            </div>

            <div className="docs-callout success">
              <i className="fas fa-circle-check" />
              <div>
                <strong>{t('Need help?', 'تحتاج مساعدة؟')}</strong>
                <p>{t('Contact our team at ', 'تواصل مع فريقنا على ')}
                  <a href="mailto:voxio049@gmail.com" style={{ color: 'var(--color-text)' }}>voxio049@gmail.com</a>
                  {t(' — we reply within 24 hours.', ' — نرد خلال 24 ساعة.')}
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Docs;
