import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSEO } from '../../hooks/useSEO';

const TelegramIntegration = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  useSEO({
    title: t('VOXIO Docs | Telegram Bot Integration', 'توثيق VOXIO | ربط بوت تيليجرام'),
    description: t('Learn how to connect your trained VOXIO AI agent to a Telegram bot instantly.', 'تعلم كيفية ربط وكيلك الذكي المدرب على VOXIO ببوت تيليجرام في ثوانٍ لاستقبال رسائل العملاء والرد عليها آلياً.'),
    keywords: 'Telegram Bot API integration, AI Telegram Bot, VOXIO Telegram, ربط تيليجرام, بوت تيليجرام ذكي',
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": t('Telegram Bot Integration', 'دليل ربط بوت تيليجرام'),
      "description": t('How to deploy your VOXIO agent to Telegram.', 'كيفية نشر وكيل VOXIO الخاص بك على Telegram.'),
      "author": { "@type": "Organization", "name": "VOXIO" },
      "articleSection": "Documentation"
    }
  });

  return (
    <section className="docs-section" style={{ padding: '0' }}>
      <div className="docs-section-header" style={{ marginBottom: '2rem' }}>
        <div className="docs-section-icon" style={{ background: '#0088cc', color: '#fff' }}>
          <i className="fab fa-telegram" />
        </div>
        <div>
          <h2>{t('Telegram Bot Integration', 'ربط بوت تيليجرام (Telegram Bot)')}</h2>
          <p>{t('Deploy your AI agent to Telegram in seconds.', 'قم بنشر وكيلك الذكي على تيليجرام في ثوانٍ.')}</p>
        </div>
      </div>

      <div className="docs-text-content">
        <p className="docs-lead">
          {t('Telegram bots are a powerful way to engage with a tech-savvy audience. With VOXIO, you do not need to write any code to host a Telegram bot. You simply provide your Bot Token, and our AI handles the rest.', 'تعد بوتات تيليجرام طريقة قوية للتفاعل مع الجمهور. مع Voxio، لا تحتاج لكتابة أي كود لاستضافة بوت تيليجرام. ببساطة قم بتوفير الـ Token الخاص بالبوت، والذكاء الاصطناعي الخاص بنا سيتولى الباقي.')}
        </p>

        <h3>{t('Setup Instructions', 'خطوات الإعداد')}</h3>
        <p>{t('Follow these simple steps to bring your bot to life on Telegram:', 'اتبع هذه الخطوات البسيطة لتفعيل البوت الخاص بك على تيليجرام:')}</p>
        
        <img src="/docs-assets/telegram_bot.png" alt="Telegram BotFather Token" className="docs-image" />

        <ol style={{ marginLeft: isAr ? '0' : '20px', marginRight: isAr ? '20px' : '0', marginBottom: '2rem' }}>
          <li>{t('Open Telegram and search for the @BotFather.', 'افتح تطبيق تيليجرام وابحث عن @BotFather.')}</li>
          <li>{t('Send the command /newbot and follow the prompts to name your bot.', 'أرسل أمر /newbot واتبع التعليمات لتسمية البوت.')}</li>
          <li>{t('Copy the API Token provided by BotFather (e.g., 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11).', 'انسخ الـ API Token الذي سيقدمه لك BotFather.')}</li>
          <li>{t('Go to your VOXIO Dashboard > Integrations > Telegram.', 'اذهب إلى لوحة تحكم VOXIO > التكاملات > Telegram.')}</li>
          <li>{t('Paste the token and click Connect. Your bot is now live!', 'الصق التوكن واضغط على اتصال (Connect). البوت الآن يعمل!')}</li>
        </ol>

        <div className="docs-callout success">
          <i className="fas fa-bolt" />
          <p>{t('Instant Webhook Registration: When you connect the token in VOXIO, our server automatically registers a Telegram Webhook to point directly to your specific agent instance.', 'تسجيل تلقائي: عند إدخال التوكن في Voxio، يقوم سيرفرنا تلقائياً بتسجيل الـ Webhook الخاص بتيليجرام ليوجه الرسائل مباشرة إلى وكيلك الذكي دون أي تدخل برمجي منك.')}</p>
        </div>
      </div>
    </section>
  );
};

export default TelegramIntegration;
