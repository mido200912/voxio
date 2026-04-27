import express from 'express';
import multer from 'multer';
import axios from 'axios';
import Company from '../models/company.js';
import { requireAuth as protect } from '../middleware/auth.js';
import { extractCorexReply, fetchAiResponse } from '../utils/corexHelper.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.txt', '.doc'];
        const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
        const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        if (allowed.includes(ext) && allowedMimes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed.'), false);
    }
});

// Upload a file to knowledge base and extract text using AI
router.post('/upload', protect, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Find the user's company
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const newResource = {
            id: Date.now().toString(),
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            fileType: req.file.originalname.split('.').pop(),
        };

        company.knowledgeBase.push(newResource);

        // ✨ Extract text from file using AI
        try {
            console.log('📄 Extracting knowledge from file:', req.file.originalname);

            const extractionPrompt = `أنت مساعد ذكي متخصص في تحليل الملفات واستخراج المعلومات المهمة.
            
تم رفع ملف جديد: ${req.file.originalname}
نوع الملف: ${newResource.fileType}

المعلومات المستخرجة سابقاً من ملفات أخرى (إن وجدت):
${company.extractedKnowledge || 'لا توجد معلومات سابقة.'}

مهمتك:
1. استخراج جميع المعلومات المهمة من هذا الملف الجديد.
2. دمج هذه المعلومات بذكاء مع المعلومات المستخرجة سابقاً (بحيث لا يتكرر الكلام، ويتم تحديث المعلومات القديمة إذا كانت هناك معلومات أحدث).
3. تنظيم كل المعلومات النهائية (القديمة والجديدة) في دليل واحد واضح ومنسق، يسهل على بوت الدردشة قراءته والرد منه.
4. التركيز على:
   - معلومات عن المنتجات والخدمات
   - الأسعار
   - سياسات الشركة
   - معلومات الاتصال
   - أي تفاصيل مفيدة للعملاء

الرد يجب أن يحتوي فقط على الدليل الموحد والمحدث بالكامل كنص منسق بدون مقدمات.`;

            // استخدام الدالة الموحدة المدمج بها Fallback
            const extractedText = await fetchAiResponse(extractionPrompt, '');

            if (extractedText) {
                // ✨ Replace existing knowledge with the new intelligently merged knowledge
                company.extractedKnowledge = extractedText;
                console.log('✅ Knowledge extracted and merged intelligently');
            }

        } catch (aiError) {
            console.error('⚠️ AI extraction failed:', aiError.message);
            // Continue even if AI extraction fails - file is still uploaded
        }

        await company.save();

        res.json({
            message: 'File uploaded and analyzed successfully',
            resource: newResource,
            extractedKnowledge: company.extractedKnowledge
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error during upload' });
    }
});

// ✨ Scrape URL and extract knowledge
router.post('/scrape-url', protect, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Fetch HTML
        console.log(`🌐 Scraping URL: ${url}`);
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        const html = response.data;
        
        // Strip HTML tags and extra spaces
        const rawText = typeof html === 'string' 
            ? html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                  .replace(/<[^>]*>?/gm, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
            : JSON.stringify(html);

        // Limit to 6000 chars to avoid token limits
        const truncatedText = rawText.substring(0, 6000);

        const extractionPrompt = `أنت مساعد ذكي متخصص في تحليل مواقع الويب وصفحات السوشيال ميديا واستخراج المعلومات المهمة لتدريب بوت الدردشة.
        
رابط الموقع/الصفحة الجديد: ${url}

محتوى الموقع المستخرج:
${truncatedText}

معلومات الروابط المستخرجة والمحفوظة سابقاً (إن وجدت):
${company.urlExtractedKnowledge || 'لا توجد معلومات سابقة.'}

مهمتك:
1. استخراج جميع المعلومات المهمة من هذا الموقع عن المنتجات، الخدمات، الأسعار، وطبيعة عمل الشركة.
2. دمج هذه المعلومات بذكاء مع "معلومات الروابط المحفوظة سابقاً" (بحيث لا يحدث تكرار، ويتم تحديث المعلومات القديمة بالمعلومات الجديدة إذا تعارضت).
3. تنظيم جميع المعلومات النهائية بشكل واضح لتصبح جزءاً من قاعدة المعرفة الخاصة بالبوت (URL Knowledge Base).
4. الرد يجب أن يحتوي فقط على المعلومات الموحدة والنهائية كنص منسق بدون مقدمات.`;

        const extractedText = await fetchAiResponse(extractionPrompt, '');

        if (extractedText) {
            // ✨ Replace existing url knowledge with the new intelligently merged knowledge
            company.urlExtractedKnowledge = extractedText;
            
            // Also append the tone/instructions to customInstructions intelligently
            const tonePrompt = `بناءً على المحتوى التالي من الرابط (${url}):\n\n${truncatedText.substring(0, 2000)}\n\nتعليمات البوت الحالية هي:\n${company.customInstructions || 'لا توجد تعليمات سابقة.'}\n\nاكتب قواعد سريعة تحدد "أسلوب وطريقة رد البوت" (Tone of Voice) لتضاف أو تدمج مع التعليمات الحالية. الرد يجب أن يحتوي على التعليمات المحدثة بالكامل فقط.`;
            const toneResult = await fetchAiResponse(tonePrompt, '');
            if (toneResult) {
                company.customInstructions = toneResult;
            }

            await company.save();

            res.json({
                message: 'URL scraped successfully',
                urlExtractedKnowledge: company.urlExtractedKnowledge,
                customInstructions: company.customInstructions
            });
        } else {
            res.status(500).json({ error: 'AI failed to extract knowledge' });
        }
    } catch (error) {
        console.error('Scrape error:', error.message);
        res.status(500).json({ error: 'Failed to scrape URL. Please check if the link is correct and accessible.' });
    }
});

// Get all knowledge base files
router.get('/', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company.knowledgeBase);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ✨ Get extracted knowledge text
router.get('/extracted-knowledge', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json({ extractedKnowledge: company.extractedKnowledge || '' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ✨ Update extracted knowledge text (editable by user)
router.put('/extracted-knowledge', protect, async (req, res) => {
    try {
        const { extractedKnowledge } = req.body;
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        company.extractedKnowledge = extractedKnowledge || '';
        await company.save();

        res.json({
            message: 'Extracted knowledge updated successfully',
            extractedKnowledge: company.extractedKnowledge
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ✨ Get URL extracted knowledge text
router.get('/url-extracted-knowledge', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json({ urlExtractedKnowledge: company.urlExtractedKnowledge || '' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ✨ Update URL extracted knowledge text (editable by user)
router.put('/url-extracted-knowledge', protect, async (req, res) => {
    try {
        const { urlExtractedKnowledge } = req.body;
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        company.urlExtractedKnowledge = urlExtractedKnowledge || '';
        await company.save();

        res.json({
            message: 'URL extracted knowledge updated successfully',
            urlExtractedKnowledge: company.urlExtractedKnowledge
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update custom instructions
router.put('/instructions', protect, async (req, res) => {
    try {
        const { instructions } = req.body;
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        company.customInstructions = instructions;
        await company.save();
        res.json({ message: 'Instructions updated', instructions });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a file from knowledge base
router.delete('/:fileId', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        let fileIndex = company.knowledgeBase.findIndex(f => 
            (f.id && f.id.toString() === req.params.fileId) || 
            (f._id && f._id.toString() === req.params.fileId)
        );

        if (fileIndex === -1 && !isNaN(req.params.fileId)) {
            // Fallback for existing files without id, assuming fileId might be the index
            const possibleIndex = parseInt(req.params.fileId);
            if (possibleIndex >= 0 && possibleIndex < company.knowledgeBase.length) {
                fileIndex = possibleIndex;
            }
        }

        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Optional: Delete from Cloudinary using public_id if you stored it
        // const publicId = company.knowledgeBase[fileIndex].publicId; 
        // if (publicId) await cloudinary.uploader.destroy(publicId);

        company.knowledgeBase.splice(fileIndex, 1);
        await company.save();

        res.json({ message: 'File deleted successfully', knowledgeBase: company.knowledgeBase });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
