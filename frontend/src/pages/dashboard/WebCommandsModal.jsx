import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { useToast } from '../../components/ui/Toast';


const WebCommandsModal = ({ show, onClose, isInline = false, platform = 'website' }) => {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [commandsData, setCommandsData] = useState({ commands: [] });
    const [newCommand, setNewCommand] = useState({ command: '', description: '', category: '', type: 'ai', message: '', successMessage: '', products: [] });
    const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', imageUrl: '' });
    const [mediaLibrary, setMediaLibrary] = useState([]);
    const [showMediaBrowser, setShowMediaBrowser] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = secureStorage.getItem('token');
    
    const newCommandRef = useRef(newCommand);
    useEffect(() => { newCommandRef.current = newCommand; }, [newCommand]);

    useEffect(() => {
        if (show || isInline) {
            fetchWebsiteCommands();
            fetchMediaLibrary();
        }
    }, [show, isInline, platform]);

    const fetchWebsiteCommands = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/integration-manager`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const int = res.data.find(i => i.platform === platform);
            if (int && int.settings) {
                setCommandsData({ commands: int.settings.commands || [] });
            } else {
                setCommandsData({ commands: [] });
            }
        } catch (error) {
            console.error('Error fetching website commands:', error);
        }
    };

    const fetchMediaLibrary = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/ai/media-library`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.images) {
                setMediaLibrary(res.data.images);
            }
        } catch (error) {
            console.error('Error fetching media library:', error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const uploadRes = await axios.post(`${BACKEND_URL}/ai/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setNewProduct(prev => ({ ...prev, imageUrl: uploadRes.data.imageUrl }));
            setMediaLibrary(prev => [uploadRes.data.imageUrl, ...prev]);
            toast.success(t.language === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded successfully!');
        } catch (error) {
            console.error('Error uploading product image:', error);
            toast.error(t.language === 'ar' ? 'فشل رفع الصورة' : 'Image upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    const updateNewCommand = (field, value) => {
        setNewCommand(prev => {
            const updated = { ...prev, [field]: value };
            newCommandRef.current = updated;
            return updated;
        });
    };

    const addProductToCommand = () => {
        if (!newProduct.name) {
            toast.warning(t.language === 'ar' ? 'اكتب اسم المنتج الأوّل!' : 'Enter product name first!');
            return;
        }
        const productToAdd = { name: newProduct.name, price: newProduct.price, description: newProduct.description, imageUrl: newProduct.imageUrl || '' };
        setNewCommand(prev => {
            const updated = { ...prev, products: [...(prev.products || []), productToAdd] };
            newCommandRef.current = updated;
            return updated;
        });
        setNewProduct({ name: '', price: '', description: '', imageUrl: '' });
    };

    const addCommand = () => {
        const currentCmd = newCommandRef.current;
        if (!currentCmd.command) return;
        setCommandsData(prev => ({ ...prev, commands: [...prev.commands, { ...currentCmd }] }));
        const emptyCmd = { command: '', description: '', category: '', type: 'ai', message: '', successMessage: '', products: [] };
        setNewCommand(emptyCmd);
        newCommandRef.current = emptyCmd;
        setNewProduct({ name: '', price: '', description: '', imageUrl: '' });
    };

    const removeCommand = (index) => {
        setCommandsData(prev => ({ ...prev, commands: prev.commands.filter((_, i) => i !== index) }));
    };

    const removeProductFromCommand = (idx) => {
        setNewCommand(prev => {
            const updated = { ...prev, products: prev.products.filter((_, i) => i !== idx) };
            newCommandRef.current = updated;
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const currentCmd = newCommandRef.current;
            let finalCommands = [...commandsData.commands];
            if (currentCmd.command && currentCmd.command.trim() !== '') {
                finalCommands.push({ ...currentCmd });
            }

            const payload = { commands: finalCommands };
            await axios.post(`${BACKEND_URL}/integration-manager/${platform}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t.language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!');
            if (onClose) onClose();
        } catch (error) {
            console.error('Error saving commands:', error);
            toast.error(t.language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving data.');
        }
    };

    if (!show && !isInline) return null;

    // Rendered form content (Shared between modal & inline)
    const renderFormContent = () => (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: 'var(--dash-text-sec)', marginBottom: '10px', lineHeight: '1.6', fontSize: '0.9rem' }}>
                {t.language === 'ar' 
                    ? 'قم بإنشاء روابط مخصصة (سلاش /) لعملاء موقعك لطلب منتجات، فتح قوائم، أو توجيه أسئلة مخصصة للذكاء الاصطناعي.' 
                    : 'Create custom links (slash /) for your website visitors to order products, open menus, or ask specific AI questions.'}
            </p>

            {/* Saved Commands */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '10px' }}>
                {commandsData.commands.map((cmd, idx) => (
                    <div key={idx} style={{ position: 'relative', background: 'var(--dash-bg)', padding: '16px', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>/{cmd.command}</span>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(128,128,128,0.1)', padding: '2px 8px', borderRadius: '10px', color: 'var(--dash-text-sec)' }}>{cmd.type}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--dash-text-sec)' }}><b>{t.language === 'ar' ? 'التصنيف:' : 'Category:'}</b> {cmd.category}</div>
                        {cmd.products?.length > 0 && <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}><b>📦 {cmd.products.length} {t.language === 'ar' ? 'منتجات' : 'Products'}</b></div>}
                        <button type="button" onClick={() => removeCommand(idx)} style={{ position: 'absolute', top: '12px', right: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <i className="fas fa-trash" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Command Form */}
            <div style={{ background: 'var(--dash-bg)', border: '1px solid var(--dash-border)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '15px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--dash-text-sec)', fontWeight: '600', marginBottom: '5px', display: 'block' }}>{t.language === 'ar' ? 'أمر يبدأ بـ (بدون /)' : 'Command ID'}</label>
                        <input type="text" placeholder="shopping" value={newCommand.command} onChange={e => updateNewCommand('command', e.target.value)}
                            style={{ borderRadius: '10px', padding: '10px 14px', border: '1px solid var(--dash-border)', background: 'var(--dash-card)', color: 'var(--dash-text)', width: '100%' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--dash-text-sec)', fontWeight: '600', marginBottom: '5px', display: 'block' }}>{t.language === 'ar' ? 'التصنيف' : 'Category'}</label>
                        <input type="text" placeholder={t.language === 'ar' ? 'مبيعات' : 'Sales'} value={newCommand.category} onChange={e => updateNewCommand('category', e.target.value)}
                            style={{ borderRadius: '10px', padding: '10px 14px', border: '1px solid var(--dash-border)', background: 'var(--dash-card)', color: 'var(--dash-text)', width: '100%' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--dash-text-sec)', fontWeight: '600', marginBottom: '5px', display: 'block' }}>{t.language === 'ar' ? 'نوع الرد' : 'Response Type'}</label>
                        <select value={newCommand.type} onChange={e => updateNewCommand('type', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--dash-border)', background: 'var(--dash-card)', color: 'var(--dash-text)' }}>
                            <option value="ai">🤖 AI Reply</option>
                            <option value="fixed_message">💬 Fixed Message</option>
                            <option value="product_menu">🛍️ Product Menu + Order</option>
                        </select>
                    </div>
                </div>

                {newCommand.type !== 'ai' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--dash-text-sec)', fontWeight: '600', marginBottom: '5px', display: 'block' }}>{t.language === 'ar' ? 'رسالة العرض / الترحيب' : 'Display Message'}</label>
                            <textarea rows="3" value={newCommand.message} placeholder={t.language === 'ar' ? 'اختر منتجاً...' : 'Choose a product...'} onChange={e => updateNewCommand('message', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--dash-border)', background: 'var(--dash-card)', color: 'var(--dash-text)', fontSize: '0.85rem' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--dash-text-sec)', fontWeight: '600', marginBottom: '5px', display: 'block' }}>{t.language === 'ar' ? 'رسالة النجاح' : 'Success Message'}</label>
                            <textarea rows="3" value={newCommand.successMessage} placeholder={t.language === 'ar' ? 'تم استلام طلبك.' : 'Order received.'} onChange={e => updateNewCommand('successMessage', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--dash-border)', background: 'var(--dash-card)', color: 'var(--dash-text)', fontSize: '0.85rem' }} />
                        </div>
                    </div>
                )}

                {newCommand.type === 'product_menu' && (
                    <div style={{ background: 'var(--dash-card)', borderRadius: '15px', padding: '18px', border: '1px solid var(--dash-border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(newCommand.products || []).map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--dash-bg)', borderRadius: '10px', border: '1px solid var(--dash-border)' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {p.imageUrl && <img src={p.imageUrl} alt="thumb" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />}
                                        {p.name} <small style={{ color: 'var(--dash-text-sec)' }}>({p.price})</small>
                                    </span>
                                    <button type="button" onClick={() => removeProductFromCommand(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder={t.language === 'ar' ? 'اسم المنتج' : 'Product name'} value={newProduct.name} onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)' }} />
                            <input type="text" placeholder={t.language === 'ar' ? 'السعر' : 'Price'} value={newProduct.price} onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)' }} />
                            <button type="button" onClick={addProductToCommand} style={{ background: 'var(--dash-text)', color: 'var(--dash-bg)', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer' }}><i className="fas fa-plus"></i></button>
                        </div>

                        {/* Product Image Selection & Upload */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--dash-border)', paddingTop: '12px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', fontWeight: '600' }}>
                                {t.language === 'ar' ? 'صورة المنتج (اختيارية)' : 'Product Image (Optional)'}
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    placeholder={t.language === 'ar' ? 'أدخل رابط الصورة أو ارفعها...' : 'Enter image URL or upload...'} 
                                    value={newProduct.imageUrl} 
                                    onChange={e => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))} 
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)' }} 
                                />
                                <label style={{ cursor: 'pointer', background: 'var(--dash-border)', color: 'var(--dash-text)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', height: '100%', minHeight: '40px' }}>
                                    <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                                    {isUploading ? '' : (t.language === 'ar' ? 'رفع' : 'Upload')}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                </label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowMediaBrowser(true)} 
                                    style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}
                                >
                                    <i className="fas fa-images"></i>
                                    {t.language === 'ar' ? 'استيراد' : 'Import'}
                                </button>
                            </div>
                            {newProduct.imageUrl && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', border: '1px solid var(--dash-border)' }}>
                                    <img src={newProduct.imageUrl} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{newProduct.imageUrl}</span>
                                    <button type="button" onClick={() => setNewProduct(prev => ({ ...prev, imageUrl: '' }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <button type="button" onClick={addCommand} style={{ background: 'var(--dash-card)', border: '1px dashed var(--dash-border)', color: 'var(--dash-text)', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: '700' }}>
                    <i className="fas fa-plus"></i> {t.language === 'ar' ? 'إضافة هذا الأمر للموقع' : 'Add Command'}
                </button>
            </div>

            {/* Media Browser Overlay */}
            {showMediaBrowser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--dash-text)' }}>
                                {t.language === 'ar' ? '📥 استيراد صورة من المحادثات والطلبات' : 'Import Image from Chats & Leads'}
                            </h3>
                            <button type="button" onClick={() => setShowMediaBrowser(false)} style={{ background: 'none', border: 'none', color: 'var(--dash-text)', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times"></i></button>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dash-text-sec)', lineHeight: '1.4' }}>
                            {t.language === 'ar' 
                                ? 'يتم هنا تلقائياً كشف واستيراد جميع الصور التي أرسلها العملاء أو البوتات في تليجرام، واتساب، ومحادثات الويب، بالإضافة لبعض النماذج المميزة.' 
                                : 'All images shared by users or bots in Telegram, WhatsApp, Web, and presets are auto-discovered here.'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                            {mediaLibrary.map((imgUrl, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => {
                                        setNewProduct(prev => ({ ...prev, imageUrl: imgUrl }));
                                        setShowMediaBrowser(false);
                                    }}
                                    style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--dash-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <img src={imgUrl} alt="Library Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="dash-btn dash-btn-outline" onClick={() => setShowMediaBrowser(false)}>
                                {t.language === 'ar' ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                {!isInline && (
                    <button type="button" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(128,128,128,0.1)', border: 'none', fontWeight: '600', cursor: 'pointer', color: 'var(--dash-text)' }}>
                        {t.language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                )}
                <button type="submit" className="dash-btn dash-btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', height: 'auto' }}>
                    <i className="fas fa-save" style={{ marginInlineEnd: '8px' }}></i>
                    {t.language === 'ar' ? 'حفظ الأوامر مخصصة' : 'Save Commands'}
                </button>
            </div>
        </form>
    );

    if (isInline) {
        return (
            <div className="dash-card animate-fade-in" style={{ padding: '30px', background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--dash-text)', color: 'var(--dash-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        <i className="fas fa-globe"></i>
                    </div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '800', color: 'var(--dash-text)' }}>
                        {t.language === 'ar' ? 'إعداد القوائم والأوامر الخاصة بالويب' : 'Web Bot Slash Commands & Menus'}
                    </h2>
                </div>
                {renderFormContent()}
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 999999,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: 'var(--dash-card)', color: 'var(--dash-text)', borderRadius: '24px', width: '90%', maxWidth: '700px',
                padding: '30px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--dash-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        <i className="fas fa-globe" style={{ color: '#4f46e5' }} />
                        {t.language === 'ar' ? 'إعداد القوائم والأوامر الخاصة بالويب' : 'Web Bot Slash Commands & Menus'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--dash-text)' }}><i className="fas fa-times"></i></button>
                </div>
                {renderFormContent()}
            </div>
        </div>
    );
};

export default WebCommandsModal;
