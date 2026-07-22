import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { useGetConversationsQuery } from '../../store/dashboardApi';
import { motion } from 'framer-motion';


import './DashboardShared.css';
import './Conversations.css';
import PageLoader from '../../components/ui/PageLoader';
import { useToast } from '../../components/ui/Toast';

const TABS = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
  { key: 'handoff', labelAr: 'تحويل بشري', labelEn: 'Handoff' },
  { key: 'active', labelAr: 'تلقائي', labelEn: 'Auto' },
  { key: 'manual', labelAr: 'يدوي', labelEn: 'Manual' },
];

const Conversations = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [tab, setTab] = useState('all');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = secureStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const t = (ar, en) => isArabic ? ar : en;

  // Use polling in RTK query with pollingInterval: 15000
  const { data = { all: [], handoff: [], active: [], manual: [] }, isLoading: loading, refetch: fetchConversations } = useGetConversationsQuery(undefined, { pollingInterval: 15000 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = async (conv) => {
    setSelected(conv);
    try {
      const res = await axios.get(`${BACKEND_URL}/handoff/conversation/${encodeURIComponent(conv.userId)}/${conv.platform}`, { headers });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessages([]);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected || sendingReply) return;
    setSendingReply(true);
    try {
      await axios.post(`${BACKEND_URL}/handoff/reply`, {
        userId: selected.userId,
        platform: selected.platform,
        message: replyText.trim()
      }, { headers });
      setReplyText('');
      toast(t('تم إرسال الرد', 'Reply sent'), 'success');
      const res = await axios.get(`${BACKEND_URL}/handoff/conversation/${encodeURIComponent(selected.userId)}/${selected.platform}`, { headers });
      setMessages(Array.isArray(res.data) ? res.data : []);
      fetchConversations();
    } catch (err) {
      toast(err.response?.data?.error || 'Error sending reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const toggleAi = async (conv) => {
    const current = conv.aiEnabled !== false;
    try {
      await axios.post(`${BACKEND_URL}/handoff/toggle-ai`, {
        userId: conv.userId,
        platform: conv.platform,
        aiEnabled: !current
      }, { headers });
      toast(current ? t('تم إيقاف الرد التلقائي', 'AI auto-reply off') : t('تم تفعيل الرد التلقائي', 'AI auto-reply on'), 'success');
      setSelected(prev => prev ? { ...prev, aiEnabled: !current } : null);
      fetchConversations();
    } catch (err) {
      toast('Error toggling AI', 'error');
    }
  };

  const acceptHandoff = async (conv) => {
    try {
      await axios.post(`${BACKEND_URL}/handoff/accept`, {
        userId: conv.userId,
        platform: conv.platform
      }, { headers });
      toast(t('تم قبول المحادثة', 'Handoff accepted'), 'success');
      fetchConversations();
      selectConversation(conv);
    } catch (err) {
      toast('Error accepting', 'error');
    }
  };

  const list = data[tab] || data.all || [];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('الآن', 'now');
    if (diffMins < 60) return `${diffMins}${t('د', 'm')}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}${t('س', 'h')}`;
    return d.toLocaleDateString();
  };

  const platformIcon = (p) => {
    const icons = { telegram: '✈️', whatsapp: '💬', instagram: '📸', widget: '🔌', web: '🌐', website: '🌐', facebook: '👍' };
    return icons[p] || '💬';
  };

  const msgIcon = (sender) => {
    if (sender === 'user') return '👤';
    if (sender === 'ai') return '🤖';
    return '👨‍💼';
  };

  const formatUserId = (conv) => {
    if (conv.platform === 'whatsapp' || conv.platform === 'telegram') {
      return conv.userId; // Usually the raw phone number/ID
    }
    if (conv.platform === 'web' || conv.platform === 'website' || conv.platform === 'widget') {
      if (conv.ip && conv.ip !== 'unknown' && conv.ip !== '::1') return `IP: ${conv.ip}`;
      if (conv.userId && conv.userId.startsWith('web_')) return 'Web User';
    }
    return conv.userId?.substring(0, 18) || 'Unknown';
  };

  if (loading) return <PageLoader />;

  return (
    <div className="dashboard-page conv-page" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('المحادثات والردود', 'Conversations')}</h1>
        <div className="conv-attention">
          {data.handoff?.length > 0 && (
            <span className="conv-attention-badge">
              🔴 {data.handoff.length} {t('تتطلب رداً', 'need reply')}
            </span>
          )}
        </div>
      </div>

      <div className="conv-layout">
        <div className="conv-sidebar">
          <div className="conv-tabs">
            {TABS.map(tabItem => (
              <button
                key={tabItem.key}
                className={`conv-tab ${tab === tabItem.key ? 'active' : ''}`}
                onClick={() => setTab(tabItem.key)}
              >
                {t(tabItem.labelAr, tabItem.labelEn)}
                {(data[tabItem.key]?.length || 0) > 0 && (
                  <span className="conv-tab-count">{data[tabItem.key].length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="conv-list">
            {list.length === 0 ? (
              <div className="conv-empty">
                <span style={{ fontSize: 32 }}>💬</span>
                <p>{t('لا توجد محادثات', 'No conversations')}</p>
              </div>
            ) : (
              list.map((conv, i) => (
                <div
                  key={`${conv.userId}_${conv.platform}_${i}`}
                  className={`conv-item ${selected?.userId === conv.userId && selected?.platform === conv.platform ? 'selected' : ''} ${conv.handoffRequested ? 'needs-attention' : ''} ${conv.aiEnabled === false ? 'manual-mode' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conv-item-top">
                    <span className="conv-item-user">
                      {platformIcon(conv.platform)} {formatUserId(conv)}
                    </span>
                    <span className="conv-item-time">{formatTime(conv.lastMessage)}</span>
                  </div>
                  <div className="conv-item-text">{conv.lastText?.substring(0, 60) || t('بدون رسالة', 'No message')}</div>
                  <div className="conv-item-bottom">
                    <span className="conv-item-platform">{conv.platform}</span>
                    <div className="conv-item-badges">
                      {conv.handoffRequested && <span className="badge-handoff">{t('يدوي', 'H')}</span>}
                      <span className={`badge-ai ${conv.aiEnabled !== false ? 'on' : 'off'}`}>
                        AI {conv.aiEnabled !== false ? 'ON' : 'OFF'}
                      </span>
                      <span className="conv-item-count">{conv.messageCount} msg</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="conv-main">
          {!selected ? (
            <div className="conv-no-selection">
              <span style={{ fontSize: 48 }}>💬</span>
              <h3>{t('اختر محادثة', 'Select a conversation')}</h3>
              <p>{t('اختر محادثة من القائمة لعرضها والرد عليها', 'Choose a conversation from the list to view and reply')}</p>
            </div>
          ) : (
            <>
              <div className="conv-main-header">
                <div className="conv-main-info">
                  <span className="conv-main-user">
                    {platformIcon(selected.platform)} {formatUserId(selected)}
                  </span>
                  <div className="conv-main-meta">
                    <span className="conv-main-platform">{selected.platform}</span>
                    {selected.ip && <span className="conv-main-platform" style={{ background: 'var(--dash-border)', color: 'var(--dash-text)' }}>IP: {selected.ip}</span>}
                    <span className={`badge-ai ${selected.aiEnabled !== false ? 'on' : 'off'}`}>
                      AI {selected.aiEnabled !== false ? 'ON' : 'OFF'}
                    </span>
                    {selected.handoffRequested && <span className="badge-handoff">{t('يطلب دعماً بشرياً', 'Requested human support')}</span>}
                  </div>
                </div>
                <div className="conv-main-actions">
                  {selected.handoffRequested && (
                    <button className="dash-btn dash-btn-primary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => acceptHandoff(selected)}>
                      {t('قبول المحادثة', 'Accept')} 🙋
                    </button>
                  )}
                  <button
                    className={`dash-btn ${selected.aiEnabled !== false ? 'dash-btn-outline' : 'dash-btn-primary'}`}
                    style={{ fontSize: 13, padding: '8px 16px' }}
                    onClick={() => toggleAi(selected)}
                  >
                    {selected.aiEnabled !== false ? `⏸️ ${t('إيقاف AI', 'Stop AI')}` : `▶️ ${t('تفعيل AI', 'Enable AI')}`}
                  </button>
                </div>
              </div>

              <div className="conv-messages" ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
                {messages.length === 0 ? (
                  <div className="conv-empty" style={{ flex: 1 }}>
                    <p>{t('لا توجد رسائل', 'No messages')}</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`conv-msg ${msg.sender === 'user' ? 'from-user' : msg.sender === 'ai' ? 'from-ai' : 'from-agent'}`}>
                      <div className="conv-msg-sender">
                        {msgIcon(msg.sender)}
                        <span>{msg.sender === 'user' ? t('عميل', 'Customer') : msg.sender === 'ai' ? 'AI' : t('أنت', 'You')}</span>
                      </div>
                      <div className="conv-msg-text">{msg.text}</div>
                      <div className="conv-msg-time">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="conv-reply">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={t('اكتب ردك هنا...', 'Type your reply here...')}
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <button
                  className="dash-btn dash-btn-primary"
                  onClick={handleReply}
                  disabled={!replyText.trim() || sendingReply}
                >
                  {sendingReply ? '⏳' : '📤'} {t('إرسال', 'Send')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conversations;
