import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

const Hero = () => {
    const statsRef = useRef(null);
    const { t, language } = useLanguage();
    const { user, isAuthChecked } = useAuth();

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
            <div className="hero-bg-glow hero-glow-1" />
            <div className="hero-bg-glow hero-glow-2" />
            <div className="hero-grid-lines" />
            <div className="hero-noise" />

            <div className="hero-container">
                {/* ── Left Content ── */}
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        <span>{t.hero.badge}</span>
                    </div>

                    <h1 className="hero-title">
                        <span>{t.hero.titleStart}</span>
                        <br />
                        <span className="hero-title-accent">{t.hero.titleGradient}</span>
                    </h1>

                    <p className="hero-description">{t.hero.description}</p>

                    <div className="hero-actions">
                        {isAuthChecked && (
                            user ? (
                                <>
                                    <Link to="/dashboard" className="hero-btn hero-btn-primary">
                                        <i className="fas fa-tachometer-alt" />
                                        <span>{t.nav.goDashboard}</span>
                                    </Link>
                                    <button
                                        className="hero-btn hero-btn-ghost"
                                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        <i className="fas fa-play" />
                                        <span>{t.hero.watchVideo}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/register" className="hero-btn hero-btn-primary">
                                        <i className="fas fa-rocket" />
                                        <span>{t.hero.startNow}</span>
                                    </Link>
                                    <button
                                        className="hero-btn hero-btn-ghost"
                                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        <i className="fas fa-play" />
                                        <span>{t.hero.watchVideo}</span>
                                    </button>
                                </>
                            )
                        )}
                    </div>

                    <div className="hero-stats" ref={statsRef}>
                        <div className="hero-stat">
                            <div className="hero-stat-value">
                                <span className="stat-number" data-target="150">0</span>
                                <span className="hero-stat-plus">+</span>
                            </div>
                            <span className="hero-stat-label">{t.hero.statCompany}</span>
                        </div>
                        <div className="hero-stat-sep" />
                        <div className="hero-stat">
                            <div className="hero-stat-value">
                                <span className="stat-number" data-target="50000">0</span>
                                <span className="hero-stat-plus">+</span>
                            </div>
                            <span className="hero-stat-label">{t.hero.statConversation}</span>
                        </div>
                        <div className="hero-stat-sep" />
                        <div className="hero-stat">
                            <div className="hero-stat-value">
                                <span className="stat-number" data-target="99">0</span>
                                <span className="hero-stat-plus">%</span>
                            </div>
                            <span className="hero-stat-label">{t.hero.statSatisfaction}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right Visual ── */}
                <div className="hero-visual">
                    <div className="hero-visual-glow" />

                    {/* Floating badges */}
                    <div className="hero-float hero-float-wa">
                        <i className="fab fa-whatsapp" />
                        <span>WhatsApp</span>
                        <span className="hero-float-live" />
                    </div>
                    <div className="hero-float hero-float-tg">
                        <i className="fab fa-telegram-plane" />
                        <span>Telegram</span>
                        <span className="hero-float-live" />
                    </div>
                    <div className="hero-float hero-float-wb">
                        <i className="fas fa-globe" />
                        <span>Web</span>
                    </div>

                    {/* Chat mockup */}
                    <div className="hero-mockup">
                        <div className="hero-mock-header">
                            <div className="hero-mock-dots">
                                <span /><span /><span />
                            </div>
                            <span className="hero-mock-title">VOXIO</span>
                            <div className="hero-mock-online">
                                <span className="hero-mock-pulse" />
                                {isAr ? 'متصل' : 'Online'}
                            </div>
                        </div>

                        <div className="hero-mock-body">
                            <div className="hero-msg hero-msg-ai hero-msg-anim-1">
                                <div className="hero-msg-avatar">
                                    <i className="fas fa-robot" />
                                </div>
                                <div className="hero-msg-bubble">
                                    {isAr ? 'مرحباً! كيف يمكنني مساعدتك اليوم؟' : 'Hi! How can I help you today?'}
                                </div>
                            </div>

                            <div className="hero-msg hero-msg-user hero-msg-anim-2">
                                <div className="hero-msg-bubble hero-msg-bubble-user">
                                    {isAr ? 'أريد معرفة أسعار الباقات' : 'I want to see pricing plans'}
                                </div>
                            </div>

                            <div className="hero-msg hero-msg-ai hero-msg-anim-3">
                                <div className="hero-msg-avatar">
                                    <i className="fas fa-robot" />
                                </div>
                                <div className="hero-msg-bubble">
                                    {isAr ? 'سأوجهك الآن لصفحة الأسعار...' : 'Let me navigate you to pricing...'}
                                </div>
                            </div>

                            <div className="hero-msg-action hero-msg-anim-4">
                                <i className="fas fa-compass" />
                                <span>{isAr ? 'يتحرك إلى: #pricing' : 'Navigating to: #pricing'}</span>
                                <div className="hero-msg-progress" />
                            </div>

                            <div className="hero-msg-typing hero-msg-anim-5">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>

                    {/* Stats floating card */}
                    <div className="hero-float-card">
                        <div className="hero-float-card-icon">
                            <i className="fas fa-chart-line" />
                        </div>
                        <div className="hero-float-card-info">
                            <span className="hero-float-card-value">+127%</span>
                            <span className="hero-float-card-label">{isAr ? 'تحويلات اليوم' : "Today's Conversions"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="hero-scroll">
                <div className="hero-scroll-mouse">
                    <div className="hero-scroll-wheel" />
                </div>
                <span>{t.hero.scrollMore}</span>
            </div>
        </section>
    );
};

export default Hero;
