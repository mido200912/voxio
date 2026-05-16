import { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { secureStorage } from '../../utils/secureStorage';
import { useToast } from '../../components/Toast';
 
import { motion } from 'framer-motion';
import '../../pages/auth/Auth.css';

const OnboardingProfile = () => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        companySize: '',
        description: '',
        vision: '',
        mission: '',
        values: '',
        websiteUrl: '',
        allowedDomains: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = secureStorage.getItem('token');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.industry) {
            toast.error(language === 'ar' ? 'الرجاء إكمال الحقول المطلوبة' : 'Please fill required fields');
            return;
        }

        setLoading(true);
        try {
            let logoUrl = '';
            if (logoFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('image', logoFile);
                const uploadRes = await axios.post(`${BACKEND_URL}/ai/image`, formDataUpload, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}` 
                    }
                });
                logoUrl = uploadRes.data.imageUrl;
            }

            const payload = {
                ...formData,
                size: formData.companySize,
                values: formData.values.split(',').map(v => v.trim()).filter(v => v),
                allowedDomains: formData.allowedDomains.split(',').map(d => d.trim()).filter(d => d),
                ...(logoUrl && { logo: logoUrl })
            };

            await axios.post(`${BACKEND_URL}/company`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(language === 'ar' ? 'تم إنشاء هوية الشركة بنجاح!' : 'Company identity created successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(language === 'ar' ? "حدث خطأ أثناء الحفظ" : "Error saving profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container onboarding-container">
            <motion.div 
                className="auth-card onboarding-card" 
                style={{ maxWidth: '900px', width: '95%' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <div className="onboarding-badge">Step 1/1</div>
                    <h2>{language === 'ar' ? 'بناء هوية شركتك الذكية' : 'Build Your Smart Company Identity'}</h2>
                    <p>{language === 'ar' ? 'هذه البيانات هي "عقل" المساعد الذكي، كلما كانت دقيقة، كان رده احترافياً.' : 'This data is the "brain" of your AI assistant. The more accurate it is, the more professional the response.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="onboarding-form">
                    {/* Logo Section */}
                    <div className="onboarding-section" style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <label htmlFor="logo-upload" className="logo-upload-label">
                            <div className="logo-preview-circle">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" />
                                ) : (
                                    <i className="fas fa-camera"></i>
                                )}
                            </div>
                            <span className="upload-text">{language === 'ar' ? 'تحميل شعار الشركة' : 'Upload Company Logo'}</span>
                        </label>
                        <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleLogoChange}
                        />
                    </div>

                    <div className="onboarding-grid">
                        <div className="form-group">
                            <label className="form-label">{language === 'ar' ? 'اسم الشركة' : 'Company Name'} <span className="required">*</span></label>
                            <input
                                className="form-input"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Example: VOXIO AI"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{language === 'ar' ? 'مجال العمل' : 'Industry'} <span className="required">*</span></label>
                            <input
                                className="form-input"
                                type="text"
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Technology, E-commerce, Real Estate"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{language === 'ar' ? 'حجم الشركة' : 'Company Size'}</label>
                            <select 
                                className="form-input" 
                                name="companySize" 
                                value={formData.companySize} 
                                onChange={handleChange}
                            >
                                <option value="">Select Size</option>
                                <option value="1-10">1-10 Employees</option>
                                <option value="11-50">11-50 Employees</option>
                                <option value="51-200">51-200 Employees</option>
                                <option value="201-500">201-500 Employees</option>
                                <option value="500+">500+ Employees</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{language === 'ar' ? 'رابط الموقع (اختياري)' : 'Website URL (Optional)'}</label>
                            <input
                                className="form-input"
                                type="url"
                                name="websiteUrl"
                                value={formData.websiteUrl}
                                onChange={handleChange}
                                placeholder="https://yourwebsite.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{language === 'ar' ? 'وصف الشركة' : 'Company Description'}</label>
                        <textarea
                            className="form-input"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder={language === 'ar' ? 'ماذا تفعل شركتك؟ من هم عملاؤك؟' : 'What does your company do? Who are your customers?'}
                        />
                    </div>

                    <div className="onboarding-grid">
                        <div className="form-group">
                            <label className="form-label">{language === 'ar' ? 'الرؤية (Vision)' : 'Vision'}</label>
                            <textarea
                                className="form-input"
                                name="vision"
                                value={formData.vision}
                                onChange={handleChange}
                                rows="2"
                                placeholder={language === 'ar' ? 'أين ترى الشركة في المستقبل؟' : 'Where do you see the company in the future?'}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{language === 'ar' ? 'الرسالة (Mission)' : 'Mission'}</label>
                            <textarea
                                className="form-input"
                                name="mission"
                                value={formData.mission}
                                onChange={handleChange}
                                rows="2"
                                placeholder={language === 'ar' ? 'ما هو هدفكم اليومي؟' : 'What is your daily goal?'}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{language === 'ar' ? 'القيم (Values) - افصل بفاصلة' : 'Company Values - Separated by comma'}</label>
                        <input
                            className="form-input"
                            type="text"
                            name="values"
                            value={formData.values}
                            onChange={handleChange}
                            placeholder="Innovation, Trust, Quality..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{language === 'ar' ? 'النطاقات المسموح بها (Allowed Domains)' : 'Allowed Domains'}</label>
                        <input
                            className="form-input"
                            type="text"
                            name="allowedDomains"
                            value={formData.allowedDomains}
                            onChange={handleChange}
                            placeholder="example.com, shop.example.com"
                        />
                        <p className="form-hint">
                            {language === 'ar' 
                                ? '⚠️ أدخل النطاقات التي سيتم تشغيل البوت عليها فقط لمنع استخدامه في مواقع أخرى.' 
                                : '⚠️ Enter domains where your bot is allowed to run to prevent unauthorized use.'}
                        </p>
                    </div>

                    <div className="onboarding-actions">
                        <button
                            type="submit"
                            className="btn btn-primary btn-xl"
                            disabled={loading}
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin"></i> {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</>
                            ) : (
                                <>{language === 'ar' ? 'تفعيل حساب الشركة والبدء' : 'Activate Company Account & Start'} <i className="fas fa-rocket"></i></>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>

            <style dangerouslySetInnerHTML={{ __html: `
                .onboarding-container {
                    padding: 40px 20px;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .onboarding-card {
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    padding: 40px !important;
                }
                .onboarding-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .onboarding-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                @media (max-width: 768px) {
                    .onboarding-grid { grid-template-columns: 1fr; }
                }
                .logo-preview-circle {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .logo-upload-label:hover .logo-preview-circle {
                    border-color: var(--primary-color);
                    background: rgba(255, 255, 255, 0.1);
                }
                .logo-preview-circle i {
                    font-size: 32px;
                    color: rgba(255, 255, 255, 0.3);
                }
                .logo-preview-circle img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .upload-text {
                    color: var(--primary-color);
                    font-weight: 600;
                    font-size: 14px;
                }
                .onboarding-actions {
                    margin-top: 40px;
                }
                .btn-xl {
                    padding: 18px 30px;
                    font-size: 18px;
                    font-weight: 800;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                }
                .form-hint {
                    font-size: 12px;
                    color: #94a3b8;
                    margin-top: 8px;
                }
            ` }} />
        </div>
    );
};

export default OnboardingProfile;
