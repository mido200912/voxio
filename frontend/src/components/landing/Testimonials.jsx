import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Testimonials.css';

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const testimonialsData = {
  en: [
    {
      quote: "VOXIO transformed our customer support. We handle 3x more inquiries with the same team.",
      name: "Ahmed Hassan",
      role: "CEO, TechFlow",
      initials: "AH"
    },
    {
      quote: "The WhatsApp integration alone saved us hours every day. Incredible product.",
      name: "Sarah Al-Mansouri",
      role: "Head of CX, Bloom Store",
      initials: "SA"
    },
    {
      quote: "Setup took 20 minutes and we were live. The AI responses feel genuinely human.",
      name: "Omar Khalid",
      role: "Founder, NovaMed",
      initials: "OK"
    }
  ],
  ar: [
    {
      quote: "VOXIO غيّر خدمة العملاء عندنا بالكامل. نتعامل مع ضعف الاستفسارات بنفس الفريق.",
      name: "أحمد حسن",
      role: "رئيس تنفيذي، TechFlow",
      initials: "أح"
    },
    {
      quote: "تكامل واتساب وحده وفّر علينا ساعات يومياً. منتج رائع حقاً.",
      name: "سارة المنصوري",
      role: "مدير تجربة العملاء، Bloom",
      initials: "سم"
    },
    {
      quote: "الإعداد أخذ 20 دقيقة وكنا نعمل. ردود الذكاء الاصطناعي تبدو إنسانية فعلاً.",
      name: "عمر خالد",
      role: "مؤسس، NovaMed",
      initials: "عخ"
    }
  ]
};

const avatarColors = ['#6C63FF', '#F59E0B', '#22c55e'];

const Testimonials = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const revealRef = useScrollReveal();
  const testimonials = isAr ? testimonialsData.ar : testimonialsData.en;

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">
            {isAr ? '⭐ شهادات العملاء' : '⭐ Testimonials'}
          </span>
          <h2 className="section-title">
            {isAr ? 'ماذا يقول عملاؤنا' : 'What our customers say'}
          </h2>
          <p className="section-description">
            {isAr
              ? 'آلاف الشركات تثق في VOXIO لإدارة خدمة عملائها'
              : 'Thousands of businesses trust VOXIO to power their customer experience'
            }
          </p>
        </div>

        <div className="testimonials-grid reveal-section" ref={revealRef}>
          {testimonials.map((item, idx) => (
            <div key={idx} className="testimonial-card" data-reveal-delay={idx * 100}>
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <blockquote className="testimonial-quote">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="testimonial-author">
                <div
                  className="testimonial-avatar"
                  style={{ background: avatarColors[idx % avatarColors.length] }}
                >
                  {item.initials}
                </div>
                <div className="testimonial-info">
                  <span className="testimonial-name">{item.name}</span>
                  <span className="testimonial-role">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
