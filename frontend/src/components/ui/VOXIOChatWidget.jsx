import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './VOXIOChatWidget.css';

const MAX_AUTO_PROMPT_DEPTH = 1;
const COPILOT_PENDING_PROMPT_KEY = 'vx_copilot_pending_prompt';

// ─── Typewriter effect for latest AI message only ─────────────────────────────
const TypewriterText = ({ text, speed = 14 }) => {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const iv = setInterval(() => {
            if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
            else clearInterval(iv);
        }, speed);
        return () => clearInterval(iv);
    }, [text, speed]);
    return <>{displayed}</>;
};

// ─── Voice Wave ───────────────────────────────────────────────────────────────
const VoiceWave = () => (
    <div className="vx-voice-wave">
        {[...Array(5)].map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />)}
    </div>
);

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS_AR = [
    { icon: '🚀', label: 'ابدأ الإعداد', prompt: 'كيف أبدأ في إعداد الـ AI agent الخاص بي؟' },
    { icon: '💬', label: 'ربط واتساب', prompt: 'كيف أربط الـ AI بواتساب؟' },
    { icon: '📊', label: 'عرض التحليلات', prompt: 'أرني صفحة التحليلات' },
    { icon: '⚙️', label: 'الإعدادات', prompt: 'افتح إعدادات الحساب' },
];
const QUICK_ACTIONS_EN = [
    { icon: '🚀', label: 'Get Started', prompt: 'How do I set up my AI agent?' },
    { icon: '💬', label: 'Connect WhatsApp', prompt: 'How do I connect WhatsApp?' },
    { icon: '📊', label: 'View Analytics', prompt: 'Show me the analytics page' },
    { icon: '⚙️', label: 'Settings', prompt: 'Open account settings' },
];

// ─────────────────────────────────────────────────────────────────────────────
const VOXIOChatWidget = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isArabic = language === 'ar';

    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('ai');
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: 'مرحباً بك في VOXIO! 👋 أنا مساعدك الذكي، كيف يمكنني مساعدتك؟'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [agentActing, setAgentActing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [hasNewMsg, setHasNewMsg] = useState(false);
    const [agentProgress, setAgentProgress] = useState(0);
    const [latestBotId, setLatestBotId] = useState(null);
    const [showQuickActions, setShowQuickActions] = useState(true);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const autoPromptDepthRef = useRef(0);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const [sessionId] = useState(() => {
        let sid = localStorage.getItem('voxio_sid');
        if (!sid) { sid = 'sess_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('voxio_sid', sid); }
        return sid;
    });

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) { setTimeout(() => inputRef.current?.focus(), 300); setHasNewMsg(false); }
    }, [isOpen]);

    // Agent progress bar animation
    useEffect(() => {
        if (agentActing) {
            setAgentProgress(0);
            const t = setInterval(() => setAgentProgress(p => Math.min(p + 2, 92)), 60);
            return () => clearInterval(t);
        } else {
            setAgentProgress(100);
            setTimeout(() => setAgentProgress(0), 500);
        }
    }, [agentActing]);

    const toggleChat = () => setIsOpen(o => !o);

    // ─── Page Context ─────────────────────────────────────────────────────────
    const collectPageContext = () => {
        try {
            return {
                url: window.location.href,
                title: document.title,
                links: [...document.querySelectorAll('a[href]')].slice(0, 25).map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') })),
                buttons: [...document.querySelectorAll('button, .btn, [role="button"]')].slice(0, 20).map(b => ({ text: b.innerText.trim() })),
                headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 10).map(h => ({ text: h.innerText.trim() })),
            };
        } catch { return null; }
    };

    const findElement = (selector) => {
        if (!selector) return null;
        try {
            let el = document.querySelector(selector);
            if (el) return el;
            el = document.getElementById(selector);
            if (el) return el;
            const all = [...document.querySelectorAll('a, button, [role="button"]')];
            return all.find(e => e.innerText.trim().toLowerCase() === selector.toLowerCase());
        } catch { return null; }
    };

    const showAiCursor = (targetEl) => {
        let cursor = document.getElementById('voxio-ai-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'voxio-ai-cursor';
            cursor.style.cssText = `
                position:fixed;width:36px;height:36px;pointer-events:none;z-index:2147483646;
                background:radial-gradient(circle,rgba(139,92,246,1) 0%,rgba(109,40,217,0.8) 60%,transparent 100%);
                border-radius:50%;box-shadow:0 0 20px rgba(139,92,246,0.8),0 0 40px rgba(139,92,246,0.4);
                transition:all 0.5s cubic-bezier(0.34,1.56,0.64,1);transform:scale(0);opacity:0;
            `;
            document.body.appendChild(cursor);
        }
        const rect = targetEl.getBoundingClientRect();
        cursor.style.left = (rect.left + rect.width / 2 - 18) + 'px';
        cursor.style.top = (rect.top + rect.height / 2 - 18) + 'px';
        requestAnimationFrame(() => { cursor.style.transform = 'scale(1)'; cursor.style.opacity = '1'; });
        setTimeout(() => {
            cursor.style.transform = 'scale(0)'; cursor.style.opacity = '0';
            setTimeout(() => cursor.remove(), 500);
        }, 1800);
    };

    const showNavigationEffect = () => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483645;pointer-events:none;
            background:radial-gradient(circle at center,rgba(139,92,246,0.12) 0%,transparent 70%);
            opacity:1;transition:opacity 0.7s ease-out;
        `;
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.style.opacity = '0'; }, 50);
        setTimeout(() => overlay.remove(), 800);
    };

    const sendPromptToCopilot = (text) => {
        if (!text) return;
        localStorage.setItem(COPILOT_PENDING_PROMPT_KEY, text);
        window.postMessage({ type: 'VOXIO_COPILOT_CHAT', message: text }, window.location.origin);
    };

    // ─── Parse & Execute Agent Commands ──────────────────────────────────────
    const parseAndExecuteCommands = (rawReply, autoPromptCallback) => {
        let reply = rawReply;
        let hasAction = false;
        const commands = [];
        let autoPromptText = null;

        const handle = (pattern, actionType) => {
            const re = new RegExp(pattern, 'g');
            reply = reply.replace(re, (match, param) => {
                commands.push({ type: actionType, param: param.trim() });
                hasAction = true;
                return '';
            });
        };

        handle('\\[NAVIGATE:\\s*(.*?)\\]', 'NAVIGATE');
        handle('\\[SCROLL:\\s*(.*?)\\]', 'SCROLL');
        handle('\\[CLICK:\\s*(.*?)\\]', 'CLICK');

        reply = reply.replace(/\[AUTO_PROMPT:\s*(.*?)\]/g, (match, text) => {
            autoPromptText = text.trim(); return '';
        });
        reply = reply.replace(/\[AGENT_DONE\]/g, '').trim();

        const canAutoPrompt = autoPromptText && autoPromptDepthRef.current < MAX_AUTO_PROMPT_DEPTH;
        const copilotNavigation = commands.find(cmd =>
            cmd.type === 'NAVIGATE' && cmd.param.replace(/\/$/, '') === '/dashboard/ai-copilot'
        );

        if (hasAction && commands.length > 0) {
            setAgentActing(true);
            const executeNext = (index) => {
                if (index >= commands.length) {
                    setTimeout(() => setAgentActing(false), 2000);
                    return;
                }
                const cmd = commands[index];
                if (cmd.type === 'NAVIGATE') {
                    showNavigationEffect();
                    navigate(cmd.param);
                    setTimeout(() => executeNext(index + 1), 1000);
                } else if (cmd.type === 'SCROLL') {
                    const el = findElement(cmd.param);
                    if (el) { showAiCursor(el); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                    setTimeout(() => executeNext(index + 1), 800);
                } else if (cmd.type === 'CLICK') {
                    const el = findElement(cmd.param);
                    if (el) {
                        showAiCursor(el);
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => { el.click(); executeNext(index + 1); }, 600);
                    } else { executeNext(index + 1); }
                }
            };
            setTimeout(() => {
                executeNext(0);
                if (canAutoPrompt && autoPromptCallback) {
                    autoPromptDepthRef.current += 1;
                    if (copilotNavigation) {
                        setTimeout(() => sendPromptToCopilot(autoPromptText), 1500 + commands.length * 800);
                    } else {
                        setTimeout(() => autoPromptCallback(autoPromptText), 1500 + commands.length * 800);
                    }
                }
            }, 100);
        } else if (canAutoPrompt && autoPromptCallback) {
            autoPromptDepthRef.current += 1;
            setTimeout(() => autoPromptCallback(autoPromptText), 1000);
        }
        return reply.trim();
    };

    // ─── Send Message (identical logic to original) ───────────────────────────
    const sendMessage = async (eOrText, opts = {}) => {
        if (eOrText && eOrText.preventDefault) eOrText.preventDefault();

        const textValue = typeof eOrText === 'string' ? eOrText : input;
        if (!textValue.trim()) return;

        const isAutoPrompt = !!opts.isAutoPrompt;
        if (!isAutoPrompt) autoPromptDepthRef.current = 0;

        setShowQuickActions(false);
        const userMsg = { id: Date.now(), role: 'user', content: textValue, isAutoPrompt };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // ── Support Mode ──
        if (mode === 'support') {
            try {
                await axios.post(`${BACKEND_URL}/support/submit`, {
                    name: 'Widget User',
                    email: `widget_${sessionId}@voxio.ai`,
                    subject: 'Widget Support Message',
                    message: textValue
                });
                const bid = Date.now() + 1;
                setMessages(prev => [...prev, {
                    id: bid, role: 'assistant success',
                    content: isArabic ? '✅ تم إرسال رسالتك لفريق الدعم، سيتم الرد عليك قريباً.' : '✅ Message sent to our support team. We will reply soon.'
                }]);
                setLatestBotId(bid);
                if (!isOpen) setHasNewMsg(true);
            } catch {
                const bid = Date.now() + 1;
                setMessages(prev => [...prev, { id: bid, role: 'assistant error', content: isArabic ? 'عذراً، فشل الإرسال.' : 'Failed to send.', isError: true }]);
                setLatestBotId(bid);
            } finally { setLoading(false); }
            return;
        }

        // ── AI Chat Mode ──
        try {
            const res = await axios.post(`${BACKEND_URL}/voxio-chat`, {
                prompt: textValue,
                sessionId,
                pageContext: collectPageContext(),
                isAutoPrompt
            });

            const parsedReply = parseAndExecuteCommands(
                res.data.reply,
                (autoTxt) => sendMessage(autoTxt, { isAutoPrompt: true })
            );

            const bid = Date.now() + 1;
            setMessages(prev => [...prev, { id: bid, role: 'assistant', content: parsedReply }]);
            setLatestBotId(bid);
            if (!isOpen) setHasNewMsg(true);

        } catch (error) {
            console.error('Chat Error:', error);
            const bid = Date.now() + 1;
            setMessages(prev => [...prev, {
                id: bid, role: 'assistant',
                content: isArabic ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.' : 'Connection error. Please try again later.',
                isError: true
            }]);
            setLatestBotId(bid);
        } finally { setLoading(false); }
    };

    // ─── Voice Recording ──────────────────────────────────────────────────────
    const toggleListen = async () => {
        if (isListening) {
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            setIsListening(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'voice.webm');
                    setLoading(true);
                    try {
                        const res = await axios.post(`${BACKEND_URL}/voxio-chat/transcribe`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data?.text) setInput(prev => prev ? prev + ' ' + res.data.text : res.data.text);
                    } catch { /* silent */ } finally { setLoading(false); }
                    stream.getTracks().forEach(t => t.stop());
                };

                mediaRecorder.start();
                setIsListening(true);
            } catch {
                alert(isArabic ? 'يرجى السماح بالوصول للمايكروفون.' : 'Please allow microphone access.');
            }
        }
    };

    const clearChat = () => {
        setMessages([{ id: 1, role: 'assistant', content: 'مرحباً بك في VOXIO! 👋 أنا مساعدك الذكي، كيف يمكنني مساعدتك؟' }]);
        setShowQuickActions(true);
        setLatestBotId(null);
        autoPromptDepthRef.current = 0;
    };

    const quickActions = isArabic ? QUICK_ACTIONS_AR : QUICK_ACTIONS_EN;

    return (
        <div
            className="vx-widget-root"
            style={{ [isArabic ? 'left' : 'right']: '24px', [isArabic ? 'right' : 'left']: 'auto' }}
            dir={isArabic ? 'rtl' : 'ltr'}
        >
            {/* Pulse rings when closed */}
            {!isOpen && <><div className="vx-pulse-ring vx-pulse-1" /><div className="vx-pulse-ring vx-pulse-2" /></>}

            {/* New message badge */}
            {hasNewMsg && !isOpen && <div className="vx-new-badge">1</div>}

            {/* Toggle Button */}
            <button className={`vx-toggle ${isOpen ? 'vx-toggle--open' : ''}`} onClick={toggleChat} aria-label="Chat with VOXIO">
                <div className="vx-toggle-icon">
                    {isOpen ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            <circle cx="9" cy="11" r="0.5" fill="currentColor" />
                            <circle cx="12" cy="11" r="0.5" fill="currentColor" />
                            <circle cx="15" cy="11" r="0.5" fill="currentColor" />
                        </svg>
                    )}
                </div>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="vx-window" style={{ [isArabic ? 'left' : 'right']: '0', [isArabic ? 'right' : 'left']: 'auto' }}>

                    {/* Shimmer bar */}
                    <div className="vx-shimmer-bar" />

                    {/* Header */}
                    <div className="vx-header">
                        <div className="vx-header-left">
                            <div className="vx-avatar">
                                <svg viewBox="0 0 40 40" fill="none">
                                    <circle cx="20" cy="20" r="20" fill="url(#hGrad)" />
                                    <circle cx="15" cy="18" r="2" fill="white" />
                                    <circle cx="25" cy="18" r="2" fill="white" />
                                    <path d="M14 25s2 3 6 3 6-3 6-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="hGrad" x1="0" y1="0" x2="40" y2="40">
                                            <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#4F46E5" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <span className="vx-avatar-dot" />
                            </div>
                            <div className="vx-header-info">
                                <span className="vx-header-name">VOXIO Assistant</span>
                                <span className="vx-header-status">
                                    {loading ? (
                                        <><span className="vx-status-thinking">{isArabic ? 'يفكر' : 'thinking'}</span>
                                            <span className="vx-thinking-dots"><span /><span /><span /></span></>
                                    ) : (
                                        <><span className="vx-status-online-dot" />{isArabic ? 'متصل الآن' : 'Online now'}</>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="vx-header-actions">
                            <button className="vx-icon-btn" onClick={clearChat} title={isArabic ? 'محادثة جديدة' : 'New chat'}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>
                            <button className="vx-icon-btn" onClick={toggleChat} title={isArabic ? 'إغلاق' : 'Close'}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mode Switcher */}
                    <div className="vx-mode-switcher">
                        <button className={`vx-mode-btn ${mode === 'ai' ? 'active' : ''}`} onClick={() => setMode('ai')}>
                            <i className="fas fa-robot" style={{ fontSize: '0.8rem' }} />
                            {isArabic ? 'الذكاء الاصطناعي' : 'AI Agent'}
                        </button>
                        <button className={`vx-mode-btn ${mode === 'support' ? 'active' : ''}`} onClick={() => setMode('support')}>
                            <i className="fas fa-headset" style={{ fontSize: '0.8rem' }} />
                            {isArabic ? 'الدعم الفني' : 'Support'}
                        </button>
                    </div>

                    {/* Agent Acting Banner */}
                    {agentActing && (
                        <div className="vx-agent-banner">
                            <div className="vx-agent-banner-inner">
                                <div className="vx-agent-icon">
                                    <i className="fas fa-magic" style={{ fontSize: '0.7rem' }} />
                                </div>
                                <span>✨ AI {isArabic ? 'يتحرك في الصفحة...' : 'is navigating...'}</span>
                            </div>
                            <div className="vx-agent-progress">
                                <div className="vx-agent-progress-bar" style={{ width: `${agentProgress}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="vx-body">
                        {messages.map((msg) => {
                            const isUser = msg.role === 'user';
                            const isBot = msg.role.startsWith('assistant');
                            const isLatest = msg.id === latestBotId;

                            return (
                                <div
                                    key={msg.id}
                                    className={`vx-msg ${isUser ? 'vx-msg--user' : 'vx-msg--bot'} ${msg.isError ? 'vx-msg--error' : ''} ${msg.role === 'assistant success' ? 'vx-msg--success' : ''}`}
                                >
                                    {isBot && (
                                        <div className="vx-msg-avatar">
                                            <svg viewBox="0 0 26 26" fill="none">
                                                <circle cx="13" cy="13" r="13" fill="url(#mGrad)" />
                                                <circle cx="10" cy="12" r="1.2" fill="white" />
                                                <circle cx="16" cy="12" r="1.2" fill="white" />
                                                <path d="M9.5 16.5s1.2 2 3.5 2 3.5-2 3.5-2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                                                <defs>
                                                    <linearGradient id="mGrad" x1="0" y1="0" x2="26" y2="26">
                                                        <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#4F46E5" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </div>
                                    )}
                                    <div className="vx-msg-bubble">
                                        {isBot && isLatest
                                            ? <TypewriterText text={msg.content} speed={12} />
                                            : msg.content
                                        }
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {loading && (
                            <div className="vx-msg vx-msg--bot">
                                <div className="vx-msg-avatar">
                                    <svg viewBox="0 0 26 26" fill="none">
                                        <circle cx="13" cy="13" r="13" fill="url(#tGrad)" />
                                        <circle cx="10" cy="12" r="1.2" fill="white" />
                                        <circle cx="16" cy="12" r="1.2" fill="white" />
                                        <path d="M9.5 16.5s1.2 2 3.5 2 3.5-2 3.5-2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="tGrad" x1="0" y1="0" x2="26" y2="26">
                                                <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#4F46E5" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                <div className="vx-msg-bubble">
                                    <div className="vx-typing"><span /><span /><span /></div>
                                </div>
                            </div>
                        )}

                        {/* Quick Action Chips */}
                        {showQuickActions && messages.length <= 1 && !loading && (
                            <div className="vx-quick-actions">
                                <p className="vx-quick-label">{isArabic ? '💡 اقتراحات سريعة:' : '💡 Quick suggestions:'}</p>
                                {quickActions.map((qa, i) => (
                                    <button
                                        key={i}
                                        className="vx-quick-chip"
                                        onClick={() => sendMessage(qa.prompt)}
                                        style={{ animationDelay: `${i * 0.07}s` }}
                                    >
                                        <span>{qa.icon}</span> {qa.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Listening Bar */}
                    {isListening && (
                        <div className="vx-listening-bar">
                            <VoiceWave />
                            <span>{isArabic ? 'جاري الاستماع...' : 'Listening...'}</span>
                            <span className="vx-listening-dot" />
                        </div>
                    )}

                    {/* Footer */}
                    <form className="vx-footer" onSubmit={sendMessage}>
                        <button
                            type="button"
                            className={`vx-mic-btn ${isListening ? 'vx-mic-btn--active' : ''}`}
                            onClick={toggleListen}
                            title={isArabic ? 'تحدث بالصوت' : 'Voice input'}
                        >
                            {isListening
                                ? <i className="fas fa-stop" style={{ fontSize: '0.85rem' }} />
                                : <i className="fas fa-microphone" style={{ fontSize: '0.85rem' }} />
                            }
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            className="vx-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={
                                isListening
                                    ? (isArabic ? 'جاري الاستماع...' : 'Listening...')
                                    : (isArabic ? 'اكتب رسالتك...' : 'Type a message...')
                            }
                            disabled={loading || isListening}
                            autoComplete="off"
                        />
                        <button type="submit" className="vx-send-btn" disabled={!input.trim() || loading || isListening}>
                            <i className="fas fa-paper-plane" style={{ fontSize: '0.85rem' }} />
                        </button>
                    </form>

                    {/* Brand */}
                    <div className="vx-brand">
                        <span>{isArabic ? 'مدعوم بـ' : 'Powered by'}</span>
                        <strong> VOXIO AI</strong>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VOXIOChatWidget;
