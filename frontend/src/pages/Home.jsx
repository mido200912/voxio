import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Integrations from '../components/Integrations';
import Pricing from '../components/Pricing';
import Contact from '../components/Contact';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
    const { language } = useLanguage();
    const isAr = language === 'ar';
    const t = (en, ar) => (isAr ? ar : en);

    useSEO({
        title: t('VOXIO - AI Customer Service Platform', 'VOXIO - منصة الذكاء الاصطناعي لخدمة العملاء'),
        description: t('Automate your customer service with VOXIO. AI chatbots for WhatsApp, Shopify, Facebook, and your Website.', 'أتمت خدمة عملائك مع VOXIO. روبوتات محادثة ذكية للواتساب، شوبيفاي، فيسبوك، وموقعك الخاص.'),
        keywords: 'AI Chatbot, Customer Service Automation, WhatsApp Bot, Shopify Bot, VOXIO, روبوت محادثة, ذكاء اصطناعي, خدمة عملاء, واتساب بيزنس',
        schema: {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "VOXIO",
              "url": "https://voxio.com/",
              "logo": "https://voxio.com/logodark.png",
              "description": "VOXIO is an AI-powered platform for automating customer service across WhatsApp, Facebook, Shopify, and websites.",
              "sameAs": [
                "https://www.facebook.com/voxio",
                "https://twitter.com/voxio"
              ]
            },
            {
              "@type": "SoftwareApplication",
              "name": "VOXIO AI Chatbot Platform",
              "operatingSystem": "Web",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            },
            {
              "@type": "WebSite",
              "url": "https://voxio.com/",
              "name": "VOXIO",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://voxio.com/docs?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          ]
        }
    });

    return (
        <div className="home-page">
            <Navbar />
            <main>
                <Hero />
                <Features />
                <HowItWorks />
                <Integrations />
                <Pricing />
                <Contact />
            </main>
            <Footer />
        </div>
    );
};

export default Home;
