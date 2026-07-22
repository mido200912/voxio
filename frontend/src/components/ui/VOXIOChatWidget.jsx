import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './VOXIOChatWidget.css';

const MAX_AUTO_PROMPT_DEPTH = 1;
const COPILOT_PENDING_PROMPT_KEY = 'vx_copilot_pending_prompt';

const VOXIOChatWidget = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const [isOpen, setIsOpen] = useState(false);
    
    // UI Modes: 'ai' | 'support'
    const [mode, setMode] = useState('ai');

    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: 'مرحباً بك في VOXIO! 👋 أنا مساعدك الذكي، كيف يمكنني مساعدتك في بناء وكيل الذكاء الاصطناعي الخاص بك؟'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [agentActing, setAgentActing] = useState(false);
    
    // Voice Recording State
    const [isListening, setIsListening] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const messagesEndRef = useRef(null);
    const autoPromptDepthRef = useRef(0);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const [sessionId] = useState(() => {
        let sid = localStorage.getItem('voxio_sid');
        if (!sid) {
            sid = "sess_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('voxio_sid', sid);
        }
        return sid;
    });

    const toggleChat = () => setIsOpen(!isOpen);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen, loading]);

    // ─── Agent Mode Helpers ───────────────────────────────────────────────────
    const collectPageContext = () => {
        try {
            return {
                url: window.location.href,
                title: document.title,
                links: [...document.querySelectorAll('a[href]')].slice(0, 25).map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') })),
                buttons: [...document.querySelectorAll('button, .btn, [role="button"]')].slice(0, 20).map(b => ({ text: b.innerText.trim() })),
                headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 10).map(h => ({ text: h.innerText.trim() })),
            };
        } catch (e) { return null; }
    };

    const findElement = (selector) => {
        if (!selector) return null;
        try {
            let el = document.querySelector(selector);
            if (el) return el;
            el = document.getElementById(selector);
            if (el) return el;
            const allElements = [...document.querySelectorAll('a, button, [role="button"]')];
            return allElements.find(e => e.innerText.trim().toLowerCase() === selector.toLowerCase());
        } catch(e) { return null; }
    };

    const showAiCursor = (targetEl) => {
        let cursor = document.getElementById('voxio-ai-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'voxio-ai-cursor';
            cursor.innerHTML = '✨';
            cursor.style.cssText = `
                position: fixed; width: 40px; height: 40px; pointer-events: none; z-index: 2147483646;
                font-size: 32px; filter: drop-shadow(0 0 15px #6C63FF) drop-shadow(0 0 5px #fff);
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                transform: scale(0); opacity: 0;
            `;
            document.body.appendChild(cursor);
        }
        const rect = targetEl.getBoundingClientRect();
        cursor.style.left = (rect.left + rect.width/2 - 20) + 'px';
        cursor.style.top = (rect.top + rect.height/2 - 20) + 'px';
        
        requestAnimationFrame(() => {
            cursor.style.transform = 'scale(1)';
            cursor.style.opacity = '1';
        });

        setTimeout(() => {
            cursor.style.transform = 'scale(0)';
            cursor.style.opacity = '0';
            setTimeout(() => cursor.remove(), 600);
        }, 1900);
    };

    const showNavigationEffect = () => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: radial-gradient(circle at center, rgba(108, 99, 255, 0.15) 0%, transparent 70%);
            z-index: 2147483645; pointer-events: none;
            opacity: 1; transition: opacity 0.8s ease-out;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.style.opacity = '0'; }, 50);
        setTimeout(() => overlay.remove(), 850);
    };

    const sendPromptToCopilot = (text) => {
        if (!text) return;
        localStorage.setItem(COPILOT_PENDING_PROMPT_KEY, text);
        window.postMessage({ type: 'VOXIO_COPILOT_CHAT', message: text }, window.location.origin);
    };

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
            autoPromptText = text.trim();
            return '';
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
                    } else {
                        executeNext(index + 1);
                    }
                }
            };
            setTimeout(() => {
                executeNext(0);
                if (canAutoPrompt && autoPromptCallback) {
                    autoPromptDepthRef.current += 1;
                    if (copilotNavigation) {
                        setTimeout(() => sendPromptToCopilot(autoPromptText), 1500 + (commands.length * 800));
                    } else {
                        setTimeout(() => autoPromptCallback(autoPromptText), 1500 + (commands.length * 800));
                    }
                }
            }, 100);
        } else if (canAutoPrompt && autoPromptCallback) {
            autoPromptDepthRef.current += 1;
            setTimeout(() => autoPromptCallback(autoPromptText), 1000);
        }
        return reply.trim();
    };

    const sendMessage = async (eOrText, opts = {}) => {
        if (eOrText && eOrText.preventDefault) eOrText.preventDefault();

        const textValue = typeof eOrText === 'string' ? eOrText : input;
        if (!textValue.trim()) return;

        const isAutoPrompt = !!opts.isAutoPrompt;

        if (!isAutoPrompt) {
            autoPromptDepthRef.current = 0;
        }

        const userMsg = { id: Date.now(), role: 'user', content: textValue, isAutoPrompt };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        if (mode === 'support') {
            try {
                // Send to direct support endpoint
                await axios.post(`${BACKEND_URL}/support/submit`, {
                    name: "Widget User",
                    email: `widget_${sessionId}@voxio.ai`,
                    subject: "Widget Support Message",
                    message: textValue
                });
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'assistant success',
                    content: isArabic ? '✅ تم إرسال رسالتك لفريق الدعم، سيتم الرد عليك قريباً.' : '✅ Message sent to our support team. We will reply soon.'
                }]);
            } catch (error) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'assistant error',
                    content: isArabic ? 'عذراً، فشل الإرسال.' : 'Failed to send message.',
                    isError: true
                }]);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Default AI Chat Mode
        try {
            const res = await axios.post(`${BACKEND_URL}/voxio-chat`, {
                prompt: textValue,
                sessionId: sessionId,
                pageContext: collectPageContext(),
                isAutoPrompt 
            });

            const parsedReply = parseAndExecuteCommands(res.data.reply, (autoTxt) => sendMessage(autoTxt, { isAutoPrompt: true }));

            const botMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: parsedReply
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: isArabic ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.' : 'Connection error. Please try again later.',
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Voice Recording (MediaRecorder + Whisper API) ──────────────────────
    const toggleListen = async () => {
        if (isListening) {
            // Stop recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            setIsListening(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    // Send to backend Whisper API
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'voice.webm');
                    
                    setLoading(true);
                    try {
                        const res = await axios.post(`${BACKEND_URL}/voxio-chat/transcribe`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data && res.data.text) {
                            setInput(prev => prev ? prev + ' ' + res.data.text : res.data.text);
                        }
                    } catch (err) {
                        console.error('Transcription failed:', err);
                        alert(isArabic ? "فشل التعرف على الصوت." : "Voice recognition failed.");
                    } finally {
                        setLoading(false);
                    }
                    
                    // Stop tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsListening(true);
            } catch (err) {
                console.error("Microphone access denied:", err);
                alert(isArabic ? "يرجى السماح بالوصول للمايكروفون." : "Please allow microphone access.");
            }
        }
    };

    return (
        <div className="voxio-widget-container" style={{ [isArabic ? 'left' : 'right']: '24px', [isArabic ? 'right' : 'left']: 'auto' }}>
            <button
                className={`widget-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={toggleChat}
                aria-label="Chat with VOXIO"
            >
                {isOpen ? <i className="fas fa-times"></i> : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="widget-window animate-pop-up" style={{ [isArabic ? 'left' : 'right']: '0', [isArabic ? 'right' : 'left']: 'auto' }} dir={isArabic ? 'rtl' : 'ltr'}>
                    <div className="widget-header">
                        <div className="header-info">
                            <span className="status-dot"></span>
                            <h3>{mode === 'ai' ? 'VOXIO Assistant' : (isArabic ? 'الدعم الفني' : 'Support')}</h3>
                        </div>
                        
                        <div className="widget-mode-switcher">
                            <button 
                                className={`mode-btn ${mode === 'ai' ? 'active' : ''}`}
                                onClick={() => setMode('ai')}
                            >
                                <i className="fas fa-robot"></i> {isArabic ? 'الذكاء الاصطناعي' : 'AI Agent'}
                            </button>
                            <button 
                                className={`mode-btn ${mode === 'support' ? 'active' : ''}`}
                                onClick={() => setMode('support')}
                            >
                                <i className="fas fa-headset"></i> {isArabic ? 'فريق الدعم' : 'Support Team'}
                            </button>
                        </div>
                    </div>

                    {agentActing && (
                        <div className="vx-agent-acting-banner" style={{ background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(108, 99, 255, 0.05))', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#6C63FF', fontWeight: 600, borderBottom: '1px solid rgba(108, 99, 255, 0.1)' }}>
                            <i className="fas fa-magic" style={{ animation: 'vx-blink 1.5s infinite' }}></i>
                            <span>✨ AI {isArabic ? 'يتحرك في الصفحة...' : 'is navigating...'}</span>
                        </div>
                    )}

                    <div className="widget-body">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`widget-msg ${msg.role}`}>
                                <div className="msg-content">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="widget-msg assistant">
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="widget-footer" onSubmit={sendMessage}>
                        <button type="button" className={`mic-btn ${isListening ? 'listening' : ''}`} onClick={toggleListen} title={isArabic ? "تحدث بالصوت" : "Speak"}>
                            {isListening ? <i className="fas fa-stop"></i> : <i className="fas fa-microphone"></i>}
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? (isArabic ? 'جاري الاستماع...' : 'Listening...') : (isArabic ? 'اكتب رسالتك...' : 'Type your message...')}
                            disabled={loading || isListening}
                        />
                        <button type="submit" disabled={!input.trim() || loading || isListening}>
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default VOXIOChatWidget;
