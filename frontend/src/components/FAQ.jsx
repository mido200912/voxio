import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './FAQ.css';

const faqData = {
  en: [
    {
      question: 'What is VOXIO?',
      answer: 'VOXIO is an AI-powered customer service platform that automates responses across WhatsApp, Facebook, Shopify, Telegram, and your website. It helps businesses handle inquiries 24/7 with intelligent, human-like conversations.'
    },
    {
      question: 'How do I connect WhatsApp?',
      answer: 'Connecting WhatsApp is simple. Go to the Integrations page, click on WhatsApp, scan the QR code with your WhatsApp app, and your account is linked. The setup takes less than 2 minutes.'
    },
    {
      question: 'Can I customize the AI responses?',
      answer: 'Absolutely. VOXIO allows you to train the AI on your brand voice, set custom reply templates, define fallback messages, and configure auto-replies for specific keywords. You have full control over the conversation flow.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, we offer a generous free plan that includes up to 500 messages per month across one channel. No credit card required. You can upgrade anytime as your business grows.'
    },
    {
      question: 'What platforms are supported?',
      answer: 'VOXIO currently supports WhatsApp, Facebook Messenger, Instagram, Telegram, Shopify, and custom website widget. We are continuously adding new platforms based on user demand.'
    },
    {
      question: 'How is pricing calculated?',
      answer: 'Pricing is based on the number of messages processed and channels connected. We offer tiered plans starting from the free tier up to enterprise plans with unlimited messages and dedicated support.'
    }
  ],
  ar: [
    {
      question: 'ما هو VOXIO؟',
      answer: 'VOXIO هي منصة ذكاء اصطناعي لخدمة العملاء تعمل على أتمتة الردود عبر واتساب، فيسبوك، شوبيفاي، تلغرام، وموقعك الإلكتروني. تساعد الشركات على التعامل مع الاستفسارات على مدار الساعة بمحادثات ذكية تشبه البشر.'
    },
    {
      question: 'كيف أربط واتساب؟',
      answer: 'ربط واتساب سهل للغاية. اذهب إلى صفحة التكاملات، انقر على واتساب، امسح رمز QR بتطبيق واتساب، وسيتم ربط حسابك. الإعداد يستغرق أقل من دقيقتين.'
    },
    {
      question: 'هل يمكنني تخصيص ردود الذكاء الاصطناعي؟',
      answer: 'بالتأكيد. يتيح لك VOXIO تدريب الذكاء الاصطناعي على صوت علامتك التجارية، وتعيين قوالب ردود مخصصة، وتحديد رسائل احتياطية، وتكوين الردود التلقائية لكلمات مفتاحية محددة. لديك تحكم كامل في تدفق المحادثة.'
    },
    {
      question: 'هل توجد فترة تجريبية مجانية؟',
      answer: 'نعم، نقدم خطة مجانية سخية تشمل حتى 500 رسالة شهرياً عبر قناة واحدة. لا حاجة لبطاقة ائتمانية. يمكنك الترقية في أي وقت مع نمو عملك.'
    },
    {
      question: 'ما المنصات المدعومة؟',
      answer: 'يدعم VOXIO حالياً واتساب، فيسبوك ماسنجر، إنستغرام، تلغرام، شوبيفاي، وأداة الويب المخصصة. نضيف منصات جديدة باستمرار بناءً على طلب المستخدمين.'
    },
    {
      question: 'كيف يتم حساب الأسعار؟',
      answer: 'تعتمد الأسعار على عدد الرسائل المعالجة والقنوات المتصلة. نقدم خططاً متدرجة تبدأ من الخطة المجانية وصولاً إلى خطط المؤسسات مع رسائل غير محدودة ودعم مخصص.'
    }
  ]
};

const ChevronIcon = ({ isOpen }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`faq-chevron ${isOpen ? 'open' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const FAQ = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [openIndex, setOpenIndex] = useState(null);
  const items = isAr ? faqData.ar : faqData.en;

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">
            {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
          </span>
          <h2 className="section-title">
            {isAr ? 'أسئلة مكررة' : 'Frequently asked questions'}
          </h2>
          <p className="section-description">
            {isAr
              ? 'أجوبة على أكثر الأسئلة شيوعاً حول منصة VOXIO'
              : 'Answers to the most common questions about the VOXIO platform'
            }
          </p>
        </div>

        <div className="faq-list">
          {items.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
              >
                <span>{item.question}</span>
                <ChevronIcon isOpen={openIndex === index} />
              </button>
              <div
                className="faq-answer"
                style={{
                  maxHeight: openIndex === index ? `${items.length * 120}px` : '0',
                  opacity: openIndex === index ? 1 : 0
                }}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
