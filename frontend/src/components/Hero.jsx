import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

const Hero = () => {
    const statsRef = useRef(null);
    const { t, language } = useLanguage();
    const { user, isAuthChecked } = useAuth();

    // Animated counter
    useEffect(() => {
        const animateValue = (element, start, end, duration) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = Math.floor(eased * (end - start) + start).toLocaleString();
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.stat-number').forEach((stat) => {
                            animateValue(stat, 0, parseInt(stat.getAttribute('data-target')), 2000);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    const isAr = language === 'ar';

    return (
        <section className="hero" id="home">
            {/* Animated mesh background */}
            <div className="hero-mesh-bg" />
            <div className="hero-orb orb-1" />
            <div className="hero-orb orb-2" />
            <div className="hero-orb orb-3" />

            {/* Floating grid lines */}
            <div className="hero-grid-overlay" />

            <div className="hero-container">
                {/* ── Left Content ── */}
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot" />
                        <i className="fas fa-sparkles" />
                        <span>{t.hero.badge}</span>
                    </div>

                    <h1 className="hero-title">
                        <span className="title-line-1">{t.hero.titleStart}</span>
                        <br />
                        <span className="gradient-text-hero">{t.hero.titleGradient}</span>
                    </h1>

                    <p className="hero-description">{t.hero.description}</p>

                    <div className="hero-buttons">
                        {isAuthChecked && (
                            user ? (
                                <>
                                    <Link to="/dashboard" className="btn-hero-primary">
                                        <i className="fas fa-tachometer-alt" />
                                        <span>{t.nav.goDashboard}</span>
                                        <div className="btn-hero-shine" />
                                    </Link>
                                    <button
                                        className="btn-hero-glass"
                                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        <i className="fas fa-play-circle" />
                                        <span>{t.hero.watchVideo}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/register" className="btn-hero-primary">
                                        <i className="fas fa-rocket" />
                                        <span>{t.hero.startNow}</span>
                                        <div className="btn-hero-shine" />
                                    </Link>
                                    <button
                                        className="btn-hero-glass"
                                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        <i className="fas fa-play-circle" />
                                        <span>{t.hero.watchVideo}</span>
                                    </button>
                                </>
                            )
                        )}
                    </div>

                    {/* Stats */}
                    <div className="hero-stats" ref={statsRef}>
                        <div className="stat-item">
                            <div className="stat-value">
                                <span className="stat-number" data-target="150">0</span>
                                <span className="stat-suffix">+</span>
                            </div>
                            <span className="stat-label">{t.hero.statCompany}</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <div className="stat-value">
                                <span className="stat-number" data-target="50000">0</span>
                                <span className="stat-suffix">+</span>
                            </div>
                            <span className="stat-label">{t.hero.statConversation}</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <div className="stat-value">
                                <span className="stat-number" data-target="99">0</span>
                                <span className="stat-suffix">%</span>
                            </div>
                            <span className="stat-label">{t.hero.statSatisfaction}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right Visual ── */}
                <div className="hero-visual">
                    {/* Floating platform cards */}
                    <div className="platform-card card-wa">
                        <i className="fab fa-whatsapp" />
                        <span>WhatsApp</span>
                        <span className="card-live-dot" />
                    </div>
                    <div className="platform-card card-fb">
                        <i className="fab fa-facebook-messenger" />
                        <span>Messenger</span>
                        <span className="card-live-dot" />
                    </div>
                    <div className="platform-card card-sh">
                        <i className="fab fa-shopify" />
                        <span>Shopify</span>
                    </div>

                    {/* Main chat mockup */}
                    <div className="hero-mockup">
                        <div className="mockup-topbar">
                            <div className="mockup-dots">
                                <span className="dot-red" /><span className="dot-yellow" /><span className="dot-green" />
                            </div>
                            <span className="mockup-url">voxio.ai / dashboard</span>
                            <div className="mockup-status">
                                <span className="status-pulse" />
                                <span>{isAr ? 'متصل' : 'Online'}</span>
                            </div>
                        </div>

                        <div className="mockup-body">
                            <div className="mock-bubble ai anim-1">
                                <div className="mock-avatar"><i className="fas fa-robot" /></div>
                                <div className="mock-text">
                                    {isAr ? '👋 مرحباً! كيف يمكنني مساعدتك اليوم؟' : '👋 Hi! How can I help you today?'}
                                </div>
                            </div>

                            <div className="mock-bubble user anim-2">
                                <div className="mock-text">
                                    {isAr ? 'أريد معرفة أسعار الباقات' : 'I want to see pricing plans'}
                                </div>
                            </div>

                            <div className="mock-bubble ai anim-3">
                                <div className="mock-avatar"><i className="fas fa-robot" /></div>
                                <div className="mock-text">
                                    {isAr
                                        ? '💡 سأوجهك الآن لصفحة الأسعار...'
                                        : '💡 Let me navigate you to our pricing now...'}
                                </div>
                            </div>

                            {/* Copilot action indicator */}
                            <div className="mock-copilot-action anim-4">
                                <i className="fas fa-compass" />
                                <span>{isAr ? 'يتحرك إلى: #pricing' : 'Navigating to: #pricing'}</span>
                                <div className="copilot-progress" />
                            </div>

                            <div className="mock-typing anim-5">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>

                    {/* Analytics floating card */}
                    <div className="analytics-card">
                        <div className="analytics-icon"><i className="fas fa-chart-line" /></div>
                        <div className="analytics-info">
                            <span className="analytics-value">+127%</span>
                            <span className="analytics-label">{isAr ? 'تحويلات اليوم' : "Today's Conversions"}</span>
                        </div>
                        <div className="analytics-spark">
                            <svg viewBox="0 0 60 24" fill="none">
                                <polyline points="0,20 10,15 20,18 30,8 40,12 50,4 60,6"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="scroll-indicator">
                <div className="mouse"><div className="wheel" /></div>
                <span>{t.hero.scrollMore}</span>
            </div>
        </section>
    );
};

export default Hero;
