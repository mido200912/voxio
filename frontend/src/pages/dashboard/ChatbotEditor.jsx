import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // eslint-disable-line no-unused-vars
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import Prism from 'prismjs';
import Editor from 'react-simple-code-editor';

import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';

import './ChatbotEditor.css';
import { secureStorage } from '../../utils/secureStorage';
import WebCommandsModal from './WebCommandsModal';
import { useToast } from '../../components/Toast';
import './DashboardShared.css';

const ChatbotEditor = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const { toast } = useToast();
    const isArabic = language === 'ar';
    
    // States
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentCode, setCurrentCode] = useState('');
    const [companySlug, setCompanySlug] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [showWebCommands, setShowWebCommands] = useState(false);
    const [templates, setTemplates] = useState([]);

    // التحكم في ظهور القائمة الجانبية (AI Editor)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

    // Workspace Settings
    const [viewMode, setViewMode] = useState('split'); 
    const [activeSidebarTab, setActiveSidebarTab] = useState('ai'); 
    const [isSaving, setIsSaving] = useState(false);
    const [codeHistory, setCodeHistory] = useState([]);
    const [activeFile, setActiveFile] = useState('html'); 
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [discoveredColors, setDiscoveredColors] = useState([]);
    const [segments, setSegments] = useState({ html: '', css: '', js: '' });

    const iframeRef = useRef(null);
    const messagesEndRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        fetchCurrentChatbot();
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = secureStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${BACKEND_URL}/chatbot-editor/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data.templates || []);
        } catch (err) { console.error(err); }
    };

    const fetchCurrentChatbot = async () => {
        try {
            const token = secureStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${BACKEND_URL}/chatbot-editor/current`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fullCode = res.data.htmlContent;
            setCurrentCode(fullCode);
            parseAndSetSegments(fullCode);
            setCompanySlug(res.data.slug);
            setCompanyName(res.data.name);
            setMessages([{
                id: 1,
                role: 'ai',
                content: language === 'ar' 
                    ? `مرحباً ${user?.name || ''}! 👋 أنا مصممك الخاص. اطلب مني أي تعديل وسأقوم بتعديل الكود فوراً.` 
                    : `Hello ${user?.name || ''}! 👋 I'm your AI Designer. Ask for any changes.`
            }]);
        } catch (err) { console.error(err); }
        finally { setInitialLoading(false); }
    };

    const parseAndSetSegments = (rawCode) => {
        if (!rawCode) return;
        // Clean markdown blocks if present
        let code = rawCode;
        if (typeof code === 'string') {
            code = code.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        }

        const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

        let htmlOnly = code;
        if (styleMatch) htmlOnly = htmlOnly.replace(styleMatch[0], '');
        if (scriptMatch) htmlOnly = htmlOnly.replace(scriptMatch[0], '');

        setSegments({
            html: htmlOnly.trim(),
            css: styleMatch ? styleMatch[1].trim() : '',
            js: scriptMatch ? scriptMatch[1].trim() : ''
        });

        // Discover colors from CSS
        try {
            const cssText = styleMatch ? styleMatch[1] : '';
            const colorRegex = /#[0-9a-fA-F]{3,8}\b/g;
            const found = cssText.match(colorRegex) || [];
            const unique = [...new Set(found)].slice(0, 12);
            setDiscoveredColors(unique);
        } catch (e) { /* ignore */ }
    };

    const handleSegmentChange = (newCode, type) => {
        const newSegments = { ...segments, [type]: newCode };
        setSegments(newSegments);
        let merged = newSegments.html;
        merged += `\n<style>\n${newSegments.css}\n</style>`;
        merged += `\n<script>\n${newSegments.js}\n</script>`;
        setCurrentCode(merged);
    };

    // Web Editor Specialized AI Model
    const [codingModel, setCodingModel] = useState('openrouter/owl-alpha');

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        const request = input;
        setInput('');
        setLoading(true);
        setAiProcessing(true);

        try {
            const token = secureStorage.getItem('token');
            const res = await axios.post(
                `${BACKEND_URL}/chatbot-editor/edit`,
                { userRequest: request, history: messages, codingModel },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.code && res.data.code !== currentCode) {
                setCodeHistory(prev => [...prev, currentCode]);
                setCurrentCode(res.data.code);
                parseAndSetSegments(res.data.code);
            }
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: res.data.message || 'Updated! ✅' }]);
        } catch (err) { 
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
            console.error("🔥 AI Editor Error:", err.response?.data || err.message);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: `❌ حدث خطأ: ${errorMsg}` }]);
        }
        finally { setLoading(false); setAiProcessing(false); }
    };

    const handleManualSave = async () => {
        setIsSaving(true);
        try {
            const token = secureStorage.getItem('token');
            await axios.post(`${BACKEND_URL}/chatbot-editor/save`, { htmlContent: currentCode }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        } catch (err) { console.error(err); }
        finally { setIsSaving(false); }
    };

    const normalizeToHex = (color) => {
        if (!color || color.startsWith('#')) return color || '#000000';
        return '#3b82f6';
    };

    const [deviceSize, setDeviceSize] = useState('mobile');

    // Mobile View State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileTab, setMobileTab] = useState('preview'); // 'ai', 'theme', 'code', 'preview'

    const getMobileTabName = () => {
        switch(mobileTab) {
            case 'ai': return language === 'ar' ? 'المساعد الذكي' : 'AI Assistant';
            case 'theme': return language === 'ar' ? 'القوالب' : 'Templates';
            case 'code': return language === 'ar' ? 'محرر الأكواد' : 'Code Editor';
            case 'preview': return language === 'ar' ? 'المعاينة' : 'Live Preview';
            default: return 'Live Preview';
        }
    };

    return (
        <div className={`chatbot-editor-container ${isFullscreen ? 'fullscreen' : ''}`} style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            {/* ─── Premium Header ─── */}
            <div className="dash-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dash-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(var(--dash-primary-rgb, 108, 99, 255), 0.2)' }}>
                        <i className="fas fa-magic" />
                    </div>
                    <div>
                        <h1 className="dash-page-title">{language === 'ar' ? 'مصمم الشات بوت' : 'Chatbot Designer'}</h1>
                        <p className="dash-page-subtitle">{companyName || 'VOXIO AI'}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* View Toggles */}
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--dash-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--dash-border)' }} className="desktop-only">
                        <button className={`dash-btn ${viewMode === 'code-only' ? 'dash-btn-primary' : 'dash-btn-outline'}`} onClick={() => setViewMode('code-only')} style={{ padding: '6px 12px', height: 'auto' }}>
                            <i className="fas fa-code"></i>
                        </button>
                        <button className={`dash-btn ${viewMode === 'split' ? 'dash-btn-primary' : 'dash-btn-outline'}`} onClick={() => setViewMode('split')} style={{ padding: '6px 12px', height: 'auto' }}>
                            <i className="fas fa-columns"></i>
                        </button>
                        <button className={`dash-btn ${viewMode === 'preview-only' ? 'dash-btn-primary' : 'dash-btn-outline'}`} onClick={() => setViewMode('preview-only')} style={{ padding: '6px 12px', height: 'auto' }}>
                            <i className="fas fa-mobile-screen"></i>
                        </button>
                    </div>

                    <div className="divider desktop-only" style={{ width: '1px', background: 'var(--dash-border)', margin: '0 8px' }}></div>

                    <button className="dash-btn dash-btn-outline" onClick={() => setCodeHistory(prev => prev.slice(0, -1))} disabled={codeHistory.length === 0} style={{ width: '42px', padding: 0 }}>
                        <i className="fas fa-rotate-left"></i>
                    </button>
                    
                    <button className="dash-btn dash-btn-primary" onClick={handleManualSave} disabled={isSaving}>
                        <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                        <span>{language === 'ar' ? 'حفظ' : 'Save'}</span>
                    </button>
                </div>
            </div>

            {/* ─── Main Workspace ─── */}
            <div className={`chatbot-editor mode-${viewMode} mobile-tab-${mobileTab}`}>
                <div className="editor-workspace">
                
                {/* ─── AI Assistant Sidebar ─── */}
                <aside className={`ai-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-nav">
                        <button className={activeSidebarTab === 'ai' ? 'active' : ''} onClick={() => setActiveSidebarTab('ai')}>
                            Chat
                        </button>
                        <button className={activeSidebarTab === 'theme' ? 'active' : ''} onClick={() => setActiveSidebarTab('theme')}>
                            Templates
                        </button>
                    </div>

                    <div className="sidebar-body">
                        {activeSidebarTab === 'ai' && (
                            <div className="chat-interface" dir={isArabic ? 'rtl' : 'ltr'}>
                                
                                <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--dash-border)', background: 'rgba(0,0,0,0.02)' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--dash-text-sec)' }}>
                                        {isArabic ? 'موديل البرمجة' : 'Coding Model'}
                                    </label>
                                    <select 
                                        value={codingModel} 
                                        onChange={(e) => setCodingModel(e.target.value)}
                                        className="settings-select"
                                        style={{ width: '100%', fontSize: '0.85rem', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--dash-border)', background: 'var(--dash-card)', color: 'var(--dash-text)' }}
                                    >
                                        <optgroup label="Coding Specialists">
                                            <option value="openrouter/owl-alpha">Owl Alpha (Advanced Design AI)</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="messages-container">
                                    <AnimatePresence>
                                        {messages.map((msg) => (
                                            <motion.div 
                                                key={msg.id} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`message-row ${msg.role}`}
                                            >
                                                {msg.role === 'ai' && <div className="avatar ai"><i className="fas fa-robot"></i></div>}
                                                <div className="message-content">{msg.content}</div>
                                                {msg.role === 'user' && <div className="avatar user"><i className="fas fa-user"></i></div>}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {loading && (
                                        <div className="message-row ai">
                                            <div className="avatar ai"><i className="fas fa-robot"></i></div>
                                            <div className="typing-indicator">
                                                <span></span><span></span><span></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                <form className="chat-input-box" onSubmit={sendMessage}>
                                    <input 
                                        value={input} 
                                        onChange={(e) => setInput(e.target.value)} 
                                        placeholder={language === 'ar' ? "اطلب تعديل التصميم..." : "Ask AI to edit design..."}
                                    />
                                    <button type="submit" disabled={!input.trim() || loading}>
                                        <i className="fas fa-arrow-up"></i>
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeSidebarTab === 'theme' && (
                            <div className="templates-view">
                                <h3>{language === 'ar' ? 'قوالب جاهزة' : 'Starter Templates'}</h3>
                                <p className="subtitle">{language === 'ar' ? 'اختر تصميماً للبدء' : 'Choose a base design'}</p>
                                
                                <div className="templates-grid">
                                    {templates.length > 0 ? templates.map(t => (
                                        <div key={t.id || t._id} className="template-card" onClick={async () => {
                                            if (window.confirm(language === 'ar' ? 'سيتم استبدال التصميم الحالي. متأكد؟' : 'This will replace your current design. Continue?')) {
                                                try {
                                                    setAiProcessing(true);
                                                    const token = secureStorage.getItem('token');
                                                    const res = await axios.post(`${BACKEND_URL}/chatbot-editor/reset`, { templateId: t.id }, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    if (res.data.code) {
                                                        setCodeHistory(prev => [...prev, currentCode]);
                                                        setCurrentCode(res.data.code);
                                                        parseAndSetSegments(res.data.code);
                                                        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: res.data.message || '✅ Template applied!' }]);
                                                    }
                                                } catch (err) {
                                                    console.error('Template reset error:', err);
                                                    toast.error(language === 'ar' ? 'حدث خطأ أثناء تطبيق القالب' : 'Error applying template');
                                                } finally {
                                                    setAiProcessing(false);
                                                }
                                            }
                                        }}>
                                            <div className="template-preview">
                                                {t.thumbnail ? (
                                                    <img src={t.thumbnail} alt={t.name} />
                                                ) : (
                                                    <i className="fas fa-layer-group"></i>
                                                )}
                                            </div>
                                            <div className="template-info">
                                                <span>{t.name}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state">No templates found.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ─── Code & Preview Area ─── */}
                <main className="dynamic-area">
                    
                    {/* Code Editor */}
                    <div className="editor-panel code-panel">
                        <div className="panel-header">
                            <div className="file-tabs">
                                {['html', 'css', 'js'].map(ext => (
                                    <button key={ext} className={activeFile === ext ? 'active' : ''} onClick={() => setActiveFile(ext)}>
                                        {ext.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="code-container" dir="ltr" style={{ textAlign: 'left', direction: 'ltr' }}>
                            <Editor
                                value={segments[activeFile]}
                                onValueChange={code => handleSegmentChange(code, activeFile)}
                                highlight={code => Prism.highlight(code, 
                                    activeFile === 'html' ? Prism.languages.markup : 
                                    activeFile === 'css' ? Prism.languages.css : Prism.languages.javascript, 
                                    activeFile)}
                                padding={20}
                                className="prism-editor"
                                style={{ fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '14px', direction: 'ltr' }}
                            />
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="editor-panel preview-panel">
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="device-toggles">
                                <button className={deviceSize === 'mobile' ? 'active' : ''} onClick={() => setDeviceSize('mobile')} title="Mobile">
                                    <i className="fas fa-mobile-alt"></i>
                                </button>
                                <button className={deviceSize === 'tablet' ? 'active' : ''} onClick={() => setDeviceSize('tablet')} title="Tablet">
                                    <i className="fas fa-tablet-alt"></i>
                                </button>
                                <button className={deviceSize === 'desktop' ? 'active' : ''} onClick={() => setDeviceSize('desktop')} title="Desktop">
                                    <i className="fas fa-desktop"></i>
                                </button>
                            </div>
                        </div>
                        <div className="preview-container">
                            <div className={`device-frame ${deviceSize}`}>
                                <iframe ref={iframeRef} srcDoc={currentCode} title="Live Preview" />
                            </div>
                            
                            <AnimatePresence>
                                {aiProcessing && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="building-overlay"
                                    >
                                        <div className="magic-spinner"></div>
                                        <p>AI is coding...</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>
        </div>

            <AnimatePresence>
                {showCopied && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="toast-notification">
                        <i className="fas fa-check-circle"></i> Saved Successfully
                    </motion.div>
                )}
            </AnimatePresence>
            <WebCommandsModal show={showWebCommands} onClose={() => setShowWebCommands(false)} />
        </div>
    );
};

export default ChatbotEditor;
