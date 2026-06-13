import { useLanguage } from '../context/LanguageContext';
import './Contact.css';

const Contact = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">
            {isAr ? '📬 اتصل بنا' : '📬 Contact'}
          </span>
          <h2 className="section-title">
            {isAr ? 'تواصل معنا' : 'Get in touch'}
          </h2>
          <p className="section-description">
            {isAr
              ? 'نحن هنا للإجابة على استفساراتك. تواصل معنا عبر البريد الإلكتروني أو من خلال نموذج الاتصال.'
              : 'We are here to answer your questions. Reach out via email or through the contact form.'
            }
          </p>
        </div>

        <div className="contact-links">
          <a href="mailto:support@voxio.com" className="contact-link-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
            <div className="contact-link-text">
              <span className="contact-link-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
              <span className="contact-link-value">support@voxio.com</span>
            </div>
          </a>

          <a href="/contact-form" className="contact-link-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div className="contact-link-text">
              <span className="contact-link-label">{isAr ? 'نموذج الاتصال' : 'Contact Form'}</span>
              <span className="contact-link-value">{isAr ? 'أرسل رسالة مباشرة' : 'Send a direct message'}</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
