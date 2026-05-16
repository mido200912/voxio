import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';  
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';  
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
                    ? `مرحباً ${user?.name || ''}! 👋 أنا مصمم موقعك الخاص. أقدر أبني لك بورتفوليو كامل لشركتك، أغيّر الألوان والتصميم، وأضيف أقسام جديدة. اطلب مني أي تعديل!` 
                    : `Hello ${user?.name || ''}! 👋 I'm your Website Builder AI. I can build your full company portfolio, change colors, layouts, and add new sections. Ask me anything!`
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

        // Extract ALL style blocks
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let allCss = '';
        let styleMatch;
        while ((styleMatch = styleRegex.exec(code)) !== null) {
            allCss += (allCss ? '\n' : '') + styleMatch[1].trim();
        }

        // Extract ALL script blocks
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        let allJs = '';
        let scriptMatch;
        while ((scriptMatch = scriptRegex.exec(code)) !== null) {
            allJs += (allJs ? '\n\n' : '') + scriptMatch[1].trim();
        }

        // Remove all style and script blocks from HTML
        let htmlOnly = code
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

        setSegments({
            html: htmlOnly.trim(),
            css: allCss,
            js: allJs
        });

        // Discover colors from CSS
        try {
            const colorRegex = /#[0-9a-fA-F]{3,8}\b/g;
            const found = allCss.match(colorRegex) || [];
            const unique = [...new Set(found)].slice(0, 12);
            setDiscoveredColors(unique);
        } catch (_e) { /* ignore */ }
    };

    const handleSegmentChange = (newCode, type) => {
        const newSegments = { ...segments, [type]: newCode };
        setSegments(newSegments);

        // Rebuild the full HTML properly
        let html = newSegments.html;
        
        // Insert <style> before </head> if head exists, otherwise before </html>
        if (newSegments.css) {
            const styleBlock = `\n<style>\n${newSegments.css}\n</style>\n`;
            if (html.includes('</head>')) {
                html = html.replace('</head>', styleBlock + '</head>');
            } else {
                html = styleBlock + html;
            }
        }

        // Insert <script> before </body> if body exists, otherwise at end
        if (newSegments.js) {
            const scriptBlock = `\n<script>\n${newSegments.js}\n</script>\n`;
            if (html.includes('</body>')) {
                html = html.replace('</body>', scriptBlock + '</body>');
            } else {
                html += scriptBlock;
            }
        }

        setCurrentCode(html);
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
            
            {/* ─── Lovable-style Top Toolbar ─── */}
            <div className="editor-toolbar">
                <div className="toolbar-left">
                    <div className="toolbar-logo">
                        <i className="fas fa-bolt"></i>
                    </div>
                    <span className="toolbar-project-name">{companyName || 'VOXIO AI'}</span>
                </div>

                <div className="toolbar-center desktop-only">
                    <button className={`tb-btn ${viewMode === 'code-only' ? 'active' : ''}`} onClick={() => setViewMode('code-only')}>
                        <i className="fas fa-code"></i>
                        <span>{isArabic ? 'كود' : 'Code'}</span>
                    </button>
                    <button className={`tb-btn ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')}>
                        <i className="fas fa-columns"></i>
                        <span>{isArabic ? 'تقسيم' : 'Split'}</span>
                    </button>
                    <button className={`tb-btn ${viewMode === 'preview-only' ? 'active' : ''}`} onClick={() => setViewMode('preview-only')}>
                        <i className="fas fa-eye"></i>
                        <span>{isArabic ? 'معاينة' : 'Preview'}</span>
                    </button>
                </div>

                <div className="toolbar-right">
                    <button 
                        className="tb-icon-btn" 
                        onClick={() => setIsSidebarOpen(prev => !prev)} 
                        title={isArabic ? 'القائمة الجانبية' : 'Toggle Sidebar'}
                    >
                        <i className={`fas ${isSidebarOpen ? 'fa-sidebar' : 'fa-bars'}`}></i>
                    </button>
                    <button 
                        className="tb-icon-btn" 
                        onClick={() => { if (codeHistory.length > 0) { setCurrentCode(codeHistory[codeHistory.length - 1]); parseAndSetSegments(codeHistory[codeHistory.length - 1]); setCodeHistory(prev => prev.slice(0, -1)); }}} 
                        disabled={codeHistory.length === 0}
                        title={isArabic ? 'تراجع' : 'Undo'}
                    >
                        <i className="fas fa-rotate-left"></i>
                    </button>
                    <button 
                        className="tb-icon-btn desktop-only" 
                        onClick={() => setIsFullscreen(prev => !prev)}
                        title={isArabic ? 'ملء الشاشة' : 'Fullscreen'}
                    >
                        <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                    </button>
                    <button className="tb-save-btn" onClick={handleManualSave} disabled={isSaving}>
                        <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                        <span>{isArabic ? 'نشر' : 'Publish'}</span>
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
                            <i className="fas fa-sparkles"></i>
                            {isArabic ? 'المساعد' : 'Chat'}
                        </button>
                        <button className={activeSidebarTab === 'theme' ? 'active' : ''} onClick={() => setActiveSidebarTab('theme')}>
                            <i className="fas fa-swatchbook"></i>
                            {isArabic ? 'قوالب' : 'Templates'}
                        </button>
                    </div>

                    <div className="sidebar-body">
                        {activeSidebarTab === 'ai' && (
                            <div className="chat-interface" dir={isArabic ? 'rtl' : 'ltr'}>
                                
                                <div className="model-selector-bar">
                                    <label>{isArabic ? 'موديل البرمجة' : 'Coding Model'}</label>
                                    <select 
                                        value={codingModel} 
                                        onChange={(e) => setCodingModel(e.target.value)}
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
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
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
                                style={{ fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '13px', direction: 'ltr' }}
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
                                        <p>{isArabic ? 'الذكاء الاصطناعي يكتب الكود...' : 'AI is coding...'}</p>
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
                        <i className="fas fa-check-circle"></i> {isArabic ? 'تم الحفظ بنجاح' : 'Published Successfully'}
                    </motion.div>
                )}
            </AnimatePresence>
            <WebCommandsModal show={showWebCommands} onClose={() => setShowWebCommands(false)} />
        </div>
    );
};

export default ChatbotEditor;
