import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Terms = () => {
    const { t } = useLanguage();

    return (
        <div className="legal-container" style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', lineHeight: '1.8', color: 'var(--text-primary)' }}>
            <h1 style={{ marginBottom: '10px', fontSize: '2.5rem', fontWeight: 'bold' }}>{t.footer.terms}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Last Updated: March 2026</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>1. Agreement to Terms</h2>
            <p>These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Aithor ("we", "us", or "our"), concerning your access to and use of the Aithor website and application as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site"). You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Service.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>2. Use of the Services</h2>
            <p>Our platform allows you to create AI-powered chatbots and integrate them with various communication platforms, including but not limited to TikTok, Meta platforms, and e-commerce services like Shopify. By using these integrations, you agree to comply strictly with the Terms of Service and Developer Policies of those respective platforms.</p>
            <ul style={{ marginLeft: '20px', paddingLeft: '10px', listStyleType: 'disc' }}>
                <li>You agree not to use our services for spam, harassment, or distributing malware.</li>
                <li>You are entirely responsible for the data and files you upload to train the AI on your account.</li>
                <li>You must not use the services to deceive users or impersonate a human without appropriate disclosures where required by platform policies.</li>
            </ul>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>3. User Data and Privacy</h2>
            <p>We care about data privacy and security. By using the Site, you agree to be bound by our Privacy Policy incorporated into these Terms of Service. Processing of any personal data through third-party integrations (such as TikTok interactions) is done strictly according to our Privacy Policy and the policies of those third-party providers. If you delete your account, you will lose access to all your data immediately.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>4. Intellectual Property Rights</h2>
            <p>Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site and the trademarks, service marks, and logos contained therein are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>5. Third-Party Websites and Content</h2>
            <p>The Site may contain links to other websites ("Third-Party Websites") as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties. Such Content is not investigated, monitored, or checked for accuracy by us, and we are not responsible for any Third-Party Websites accessed through the Site.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>6. Disclaimer and Limitation of Liability</h2>
            <p>THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SITE.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>7. Termination</h2>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>8. Contact Us</h2>
            <p>In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:</p>
            <p><strong>Email:</strong> support@aithor.com</p>
        </div>
    );
};

export default Terms;
