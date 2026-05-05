import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';


import morgan from 'morgan';

const app = express();

// 🛡️ Security Hardening
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
// Custom XSS Middleware
const sanitizeObj = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/<[^>]*>?/gm, ''); // simple strip tags
    } else if (typeof obj[key] === 'object') {
      sanitizeObj(obj[key]);
    }
  }
};
app.use((req, res, next) => {
  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);
  next();
});
app.use(morgan('combined'));

// 🚦 Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' }
});

// 🔌 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Admin Backend connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 📝 Mongoose Schemas (Simplified for Admin use)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isSuspended: { type: Boolean, default: false },
  blockReason: String,
  blockedAt: Date,
}, { timestamps: true });

const companySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  industry: String,
  description: String,
  vision: String,
  mission: String,
  values: [String],
  apiKey: String,
  slug: String,
  messageLimit: { type: Number, default: 1000 },
  isSuspended: { type: Boolean, default: false },
  customInstructions: String,
  extractedKnowledge: String,
  urlExtractedKnowledge: String,
  websiteUrl: String,
}, { timestamps: true });

const integrationSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  platform: String,
  isActive: { type: Boolean, default: true },
  credentials: Object,
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  sender: String,
  message: String,
}, { timestamps: true });

const supportMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  status: { type: String, default: 'unread' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
const Integration = mongoose.models.Integration || mongoose.model('Integration', integrationSchema);
const Chat = mongoose.models.company_chats || mongoose.model('company_chats', chatSchema);
const SupportMessage = mongoose.models.support_messages || mongoose.model('support_messages', supportMessageSchema);

// Admin Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'midovoxio@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'mido927010';

// Auth Middleware
const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('Not authorized');
    
    req.admin = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Please authenticate as admin' });
  }
};

// 🛣️ Routes

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const token = jwt.sign({ isAdmin: true, email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().lean();
    const companies = await Company.find().lean();
    const integrations = await Integration.find().lean();

    const formattedUsers = users.map(u => {
      const company = companies.find(c => c.owner?.toString() === u._id.toString());
      const userIntegrations = company ? integrations.filter(i => i.company?.toString() === company._id.toString()) : [];

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        isSuspended: u.isSuspended || false,
        companyName: company ? company.name : 'No Company',
        companyId: company ? company._id : null,
        messageLimit: company ? company.messageLimit : 1000,
        integrationsCount: userIntegrations.length
      };
    });
    res.json(formattedUsers);
  } catch (e) {
    console.error('Error fetching users:', e);
    res.status(500).json({ error: 'Failed to fetch users', details: e.message });
  }
});

app.get('/api/admin/companies/:id', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });
    
    const owner = await User.findById(company.owner).lean();
    const integrations = await Integration.find({ company: req.params.id }).lean();

    res.json({
      ...company,
      ownerEmail: owner ? owner.email : 'Unknown',
      integrations
    });
  } catch (e) {
    console.error('Error fetching company:', e);
    res.status(500).json({ error: 'Failed to fetch company details', details: e.message });
  }
});

app.delete('/api/admin/users/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const companies = await Company.find({ owner: userId });
    
    for (const company of companies) {
      await Integration.deleteMany({ company: company._id });
      await Chat.deleteMany({ company: company._id });
      await Company.findByIdAndDelete(company._id);
    }
    
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User and associated data deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.put('/api/admin/users/:userId/suspend', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.isSuspended = !user.isSuspended;
    await user.save();
    
    await Company.updateMany({ owner: req.params.userId }, { isSuspended: user.isSuspended });
    
    res.json({ message: 'Status updated', isSuspended: user.isSuspended });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.put('/api/admin/companies/:companyId/limit', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.body.limit);
    await Company.findByIdAndUpdate(req.params.companyId, { messageLimit: limit });
    res.json({ message: 'Limit updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update limit' });
  }
});

app.get('/api/admin/companies/:companyId/ai-config', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId).lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });
    
    res.json({
      name: company.name || '',
      industry: company.industry || '',
      description: company.description || '',
      vision: company.vision || '',
      mission: company.mission || '',
      values: company.values || '',
      systemPrompt: company.customInstructions || '',
      extractedKnowledge: company.extractedKnowledge || '',
      urlExtractedKnowledge: company.urlExtractedKnowledge || '',
      websiteUrl: company.websiteUrl || ''
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

app.put('/api/admin/companies/:companyId/ai-config', adminAuth, async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      industry: req.body.industry,
      description: req.body.description,
      vision: req.body.vision,
      mission: req.body.mission,
      values: req.body.values,
      customInstructions: req.body.systemPrompt,
      extractedKnowledge: req.body.extractedKnowledge,
      urlExtractedKnowledge: req.body.urlExtractedKnowledge,
    };

    await Company.findByIdAndUpdate(req.params.companyId, updateData);
    res.json({ message: 'Company AI configuration synchronized successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update AI config' });
  }
});

app.get('/api/admin/agents', adminAuth, async (req, res) => {
  try {
    const integrations = await Integration.find().populate('company').lean();
    const users = await User.find().lean();

    const agents = integrations.map(a => {
      const comp = a.company;
      const owner = comp ? users.find(u => u._id.toString() === comp.owner?.toString()) : null;
      return {
        _id: a._id,
        platform: a.platform,
        isActive: a.isActive,
        companyName: comp ? comp.name : 'Unknown',
        ownerEmail: owner ? owner.email : 'Unknown'
      };
    });
    res.json(agents);
  } catch (e) {
    console.error('Error fetching agents:', e);
    res.status(500).json({ error: 'Failed to fetch agents', details: e.message });
  }
});

app.delete('/api/admin/agents/:agentId', adminAuth, async (req, res) => {
  try {
    await Integration.findByIdAndDelete(req.params.agentId);
    res.json({ message: 'Agent deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

app.get('/api/admin/support-messages', adminAuth, async (req, res) => {
  try {
    const messages = await SupportMessage.find().sort({ createdAt: -1 }).lean();
    res.json(messages);
  } catch (e) {
    console.error('Error fetching support messages:', e);
    res.status(500).json({ error: 'Failed to fetch messages', details: e.message });
  }
});

app.put('/api/admin/support-messages/:id/read', adminAuth, async (req, res) => {
  try {
    await SupportMessage.findByIdAndUpdate(req.params.id, { status: 'read' });
    res.json({ message: 'Message marked as read' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

app.delete('/api/admin/support-messages/:id', adminAuth, async (req, res) => {
  try {
    await SupportMessage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.get('/api/admin/analytics', adminAuth, async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const integrationsCount = await Integration.countDocuments();
    const aiMessagesCount = await Chat.countDocuments({ sender: 'ai' });
    
    res.json({ usersCount, integrationsCount, totalAIMessages: aiMessagesCount });
  } catch (e) {
    console.error('Error fetching analytics:', e);
    res.status(500).json({ error: 'Failed to fetch analytics', details: e.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🛡️ Secure Admin Backend running on port ${PORT}`);
});

export default app;
