import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './CTASection.css';

const CTASection = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const isAr = language === 'ar';

    return (
        <section className="cta-section" id="cta">
            <div className="container">
                <div className="cta-inner">
                    <h2 className="cta-title">
                        {isAr
                            ? 'ابدأ تحويل خدمة عملائك اليوم'
                            : 'Start transforming your customer service today'
                        }
                    </h2>
                    <p className="cta-subtitle">
                        {isAr
                            ? 'انضم إلى أكثر من 150 شركة تستخدم VOXIO لتقديم تجربة عملاء استثنائية'
                            : 'Join 150+ companies using VOXIO to deliver exceptional customer experiences'
                        }
                    </p>
                    <div className="cta-actions">
                        {user ? (
                            <Link to="/dashboard" className="cta-btn-primary">
                                {isAr ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="cta-btn-primary">
                                    {isAr ? 'ابدأ مجاناً الآن' : 'Start for free'}
                                </Link>
                                <Link to="/contact" className="cta-btn-secondary">
                                    {isAr ? 'تحدث مع فريقنا' : 'Talk to sales'}
                                </Link>
                            </>
                        )}
                    </div>
                    <p className="cta-note">
                        {isAr ? 'لا بطاقة ائتمانية مطلوبة · إعداد في 5 دقائق' : 'No credit card required · 5-minute setup'}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
