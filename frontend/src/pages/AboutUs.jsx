import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const AboutUs = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  return (
    <div className="lp-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="lp-topbar">
        <Link to="/" className="lp-logo">
          <i className="fas fa-arrow-right" />
          {t('Back to Home', 'الرئيسية')}
        </Link>
      </div>

      {/* HERO */}
      <div className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">
            <i className="fas fa-building" />
            {t('About Us', 'من نحن')}
          </div>
          <h1>
            {t(
              'Building the future of AI-powered business communication',
              'نحن نبني مستقبل التواصل التجاري بالذكاء الاصطناعي'
            )}
          </h1>
          <p className="lp-hero-desc">
            {t(
              'Aithor lets every company — from startups to enterprises — deploy a fully trained AI agent for customer service that never sleeps.',
              'Aithor يمنح كل شركة — من الناشئة إلى الكبيرة — قوة وكيل ذكاء اصطناعي مدرَّب لخدمة العملاء لا يتوقف أبداً.'
            )}
          </p>
        </div>
      </div>

      <div className="lp-container">

        {/* STATS */}
        <div className="lp-stats-grid">
          {[
            { value: '500+', label: t('Companies Served', 'شركة مخدومة') },
            { value: '50K+', label: t('Monthly Conversations', 'محادثة شهرياً') },
            { value: '98%',  label: t('Satisfaction Rate', 'معدل الرضا') },
            { value: '24/7', label: t('Always Available', 'متاح دائماً') },
          ].map((s, i) => (
            <div key={i} className="lp-stat">
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* VISION & MISSION */}
        <div className="lp-section">
          <div className="lp-section-label">
            <i className="fas fa-compass" />
            {t('Direction', 'التوجه')}
          </div>
          <div className="lp-two-col">
            <div className="lp-info-card">
              <div className="lp-info-icon"><i className="fas fa-rocket" /></div>
              <h2>{t('Our Vision', 'رؤيتنا')}</h2>
              <p>
                {t(
                  'A world where every business has an intelligent AI assistant that understands its context, speaks its customers\' language, and works tirelessly to deliver exceptional results.',
                  'عالم تمتلك فيه كل شركة مساعداً ذكياً يفهم سياقها، ويتحدث بلغة عملائها، ويعمل بلا توقف لتقديم نتائج استثنائية.'
                )}
              </p>
            </div>
            <div className="lp-info-card">
              <div className="lp-info-icon"><i className="fas fa-bullseye" /></div>
              <h2>{t('Our Mission', 'رسالتنا')}</h2>
              <p>
                {t(
                  'To make advanced AI accessible to businesses of all sizes through a simple, powerful, and affordable platform — not just for tech giants.',
                  'جعل الذكاء الاصطناعي المتقدم في متناول الشركات من جميع الأحجام من خلال منصة بسيطة وقوية وبأسعار معقولة — ليس فقط لعمالقة التكنولوجيا.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* WHAT WE BUILD */}
        <div className="lp-section">
          <div className="lp-section-label">
            <i className="fas fa-layer-group" />
            {t('Platform', 'المنصة')}
          </div>
          <div className="lp-section-title">{t('What We Build', 'ما الذي نبنيه')}</div>
          <p className="lp-section-sub">
            {t('The complete toolkit for AI-powered customer communication.', 'مجموعة الأدوات الكاملة لتواصل العملاء المدعوم بالذكاء الاصطناعي.')}
          </p>
          <div className="lp-feature-list">
            {[
              { icon: 'fa-robot',         title: t('AI Chatbots', 'بوتات ذكية'),                    desc: t('Trained on your company\'s own data for precise, context-aware responses in Arabic & English.', 'مدربة على بيانات شركتك لردود دقيقة وادراكية للسياق بالعربية والإنجليزية.') },
              { icon: 'fa-network-wired', title: t('Multi-Channel Integration', 'تكامل متعدد القنوات'), desc: t('WhatsApp, Facebook, Instagram, Shopify, and your website — one unified platform.', 'WhatsApp وFacebook وInstagram وShopify وموقعك — منصة واحدة موحدة.') },
              { icon: 'fa-chart-line',    title: t('Analytics Dashboard', 'لوحة التحليلات'),          desc: t('Track conversations, measure AI resolution rates, and understand your customers better.', 'تتبع المحادثات وقس معدلات الحل وافهم عملاءك بشكل أفضل.') },
              { icon: 'fa-code',          title: t('Developer API', 'API للمطورين'),                  desc: t('A clean REST API to embed Aithor in any app, website, or workflow you build.', 'API REST نظيف لتضمين Aithor في أي تطبيق أو موقع أو سير عمل تبنيه.') },
            ].map((f, i) => (
              <div key={i} className="lp-feature-item">
                <div className="lp-feature-icon-wrap"><i className={`fas ${f.icon}`} /></div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TEAMS */}
        <div className="lp-section">
          <div className="lp-section-label">
            <i className="fas fa-users" />
            {t('People', 'الفريق')}
          </div>
          <div className="lp-section-title">{t('Our Teams', 'فرقنا')}</div>
          <div className="lp-team-grid">
            {[
              { icon: 'fa-palette',    title: t('Product', 'المنتج'),              desc: t('Building the full user experience and interface.', 'بناء تجربة المستخدم الكاملة والواجهة.') },
              { icon: 'fa-brain',      title: t('AI Research', 'بحث الذكاء الاصطناعي'), desc: t('Developing language models and NLP for Arabic.', 'تطوير نماذج اللغة ومعالجة اللغة للعربية.') },
              { icon: 'fa-server',     title: t('Backend', 'الباك إند'),             desc: t('Building APIs, infrastructure, and data systems.', 'بناء APIs والبنية التحتية وأنظمة البيانات.') },
              { icon: 'fa-headset',    title: t('Support', 'الدعم'),                desc: t('Helping customers onboard and succeed.', 'مساعدة العملاء على الإعداد والنجاح.') },
            ].map((m, i) => (
              <div key={i} className="lp-team-card">
                <div className="lp-team-icon"><i className={`fas ${m.icon}`} /></div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="lp-cta-block">
          <h2>{t('Ready to transform your business?', 'مستعد لتحويل شركتك؟')}</h2>
          <p>{t('Start free. No credit card required.', 'ابدأ مجاناً. لا يلزم بطاقة ائتمان.')}</p>
          <div className="lp-cta-btns">
            <Link to="/register" className="lp-btn-primary">
              <i className="fas fa-arrow-left" />
              {t('Start Free', 'ابدأ مجاناً')}
            </Link>
            <a href="mailto:aithor049@gmail.com" className="lp-btn-secondary">
              <i className="fas fa-envelope" />
              {t('Contact Us', 'تواصل معنا')}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
