import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../Docs.css'; // Importing existing CSS

const DocsLayout = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isAr = language === 'ar';
  const location = useLocation();

  const t = (en, ar) => (isAr ? ar : en);

  const navItems = [
    { path: '/docs', icon: 'fas fa-compass', en: 'Overview', ar: 'نظرة عامة' },
    { path: '/docs/shopify', icon: 'fab fa-shopify', en: 'Shopify Integration', ar: 'ربط شوبيفاي' },
    { path: '/docs/meta', icon: 'fab fa-meta', en: 'Meta (WhatsApp/FB/IG)', ar: 'ربط ميتا (واتساب/فيسبوك)' },
    { path: '/docs/telegram', icon: 'fab fa-telegram', en: 'Telegram Integration', ar: 'ربط تيليجرام' },
    { path: '/docs/widget', icon: 'fas fa-window-maximize', en: 'Website Widget', ar: 'ودجت الموقع' },
  ];

  return (
    <div className="docs-page" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ─── TOP NAV BAR ─── */}
      <nav className="docs-topbar">
        <Link to="/" className="docs-logo">
          <img src={theme === 'dark' ? '/logodark.png' : '/logo.png'} alt="VOXIO" />
          <span>VOXIO</span>
        </Link>
        <div className="docs-topbar-right">
          <span className="docs-version-badge">v1.0</span>
          <a href="mailto:voxio@gmail.com" className="docs-contact-link">
            {t('Support', 'الدعم')}
          </a>
        </div>
      </nav>

      <div className="docs-layout">
        {/* ─── SIDEBAR ─── */}
        <aside className="docs-sidebar">
          <p className="docs-sidebar-label">{t('Documentation', 'التوثيق')}</p>
          <nav className="docs-sidebar-nav">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`docs-sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <i className={`${item.icon} docs-sidebar-icon`} />
                  <span>{t(item.en, item.ar)}</span>
                  {isActive && <span className="docs-sidebar-indicator" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ─── MAIN CONTENT (Outlet) ─── */}
        <main className="docs-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DocsLayout;
