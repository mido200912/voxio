import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

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

    return (
        <div className="dashboard-layout">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay mobile-only" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src="/logo.png" alt="VOXIO" className="sidebar-logo" />
                        {isSidebarOpen && <span className="logo-text">VOXIO</span>}
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
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'User'}</span>
                            <span className="user-role">Admin</span>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-home"></i>
                                {isSidebarOpen && <span>{t.dashboard.home}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/inbox" className={`nav-item ${isActive('/dashboard/inbox')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-inbox"></i>
                                {isSidebarOpen && <span>{t.dashboard.inbox}</span>}
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
                                <i className="fas fa-robot"></i>
                                {isSidebarOpen && <span>{t.dashboard.modelTest}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/integrations" className={`nav-item ${isActive('/dashboard/integrations')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-plug"></i>
                                {isSidebarOpen && <span>{t.dashboard.integrations}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/telegram" className={`nav-item ${isActive('/dashboard/telegram')}`} onClick={handleNavItemClick}>
                                <i className="fab fa-telegram-plane"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'تليجرام' : 'Telegram'}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/website-chat" className={`nav-item ${isActive('/dashboard/website-chat')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-globe"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'موقع الويب' : 'Website'}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/chatbot-editor" className={`nav-item ${isActive('/dashboard/chatbot-editor')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-wand-magic-sparkles"></i>
                                {isSidebarOpen && <span>{language === 'ar' ? 'مصمم الشات بوت' : 'Chatbot Editor'}</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/settings" className={`nav-item ${isActive('/dashboard/settings')}`} onClick={handleNavItemClick}>
                                <i className="fas fa-cog"></i>
                                {isSidebarOpen && <span>{t.dashboard.settings}</span>}
                            </Link>
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
        </div>
    );
};

export default DashboardLayout;
