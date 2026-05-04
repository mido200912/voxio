import { useState, useEffect } from 'react';
import axios from 'axios';
import { secureStorage } from '../../utils/secureStorage';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { useToast } from '../../components/Toast';
import './AiTraining.css';
import './DashboardShared.css';

const AiTraining = () => {
    const { t, language } = useLanguage();
    const isArabic = language === 'ar';
    const { toast } = useToast();
    const [files, setFiles] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [extractedKnowledge, setExtractedKnowledge] = useState(''); // PDF
    const [urlExtractedKnowledge, setUrlExtractedKnowledge] = useState(''); // URL
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingKnowledge, setSavingKnowledge] = useState(false); 
    const [savingUrlKnowledge, setSavingUrlKnowledge] = useState(false);
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [scraping, setScraping] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';
    const token = secureStorage.getItem('token');

    useEffect(() => {
        fetchFiles();
        fetchInstructions();
        fetchExtractedKnowledge();
        fetchUrlExtractedKnowledge();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/ai`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFiles(res.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    const fetchInstructions = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/company`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInstructions(res.data.customInstructions || '');
        } catch (error) {
            console.error('Error fetching instructions:', error);
        }
    };

    const fetchExtractedKnowledge = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/ai/extracted-knowledge`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExtractedKnowledge(res.data.extractedKnowledge || '');
        } catch (error) {
            console.error('Error fetching extracted knowledge:', error);
        }
    };

    const fetchUrlExtractedKnowledge = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/ai/url-extracted-knowledge`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUrlExtractedKnowledge(res.data.urlExtractedKnowledge || '');
        } catch (error) {
            console.error('Error fetching url extracted knowledge:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`${BACKEND_URL}/ai/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(isArabic ? 'تم رفع الملف واستخراج المعلومات بنجاح!' : 'File uploaded and knowledge extracted!');
            fetchFiles();

            // ✨ تحديث المعلومات المستخرجة فوراً
            if (res.data.extractedKnowledge) {
                setExtractedKnowledge(res.data.extractedKnowledge);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(isArabic ? 'حدث خطأ أثناء رفع الملف' : 'Error uploading file');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

        try {
            await axios.delete(`${BACKEND_URL}/ai/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFiles();
            toast.success(isArabic ? 'تم حذف الملف بنجاح' : 'File deleted');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(isArabic ? 'حدث خطأ أثناء حذف الملف' : 'Error deleting file');
        }
    };

    const handleSaveInstructions = async () => {
        setSaving(true);
        try {
            await axios.put(`${BACKEND_URL}/ai/instructions`,
                { instructions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(isArabic ? 'تم حفظ التعليمات بنجاح!' : 'Instructions saved!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving');
        } finally {
            setSaving(false);
        }
    };

    const handleScrapeUrl = async () => {
        if (!scrapeUrl) return toast.warning(isArabic ? 'يرجى إدخال رابط صحيح' : 'Please enter a valid URL');
        setScraping(true);
        try {
            const res = await axios.post(`${BACKEND_URL}/ai/scrape-url`, { url: scrapeUrl }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(isArabic ? 'تم قراءة الرابط واستخراج المعلومات وتحديد طريقة الرد بنجاح!' : 'URL scraped successfully!');
            if (res.data.urlExtractedKnowledge) setUrlExtractedKnowledge(res.data.urlExtractedKnowledge);
            if (res.data.customInstructions) setInstructions(res.data.customInstructions);
            setScrapeUrl('');
        } catch (error) {
            console.error('Scrape error:', error);
            toast.error(isArabic ? 'حدث خطأ أثناء محاولة قراءة الرابط. يرجى التأكد من الرابط والمحاولة مجدداً.' : 'Error scraping URL.');
        } finally {
            setScraping(false);
        }
    };

    const handleSaveExtractedKnowledge = async () => {
        setSavingKnowledge(true);
        try {
            await axios.put(`${BACKEND_URL}/ai/extracted-knowledge`,
                { extractedKnowledge },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(isArabic ? 'تم حفظ معلومات الملفات بنجاح!' : 'Saved!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving');
        } finally {
            setSavingKnowledge(false);
        }
    };

    const handleSaveUrlExtractedKnowledge = async () => {
        setSavingUrlKnowledge(true);
        try {
            await axios.put(`${BACKEND_URL}/ai/url-extracted-knowledge`,
                { urlExtractedKnowledge },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(isArabic ? 'تم حفظ معلومات الروابط بنجاح!' : 'Saved!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving');
        } finally {
            setSavingUrlKnowledge(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="ai-training-container animate-fade-in">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{t.dashboard.trainingPage.title}</h1>
                    <p className="dash-page-subtitle">{t.dashboard.trainingPage.subtitle}</p>
                </div>
            </div>

            <div className="dash-grid">
                {/* Knowledge Base Section */}
                <motion.div className="dash-card animate-slide-in" variants={itemVariants}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: 0, background: 'none', border: 'none' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--dash-text-rgb), 0.05)', color: 'var(--dash-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-book"></i>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{t.dashboard.trainingPage.knowledgeBase}</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <div className="upload-box relative">
                            <input
                                type="file"
                                id="file-upload-training"
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload-training" className={`upload-label ${uploading ? 'uploading' : ''}`} style={{ border: '2px dashed var(--dash-border)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(var(--dash-text-rgb), 0.01)' }}>
                                <i className={uploading ? "fas fa-spinner fa-spin" : "fas fa-cloud-upload-alt"} style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--dash-text-sec)' }}></i>
                                <span style={{ fontWeight: '700', color: 'var(--dash-text)' }}>{uploading ? t.dashboard.trainingPage.uploadingFile : t.dashboard.trainingPage.uploadBtn}</span>
                                <small style={{ color: 'var(--dash-text-sec)', marginTop: '4px' }}>{t.dashboard.trainingPage.uploadHint}</small>
                            </label>
                        </div>

                        <div className="files-list" style={{ marginTop: '24px' }}>
                            {files.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--dash-text-sec)', fontSize: '0.9rem' }}>
                                    {t.dashboard?.trainingPage?.noFiles || 'لا توجد ملفات'}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {files.map((file, index) => {
                                        const fileId = file.id || file._id || index;
                                        return (
                                            <div key={fileId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(var(--dash-text-rgb), 0.03)', borderRadius: '12px', border: '1px solid var(--dash-border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--dash-text)', fontSize: '0.9rem' }}>
                                                    <i className={`fas fa-file-${file.fileType === 'pdf' ? 'pdf' : file.fileType === 'docx' ? 'word' : 'alt'}`} style={{ opacity: 0.6 }}></i>
                                                    <span style={{ fontWeight: '600' }}>{file.fileName}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteFile(fileId)}
                                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ✨ URL Scraping Section */}
                <motion.div className="dash-card animate-slide-in" variants={itemVariants}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: 0, background: 'none', border: 'none' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(108, 99, 255, 0.1)', color: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-link"></i>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{isArabic ? 'التدريب عبر الروابط' : 'URL Training'}</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--dash-text-sec)', marginBottom: '24px', lineHeight: '1.6' }}>
                            {isArabic ? 'ضع رابط صفحتك (إنستاجرام، فيسبوك) أو موقعك وسيتم تحليل المحتوى تلقائياً.' : 'Enter your page/website link, and the content will be automatically analyzed.'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input 
                                className="dash-input"
                                type="url" 
                                placeholder={isArabic ? 'مثال: https://instagram.com/yourpage' : 'e.g. https://instagram.com/yourpage'} 
                                value={scrapeUrl}
                                onChange={(e) => setScrapeUrl(e.target.value)}
                                style={{ marginBottom: 0 }}
                                disabled={scraping}
                            />
                            <button 
                                className="dash-btn dash-btn-primary"
                                onClick={handleScrapeUrl} 
                                disabled={scraping || !scrapeUrl}
                                style={{ width: '100%', height: '48px' }}
                            >
                                {scraping ? (
                                    <><i className="fas fa-spinner fa-spin"></i> {isArabic ? 'جاري التحليل...' : 'Analyzing...'}</>
                                ) : (
                                    <><i className="fas fa-magic"></i> {isArabic ? 'تحليل وتدريب' : 'Analyze & Train'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ✨ Extracted Knowledge Section - PDF */}
                <motion.div className="dash-card animate-slide-in" variants={itemVariants}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: 0, background: 'none', border: 'none' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(228, 64, 95, 0.1)', color: '#E4405F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{isArabic ? 'معلومات الملفات المرفوعة' : 'PDF/Docs Knowledge'}</h3>
                    </div>
                    <div className="card-body">
                        <p className="card-description">
                            {isArabic ? 'هذه هي المعلومات التي استخرجها الذكاء الاصطناعي من ملفات الـ PDF أو Word التي قمت برفعها. يمكنك تعديلها يدوياً وتنسيقها.' : 'This is the knowledge extracted from uploaded files. You can edit it manually.'}
                        </p>

                        <textarea
                            className="dash-textarea"
                            value={extractedKnowledge}
                            onChange={(e) => setExtractedKnowledge(e.target.value)}
                            placeholder={t.dashboard.trainingPage.extractedPlaceholder}
                            rows="10"
                            style={{ minHeight: '200px', width: '100%', marginBottom: '16px' }}
                        />

                        <button
                            className="dash-btn dash-btn-primary"
                            onClick={handleSaveExtractedKnowledge}
                            disabled={savingKnowledge}
                        >
                            {savingKnowledge ? t.dashboard.trainingPage.saving : t.dashboard.trainingPage.saveExtracted}
                        </button>
                    </div>
                </motion.div>

                {/* ✨ URL Extracted Knowledge Section - URL */}
                <motion.div className="dash-card animate-slide-in" variants={itemVariants}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: 0, background: 'none', border: 'none' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(38, 165, 228, 0.1)', color: '#26A5E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-globe"></i>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{isArabic ? 'معلومات الروابط المستخرجة' : 'URL Knowledge'}</h3>
                    </div>
                    <div className="card-body">
                        <p className="card-description">
                            {isArabic ? 'هذه هي المعلومات التي تم استخراجها وتلخيصها من روابط صفحاتك أو موقعك الإلكتروني. يمكن تعديلها لتحسين ردود البوت.' : 'This is the knowledge extracted from URLs. You can edit it manually.'}
                        </p>

                        <textarea
                            className="dash-textarea"
                            value={urlExtractedKnowledge}
                            onChange={(e) => setUrlExtractedKnowledge(e.target.value)}
                            placeholder={isArabic ? 'اكتب أو عدّل المعلومات المستخرجة من الروابط هنا...' : 'Edit URL extracted knowledge here...'}
                            rows="10"
                            style={{ minHeight: '200px', width: '100%', marginBottom: '16px' }}
                        />

                        <button
                            className="dash-btn dash-btn-primary"
                            onClick={handleSaveUrlExtractedKnowledge}
                            disabled={savingUrlKnowledge}
                        >
                            {savingUrlKnowledge ? t.dashboard.trainingPage.saving : (isArabic ? 'حفظ معلومات الروابط' : 'Save URL Knowledge')}
                        </button>
                    </div>
                </motion.div>

                {/* Custom Instructions Section */}
                <motion.div className="dash-card animate-slide-in" variants={itemVariants} style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: 0, background: 'none', border: 'none' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--dash-text-rgb), 0.05)', color: 'var(--dash-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-cog"></i>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>{t.dashboard.trainingPage.customTitle}</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--dash-text-sec)', marginBottom: '20px', lineHeight: '1.6' }}>
                            {t.dashboard.trainingPage.customDesc}
                        </p>

                        <textarea
                            className="dash-textarea"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={t.dashboard.trainingPage.customPlaceholder}
                            rows="8"
                            style={{ width: '100%', marginBottom: '16px', minHeight: '150px' }}
                        />

                        <button
                            className="dash-btn dash-btn-primary"
                            onClick={handleSaveInstructions}
                            disabled={saving}
                            style={{ padding: '0 32px' }}
                        >
                            {saving ? t.dashboard.trainingPage.saving : t.dashboard.trainingPage.saveCustom}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AiTraining;
