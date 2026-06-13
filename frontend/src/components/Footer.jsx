import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import './Footer.css';

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Footer = () => {
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAr = language === 'ar';

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Logo Column */}
          <div className="footer-col footer-brand">
            <div className="footer-logo">
              <img src={theme === 'dark' ? '/logodark.png' : '/logo.png'} alt="VOXIO" />
            </div>
          </div>

          {/* Product Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{isAr ? 'المنتج' : 'Product'}</h4>
            <ul className="footer-links-list">
              <li><a href="/#features">{isAr ? 'المميزات' : 'Features'}</a></li>
              <li><a href="/#integrations">{isAr ? 'التكاملات' : 'Integrations'}</a></li>
              <li><a href="/#pricing">{isAr ? 'الأسعار' : 'Pricing'}</a></li>
              <li><Link to="/agents">{isAr ? 'الوكلاء' : 'Agents'}</Link></li>
              <li><Link to="/security">{isAr ? 'الأمان' : 'Security'}</Link></li>
              <li><Link to="/changelog">{isAr ? 'التحديثات' : 'Changelog'}</Link></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{isAr ? 'الحلول' : 'Solutions'}</h4>
            <ul className="footer-links-list">
              <li><Link to="/solutions/support">{isAr ? 'خدمة العملاء' : 'Customer Support'}</Link></li>
              <li><Link to="/solutions/ecommerce">{isAr ? 'التجارة الإلكترونية' : 'E-commerce'}</Link></li>
              <li><Link to="/solutions/sales">{isAr ? 'المبيعات' : 'Sales & Marketing'}</Link></li>
              <li><Link to="/solutions/healthcare">{isAr ? 'الرعاية الصحية' : 'Healthcare'}</Link></li>
              <li><Link to="/solutions/startups">{isAr ? 'الشركات الناشئة' : 'Startups'}</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{isAr ? 'الشركة' : 'Company'}</h4>
            <ul className="footer-links-list">
              <li><Link to="/about">{isAr ? 'عن فُكسيو' : 'About'}</Link></li>
              <li><Link to="/customers">{isAr ? 'عملائنا' : 'Customers'}</Link></li>
              <li>
                <a href="https://form-voxio.vercel.app/" target="_blank" rel="noopener noreferrer">
                  {isAr ? 'الوظائف' : 'Careers'}
                </a>
              </li>
              <li><Link to="/blog">{isAr ? 'المدونة' : 'Blog'}</Link></li>
              <li><Link to="/brand">{isAr ? 'العلامة التجارية' : 'Brand'}</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{isAr ? 'المصادر' : 'Resources'}</h4>
            <ul className="footer-links-list">
              <li><Link to="/docs">{isAr ? 'المستندات' : 'Documentation'}</Link></li>
              <li><Link to="/help">{isAr ? 'مركز المساعدة' : 'Help Center'}</Link></li>
              <li><Link to="/docs">API</Link></li>
              <li><Link to="/status">{isAr ? 'حالة النظام' : 'Status'}</Link></li>
              <li><Link to="/community">{isAr ? 'المجتمع' : 'Community'}</Link></li>
            </ul>
          </div>

          {/* Connect Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{isAr ? 'تواصل معنا' : 'Connect'}</h4>
            <ul className="footer-links-list">
              <li><Link to="/contact">{isAr ? 'اتصل بنا' : 'Contact us'}</Link></li>
              <li><a href="https://twitter.com/voxio" target="_blank" rel="noopener noreferrer">X (Twitter)</a></li>
              <li><a href="https://linkedin.com/company/voxio" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              <li><a href="https://github.com/voxio" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://youtube.com/voxio" target="_blank" rel="noopener noreferrer">YouTube</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <Link to="/privacy">{isAr ? 'الخصوصية' : 'Privacy'}</Link>
            <Link to="/terms">{isAr ? 'الشروط' : 'Terms'}</Link>
            <Link to="/dpa">DPA</Link>
            <Link to="/aup">AUP</Link>
            
            <button className="footer-theme-btn" onClick={toggleTheme} aria-label="Toggle theme" title={isAr ? 'تبديل المظهر' : 'Toggle Theme'}>
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
          
          <div className="footer-bottom-right">
            {/* The Linear footer doesn't typically show copyright prominently, but we'll keep it subtle */}
            <p className="footer-copy">&copy; 2026 VOXIO.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
