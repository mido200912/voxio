import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import './AiCopilot.css';
import Input from '../../components/ui/Input';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COPILOT_PENDING_PROMPT_KEY = 'vx_copilot_pending_prompt';

const QUICK_ACTIONS = [
  { id: 'analyze', icon: 'fas fa-search', labelEn: 'Analyze Bot Failures', labelAr: 'تحليل أخطاء البوت', msg: 'Analyze my bot\'s failed conversations and tell me exactly what went wrong and how to fix it.' },
  { id: 'prompt', icon: 'fas fa-pencil-alt', labelEn: 'Improve Bot Prompt', labelAr: 'تحسين نص البوت', msg: 'Based on my bot\'s performance, write me an improved system prompt that will increase the AI resolution rate.' },
  { id: 'leads', icon: 'fas fa-user-plus', labelEn: 'Grow My Leads', labelAr: 'زيادة العملاء', msg: 'What specific changes should I make to increase lead capture through my chatbot?' },
  { id: 'hours', icon: 'fas fa-clock', labelEn: 'Optimize Active Hours', labelAr: 'تحسين ساعات العمل', msg: 'Based on my peak hour data, when should my team be most available and what should I automate?' },
];

const TypingDots = () => (
  <div className="acp-typing">
    <span></span><span></span><span></span>
  </div>
);

const MessageBubble = ({ msg, isArabic }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`acp-msg-row ${isUser ? 'user' : 'ai'}`}>
      {!isUser && (
        <div className="acp-avatar">
          <i className="fas fa-magic"></i>
        </div>
      )}
      <div className={`acp-bubble ${isUser ? 'user' : 'ai'}`}>
        {!isUser && <div className="acp-bubble-label">{isArabic ? 'مساعد AI' : 'AI Copilot'}</div>}
        <div className="acp-bubble-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {msg.content}
        </div>
        {msg.timestamp && (
          <div className="acp-bubble-time">
            {new Date(msg.timestamp).toLocaleTimeString(isArabic ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

const AiCopilot = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const t = (ar, en) => isArabic ? ar : en;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const sendMessageRef = useRef(null);
  const token = secureStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const lastExternalMessageRef = useRef({ text: '', at: 0 });

  // ─── Listen for messages from widget iframe ─────────────────────────────────
  useEffect(() => {
    const handleWidgetMessage = (event) => {
      if (!event.data || event.data.type !== 'VOXIO_COPILOT_CHAT') return;
      if (!event.data.message) return;
      const text = event.data.message.trim();
      const now = Date.now();
      if (lastExternalMessageRef.current.text === text && now - lastExternalMessageRef.current.at < 3000) return;
      lastExternalMessageRef.current = { text, at: now };
      localStorage.removeItem(COPILOT_PENDING_PROMPT_KEY);
      sendMessageRef.current?.(text);
    };
    window.addEventListener('message', handleWidgetMessage);
    return () => window.removeEventListener('message', handleWidgetMessage);
  }, []);

  useEffect(() => {
    if (historyLoading || loading) return;
    const pendingPrompt = localStorage.getItem(COPILOT_PENDING_PROMPT_KEY);
    if (!pendingPrompt) return;
    localStorage.removeItem(COPILOT_PENDING_PROMPT_KEY);
    sendMessageRef.current?.(pendingPrompt);
  }, [historyLoading, loading]);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/copilot/history`, { headers });
        setMessages(res.data || []);
      } catch {
        // No history yet
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
      _local: true,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Get fresh token on every send (avoids stale closure)
      const freshToken = secureStorage.getItem('token');
      const res = await axios.post(
        `${BACKEND_URL}/copilot/chat`,
        { message: text.trim() },
        { headers: { Authorization: `Bearer ${freshToken}` } }
      );
      const aiMsg = {
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date().toISOString(),
        _local: true,
      };
      setMessages(prev => [...prev, aiMsg]);
      if (res.data.stats) setStats(res.data.stats);
    } catch (err) {
      const errDetail = err.response?.data?.error || err.message || 'Unknown error';
      console.error('[Copilot] Error:', errDetail);
      const errMsg = {
        role: 'assistant',
        content: t(
          `حدث خطأ: ${errDetail}. يرجى المحاولة مرة أخرى.`,
          `Error: ${errDetail}. Please try again.`
        ),
        timestamp: new Date().toISOString(),
        _local: true,
        _error: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, t]);

  sendMessageRef.current = sendMessage;

  useEffect(() => {
    if (historyLoading) return;

    const sendPendingPrompt = () => {
      if (loading) return;
      const pendingPrompt = localStorage.getItem(COPILOT_PENDING_PROMPT_KEY);
      if (!pendingPrompt) return;
      localStorage.removeItem(COPILOT_PENDING_PROMPT_KEY);
      sendMessageRef.current?.(pendingPrompt);
    };

    sendPendingPrompt();
    const intervalId = window.setInterval(sendPendingPrompt, 500);
    return () => window.clearInterval(intervalId);
  }, [historyLoading, loading]);


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = async () => {
    try {
      await axios.post(`${BACKEND_URL}/copilot/clear`, {}, { headers });
      setMessages([]);
    } catch {
      // ignore
    }
  };

  const isEmpty = messages.length === 0 && !historyLoading;

  return (
    <div className="acp-page" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <div className="acp-header">
        <div className="acp-header-left">
          <div className="acp-header-icon">
            <i className="fas fa-magic"></i>
          </div>
          <div>
            <h1 className="acp-title">{t('مساعد AI الذكي', 'AI Copilot')}</h1>
            <p className="acp-subtitle">
              {t('مستشارك الشخصي لتحسين الشاتبوت وزيادة المبيعات', 'Your personal AI business consultant')}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="acp-clear-btn" onClick={handleClear} title={t('مسح المحادثة', 'Clear history')}>
            <i className="fas fa-trash-alt"></i>
            {t('مسح', 'Clear')}
          </button>
        )}
      </div>

      {/* ── Stats Bar ── */}
      {stats && (
        <div className="acp-stats-bar">
          <div className="acp-stat">
            <i className="fas fa-comments"></i>
            <span>{stats.totalMsgs} {t('رسالة', 'messages')}</span>
          </div>
          <div className="acp-stat">
            <i className="fas fa-robot"></i>
            <span>{stats.aiMsgs} {t('رد AI', 'AI replies')}</span>
          </div>
          <div className="acp-stat acp-stat--warn">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{stats.failedCount} {t('محادثة فاشلة', 'failed conversations')}</span>
          </div>
        </div>
      )}

      {/* ── Chat Area ── */}
      <div className="acp-chat-area">
        {historyLoading ? (
          <div className="acp-loading">
            <div className="acp-spinner"></div>
            <span>{t('جاري التحميل...', 'Loading...')}</span>
          </div>
        ) : isEmpty ? (
          /* Welcome / Empty State */
          <div className="acp-welcome">
            <div className="acp-welcome-orb">
              <i className="fas fa-magic"></i>
            </div>
            <h2 className="acp-welcome-title">{t('مرحباً بك في مساعد AI', 'Welcome to AI Copilot')}</h2>
            <p className="acp-welcome-desc">
              {t(
                'أنا هنا لمساعدتك في تحسين أداء الشاتبوت الخاص بك. يمكنني تحليل المحادثات الفاشلة، وتحسين النصوص، وزيادة معدل حل المشكلات.',
                'I analyze your chatbot\'s performance, identify failures, and help you improve it. Start with a quick action or ask me anything.'
              )}
            </p>

            {/* Quick Actions */}
            <div className="acp-quick-grid">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.id}
                  className="acp-quick-btn"
                  onClick={() => sendMessage(qa.msg)}
                  disabled={loading}
                >
                  <i className={qa.icon}></i>
                  <span>{isArabic ? qa.labelAr : qa.labelEn}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="acp-messages">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} isArabic={isArabic} />
            ))}
            {loading && (
              <div className="acp-msg-row ai">
                <div className="acp-avatar"><i className="fas fa-magic"></i></div>
                <div className="acp-bubble ai">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Quick Actions (when conversation exists) ── */}
      {!isEmpty && !historyLoading && (
        <div className="acp-quick-row">
          {QUICK_ACTIONS.map(qa => (
            <button
              key={qa.id}
              className="acp-quick-chip"
              onClick={() => sendMessage(qa.msg)}
              disabled={loading}
            >
              <i className={qa.icon}></i>
              {isArabic ? qa.labelAr : qa.labelEn}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="acp-input-area">
        <div className="acp-input-wrapper">
          <textarea
            ref={inputRef}
            className="acp-input"
            placeholder={t('اسألني أي شيء عن أداء الشاتبوت...', 'Ask me anything about your chatbot performance...')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className={`acp-send-btn ${loading ? 'loading' : ''} ${input.trim() ? 'active' : ''}`}
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            {loading
              ? <i className="fas fa-spinner fa-spin"></i>
              : <i className="fas fa-paper-plane"></i>}
          </button>
        </div>
        <p className="acp-hint">
          {t('Enter للإرسال • Shift+Enter لسطر جديد', 'Enter to send • Shift+Enter for new line')}
        </p>
      </div>
    </div>
  );
};

export default AiCopilot;
