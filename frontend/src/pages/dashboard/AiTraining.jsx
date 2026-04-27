import { useState, useEffect } from 'react';
import axios from 'axios';
import { secureStorage } from '../../utils/secureStorage';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { useToast } from '../../components/Toast';
import './AiTraining.css';

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
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="page-title"
            >
                {t.dashboard.trainingPage.title}
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="page-subtitle"
            >
                {t.dashboard.trainingPage.subtitle}
            </motion.p>

            <motion.div
                className="training-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Knowledge Base Section */}
                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <i className="fas fa-book"></i>
                        <h3>{t.dashboard.trainingPage.knowledgeBase}</h3>
                    </div>
                    <div className="card-body">
                        <div className="upload-box relative">
                            <input
                                type="file"
                                id="file-upload-training"
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload-training" className={`upload-label ${uploading ? 'uploading' : ''}`}>
                                <i className={uploading ? "fas fa-spinner fa-spin" : "fas fa-cloud-upload-alt"}></i>
                                <span>{uploading ? t.dashboard.trainingPage.uploadingFile : t.dashboard.trainingPage.uploadBtn}</span>
                                <small>{t.dashboard.trainingPage.uploadHint}</small>
                            </label>
                        </div>

                        <div className="files-list">
                            {files.length === 0 ? (
                                <p className="empty-state">{t.dashboard?.trainingPage?.noFiles || 'لا توجد ملفات'}</p>
                            ) : (
                                files.map((file, index) => {
                                    const fileId = file.id || file._id || index;
                                    return (
                                        <div key={fileId} className="file-item">
                                            <div className="file-info">
                                                <i className={`fas fa-file-${file.fileType === 'pdf' ? 'pdf' : file.fileType === 'docx' ? 'word' : 'alt'}`}></i>
                                                <span>{file.fileName}</span>
                                            </div>
                                            <button
                                                className="btn-icon-delete"
                                                onClick={() => handleDeleteFile(fileId)}
                                                title={t.dashboard?.trainingPage?.delete || 'حذف'}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ✨ URL Scraping Section - منفصل عن الكارد الأول */}
                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <i className="fas fa-link" style={{ color: '#6C63FF' }}></i>
                        <h3>{isArabic ? 'التدريب عبر الروابط' : 'URL Training'}</h3>
                    </div>
                    <div className="card-body">
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            {isArabic ? 'ضع رابط صفحتك (إنستاجرام، فيسبوك) أو موقعك وسيقوم الذكاء الاصطناعي بقراءة محتواها واستنتاج "طريقة وأسلوب الرد" المناسب لعملائك تلقائياً.' : 'Enter your page/website link, and the AI will read its content and automatically deduce the best "Tone of Voice" and rules for your customers.'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
                            <input 
                                type="url" 
                                placeholder={isArabic ? 'مثال: https://instagram.com/yourpage' : 'e.g. https://instagram.com/yourpage'} 
                                value={scrapeUrl}
                                onChange={(e) => setScrapeUrl(e.target.value)}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.95rem' }}
                                disabled={scraping}
                            />
                            <button 
                                onClick={handleScrapeUrl} 
                                disabled={scraping || !scrapeUrl}
                                style={{ width: '100%', padding: '14px 24px', borderRadius: '12px', background: scraping ? 'var(--color-text-secondary)' : '#6C63FF', color: 'white', border: 'none', cursor: scraping ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                            >
                                {scraping ? (
                                    <><i className="fas fa-spinner fa-spin"></i> {isArabic ? 'جاري التحليل والتدريب...' : 'Analyzing & Training...'}</>
                                ) : (
                                    <><i className="fas fa-magic"></i> {isArabic ? 'تحليل وتدريب البوت' : 'Analyze & Train Bot'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ✨ Extracted Knowledge Section - PDF */}
                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <i className="fas fa-file-alt" style={{ color: '#E4405F' }}></i>
                        <h3>{isArabic ? 'معلومات الملفات المرفوعة' : 'PDF/Docs Knowledge'}</h3>
                    </div>
                    <div className="card-body">
                        <p className="card-description">
                            {isArabic ? 'هذه هي المعلومات التي استخرجها الذكاء الاصطناعي من ملفات الـ PDF أو Word التي قمت برفعها. يمكنك تعديلها يدوياً وتنسيقها.' : 'This is the knowledge extracted from uploaded files. You can edit it manually.'}
                        </p>

                        <textarea
                            className="instructions-textarea"
                            value={extractedKnowledge}
                            onChange={(e) => setExtractedKnowledge(e.target.value)}
                            placeholder={t.dashboard.trainingPage.extractedPlaceholder}
                            rows="10"
                            style={{ minHeight: '200px' }}
                        />

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveExtractedKnowledge}
                            disabled={savingKnowledge}
                        >
                            {savingKnowledge ? t.dashboard.trainingPage.saving : t.dashboard.trainingPage.saveExtracted}
                        </button>
                    </div>
                </motion.div>

                {/* ✨ URL Extracted Knowledge Section - URL */}
                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <i className="fas fa-globe" style={{ color: '#26A5E4' }}></i>
                        <h3>{isArabic ? 'معلومات الروابط المستخرجة' : 'URL Knowledge'}</h3>
                    </div>
                    <div className="card-body">
                        <p className="card-description">
                            {isArabic ? 'هذه هي المعلومات التي تم استخراجها وتلخيصها من روابط صفحاتك أو موقعك الإلكتروني. يمكن تعديلها لتحسين ردود البوت.' : 'This is the knowledge extracted from URLs. You can edit it manually.'}
                        </p>

                        <textarea
                            className="instructions-textarea"
                            value={urlExtractedKnowledge}
                            onChange={(e) => setUrlExtractedKnowledge(e.target.value)}
                            placeholder={isArabic ? 'اكتب أو عدّل المعلومات المستخرجة من الروابط هنا...' : 'Edit URL extracted knowledge here...'}
                            rows="10"
                            style={{ minHeight: '200px' }}
                        />

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveUrlExtractedKnowledge}
                            disabled={savingUrlKnowledge}
                        >
                            {savingUrlKnowledge ? t.dashboard.trainingPage.saving : (isArabic ? 'حفظ معلومات الروابط' : 'Save URL Knowledge')}
                        </button>
                    </div>
                </motion.div>

                {/* Custom Instructions Section */}
                <motion.div variants={itemVariants} className="card full-width">
                    <div className="card-header">
                        <i className="fas fa-cog"></i>
                        <h3>{t.dashboard.trainingPage.customTitle}</h3>
                    </div>
                    <div className="card-body">
                        <p className="card-description">
                            {t.dashboard.trainingPage.customDesc}
                        </p>

                        <textarea
                            className="instructions-textarea"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={t.dashboard.trainingPage.customPlaceholder}
                            rows="8"
                        />

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveInstructions}
                            disabled={saving}
                        >
                            {saving ? t.dashboard.trainingPage.saving : t.dashboard.trainingPage.saveCustom}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AiTraining;
