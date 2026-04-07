import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const Support = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);
  const [openFaq, setOpenFaq] = useState(null);

  const channels = [
    {
      icon: 'fa-envelope',
      title: t('Email Support', 'دعم البريد الإلكتروني'),
      desc: t('Usually reply within 24 hours, often much faster.', 'نرد عادةً خلال ٢٤ ساعة، وكثيراً أسرع من ذلك.'),
      linkLabel: 'voxio049@gmail.com',
      linkHref: 'mailto:voxio049@gmail.com',
      external: true,
    },
    {
      icon: 'fa-book-open',
      title: t('Documentation', 'التوثيق'),
      desc: t('Detailed API reference, guides and code examples.', 'مرجع API مفصل وأدلة وأمثلة برمجية.'),
      linkLabel: t('Open Docs', 'فتح التوثيق'),
      linkHref: '/docs',
      external: false,
    },
    {
      icon: 'fa-comments',
      title: t('Live Chat', 'محادثة فورية'),
      desc: t('Chat with our AI bot on the homepage — powered by VOXIO itself!', 'تحدث مع بوتنا على الرئيسية — مدعوم بـ VOXIO نفسه!'),
      linkLabel: t('Go to Home', 'الذهاب للرئيسية'),
      linkHref: '/',
      external: false,
    },
  ];

  const faqs = [
    {
      q: t('How do I get started with VOXIO?', 'كيف أبدأ استخدام VOXIO؟'),
      a: t('Register a free account, complete your company profile during onboarding, then upload your knowledge base (PDFs, docs) to train your AI bot.', 'سجّل حساباً مجانياً، أكمل ملف شركتك خلال الإعداد، ثم ارفع قاعدة المعرفة (PDFs، وثائق) لتدريب بوتك.'),
    },
    {
      q: t('Does VOXIO support Arabic?', 'هل يدعم VOXIO اللغة العربية؟'),
      a: t('Yes. VOXIO is Arabic-first. The platform UI supports RTL and the AI model (Meta Llama 3.3 70B) responds fluently in both Arabic and English.', 'نعم. صُمم VOXIO مع الأولوية للعربية. الواجهة تدعم RTL ونموذج الذكاء الاصطناعي (Meta Llama 3.3 70B) يرد بطلاقة بالعربية والإنجليزية.'),
    },
    {
      q: t('Where do I find my API key?', 'أين أجد مفتاح الـ API الخاص بي؟'),
      a: t('Login → Dashboard → Settings → API Key section. Your 48-character key is there. Keep it confidential.', 'سجّل الدخول → لوحة التحكم → الإعدادات → قسم مفتاح الـ API. مفتاحك المكون من ٤٨ حرفاً هناك. احتفظ به سرياً.'),
    },
    {
      q: t("I'm getting a 500 error. What do I do?", 'أحصل على خطأ 500. ماذا أفعل؟'),
      a: t('A 500 error usually means the AI service timed out or your OpenRouter API key quota is exhausted. Check your key, ensure it has credits, then restart the backend server.', 'خطأ 500 يعني عادةً انتهاء مهلة الذكاء الاصطناعي أو استنفاد حصة OpenRouter. تحقق من مفتاحك وتأكد من وجود أرصدة، ثم أعد تشغيل الخادم.'),
    },
    {
      q: t('Can I embed the chatbot in my website?', 'هل يمكنني تضمين البوت في موقعي؟'),
      a: t('Yes! Add a single <script> tag with your API key config and the VOXIO widget appears on any webpage instantly.', 'نعم! أضف علامة <script> واحدة مع إعدادات مفتاح الـ API ويظهر ودجت VOXIO فوراً.'),
    },
    {
      q: t('How do I delete my account?', 'كيف أحذف حسابي؟'),
      a: t('Email voxio049@gmail.com with subject "Account Deletion". We permanently delete all your data within 30 days.', 'راسل voxio049@gmail.com بموضوع "حذف الحساب". نحذف جميع بياناتك بشكل دائم خلال ٣٠ يوماً.'),
    },
  ];

  return (
    <div className="lp-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="lp-topbar">
        <Link to="/" className="lp-logo">
          <i className="fas fa-arrow-right" />
          {t('Back to Home', 'الرئيسية')}
        </Link>
      </div>

      <div className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">
            <i className="fas fa-life-ring" />
            {t('Support', 'الدعم')}
          </div>
          <h1>{t("We're here to help", 'نحن هنا للمساعدة')}</h1>
          <p className="lp-hero-desc">
            {t(
              'Get help via email, browse our FAQ, or dive into the documentation.',
              'احصل على المساعدة عبر البريد الإلكتروني، أو تصفح الأسئلة الشائعة، أو اقرأ التوثيق.'
            )}
          </p>
        </div>
      </div>

      <div className="lp-container">

        {/* CHANNELS */}
        <div style={{ paddingTop: '3rem' }}>
          <div className="lp-support-cards">
            {channels.map((c, i) => (
              <div key={i} className="lp-support-card">
                <div className="lp-support-icon"><i className={`fas ${c.icon}`} /></div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                {c.external ? (
                  <a href={c.linkHref} className="lp-support-link">
                    {c.linkLabel}
                    <i className="fas fa-arrow-left" />
                  </a>
                ) : (
                  <Link to={c.linkHref} className="lp-support-link">
                    {c.linkLabel}
                    <i className="fas fa-arrow-left" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="lp-section">
          <div className="lp-section-label">
            <i className="fas fa-circle-question" />
            {t('FAQ', 'الأسئلة الشائعة')}
          </div>
          <div className="lp-section-title">{t('Frequently Asked Questions', 'الأسئلة الأكثر شيوعاً')}</div>
          <p className="lp-section-sub">
            {t('Quick answers to the questions we get most often.', 'إجابات سريعة للأسئلة التي نتلقاها أكثر.')}
          </p>
          <div className="lp-faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`lp-faq-item ${openFaq === i ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="lp-faq-q">
                  <span>{faq.q}</span>
                  <div className="lp-faq-chevron">
                    <i className="fas fa-chevron-down" />
                  </div>
                </div>
                {openFaq === i && <div className="lp-faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="lp-cta-block">
          <h2>{t('Still need help?', 'لا تزال بحاجة للمساعدة؟')}</h2>
          <p>{t('Our team is happy to help you get set up and running.', 'فريقنا سعيد بمساعدتك في الإعداد والتشغيل.')}</p>
          <div className="lp-cta-btns">
            <a href="mailto:voxio049@gmail.com" className="lp-btn-primary">
              <i className="fas fa-envelope" />
              {t('Email Us', 'راسلنا')}
            </a>
            <Link to="/docs" className="lp-btn-secondary">
              <i className="fas fa-book-open" />
              {t('Read the Docs', 'اقرأ التوثيق')}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Support;
