import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { secureStorage } from '../utils/secureStorage';
import './Navbar.css';

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const token = secureStorage.getItem('token');
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveLink(sectionId);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { id: 'features', label: t.nav.features },
    { id: 'how-it-works', label: t.nav.howItWorks },
    { id: 'integrations', label: t.nav.integrations },
    { id: 'pricing', label: t.nav.pricing },
    { id: 'agents', label: language === 'ar' ? 'الوكلاء' : 'Agents', route: '/agents' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo" onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img
            src={theme === 'dark' ? '/logodark.png' : '/logo.png'}
            alt="VOXIO"
            className="logo-img"
          />
          <span className="logo-text">VOXIO</span>
        </div>

        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.route || `#${link.id}`}
                className={`nav-link ${link.id === 'agents' ? 'nav-link-agents' : ''} ${activeLink === link.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (link.route) {
                    navigate(link.route);
                    setIsMobileMenuOpen(false);
                  } else {
                    scrollToSection(link.id);
                  }
                }}
              >
                {link.label}
              </a>
            </li>
          ))}

          <li className="mobile-only">
            <div className="mobile-controls">
              <button className="icon-btn" onClick={toggleLanguage} aria-label="Toggle Language">
                <GlobeIcon />
                <span>{language === 'ar' ? 'EN' : 'AR'}</span>
              </button>
              <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
            </div>
          </li>
          <li className="mobile-only mobile-auth">
            {token ? (
              <button className="btn-nav-primary btn-nav-block" onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}>
                {t.nav.goDashboard}
              </button>
            ) : (
              <>
                <button className="btn-nav-secondary btn-nav-block" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                  {t.nav.login}
                </button>
                <button className="btn-nav-primary btn-nav-block" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>
                  {t.nav.startFree}
                </button>
              </>
            )}
          </li>
        </ul>

        <div className="nav-actions">
          <button className="icon-btn" onClick={toggleLanguage} aria-label="Toggle Language">
            <GlobeIcon />
            <span>{language === 'ar' ? 'EN' : 'AR'}</span>
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <div className="nav-auth-desktop">
            {token ? (
              <button className="btn-nav-primary" onClick={() => navigate('/dashboard')}>
                {t.nav.goDashboard}
              </button>
            ) : (
              <>
                <button className="btn-nav-secondary" onClick={() => navigate('/login')}>{t.nav.login}</button>
                <button className="btn-nav-primary" onClick={() => navigate('/register')}>{t.nav.startFree}</button>
              </>
            )}
          </div>
        </div>

        <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
