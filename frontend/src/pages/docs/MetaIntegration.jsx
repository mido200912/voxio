import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSEO } from '../../hooks/useSEO';

const MetaIntegration = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  useSEO({
    title: t('VOXIO Docs | Meta Integration (WhatsApp, Facebook, Instagram)', 'توثيق VOXIO | ربط ميتا (واتساب، فيسبوك، إنستجرام)'),
    description: t('Comprehensive guide on integrating Meta APIs including WhatsApp Business API, Facebook Messenger, and Instagram Direct with VOXIO AI.', 'دليل شامل لربط واجهات ميتا البرمجية (واتساب بيزنس، ماسنجر، إنستجرام) مع روبوتات الذكاء الاصطناعي في Voxio.'),
    keywords: 'WhatsApp API integration, Facebook Messenger Bot, Instagram DM Automation, Meta Graph API, VOXIO Meta, ربط واتساب بيزنس, أتمتة رسائل فيسبوك',
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": t('Meta API Integration Guide', 'دليل ربط واجهات Meta البرمجية'),
      "description": t('Learn how to connect Meta platforms with VOXIO.', 'تعلم كيفية توصيل منصات Meta بـ VOXIO.'),
      "author": { "@type": "Organization", "name": "VOXIO" },
      "articleSection": "Documentation"
    }
  });

  return (
    <section className="docs-section" style={{ padding: '0' }}>
      <div className="docs-section-header" style={{ marginBottom: '2rem' }}>
        <div className="docs-section-icon" style={{ background: 'linear-gradient(45deg, #1877F2, #25D366, #E4405F)' }}>
          <i className="fab fa-meta" style={{ color: '#fff' }} />
        </div>
        <div>
          <h2>{t('Meta Integration Guide', 'دليل ربط Meta (واتساب، فيسبوك، إنستجرام)')}</h2>
          <p>{t('Unify your Meta communication channels under one AI-powered brain.', 'وحد قنوات التواصل الخاصة بـ Meta تحت عقل ذكي واحد.')}</p>
        </div>
      </div>

      <div className="docs-text-content">
        <p className="docs-lead">
          {t('With VOXIO, you do not need to build separate bots for WhatsApp, Messenger, and Instagram. By connecting your Meta App to our unified Webhook, a single AI agent can seamlessly handle thousands of conversations across all platforms simultaneously.', 'مع Voxio، لن تحتاج لبناء بوتات منفصلة لكل منصة. بربط تطبيق ميتا الخاص بك بالـ Webhook الموحد لدينا، سيتمكن وكيل ذكاء اصطناعي واحد من إدارة آلاف المحادثات عبر جميع منصات ميتا في وقت واحد.')}
        </p>

        <h3>{t('Connecting WhatsApp Business API', 'ربط WhatsApp Business API')}</h3>
        <p>
          {t('VOXIO leverages the official Cloud API by Meta. This means no QR codes, no phone disconnections, and 100% stable message delivery.', 'يعتمد Voxio على الـ Cloud API الرسمي من Meta، مما يعني استقراراً تاماً وتجنب الحظر.')}
        </p>
        <ol style={{ marginLeft: isAr ? '0' : '20px', marginRight: isAr ? '20px' : '0', marginBottom: '2rem', lineHeight: '1.8' }}>
          <li><strong>{t('Create App:', 'إنشاء التطبيق:')}</strong> {t('Navigate to Meta for Developers and create a Business App.', 'اذهب إلى موقع مطوري ميتا (Meta for Developers) وقم بإنشاء تطبيق من نوع Business.')}</li>
          <li><strong>{t('Add Product:', 'إضافة المنتج:')}</strong> {t('Add the WhatsApp product and configure your business phone number.', 'قم بإضافة منتج الواتساب (WhatsApp) وإعداد رقم هاتفك التجاري.')}</li>
          <li><strong>{t('Get Token:', 'الحصول على التوكن:')}</strong> {t('Generate a Permanent Access Token from System Users in Business Settings.', 'من إعدادات مدير الأعمال (Business Settings)، أنشئ مستخدم نظام (System User) واستخرج منه توكن وصول دائم (Permanent Access Token).')}</li>
          <li><strong>{t('Configure Webhook:', 'ضبط الـ Webhook:')}</strong> {t('In WhatsApp configuration, set the Webhook URL to: ', 'في إعدادات واتساب في التطبيق، اضبط رابط الـ Webhook إلى: ')} <code>https://api.voxio.com/v1/webhooks/meta</code></li>
          <li><strong>{t('Verification Token:', 'توكن التحقق:')}</strong> {t('Use the custom Verify Token provided in your VOXIO Dashboard.', 'استخدم توكن التحقق (Verify Token) الموجود في لوحة تحكم VOXIO الخاصة بك.')}</li>
          <li><strong>{t('Subscribe:', 'الاشتراك في الأحداث:')}</strong> {t('Subscribe to the "messages" webhook field to start receiving data.', 'اشترك في حقل "messages" لتبدأ باستقبال الرسائل.')}</li>
        </ol>

        <img src="/docs-assets/meta_dashboard.png" alt="Meta Developer Dashboard" className="docs-image" />

        <h3>{t('Connecting Messenger & Instagram', 'ربط Messenger و Instagram')}</h3>
        <p>
          {t('The process is nearly identical for Messenger and Instagram Direct.', 'العملية مطابقة تقريباً لربط ماسنجر وإنستجرام.')}
        </p>
        <ul style={{ marginLeft: isAr ? '0' : '20px', marginRight: isAr ? '20px' : '0', marginBottom: '2rem' }}>
          <li>{t('For Instagram, ensure your IG Professional account is linked to your Facebook Page.', 'لإنستجرام، تأكد من ربط حساب IG بصفحة الفيسبوك.')}</li>
          <li>{t('Enable "Allow access to messages" in IG privacy settings.', 'قم بتفعيل "السماح بالوصول للرسائل" من إعدادات خصوصية إنستجرام.')}</li>
          <li>{t('Add the Messenger product in your Meta App, and subscribe to "messages" and "messaging_postbacks".', 'أضف منتج Messenger واشترك في الأحداث المخصصة.')}</li>
        </ul>

        <h3>{t('Webhook Verification Process', 'عملية التحقق من الـ Webhook')}</h3>
        <p>
          {t('Meta requires a verification process (GET request) before sending events (POST requests). VOXIO handles this automatically. Here is the internal logic:', 'تتطلب ميتا عملية تحقق (GET) قبل إرسال الأحداث. Voxio يتعامل مع هذا تلقائياً:')}
        </p>
        
        <div className="docs-code-block">
          <div className="docs-code-header"><span>Node.js / Express — Meta Webhook</span></div>
          <pre>{`app.get('/api/webhooks/meta', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});`}</pre>
        </div>

      </div>
    </section>
  );
};

export default MetaIntegration;
