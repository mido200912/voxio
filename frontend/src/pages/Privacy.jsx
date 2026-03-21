import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Privacy = () => {
    const { t } = useLanguage();

    return (
        <div className="legal-container" style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', lineHeight: '1.8', color: 'var(--text-primary)' }}>
            <h1 style={{ marginBottom: '10px', fontSize: '2.5rem', fontWeight: 'bold' }}>{t.footer.privacy}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Last Updated: March 2026</p>

            <p>Welcome to Aithor. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regards to your personal information, please contact us.</p>
            <p>This Privacy Policy applies to all information collected through our website, application, services, marketing, and related events (we refer to them collectively in this Privacy Policy as the "Services").</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>1. Information We Collect</h2>
            <h3 style={{ marginTop: '20px', fontSize: '1.3rem', fontWeight: '600' }}>Personal Information You Disclose to Us</h3>
            <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, or otherwise when you contact us.</p>
            <ul style={{ marginLeft: '20px', paddingLeft: '10px', listStyleType: 'disc' }}>
                <li><strong>Personal Info:</strong> Name, email address, passwords, and contact preferences.</li>
                <li><strong>Business Info:</strong> Company name, description, and website URLs.</li>
            </ul>

            <h3 style={{ marginTop: '20px', fontSize: '1.3rem', fontWeight: '600' }}>Information Collected from Third-Party Integrations (TikTok, Meta, etc.)</h3>
            <p>If you choose to link your Aithor account with third-party platforms such as TikTok, Meta (Facebook, Instagram, WhatsApp), or Shopify, we may collect information explicitly permitted by you through their authorization process. This includes profile information, access tokens, and chat history strictly required to provide our AI chatbot services.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>2. How We Use Your Information</h2>
            <p>We use personal information collected via our Services for a variety of business purposes described below:</p>
            <ul style={{ marginLeft: '20px', paddingLeft: '10px', listStyleType: 'disc' }}>
                <li><strong>To facilitate account creation and logon process.</strong></li>
                <li><strong>To provide and manage the Services:</strong> Specifically, to allow your customized AI chatbot to respond to queries on integrated platforms.</li>
                <li><strong>To respond to user inquiries and offer support.</strong></li>
                <li><strong>To enforce our terms, conditions, and policies.</strong></li>
            </ul>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>3. Will Your Information Be Shared With Anyone?</h2>
            <p>We only share and disclose your information in the following situations:</p>
            <ul style={{ marginLeft: '20px', paddingLeft: '10px', listStyleType: 'disc' }}>
                <li><strong>Compliance with Laws:</strong> We may disclose your information where we are legally required to do so.</li>
                <li><strong>Third-Party Service Providers:</strong> We integrate with third-party platforms (e.g., OpenAI, Meta, TikTok) to process chatbot queries. We only share the minimum required data for these integrations to function.</li>
                <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition.</li>
            </ul>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>4. Data Retention and Deletion</h2>
            <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law. </p>
            <h3 style={{ marginTop: '20px', fontSize: '1.3rem', fontWeight: '600' }}>Data Deletion Requests Rights</h3>
            <p>You have the right to request the deletion of your data at any time. To request deletion of your account and all associated data, including data obtained from third-party platforms (like TikTok), please contact our support team at <strong>support@aithor.com</strong> or use the deletion option within your account settings. Upon receiving your request, we will delete or anonymize your information from our active databases within 30 days.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>5. Security of Your Information</h2>
            <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>

            <h2 style={{ marginTop: '40px', fontSize: '1.8rem', fontWeight: '600' }}>6. Contact Us</h2>
            <p>If you have questions or comments about this policy or wish to exercise your data rights, you may email us at:</p>
            <p><strong>Email:</strong> aithor049@gmail.com</p>
        </div>
    );
};

export default Privacy;
