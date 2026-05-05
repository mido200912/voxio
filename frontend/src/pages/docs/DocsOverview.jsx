import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSEO } from '../../hooks/useSEO';
import { Link } from 'react-router-dom';

const DocsOverview = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  useSEO({
    title: t('VOXIO Documentation | API & Integrations', 'توثيق VOXIO | واجهة البرمجة والتكاملات'),
    description: t('Official VOXIO documentation. Learn how to train your AI agent, integrate it into your apps, and deploy across multiple channels.', 'التوثيق الرسمي لمنصة VOXIO. تعلم كيفية تدريب وكيلك الذكي، دمجه في تطبيقاتك، ونشره عبر القنوات المتعددة.'),
    keywords: 'VOXIO API, AI chatbot API, LLM API docs, Conversational AI integration, توثيق API, أتمتة بالذكاء الاصطناعي',
  });

  return (
    <section className="docs-section" style={{ padding: '0' }}>
      <div className="docs-section-hero" style={{ padding: '0', background: 'transparent', textAlign: isAr ? 'right' : 'left' }}>
        <div className="docs-hero-badge" style={{ margin: isAr ? '0 0 1.5rem 0' : '0 0 1.5rem 0' }}><i className="fas fa-compass" /> {t('Overview', 'نظرة عامة')}</div>
        <h1>{t('Welcome to VOXIO API', 'مرحباً بك في VOXIO API')}</h1>
        <p className="docs-lead" style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 0 2rem 0' }}>
          {t(
            'VOXIO is an AI-powered customer communication platform. It lets you train a smart chatbot on your own company data, then deploy it across WhatsApp, Facebook, Instagram, Shopify, and your own website — all through a single unified API.',
            'VOXIO منصة ذكاء اصطناعي لإدارة تواصل الشركات مع العملاء. تتيح لك تدريب بوت ذكي على بيانات شركتك ونشره عبر WhatsApp وFacebook وInstagram وShopify وموقعك الخاص — كل ذلك من خلال API موحد واحد.'
          )}
        </p>
      </div>

      <div className="docs-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <Link to="/docs/meta" className="docs-feature-card docs-link-card">
          <div className="docs-feature-icon" style={{ background: '#e4f2ff', color: '#1877F2' }}><i className="fab fa-meta" /></div>
          <h3>{t('Meta Integration', 'ربط ميتا')}</h3>
          <p>{t('Connect WhatsApp Business API, Facebook Messenger, and Instagram DMs.', 'اربط واتساب بيزنس، وماسنجر، وإنستجرام.')}</p>
        </Link>
        <Link to="/docs/shopify" className="docs-feature-card docs-link-card">
          <div className="docs-feature-icon" style={{ background: '#f4fce3', color: '#96bf48' }}><i className="fab fa-shopify" /></div>
          <h3>{t('Shopify App', 'تطبيق شوبيفاي')}</h3>
          <p>{t('Sync your products, handle abandoned carts, and automate support.', 'زامن منتجاتك وأتمت خدمة الدعم لمتجرك.')}</p>
        </Link>
        <Link to="/docs/telegram" className="docs-feature-card docs-link-card">
          <div className="docs-feature-icon" style={{ background: '#e1f5fe', color: '#0088cc' }}><i className="fab fa-telegram" /></div>
          <h3>{t('Telegram Bot', 'بوت تيليجرام')}</h3>
          <p>{t('Deploy your trained AI agent to a Telegram bot instantly.', 'انشر وكيلك الذكي كبوت تيليجرام في ثوانٍ.')}</p>
        </Link>
        <Link to="/docs/widget" className="docs-feature-card docs-link-card">
          <div className="docs-feature-icon" style={{ background: '#f3e8ff', color: '#6C63FF' }}><i className="fas fa-window-maximize" /></div>
          <h3>{t('Website Widget', 'ودجت الموقع')}</h3>
          <p>{t('Embed the VOXIO Chat UI onto your React, Vue, or HTML site.', 'ادمج واجهة المحادثة في موقعك بكل سهولة.')}</p>
        </Link>
      </div>

      <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', color: 'var(--color-text)' }}>{t('Authentication', 'المصادقة والتخويل')}</h3>
      <div className="docs-auth-grid">
        <div className="docs-auth-card">
          <div className="docs-auth-badge apikey">API KEY</div>
          <h3>{t('API Key (Public Access)', 'مفتاح API (الوصول العام)')}</h3>
          <p>{t('Used when embedding widgets or connecting external integrations.', 'يُستخدم عند التضمين الخارجي أو الاتصال بخدمات أخرى.')}</p>
          <div className="docs-code-block">
            <pre>{`// Send in request body for chat API
{
  "apiKey": "a1b2c3d4e5f6...",
  "message": "Hello!"
}`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocsOverview;
