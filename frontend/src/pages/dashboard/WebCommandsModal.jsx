import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { useToast } from '../../components/Toast';

const WebCommandsModal = ({ show, onClose, isInline = false }) => {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [commandsData, setCommandsData] = useState({ commands: [] });
    const [newCommand, setNewCommand] = useState({ command: '', description: '', category: '', type: 'ai', message: '', successMessage: '', products: [] });
    const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = secureStorage.getItem('token');
    
    const newCommandRef = useRef(newCommand);
    useEffect(() => { newCommandRef.current = newCommand; }, [newCommand]);

    useEffect(() => {
        if (show || isInline) fetchWebsiteCommands();
    }, [show, isInline]);

    const fetchWebsiteCommands = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/integration-manager`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const int = res.data.find(i => i.platform === 'website');
            if (int && int.settings) {
                setCommandsData({ commands: int.settings.commands || [] });
            }
        } catch (error) {
            console.error('Error fetching website commands:', error);
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
        const productToAdd = { name: newProduct.name, price: newProduct.price, description: newProduct.description };
        setNewCommand(prev => {
            const updated = { ...prev, products: [...(prev.products || []), productToAdd] };
            newCommandRef.current = updated;
            return updated;
        });
        setNewProduct({ name: '', price: '', description: '' });
    };

    const addCommand = () => {
        const currentCmd = newCommandRef.current;
        if (!currentCmd.command) return;
        setCommandsData(prev => ({ ...prev, commands: [...prev.commands, { ...currentCmd }] }));
        const emptyCmd = { command: '', description: '', category: '', type: 'ai', message: '', successMessage: '', products: [] };
        setNewCommand(emptyCmd);
        newCommandRef.current = emptyCmd;
        setNewProduct({ name: '', price: '', description: '' });
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
            await axios.post(`${BACKEND_URL}/integration-manager/website`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t.language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!');
            if (onClose) onClose();
        } catch (error) {
            console.error('Error saving website commands:', error);
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
                    <div style={{ background: 'var(--dash-card)', borderRadius: '15px', padding: '18px', border: '1px solid var(--dash-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                            {(newCommand.products || []).map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--dash-bg)', borderRadius: '10px', border: '1px solid var(--dash-border)' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{p.name} <small style={{ color: 'var(--dash-text-sec)' }}>({p.price})</small></span>
                                    <button type="button" onClick={() => removeProductFromCommand(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder={t.language === 'ar' ? 'اسم المنتج' : 'Product name'} value={newProduct.name} onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)' }} />
                            <input type="text" placeholder={t.language === 'ar' ? 'السعر' : 'Price'} value={newProduct.price} onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)' }} />
                            <button type="button" onClick={addProductToCommand} style={{ background: 'var(--dash-text)', color: 'var(--dash-bg)', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer' }}><i className="fas fa-plus"></i></button>
                        </div>
                    </div>
                )}
                <button type="button" onClick={addCommand} style={{ background: 'var(--dash-card)', border: '1px dashed var(--dash-border)', color: 'var(--dash-text)', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: '700' }}>
                    <i className="fas fa-plus"></i> {t.language === 'ar' ? 'إضافة هذا الأمر للموقع' : 'Add Command'}
                </button>
            </div>

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
