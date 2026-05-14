import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';
import VOXIOChatWidget from '../components/VOXIOChatWidget';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [activeIntegrations, setActiveIntegrations] = useState([]);

    useEffect(() => {
        const fetchIntegrations = async () => {
            const token = secureStorage.getItem('token');
            if (!token) return;
            try {
                const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';
                
                // ⚡ Critical: Check if company exists. If not, redirect to onboarding.
                try {
                    await axios.get(`${BACKEND_URL}/company`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (err) {
                    if (err.response?.status === 404) {
                        console.log('Company not found, redirecting to onboarding...');
                        window.location.href = '/onboarding/profile';
                        return;
                    }
                }

                const res = await axios.get(`${BACKEND_URL}/integration-manager`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActiveIntegrations(res.data.filter(i => i.isActive).map(i => i.platform));
            } catch (err) {
                console.error('Failed to fetch sidebar data:', err);
            }
        };
        fetchIntegrations();
    }, [location.pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleNavItemClick = () => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const isRailActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div className="dashboard-layout">
            {/* Icon Rail (Narrow Left Bar) */}
            <div className="icon-rail">
                <img
                    src={theme === 'dark' ? '/logodark.png' : '/logo.png'}
                    alt="V"
                    className="icon-rail-logo"
                />
                <button
                    className={`icon-rail-btn ${isRailActive('/dashboard') && location.pathname === '/dashboard' ? 'active' : ''}`}
                    onClick={() => { window.location.href = '/dashboard'; }}
                    title={t.dashboard.home}
                >
                    <i className="fas fa-home"></i>
                </button>
                <button
                    className={`icon-rail-btn ${isRailActive('/dashboard/settings') ? 'active' : ''}`}
                    onClick={() => { window.location.href = '/dashboard/settings'; }}
                    title={t.dashboard.settings}
                >
                    <i className="fas fa-cog"></i>
                </button>

                <div className="icon-rail-spacer"></div>

                <button className="icon-rail-btn" onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay mobile-only" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                            src={theme === 'dark' ? '/logodark.png' : '/logo.png'}
                            alt="VOXIO"
                            className="sidebar-logo"
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                        <span style={{ fontWeight: 800, color: 'var(--dash-text)', fontSize: '1.1rem' }}>VOXIO</span>
                    </div>
                    <button className="close-sidebar-btn mobile-only" onClick={() => setIsSidebarOpen(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar">
                        <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    {isSidebarOpen && (
                        <>
                            <div className="user-info">
                                <span className="user-name">{user?.name || 'User'}</span>
                                <span className="user-role">User Name</span>
                            </div>
                            <span className="user-badge">ADMIN</span>
                        </>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-th-large"></i>
                                {isSidebarOpen && <span>{t.dashboard.home}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/ai-training" className={`nav-item ${isActive('/dashboard/ai-training')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-brain"></i>
                                {isSidebarOpen && <span>{t.dashboard.training}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/model-test" className={`nav-item ${isActive('/dashboard/model-test')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-flask"></i>
                                {isSidebarOpen && <span>{t.dashboard.modelTest}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/integrations" className={`nav-item ${isActive('/dashboard/integrations')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-plug"></i>
                                {isSidebarOpen && (
                                    <>
                                        <span>{t.dashboard.integrations}</span>
                                        {activeIntegrations.length > 0 && <span className="integration-dot"></span>}
                                    </>
                                )}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/widget" className={`nav-item nav-item-website ${isActive('/dashboard/widget')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-code"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'ودجت الموقع' : 'Website Widget'}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/telegram" className={`nav-item nav-item-telegram ${isActive('/dashboard/telegram')}`} onClick={handleNavItemClick}>
                                <i className="fab fa-telegram-plane"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'تليجرام' : 'Telegram'}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/website-chat" className={`nav-item ${isActive('/dashboard/website-chat')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-globe"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'موقع الويب (URL)' : 'Website (URL)'}</span>}
                            </Link>
                        </li>
                        {activeIntegrations.includes('whatsapp') && (
                        <li>
                            <Link to="/dashboard/whatsapp" className={`nav-item nav-item-whatsapp ${isActive('/dashboard/whatsapp')}`} onClick={handleNavItemClick}>
                                <i className="fab fa-whatsapp"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>}
                            </Link>
                        </li>
                        )}
                        {activeIntegrations.includes('instagram') && (
                        <li>
                            <Link to="/dashboard/instagram" className={`nav-item nav-item-instagram ${isActive('/dashboard/instagram')}`} onClick={handleNavItemClick}>
                                <i className="fab fa-instagram"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'إنستاجرام' : 'Instagram'}</span>}
                            </Link>
                        </li>
                        )}
                        <li>
                            <Link to="/dashboard/settings" className={`nav-item ${isActive('/dashboard/settings')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-cog"></i>
                                {isSidebarOpen && <span>{t.dashboard.settings}</span>}
                            </Link>
                        </li>
                        <li>
                            <a href="https://voxio.gitbook.io" target="_blank" rel="noopener noreferrer" className="nav-item" onClick={handleNavItemClick}>
                                <i className="fas fa-question-circle"></i>
                                {isSidebarOpen && (
                                    <>
                                        <span>{language === 'ar' ? 'مركز المساعدة' : 'Help Center'}</span>
                                        <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem', marginInlineStart: 'auto', opacity: 0.4 }}></i>
                                    </>
                                )}
                            </a>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={logout} className="nav-item logout-btn">
                        <i className="fas fa-sign-out-alt"></i>
                        {isSidebarOpen && <span>{t.dashboard.logout}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        <i className={`fas fa-${isSidebarOpen ? 'outdent' : 'indent'}`}></i>
                    </button>

                    <div className="header-actions">
                        <button className="lang-btn" onClick={toggleLanguage}>
                            {language === 'ar' ? 'English' : 'عربي'}
                        </button>
                        <button className="theme-btn" onClick={toggleTheme}>
                            {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="dashboard-content-inner"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Global Chat Widget */}
            <VOXIOChatWidget />
        </div>
    );
};

export default DashboardLayout;
