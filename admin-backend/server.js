import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

// Admin Credentials
const ADMIN_EMAIL = 'midovoxio@gmail.com';
const ADMIN_PASS = 'mido927010';

// Auth Middleware
const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error();
    next();
  } catch (e) {
    res.status(401).json({ error: 'Please authenticate as admin' });
  }
};

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const token = jwt.sign({ isAdmin: true, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const companiesSnapshot = await db.collection('companies').get();
    const integrationsSnapshot = await db.collection('integrations').get();

    const companies = companiesSnapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
    const integrations = integrationsSnapshot.docs.map(d => ({ _id: d.id, ...d.data() }));

    const users = usersSnapshot.docs.map(doc => {
      const u = doc.data();
      const company = companies.find(c => c.owner === doc.id);
      const userIntegrations = company ? integrations.filter(i => i.company === company._id) : [];

      return {
        _id: doc.id,
        name: u.name,
        email: u.email,
        isSuspended: u.isSuspended || false,
        companyName: company ? company.name : 'No Company',
        companyId: company ? company._id : null,
        messageLimit: company ? company.messageLimit : 1000,
        integrationsCount: userIntegrations.length
      };
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/api/admin/users/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const companiesSnapshot = await db.collection('companies').where('owner', '==', userId).get();
    
    for (const doc of companiesSnapshot.docs) {
      const companyId = doc.id;
      
      // Delete Integrations
      const intgSnap = await db.collection('integrations').where('company', '==', companyId).get();
      for (const iDoc of intgSnap.docs) await db.collection('integrations').doc(iDoc.id).delete();
      
      // Delete Chats
      const chatSnap = await db.collection('company_chats').where('company', '==', companyId).get();
      for (const cDoc of chatSnap.docs) await db.collection('company_chats').doc(cDoc.id).delete();
      
      await db.collection('companies').doc(companyId).delete();
    }
    
    await db.collection('users').doc(userId).delete();
    res.json({ message: 'User and associated data deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.put('/api/admin/users/:userId/suspend', adminAuth, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    
    const isSuspended = !userDoc.data().isSuspended;
    await userRef.update({ isSuspended });
    
    const compSnap = await db.collection('companies').where('owner', '==', req.params.userId).get();
    for (const doc of compSnap.docs) {
      await db.collection('companies').doc(doc.id).update({ isSuspended });
    }
    
    res.json({ message: 'Status updated', isSuspended });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.put('/api/admin/companies/:companyId/limit', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.body.limit);
    await db.collection('companies').doc(req.params.companyId).update({ messageLimit: limit });
    res.json({ message: 'Limit updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update limit' });
  }
});

app.get('/api/admin/agents', adminAuth, async (req, res) => {
  try {
    const intgSnap = await db.collection('integrations').get();
    const compSnap = await db.collection('companies').get();
    const userSnap = await db.collection('users').get();

    const companies = compSnap.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data()}), {});
    const users = userSnap.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data()}), {});

    const agents = intgSnap.docs.map(doc => {
      const a = doc.data();
      const comp = companies[a.company];
      const owner = comp ? users[comp.owner] : null;
      return {
        _id: doc.id,
        platform: a.platform,
        isActive: a.isActive,
        companyName: comp ? comp.name : 'Unknown',
        ownerEmail: owner ? owner.email : 'Unknown'
      };
    });
    res.json(agents);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.delete('/api/admin/agents/:agentId', adminAuth, async (req, res) => {
  try {
    await db.collection('integrations').doc(req.params.agentId).delete();
    res.json({ message: 'Agent deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

app.post('/api/admin/broadcast', adminAuth, async (req, res) => {
  try {
    await db.collection('SystemSettings').doc('broadcast').set({ ...req.body, updatedAt: new Date() }, { merge: true });
    res.json({ message: 'Broadcast updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update broadcast' });
  }
});

app.get('/api/admin/analytics', adminAuth, async (req, res) => {
  try {
    const usersCount = (await db.collection('users').count().get()).data().count;
    const integrationsCount = (await db.collection('integrations').count().get()).data().count;
    const aiChatsCount = (await db.collection('company_chats').where('sender', '==', 'ai').count().get()).data().count;
    
    res.json({ usersCount, integrationsCount, totalAIMessages: aiChatsCount });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Secure Admin Backend running on port ${PORT}`);
});
