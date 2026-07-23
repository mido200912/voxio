import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Hero.css';

const RobotIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
);

const CompassIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);

const TerminalIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28C840" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const Hero = () => {
    const { language } = useLanguage();
    const revealRef = useScrollReveal();
    const isAr = language === 'ar';
    const splineRef = useRef(null);

    useEffect(() => {
        const spline = splineRef.current;
        if (spline) {
            const handleLoad = () => {
                const loader = document.getElementById('splash-loader');
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => { loader.style.display = 'none'; }, 500);
                }
            };
            spline.addEventListener('load', handleLoad);
            
            // Clean up
            return () => spline.removeEventListener('load', handleLoad);
        }
    }, []);

    return (
        <section className="hero" id="home">
            <div className="hero-container reveal-section" ref={revealRef}>
                
                <div className="hero-top">
                    {/* Floating 3D Model */}
                    <div className="hero-spline-floating">
                        <spline-viewer 
                            ref={splineRef}
                            url="https://prod.spline.design/KTKziaT8O4beJSVR/scene.splinecode"
                            className="hero-spline-model"
                        ></spline-viewer>
                        <div className="spline-watermark-hide"></div>
                    </div>

                    <div className="hero-text-content">
                        <h1 className="hero-title">
                            {isAr 
                                ? 'نظام خدمة العملاء الذكي للفرق الطموحة' 
                                : 'The AI customer service system for forward-thinking teams'}
                        </h1>
                        <p className="hero-description">
                            {isAr 
                                ? 'مصمم خصيصاً لأتمتة الدعم وزيادة المبيعات. مبني لعصر الذكاء الاصطناعي.' 
                                : 'Purpose-built for automating support and boosting sales. Designed for the AI era.'}
                        </p>
                    </div>

                    <div className="hero-side-content">
                        <Link to="/register" className="hero-announcement">
                            <span className="hero-announcement-dot" />
                            <span>
                                {isAr ? 'المحادثات التقليدية انتهت' : 'Traditional chat is dead'} 
                                <span className="hero-announcement-link"> voxio.ai/next &rarr;</span>
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="hero-visual-wrapper">
                    <div className="hero-visual">
                        <div className="glow-bg"></div>
                        <div className="hero-browser">
                            <div className="hero-browser-bar">
                                <div className="hero-browser-dots">
                                    <span /><span /><span />
                                </div>
                                <div className="hero-browser-url">
                                    <CompassIcon /> app.voxio.ai/agents
                                </div>
                            </div>

                            <div className="hero-dashboard">
                                {/* Sidebar */}
                                <div className="hero-sidebar">
                                    <div className="hero-sidebar-header">
                                        {isAr ? 'الوكلاء النشطين' : 'Active Agents'}
                                    </div>
                                    <div className="hero-sidebar-list">
                                        <div className="hero-sidebar-item active">
                                            <span className="status-dot green"></span>
                                            {isAr ? 'بوت الدعم الفني' : 'Support Bot'}
                                        </div>
                                        <div className="hero-sidebar-item">
                                            <span className="status-dot green"></span>
                                            {isAr ? 'بوت المبيعات' : 'Sales Bot'}
                                        </div>
                                        <div className="hero-sidebar-item">
                                            <span className="status-dot yellow"></span>
                                            {isAr ? 'بوت الفواتير' : 'Billing Bot'}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Chat Area */}
                                <div className="hero-main-pane">
                                    <div className="hero-mock-header">
                                        <span className="hero-mock-title">
                                            <UserIcon /> {isAr ? 'محادثة مع عميل #8492' : 'Session #8492'}
                                        </span>
                                        <div className="hero-mock-badge">
                                            {isAr ? 'طلب أولوية' : 'High Priority'}
                                        </div>
                                    </div>

                                    <div className="hero-browser-body">
                                        <div className="hero-msg hero-msg-user hero-msg-anim-1">
                                            <div className="hero-msg-bubble hero-msg-bubble-user">
                                                {isAr ? 'مرحباً، هل يمكنني ترقية باقتي إلى Pro؟' : 'Hi, can I upgrade my subscription to Pro?'}
                                            </div>
                                        </div>

                                        <div className="hero-msg-tool hero-msg-anim-2">
                                            <div className="tool-header">
                                                <TerminalIcon />
                                                <span>{isAr ? 'يعمل الوكيل على تحليل الطلب' : 'Agent analyzing intent...'}</span>
                                            </div>
                                            <div className="tool-body">
                                                <div className="tool-step">
                                                    <span className="tool-text">function_call: <span className="highlight">update_subscription</span></span>
                                                </div>
                                                <div className="tool-step success">
                                                    <CheckIcon /> <span className="tool-text">{isAr ? 'تم تنفيذ الترقية بنجاح' : 'Successfully upgraded to Pro'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hero-msg hero-msg-ai hero-msg-anim-3">
                                            <div className="hero-msg-avatar">
                                                <RobotIcon />
                                            </div>
                                            <div className="hero-msg-bubble">
                                                {isAr ? 'لقد قمت بترقية باقتك إلى Pro بنجاح! هل تحتاج لأي شيء آخر؟ 🎉' : 'I have successfully upgraded your subscription to Pro! Is there anything else you need? 🎉'}
                                            </div>
                                        </div>
                                        
                                        {/* Input Box Mockup */}
                                        <div className="hero-input-mock hero-msg-anim-4">
                                            <span className="hero-input-placeholder">{isAr ? 'جاري الكتابة...' : 'Reply to customer...'}</span>
                                            <div className="hero-input-shortcut">⌘ ⏎</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Hero;
