import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const Blog = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);
  const [active, setActive] = useState('all');

  const categories = [
    { key: 'all',     icon: 'fa-th-large',    label: t('All', 'الكل') },
    { key: 'ai',      icon: 'fa-microchip',   label: t('AI & Tech', 'ذكاء اصطناعي') },
    { key: 'business',icon: 'fa-briefcase',   label: t('Business', 'أعمال') },
    { key: 'tutorial',icon: 'fa-book-open',   label: t('Tutorials', 'شروحات') },
  ];

  const posts = [
    {
      cat: 'ai', icon: 'fa-robot',
      date: t('Mar 15, 2026', '١٥ مارس ٢٠٢٦'), readTime: t('5 min', '٥ د'),
      title: t('How AI is Transforming Customer Service in 2026', 'كيف يحوّل الذكاء الاصطناعي خدمة العملاء في ٢٠٢٦'),
      desc: t('From reactive support to proactive AI agents — discover how leading companies are cutting resolution times by 70%.', 'من الدعم التقليدي إلى وكلاء الذكاء الاصطناعي الاستباقيين — اكتشف كيف تقلل الشركات أوقات الحل بنسبة ٧٠٪.'),
      tag: t('AI & Tech', 'ذكاء اصطناعي'),
    },
    {
      cat: 'tutorial', icon: 'fa-plug',
      date: t('Feb 28, 2026', '٢٨ فبراير ٢٠٢٦'), readTime: t('8 min', '٨ د'),
      title: t('Connect WhatsApp Business to Your Store in 5 Steps', 'ربط WhatsApp Business بمتجرك في ٥ خطوات'),
      desc: t('Step-by-step guide to connecting Aithor to WhatsApp and letting the AI handle customer queries automatically.', 'دليل خطوة بخطوة لربط Aithor بـ WhatsApp وجعل الذكاء الاصطناعي يتعامل مع استفسارات العملاء تلقائياً.'),
      tag: t('Tutorials', 'شروحات'),
    },
    {
      cat: 'business', icon: 'fa-chart-bar',
      date: t('Jan 20, 2026', '٢٠ يناير ٢٠٢٦'), readTime: t('6 min', '٦ د'),
      title: t('E-commerce + AI: The Perfect Partnership', 'التجارة الإلكترونية والذكاء الاصطناعي: تكامل مثالي'),
      desc: t('How Aithor\'s Shopify integration lets you handle product questions, order tracking, and complaints via AI.', 'كيف يتيح تكامل Aithor مع Shopify معالجة أسئلة المنتجات وتتبع الطلبات عبر الذكاء الاصطناعي.'),
      tag: t('Business', 'أعمال'),
    },
    {
      cat: 'ai', icon: 'fa-brain',
      date: t('Jan 5, 2026', '٥ يناير ٢٠٢٦'), readTime: t('10 min', '١٠ د'),
      title: t('Under the Hood: How Aithor Trains Your Bot', 'خلف الكواليس: كيف يُدرّب Aithor بوتك'),
      desc: t('A deep dive into our knowledge extraction pipeline — how we parse your files and convert them into AI context.', 'تعمق في خط استخراج المعرفة — كيف نحلل ملفاتك ونحولها إلى سياق للذكاء الاصطناعي.'),
      tag: t('AI & Tech', 'ذكاء اصطناعي'),
    },
    {
      cat: 'tutorial', icon: 'fa-code',
      date: t('Dec 12, 2025', '١٢ ديسمبر ٢٠٢٥'), readTime: t('4 min', '٤ د'),
      title: t('Embed Aithor Chat Widget in Under 2 Minutes', 'تضمين ودجت Aithor في أقل من دقيقتين'),
      desc: t('One script tag. That\'s all. Your trained AI chatbot is live on any webpage instantly.', 'سطر كود واحد. هذا كل شيء. بوتك الذكي المدرَّب يعمل على أي صفحة فوراً.'),
      tag: t('Tutorials', 'شروحات'),
    },
    {
      cat: 'business', icon: 'fa-globe',
      date: t('Nov 30, 2025', '٣٠ نوفمبر ٢٠٢٥'), readTime: t('7 min', '٧ د'),
      title: t('Arabic AI: Why Language Matters in Customer Service', 'الذكاء الاصطناعي العربي: لماذا تهم اللغة'),
      desc: t('Why Arabic-language support is a business necessity for MENA companies, and how Aithor delivers it natively.', 'لماذا دعم اللغة العربية ضرورة تجارية لشركات المنطقة، وكيف يقدمه Aithor بشكل أصيل.'),
      tag: t('Business', 'أعمال'),
    },
  ];

  const filtered = active === 'all' ? posts : posts.filter(p => p.cat === active);

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
            <i className="fas fa-pen-nib" />
            {t('Blog', 'المدونة')}
          </div>
          <h1>{t('Insights on AI, Business & Technology', 'رؤى حول الذكاء الاصطناعي والأعمال والتقنية')}</h1>
          <p className="lp-hero-desc">
            {t('Tutorials, case studies, and deep dives from the Aithor team.', 'شروحات ودراسات حالة وتحليلات معمقة من فريق Aithor.')}
          </p>
        </div>
      </div>

      <div className="lp-container">
        <div style={{ paddingTop: '3rem' }}>
          <div className="lp-filter-tabs">
            {categories.map(c => (
              <button
                key={c.key}
                className={`lp-filter-tab ${active === c.key ? 'active' : ''}`}
                onClick={() => setActive(c.key)}
              >
                <i className={`fas ${c.icon}`} />
                {c.label}
              </button>
            ))}
          </div>

          <div className="lp-blog-grid">
            {filtered.map((post, i) => (
              <div key={i} className="lp-blog-card">
                <div className="lp-blog-icon"><i className={`fas ${post.icon}`} /></div>
                <div className="lp-blog-meta">
                  <span className="lp-blog-tag">{post.tag}</span>
                  <i className="fas fa-calendar-alt" />
                  <span>{post.date}</span>
                  <i className="fas fa-clock" />
                  <span>{post.readTime}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.desc}</p>
                <button className="lp-blog-read-btn">
                  {t('Read Article', 'اقرأ المقال')}
                  <i className="fas fa-arrow-left" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
