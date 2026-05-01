import { useLanguage } from '../context/LanguageContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './Features.css';

const Features = () => {
    const { t } = useLanguage();
    const revealRef = useScrollReveal();

    const features = [
        {
            icon: 'fa-brain',
            title: t.features.aiTitle,
            description: t.features.aiDesc,
            list: t.features.aiList,
            featured: false
        },
        {
            icon: 'fa-plug',
            title: t.features.integrationTitle,
            description: t.features.integrationDesc,
            list: t.features.integrationList,
            featured: true
        },
        {
            icon: 'fa-shield-alt',
            title: t.features.securityTitle,
            description: t.features.securityDesc,
            list: t.features.securityList,
            featured: false
        },
        {
            icon: 'fa-clock',
            title: t.features.clockTitle,
            description: t.features.clockDesc,
            list: [],
            featured: false
        },
        {
            icon: 'fa-chart-bar',
            title: t.features.analyticsTitle,
            description: t.features.analyticsDesc,
            list: [],
            featured: false
        },
        {
            icon: 'fa-code',
            title: t.features.apiTitle,
            description: t.features.apiDesc,
            list: [],
            featured: false
        }
    ];

    return (
        <section className="features" id="features">
            <div className="features-bg-gradient" />
            <div className="container">
                <div className="section-header">
                    <span className="section-badge">{t.features.badge}</span>
                    <h2 className="section-title">
                        {t.features.titleStart} <span className="gradient-text">VOXIO</span>?
                    </h2>
                    <p className="section-description">
                        {t.features.description}
                    </p>
                </div>

                <div className="features-grid reveal-section" ref={revealRef}>
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`feature-card ${feature.featured ? 'featured' : ''}`}
                            data-reveal-delay={index * 100}
                        >
                            {feature.featured && (
                                <div className="featured-badge">{t.features.mostPopular}</div>
                            )}
                            <div className="feature-icon">
                                <i className={`fas ${feature.icon}`}></i>
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                            {feature.list.length > 0 && (
                                <ul className="feature-list">
                                    {feature.list.map((item, idx) => (
                                        <li key={idx}>
                                            <i className="fas fa-check"></i> {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
