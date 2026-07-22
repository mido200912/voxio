import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { FaWhatsapp, FaInstagram, FaTelegramPlane, FaShopify } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import './Logos.css';

const companies = [
  { name: 'Shopify', icon: FaShopify },
  { name: 'WhatsApp', icon: FaWhatsapp },
  { name: 'Telegram', icon: FaTelegramPlane },
  { name: 'Instagram', icon: FaInstagram },
  { name: 'X (Twitter)', icon: FaXTwitter },
];

const duplicatedLogos = [...companies, ...companies];

const Logos = () => {
  const { language } = useLanguage();
  const revealRef = useScrollReveal();
  const isAr = language === 'ar';

  return (
    <section className="logos" aria-label="Trusted companies">
      <div className="logos-track-wrapper reveal-section" ref={revealRef}>
        <div className="logos-track">
          {duplicatedLogos.map((company, i) => (
            <div
              key={`${company.name}-${i}`}
              className="logo-item"
              title={company.name}
            >
              <span className="logo-icon">
                <company.icon size={30} />
              </span>
              <span className="logo-name">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Logos;
