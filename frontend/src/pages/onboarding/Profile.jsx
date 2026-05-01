import { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { secureStorage } from '../../utils/secureStorage';
import { useToast } from '../../components/Toast';
import '../../pages/auth/Auth.css';

const OnboardingProfile = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        description: '',
        vision: '',
        mission: '',
        values: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';
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

            // Process values string to array logic handled in backend if needed or send as array
            // Here backend expects array for values, let's keep it simple string for now or split
            const payload = {
                ...formData,
                values: formData.values.split(',').map(v => v.trim()).filter(v => v),
                ...(logoUrl && { logo: logoUrl })
            };

            await axios.post(`${BACKEND_URL}/company`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Navigate to Dashboard directly
            navigate('/dashboard');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("حدث خطأ: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-fade-in" style={{ maxWidth: '800px' }}>
                <div className="auth-header">
                    <h2>إعداد هوية الشركة</h2>
                    <p>هذه البيانات ستشكل شخصية الذكاء الاصطناعي وتساعده في الرد بدقة</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <label htmlFor="logo-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '2px dashed var(--border-color)',
                                margin: '0 auto 10px'
                            }}>
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>📷</span>
                                )}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--primary-color)' }}>تحميل لوجو الشركة</span>
                        </label>
                        <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleLogoChange}
                        />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">اسم الشركة <span className="required">*</span></label>
                            <input
                                className="form-input"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="اسم شركتك"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">مجال العمل <span className="required">*</span></label>
                            <input
                                className="form-input"
                                type="text"
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                required
                                placeholder="تكنولوجيا، تعليم، تجارة..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">وصف الشركة</label>
                        <textarea
                            className="form-input"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="وصف مختصر لنشاط الشركة وما تقدمه للعملاء..."
                        />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">الرؤية (Vision)</label>
                            <textarea
                                className="form-input"
                                name="vision"
                                value={formData.vision}
                                onChange={handleChange}
                                rows="2"
                                placeholder="طموحات الشركة المستقبلية"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">الرسالة (Mission)</label>
                            <textarea
                                className="form-input"
                                name="mission"
                                value={formData.mission}
                                onChange={handleChange}
                                rows="2"
                                placeholder="مهمة الشركة اليومية"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">القيم (Values) - افصل بفاصلة</label>
                        <input
                            className="form-input"
                            type="text"
                            name="values"
                            value={formData.values}
                            onChange={handleChange}
                            placeholder="مثال: الجودة، الأمانة، الابتكار"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ وإكمال الإعداد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardingProfile;
