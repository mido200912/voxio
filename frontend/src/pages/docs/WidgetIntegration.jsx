import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSEO } from '../../hooks/useSEO';

const WidgetIntegration = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  useSEO({
    title: t('VOXIO Docs | Website Widget Integration', 'توثيق VOXIO | تضمين ودجت الموقع'),
    description: t('Easily embed the VOXIO AI Chat widget on your website using a single script tag. Compatible with React, HTML, WordPress, and more.', 'قم بتضمين ودجت محادثة VOXIO بسهولة في موقعك باستخدام سطر واحد. متوافق مع كافة المنصات.'),
    keywords: 'Website chatbot widget, Embed VOXIO widget, React chatbot component, AI chat widget, تضمين بوت المحادثة, ودجت ذكاء اصطناعي',
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": t('Website Widget Integration', 'تضمين ودجت الموقع'),
      "description": t('How to embed VOXIO widget.', 'كيفية تضمين ودجت VOXIO في موقعك.'),
      "author": { "@type": "Organization", "name": "VOXIO" },
      "articleSection": "Documentation"
    }
  });

  return (
    <section className="docs-section" style={{ padding: '0' }}>
      <div className="docs-section-header" style={{ marginBottom: '2rem' }}>
        <div className="docs-section-icon" style={{ background: '#6C63FF', color: '#fff' }}>
          <i className="fas fa-window-maximize" />
        </div>
        <div>
          <h2>{t('Website Widget Integration', 'تضمين ودجت الموقع (Website Widget)')}</h2>
          <p>{t('Add a beautiful AI chat interface to any website in seconds.', 'أضف واجهة محادثة ذكية وأنيقة لأي موقع في ثوانٍ.')}</p>
        </div>
      </div>

      <div className="docs-text-content">
        <p className="docs-lead">
          {t('The fastest way to deploy your VOXIO agent is by embedding our native Web Widget. It works out-of-the-box on plain HTML websites, WordPress, Shopify stores, and modern frontend frameworks like React or Vue.', 'أسرع طريقة لنشر وكيلك الذكي هي عن طريق تضمين ودجت الموقع الخاص بنا. يعمل فوراً على مواقع HTML العادية، ووردبريس، شوبيفاي، وأطر العمل الحديثة.')}
        </p>

        <h3>{t('Standard HTML / WordPress Integration', 'التضمين في HTML أو ووردبريس')}</h3>
        <p>
          {t('Copy the snippet below and paste it just before the closing </body> tag of your website.', 'انسخ الكود أدناه والصقه قبل وسم الإغلاق </body> في موقعك.')}
        </p>
        <div className="docs-code-block">
          <pre>{`<!-- VOXIO Web Widget -->
<script 
  src="https://api.voxio.com/widget.js" 
  data-api-key="YOUR_COMPANY_API_KEY"
  data-primary-color="#6C63FF"
  data-launcher-color="#1e293b"
  async
></script>`}</pre>
        </div>

        <h3>{t('React / Next.js Integration', 'التضمين في React أو Next.js')}</h3>
        <p>
          {t('For SPA applications, you can inject the script dynamically inside a useEffect hook.', 'لتطبيقات الصفحة الواحدة، يمكنك إدراج السكريبت برمجياً داخل خطاف useEffect.')}
        </p>
        <div className="docs-code-block">
          <pre>{`import { useEffect } from 'react';

export default function VoxioWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://api.voxio.com/widget.js";
    script.setAttribute('data-api-key', "YOUR_COMPANY_API_KEY");
    script.setAttribute('data-primary-color', "#6C63FF");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`}</pre>
        </div>

        <div className="docs-callout info">
          <i className="fas fa-palette" />
          <p>{t('Customization: You can change the launcher icon color and the primary theme color by modifying the data- attributes in the script tag.', 'التخصيص: يمكنك تغيير لون أيقونة الإطلاق واللون الأساسي من خلال تعديل الخصائص في الكود.')}</p>
        </div>

        <h3 style={{ marginTop: '3rem' }}>{t('Custom Hosted Web Interface', 'واجهة الويب المستضافة (Hosted Web Interface)')}</h3>
        <p>
          {t('Do not have a website? No problem. VOXIO provides a standalone, beautifully designed web interface for your chatbot that you can share directly with your customers. You can fully customize this page to match your brand.', 'ليس لديك موقع إلكتروني؟ لا مشكلة. تقدم منصة VOXIO واجهة ويب مستقلة ومصممة بأناقة لبوت المحادثة الخاص بك، يمكنك مشاركتها مباشرة مع عملائك، وتخصيصها بالكامل لتطابق هويتك البصرية.')}
        </p>

        <h4>{t('How to Setup and Customize Your Hosted Web Page:', 'كيفية إعداد وتخصيص صفحة الويب المستضافة:')}</h4>
        <ol style={{ marginLeft: isAr ? '0' : '20px', marginRight: isAr ? '20px' : '0', marginBottom: '2rem', lineHeight: '1.8' }}>
          <li><strong>{t('Unique Slug:', 'الرابط المخصص:')}</strong> {t('Every company gets a unique link based on their company name (e.g., voxio.com/chat/your-company). You can find your exact link in the Dashboard under "Website Chat".', 'كل شركة تحصل على رابط مخصص بناءً على اسمها. يمكنك العثور على رابطك المباشر في لوحة التحكم تحت تبويب "Website Chat".')}</li>
          <li><strong>{t('Change Logo & Colors:', 'تغيير الشعار والألوان:')}</strong> {t('Go to Dashboard > Settings. Upload your Company Logo, and it will automatically replace the VOXIO logo on your hosted chat page.', 'اذهب إلى لوحة التحكم > الإعدادات (Settings). قم برفع شعار شركتك (Logo)، وسيتم استبدال شعار المنصة بشعارك فوراً في واجهة المحادثة.')}</li>
          <li><strong>{t('Welcome Message:', 'رسالة الترحيب:')}</strong> {t('In the Chatbot Editor tab, you can set the "Initial Message". This is the first message the AI sends when a customer opens your link.', 'في تبويب Chatbot Editor، يمكنك تعيين "رسالة الترحيب" لتكون أول رسالة تظهر للعميل عند فتحه للرابط.')}</li>
          <li><strong>{t('Tone and Instructions:', 'نبرة الصوت والتعليمات:')}</strong> {t('Update the System Prompt in AI Training to dictate exactly how the bot should talk (e.g., formal, friendly, using emojis). The hosted web page inherits all these rules instantly.', 'قم بتحديث تعليمات البوت (System Prompt) لتحديد نبرة الصوت (رسمي، ودود). صفحة الويب ترث هذه الإعدادات لحظياً.')}</li>
        </ol>
        
        <img src="/docs-assets/widget_settings.png" alt="Widget Customization Dashboard" className="docs-image" />

        <div className="docs-code-block success">
          <div className="docs-code-header"><span>{t('Example Link', 'مثال للرابط')}</span></div>
          <pre>{`https://voxio.com/chat/my-awesome-company`}</pre>
        </div>
      </div>
    </section>
  );
};

export default WidgetIntegration;
