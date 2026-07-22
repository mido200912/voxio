import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Features.css';

const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 0 0-4 4c0 1.1.5 2 1.2 2.6A4 4 0 0 0 8 12a4 4 0 0 0 3 3.9V20" />
    <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.5 2-1.2 2.6A4 4 0 0 1 16 12a4 4 0 0 1-3 3.9V20" />
    <path d="M8 20h8" />
    <path d="M10 16v4" />
    <path d="M14 16v4" />
  </svg>
);

const PlugIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3v5" />
    <path d="M14 3v5" />
    <path d="M5 10h14" />
    <path d="M7 10v5a5 5 0 0 0 10 0v-5" />
    <path d="M12 15v4" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a16 16 0 0 1 8 4 16 16 0 0 1-8 4 16 16 0 0 1-8-4 16 16 0 0 1 8-4Z" />
    <path d="M4 6v6a8 8 0 0 0 8 8 8 8 0 0 0 8-8V6" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const featuresData = (t) => [
  {
    icon: <BrainIcon />,
    title: t.features.aiTitle,
    description: t.features.aiDesc,
    list: t.features.aiList,
    featured: false
  },
  {
    icon: <PlugIcon />,
    title: t.features.integrationTitle,
    description: t.features.integrationDesc,
    list: t.features.integrationList,
    featured: true
  },
  {
    icon: <ShieldIcon />,
    title: t.features.securityTitle,
    description: t.features.securityDesc,
    list: t.features.securityList,
    featured: false
  },
  {
    icon: <ClockIcon />,
    title: t.features.clockTitle,
    description: t.features.clockDesc,
    list: [],
    featured: false
  },
  {
    icon: <ChartIcon />,
    title: t.features.analyticsTitle,
    description: t.features.analyticsDesc,
    list: [],
    featured: false
  },
  {
    icon: <CodeIcon />,
    title: t.features.apiTitle,
    description: t.features.apiDesc,
    list: [],
    featured: false
  }
];

const Features = () => {
  const { t } = useLanguage();
  const revealRef = useScrollReveal();
  const features = featuresData(t);

  return (
    <section className="features" id="features">
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
              className={`feature-card${feature.featured ? ' featured' : ''}`}
              data-reveal-delay={index * 100}
            >
              {feature.featured && (
                <div className="featured-badge">{t.features.mostPopular}</div>
              )}
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              {feature.list.length > 0 && (
                <ul className="feature-list">
                  {feature.list.map((item, idx) => (
                    <li key={idx}>
                      <CheckIcon /> {item}
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
