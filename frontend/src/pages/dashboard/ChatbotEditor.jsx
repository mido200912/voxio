import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import './ChatbotEditor.css';
import WebCommandsModal from './WebCommandsModal';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import Editor from 'react-simple-code-editor';

const ChatbotEditor = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
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
    
    // Workspace Modes: 'split', 'code-only', 'preview-only'
    const [viewMode, setViewMode] = useState('split');
    const [activeSidebarTab, setActiveSidebarTab] = useState('ai'); // 'ai', 'theme', 'data'
    const [isSaving, setIsSaving] = useState(false);
    const [codeHistory, setCodeHistory] = useState([]);
    const [activeFile, setActiveFile] = useState('html'); // 'html', 'css', 'js'
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [discoveredColors, setDiscoveredColors] = useState([]);
    
    // Internal state for segments
    const [segments, setSegments] = useState({ html: '', css: '', js: '' });
    
    const iframeRef = useRef(null);
    const messagesEndRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

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
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BACKEND_URL}/chatbot-editor/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data.templates || []);
        } catch (err) { console.error(err); }
    };

    const fetchCurrentChatbot = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BACKEND_URL}/chatbot-editor/current`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fullCode = res.data.htmlContent;
            setCurrentCode(fullCode);
            parseAndSetSegments(fullCode);
            
            setCodeHistory([]); // Initialize empty history
            setCompanySlug(res.data.slug);
            setCompanyName(res.data.name);
            setMessages([{
                id: 1,
                role: 'ai',
                content: language === 'ar' 
                    ? `مرحباً! 👋 أنا مصممك الخاص. اطلب مني أي تعديل وسأقوم بتعديل الكود فوراً.` 
                    : `Hello! 👋 I'm your AI Designer. Ask for any changes and I'll update the code instantly.`
            }]);
        } catch (err) { console.error(err); }
        finally { setInitialLoading(false); }
    };

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
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${BACKEND_URL}/chatbot-editor/edit`,
                { userRequest: request, history: messages },
                { headers: { Authorization: `Bearer ${token}` }, timeout: 120000 }
            );
            
            if (res.data.code && res.data.code !== currentCode) {
                setCodeHistory(prev => [...prev, currentCode]); // Save prior state before updating
                setCurrentCode(res.data.code);
                parseAndSetSegments(res.data.code);
            }
            
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: res.data.message || 'Updated! ✅'
            }]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); setAiProcessing(false); }
    };

    const parseAndSetSegments = (code) => {
        const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        
        let htmlOnly = code;
        if (styleMatch) htmlOnly = htmlOnly.replace(styleMatch[0], '<!-- STYLES -->');
        if (scriptMatch) htmlOnly = htmlOnly.replace(scriptMatch[0], '<!-- SCRIPTS -->');
        
        setSegments({
            html: htmlOnly.trim(),
            css: styleMatch ? styleMatch[1].trim() : '',
            js: scriptMatch ? scriptMatch[1].trim() : ''
        });

        discoverColors(code);
    };

    const discoverColors = (code) => {
        try {
            const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
            if (!styleMatch) return;
            const css = styleMatch[1];
            
            // Find --var: #color; or --var: color_name; or --var: rgb();
            // Regex to find CSS variables specifically for colors
            const varRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
            const found = [];
            let match;
            while ((match = varRegex.exec(css)) !== null) {
                const name = match[1].trim();
                const value = match[2].trim();
                
                // Basic check if it looks like a color (hex, rgb, rgba, hsl, or common named colors)
                const isColor = /^(#|rgb|rgba|hsl|hsla|transparent|white|black|red|blue|green|gray|grey|yellow|purple|orange|cyan|magenta)/i.test(value);
                
                if (isColor && !found.find(c => c.name === name)) {
                    // Prettify name: --bot-bg -> Bot Bg
                    const label = name.replace(/^--/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    found.push({ name, value, label });
                }
            }
            setDiscoveredColors(found);
        } catch (e) {
            console.error("Error discovering colors:", e);
        }
    };

    const normalizeToHex = (color) => {
        if (!color) return '#000000';
        
        // If it's a 3-char hex #123, convert to #112233
        const hex3Match = color.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
        if (hex3Match) {
            return "#" + hex3Match[1] + hex3Match[1] + hex3Match[2] + hex3Match[2] + hex3Match[3] + hex3Match[3];
        }

        const hexMatch = color.match(/#[0-9a-fA-F]{6}/);
        if (hexMatch) return hexMatch[0];
        
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        const colors = {
            'white': '#ffffff', 'black': '#000000', 'red': '#ff0000', 'blue': '#0000ff', 
            'green': '#008000', 'yellow': '#ffff00', 'purple': '#800080', 'gray': '#808080',
            'grey': '#808080', 'transparent': '#00000000', 'orange': '#ffa500'
        };
        return colors[color.toLowerCase()] || '#000000';
    };

    const handleSegmentChange = (newCode, type) => {
        const newSegments = { ...segments, [type]: newCode };
        setSegments(newSegments);
        
        // Merge back to full code
        let merged = newSegments.html;
        merged = merged.replace('<!-- STYLES -->', `<style>\n${newSegments.css}\n</style>`);
        merged = merged.replace('<!-- SCRIPTS -->', `<script>\n${newSegments.js}\n</script>`);
        
        // Add if markers were missing somehow
        if (!merged.includes('<style>') && newSegments.css) merged += `\n<style>\n${newSegments.css}\n</style>`;
        if (!merged.includes('<script>') && newSegments.js) merged += `\n<script>\n${newSegments.js}\n</script>`;
        
        setCurrentCode(merged);
    };

    const handleManualSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${BACKEND_URL}/chatbot-editor/save`, { htmlContent: currentCode }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(language === 'ar' ? '✅ تم الحفظ' : '✅ Saved');
        } catch (err) { console.error(err); }
        finally { setIsSaving(false); }
    };

    const handleUndoCode = () => {
        if (codeHistory.length > 0) {
            const previousCode = codeHistory[codeHistory.length - 1];
            setCodeHistory(prev => prev.slice(0, -1)); // Remove the last state
            setCurrentCode(previousCode);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'system',
                content: language === 'ar' ? 'تم استرجاع الكود القديم ⏪' : 'Reverted to previous code ⏪'
            }]);
        }
    };

    const handleResetToDefault = async (templateIdArg) => {
        // Ensure templateId is a string, not an event object
        const templateId = typeof templateIdArg === 'string' ? templateIdArg : 'default';
        
        const confirmMsg = language === 'ar' 
            ? 'هل أنت متأكد من تغيير القالب؟ سيؤدي هذا لمسح التعديلات الحالية.' 
            : 'Are you sure you want to change the template? This will overwrite your current changes.';
        
        if (!window.confirm(confirmMsg)) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${BACKEND_URL}/chatbot-editor/reset`, { templateId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setCodeHistory(prev => [...prev, currentCode]); // Save prior state before reset so they can undo the reset if they want!
            if (res.data.code) setCurrentCode(res.data.code);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'system',
                content: res.data.message || (language === 'ar' ? 'تم استعادة الكود الأساسي ✅' : 'Reset to default template ✅')
            }]);
        } catch (err) {
            console.error('Reset error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleColorChange = (varName, color) => {
        // Simple regex replace for CSS variables in the html block
        const regex = new RegExp(`(${varName}:\\s*)[^;]+(;)`, 'i');
        const newCode = currentCode.replace(regex, `$1${color}$2`);
        if (newCode !== currentCode) {
            setCurrentCode(newCode);
            parseAndSetSegments(newCode); // Update internal segments and re-discover colors
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/chat/${companySlug}`;
        navigator.clipboard.writeText(url);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 3000);
    };

    return (
        <div className={`chatbot-editor mode-${viewMode} ${isFullscreen ? 'fullscreen' : ''}`}>
            
            {/* ─── Shared Toolbar ─── */}
            <div className="editor-workspace-bar" style={{ gridColumn: 'span 2' }}>
                <div className="workspace-tabs">
                    <button className={`workspace-tab ${viewMode === 'code-only' ? 'active' : ''}`} onClick={() => setViewMode('code-only')}>
                        <i className="fas fa-code"></i> {language === 'ar' ? 'الكود فقط' : 'Code Only'}
                    </button>
                    <button className={`workspace-tab ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')}>
                        <i className="fas fa-columns"></i> {language === 'ar' ? 'عرض مزدوج' : 'Split View'}
                    </button>
                    <button className={`workspace-tab ${viewMode === 'preview-only' ? 'active' : ''}`} onClick={() => setViewMode('preview-only')}>
                        <i className="fas fa-eye"></i> {language === 'ar' ? 'المعاينة فقط' : 'Preview Only'}
                    </button>
                </div>

                <div className="workspace-actions">
                    <button className="workspace-tab danger" onClick={() => handleResetToDefault('default')} title={language === 'ar' ? 'العودة للكود الأساسي' : 'Reset Default'} style={{ color: '#ef4444' }}>
                        <i className="fas fa-trash-restore"></i> {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
                    </button>
                    <button className="workspace-tab" onClick={handleUndoCode} title={language === 'ar' ? 'رجوع للكود السابق' : 'Undo'} disabled={codeHistory.length === 0} style={{ opacity: codeHistory.length === 0 ? 0.5 : 1 }}>
                        <i className="fas fa-undo"></i>
                    </button>
                    <button className="workspace-tab" onClick={handleCopyLink} title="Copy Link"><i className="fas fa-link"></i></button>
                    <button className="workspace-tab" onClick={() => window.open(`/chat/${companySlug}`, '_blank')} title="View Live"><i className="fas fa-external-link-alt"></i></button>
                    <button className={`workspace-tab ${isFullscreen ? 'active-purple' : ''}`} onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">
                        <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        {isFullscreen ? (language === 'ar' ? 'خروج' : 'Exit') : (language === 'ar' ? 'تكبير' : 'Fullscreen')}
                    </button>
                </div>
            </div>

            {/* ─── MAIN WORKSPACE AREA ─── */}
            <div className="editor-main-area">

                {/* ─── FIXED SIDEBAR PANEL (Right Side) ─── */}
                <div className="panel sidebar-panel" style={{ order: language === 'ar' ? 2 : 0 }}>
                    <div className="sidebar-tabs">
                        <button className={activeSidebarTab === 'ai' ? 'active' : ''} onClick={() => setActiveSidebarTab('ai')}>
                            <i className="fas fa-wand-magic-sparkles"></i> {language === 'ar' ? 'الذكاء الاصطناعي' : 'AI'}
                        </button>
                        <button className={activeSidebarTab === 'theme' ? 'active' : ''} onClick={() => setActiveSidebarTab('theme')}>
                            <i className="fas fa-palette"></i> {language === 'ar' ? 'الألوان' : 'Theme'}
                        </button>
                        <button className={activeSidebarTab === 'data' ? 'active' : ''} onClick={() => setActiveSidebarTab('data')}>
                            <i className="fas fa-box"></i> {language === 'ar' ? 'المنتجات' : 'Data'}
                        </button>
                    </div>

                    <div className="sidebar-content">
                        {/* Tab 1: AI Chat */}
                        {activeSidebarTab === 'ai' && (
                            <>
                                <div className="chat-messages">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`msg-wrapper ${msg.role}`}>
                                            <div className="msg-bubble">{msg.content}</div>
                                        </div>
                                    ))}
                                    {loading && <div style={{display:'flex', justifyContent:'center', padding:'10px'}}><div className="spinner"></div></div>}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="chat-input-area">
                                    <form className="chat-form" onSubmit={sendMessage}>
                                        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="..." />
                                        <button type="submit"><i className="fas fa-paper-plane"></i></button>
                                    </form>
                                </div>
                            </>
                        )}

                        {/* Tab 2: Theme Settings */}
                        {activeSidebarTab === 'theme' && (
                            <div className="theme-settings-panel">
                                <section className="template-gallery">
                                    <h4>{language === 'ar' ? 'اختر قالب احترافي' : 'Choose a Premium Template'}</h4>
                                    <div className="templates-grid">
                                        {templates.map(tpl => (
                                            <div 
                                                key={tpl.id} 
                                                className="template-card" 
                                                onClick={() => handleResetToDefault(tpl.id)}
                                            >
                                                <div className="template-thumb">
                                                    <img src={tpl.thumbnail} alt={tpl.name} />
                                                    <div className="hover-overlay"><i className="fas fa-magic"></i></div>
                                                </div>
                                                <span>{tpl.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="divider" style={{ margin: '20px 0', borderTop: '1px solid var(--border)' }}></div>

                                <h4>{language === 'ar' ? 'الألوان المكتشفة' : 'Detected Theme Colors'}</h4>
                                <p style={{fontSize:'12px', opacity:0.7, marginBottom:'15px'}}>
                                    {language === 'ar' ? 'يتم اكتشاف هذه الألوان تلقائياً من الكود الذي صممه الذكاء الاصطناعي.' : 'These colors are automatically detected from the AI-designed code.'}
                                </p>
                                
                                {discoveredColors.length > 0 ? (
                                    discoveredColors.map(color => (
                                        <div className="setting-group" key={color.name}>
                                            <label>{color.label}</label>
                                            <div className="color-picker-wrapper">
                                                <input 
                                                    type="color" 
                                                    value={normalizeToHex(color.value)} 
                                                    onChange={(e) => handleColorChange(color.name, e.target.value)} 
                                                />
                                                <span>{color.name}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-colors-msg">
                                        {language === 'ar' ? 'لا توجد ألوان مكتشفة بعد.' : 'No dynamic colors detected yet.'}
                                    </div>
                                )}

                                <div className="theme-actions-footer">
                                    <button className="btn-save-theme" onClick={handleManualSave} disabled={isSaving}>
                                        {isSaving ? (
                                            <><i className="fas fa-spinner fa-spin"></i> {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</>
                                        ) : (
                                            <><i className="fas fa-save"></i> {language === 'ar' ? 'حفظ الألوان' : 'Save Theme'}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Bot Data & Products */}
                        {activeSidebarTab === 'data' && (
                            <div className="data-settings-panel">
                                <h4>{language === 'ar' ? 'بيانات البوت والمنتجات' : 'Bot Data & Products'}</h4>
                                <p>{language === 'ar' ? 'أضف منتجاتك وردود البوت والأوامر الخفية (مثل /shopping) الخاصة بالشات المعروض أمامك. هذه الأوامر منفصلة تماماً عن تليجرام.' : 'Add your products, bot responses, and slash commands isolated for this web chatbot specifically.'}</p>
                                <button className="btn-save-code" onClick={() => setShowWebCommands(true)} style={{ width: '100%', padding: '12px', marginTop: '15px' }}>
                                    <i className="fas fa-boxes"></i> {language === 'ar' ? 'إدارة الأوامر الخاصة بالموقع' : 'Manage Web Commands'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            {/* ─── DYNAMIC WORKSPACE (The Editor & Chatbot Design) ─── */}
            <div className="dynamic-content">
                
                {/* PART 1: The Editor */}
                <div className="panel code-panel">
                    <div className="panel-header code-header-tabs">
                        <div className="virtual-file-tabs">
                            <button className={`vt-tab ${activeFile === 'html' ? 'active' : ''}`} onClick={() => setActiveFile('html')}>
                                <i className="fab fa-html5"></i> index.html
                            </button>
                            <button className={`vt-tab ${activeFile === 'css' ? 'active' : ''}`} onClick={() => setActiveFile('css')}>
                                <i className="fab fa-css3-alt"></i> styles.css
                            </button>
                            <button className={`vt-tab ${activeFile === 'js' ? 'active' : ''}`} onClick={() => setActiveFile('js')}>
                                <i className="fab fa-js"></i> script.js
                            </button>
                        </div>
                        <button className="btn-save-code" onClick={handleManualSave} disabled={isSaving}>
                            <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                        </button>
                    </div>
                    <div className="code-container prism-editor-wrapper">
                        <div className="line-nums" id="editor-line-nums">
                            {segments[activeFile].split('\n').map((_, i) => <div key={i}>{i+1}</div>)}
                        </div>
                        <div className="editor-scroller" onScroll={(e) => {
                            document.getElementById('editor-line-nums').scrollTop = e.target.scrollTop;
                        }}>
                        <Editor
                            value={segments[activeFile]}
                            onValueChange={code => handleSegmentChange(code, activeFile)}
                            highlight={code => Prism.highlight(code, 
                                activeFile === 'html' ? Prism.languages.markup :
                                activeFile === 'css' ? Prism.languages.css :
                                Prism.languages.javascript, 
                            activeFile)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 13,
                                minHeight: '100%',
                                background: 'transparent'
                            }}
                            className="code-editor-content"
                        />
                        </div>
                    </div>
                </div>

                {/* PART 2: The Chatbot Preview */}
                <div className="panel preview-panel">
                    <div className="panel-header">
                        <div className="panel-title"><i className="fas fa-desktop"></i> Preview</div>
                    </div>
                    <div className="iframe-container">
                        {initialLoading ? <div className="loader-overlay"><div className="spinner"></div></div> : <iframe ref={iframeRef} srcDoc={currentCode} title="Preview" />}
                        {aiProcessing && <div className="loader-overlay"><div className="spinner"></div><p>✨ Designing...</p></div>}
                    </div>
                </div>

            </div>
            </div>

            {showCopied && <div className="toast-copied">✅ Link Copied</div>}

            <WebCommandsModal show={showWebCommands} onClose={() => setShowWebCommands(false)} />
        </div>
    );
};

export default ChatbotEditor;
