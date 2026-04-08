import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ChatPage = () => {
    const { slug } = useParams();
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.app.vercel/api';

    useEffect(() => {
        const fetchChatbot = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/chatbot-editor/page/${slug}`);
                setHtmlContent(res.data.htmlContent);
            } catch (err) {
                console.error('Failed to load chatbot:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchChatbot();
    }, [slug]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                background: '#0a0a0f',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                fontFamily: "'Inter', sans-serif",
                color: '#71717a'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(99,102,241,0.2)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <p>Loading...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                height: '100vh',
                background: '#0a0a0f',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                fontFamily: "'Inter', sans-serif",
                color: '#e4e4e7'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    marginBottom: '8px'
                }}>
                    <i className="fas fa-exclamation-triangle" style={{ color: 'white' }}></i>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Chatbot Not Found</h2>
                <p style={{ color: '#71717a', fontSize: '14px' }}>The chatbot page you're looking for doesn't exist.</p>
            </div>
        );
    }

    return (
        <iframe
            srcDoc={htmlContent}
            title="Chatbot"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
                width: '100%',
                height: '100vh',
                border: 'none',
                display: 'block',
                background: '#0a0a0f'
            }}
        />
    );
};

export default ChatPage;
