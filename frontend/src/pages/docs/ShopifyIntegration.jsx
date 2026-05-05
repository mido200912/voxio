import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSEO } from '../../hooks/useSEO';

const ShopifyIntegration = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  useSEO({
    title: t('VOXIO Docs | Shopify API Integration', 'توثيق VOXIO | ربط متجر شوبيفاي Shopify API'),
    description: t('Learn how to integrate your Shopify store with VOXIO using Webhooks and API to automate customer service, handle abandoned carts, and increase sales.', 'تعلم كيفية ربط متجر شوبيفاي بمنصة Voxio باستخدام Webhooks و API لتفعيل الرد الآلي واستعادة السلات المتروكة.'),
    keywords: 'Shopify API integration, Automation flow, Customer engagement, Webhooks, VOXIO Shopify, ربط شوبيفاي, بوت شوبيفاي',
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": t('Shopify Integration Docs', 'توثيق الربط التلقائي بين Shopify و Voxio'),
      "description": t('Technical guide for developers and store owners to integrate Shopify with VOXIO.', 'دليل تقني لربط Shopify مع Voxio لأتمتة خدمة العملاء والمبيعات.'),
      "author": { "@type": "Organization", "name": "VOXIO" },
      "articleSection": "Documentation"
    }
  });

  return (
    <section className="docs-section" style={{ padding: '0' }}>
      <div className="docs-section-header" style={{ marginBottom: '2rem' }}>
        <div className="docs-section-icon" style={{ background: '#96bf48', color: '#fff' }}><i className="fab fa-shopify" /></div>
        <div>
          <h2>{t('Shopify Integration Guide', 'دليل شامل لربط متجر Shopify API')}</h2>
          <p>
            <span className="docs-int-status soon" style={{ display: 'inline-block', marginBottom: '8px', padding: '4px 8px', background: '#d9770620', color: '#d97706', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {t('Coming Soon', 'قريباً')}
            </span>
            <br/>
            {t('Automate your customer service and recover abandoned carts seamlessly. (Currently in Development)', 'قم بأتمتة خدمة عملائك واستعادة السلات المتروكة بسلاسة. (قيد التطوير حالياً)')}
          </p>
        </div>
      </div>

      <div className="docs-text-content">
        <p className="docs-lead">
          {t('In the competitive e-commerce landscape, manual interactions are no longer viable. Integrating Shopify API with VOXIO is the technical solution to accelerate responses and recover abandoned carts.', 'في عالم التجارة الإلكترونية المليء بالتنافسية، لم يعد التفاعل اليدوي مع العملاء خياراً قابلاً للتطبيق لنمو الأعمال. إذا كنت تبحث عن طريقة لتسريع الردود واستعادة السلات المتروكة، فإن ربط Shopify API بمنصة Voxio هو الحل التقني الأمثل لك.')}
        </p>

        <h3>{t('How VOXIO Solves Delayed Responses', 'كيف يحل Voxio مشكلة تأخر الردود وفقدان المبيعات؟')}</h3>
        <p>
          {t('VOXIO acts as an AI core linking your store and your customers. Through seamless API integration, VOXIO captures events the moment they occur in your store and triggers automated responses.', 'يعاني العديد من أصحاب متاجر شوبيفاي من تسرب العملاء بسبب التأخر في الرد. من خلال الـ API integration السلس، يقوم Voxio بالتقاط الأحداث (Events) فور وقوعها في متجرك ويقوم بتشغيل ردود فعل تلقائية.')}
        </p>

        <h4>{t('Technical Benefits', 'أبرز الفوائد التقنية للربط:')}</h4>
        <ul style={{ marginLeft: isAr ? '0' : '20px', marginRight: isAr ? '20px' : '0', marginBottom: '2rem' }}>
          <li><strong>{t('Real-time Sync:', 'تحديثات لحظية (Real-time Sync):')}</strong> {t('Capture Checkout and Order events in milliseconds.', 'التقاط أحداث الـ Checkout والـ Order Creation في أجزاء من الثانية.')}</li>
          <li><strong>{t('Data Security:', 'تأمين البيانات:')}</strong> {t('HMAC Signature Validation to guarantee request authenticity.', 'نعتمد على التوقيع الرقمي (HMAC Signature) لضمان موثوقية الطلبات.')}</li>
          <li><strong>{t('Omnichannel:', 'توسيع القنوات:')}</strong> {t('Deliver store messages via WhatsApp and Facebook Messenger.', 'توصيل رسائل متجرك عبر قنوات كـ WhatsApp و Messenger.')}</li>
        </ul>

        <h3>{t('Step 1: Setup Shopify Webhooks', 'الخطوة 1: إعداد الـ Webhooks في متجر Shopify')}</h3>
        <p>{t('Configuring the Webhook is essential to let VOXIO know when an order or cart event happens.', 'إعداد الـ Webhook أساسي لكي يعلم VOXIO عند حدوث أي حدث في متجرك (مثل إضافة منتج للسلة).')}</p>
        
        <img src="/docs-assets/shopify_webhook.png" alt="Shopify Webhook Settings" className="docs-image" />

        <ol style={{ marginLeft: isAr ? '0' : '20px', marginRight: isAr ? '20px' : '0', marginBottom: '2rem' }}>
          <li>{t('Go to Settings > Notifications in Shopify, scroll to Webhooks.', 'اذهب إلى Settings > Notifications في شوبيفاي، وانزل للأسفل حتى Webhooks.')}</li>
          <li>{t('Click Create Webhook.', 'اضغط على Create Webhook.')}</li>
          <li>{t('Select Event (e.g. Order creation).', 'في حقل الـ Event، اختر Order creation أو Cart creation.')}</li>
          <li>{t('Select Format: JSON.', 'في حقل الـ Format، اختر JSON.')}</li>
          <li>{t('URL Endpoint: ', 'في حقل الـ URL، أدخل الرابط: ')} <code>https://api.voxio.com/v1/integrations/webhooks/shopify</code></li>
        </ol>

        <h3>{t('Step 2: Signature Verification (Code Example)', 'الخطوة 2: توثيق وتأمين استقبال البيانات')}</h3>
        <p>
          {t('To prevent spoofing, our servers verify the signature using the x-shopify-hmac-sha256 header. Here is a Node.js snippet demonstrating this:', 'لمنع الطلبات المزيفة، يتحقق خادمنا من التوقيع المرفق مع كل طلب. إليك مثال يوضح كيف يعمل معالج البيانات لدينا (Node.js):')}
        </p>
        
        <div className="docs-code-block">
          <div className="docs-code-header"><span>Node.js / Express</span></div>
          <pre>{`const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
    const shopifySignature = req.headers['x-shopify-hmac-sha256'];
    const shopifySecret = process.env.SHOPIFY_API_SECRET;

    const generatedHash = crypto
        .createHmac('sha256', shopifySecret)
        .update(req.rawBody, 'utf8')
        .digest('base64');

    if (generatedHash === shopifySignature) {
        next(); // Proceed
    } else {
        res.status(401).send('Unauthorized Webhook Request');
    }
}`}</pre>
        </div>

        <div className="docs-callout info" style={{ marginTop: '2rem' }}>
          <i className="fas fa-circle-info" />
          <p>{t('Need to connect multiple stores? VOXIO supports multiple instances. Just create a new Integration Agent for each store.', 'هل تريد ربط عدة متاجر؟ يدعم Voxio ذلك، فقط قم بإنشاء نقطة اتصال (Integration Agent) لكل متجر.')}</p>
        </div>
      </div>
    </section>
  );
};

export default ShopifyIntegration;
