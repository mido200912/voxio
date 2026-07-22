import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Pricing.css';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Pricing = () => {
  const { t } = useLanguage();
  const revealRef = useScrollReveal();

  const plans = [
    {
      name: t.pricing.starter.name,
      price: '0',
      period: t.pricing.month,
      description: t.pricing.starter.desc,
      features: [
        { text: t.pricing.starter.features[0], enabled: true },
        { text: t.pricing.starter.features[1], enabled: true },
        { text: t.pricing.starter.features[2], enabled: true },
        { text: t.pricing.starter.features[3], enabled: false },
        { text: t.pricing.starter.features[4], enabled: false }
      ],
      cta: t.pricing.startFree,
      popular: false
    },
    {
      name: t.pricing.pro.name,
      price: '49',
      period: t.pricing.month,
      description: t.pricing.pro.desc,
      features: [
        { text: t.pricing.pro.features[0], enabled: true },
        { text: t.pricing.pro.features[1], enabled: true },
        { text: t.pricing.pro.features[2], enabled: true },
        { text: t.pricing.pro.features[3], enabled: true },
        { text: t.pricing.pro.features[4], enabled: true }
      ],
      cta: t.pricing.subscribe,
      popular: true
    },
    {
      name: t.pricing.enterprise.name,
      price: '199',
      period: t.pricing.month,
      description: t.pricing.enterprise.desc,
      features: [
        { text: t.pricing.enterprise.features[0], enabled: true },
        { text: t.pricing.enterprise.features[1], enabled: true },
        { text: t.pricing.enterprise.features[2], enabled: true },
        { text: t.pricing.enterprise.features[3], enabled: true },
        { text: t.pricing.enterprise.features[4], enabled: true }
      ],
      cta: t.pricing.contactUs,
      popular: false
    }
  ];

  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.pricing.badge}</span>
          <h2 className="section-title">
            {t.pricing.titleStart} <span className="gradient-text">{t.pricing.titleGradient}</span>
          </h2>
          <p className="section-description">{t.pricing.description}</p>
        </div>

        <div className="pricing-grid reveal-section" ref={revealRef}>
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-card${plan.popular ? ' pricing-card--popular' : ''}`}
              data-reveal-delay={index * 100}
            >
              {plan.popular && (
                <span className="pricing-card__badge">{t.pricing.mostPopular}</span>
              )}
              <div className="pricing-card__header">
                <h3 className="pricing-card__name">{plan.name}</h3>
                <div className="pricing-card__price">
                  <span className="pricing-card__currency">$</span>
                  <span className="pricing-card__amount">{plan.price}</span>
                  <span className="pricing-card__period">/{plan.period}</span>
                </div>
                <p className="pricing-card__desc">{plan.description}</p>
              </div>
              <ul className="pricing-card__features">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`pricing-card__feature${!feature.enabled ? ' pricing-card__feature--disabled' : ''}`}
                  >
                    <span className="pricing-card__feature-icon">
                      {feature.enabled ? <CheckIcon /> : <XIcon />}
                    </span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <button className={`pricing-card__btn${plan.popular ? ' pricing-card__btn--primary' : ' pricing-card__btn--outline'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
