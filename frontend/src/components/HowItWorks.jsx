import { useLanguage } from '../context/LanguageContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './HowItWorks.css';

const stepsData = (t) => [
  {
    number: '01',
    title: t.howItWorks.step1Title,
    description: t.howItWorks.step1Desc
  },
  {
    number: '02',
    title: t.howItWorks.step2Title,
    description: t.howItWorks.step2Desc
  },
  {
    number: '03',
    title: t.howItWorks.step3Title,
    description: t.howItWorks.step3Desc
  },
  {
    number: '04',
    title: t.howItWorks.step4Title,
    description: t.howItWorks.step4Desc
  }
];

const HowItWorks = () => {
  const { t } = useLanguage();
  const revealRef = useScrollReveal();
  const steps = stepsData(t);

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.howItWorks.badge}</span>
          <h2 className="section-title">
            {t.howItWorks.titleStart} <span className="gradient-text">VOXIO</span>?
          </h2>
          <p className="section-description">
            {t.howItWorks.description}
          </p>
        </div>

        <div className="steps-container reveal-section" ref={revealRef}>
          <div className="steps-line">
            <div className="steps-line-progress"></div>
          </div>
          {steps.map((step, index) => (
            <div key={index} className="step-wrapper" data-reveal-delay={index * 150}>
              <div className="step-card">
                <div className="step-icon-wrapper">
                  <span className="step-number">{step.number}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
