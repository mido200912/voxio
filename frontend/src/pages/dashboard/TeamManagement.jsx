import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion } from 'framer-motion';


import './DashboardShared.css';
import PageLoader from '../../components/ui/PageLoader';
import { useToast } from '../../components/ui/Toast';

const ROLES = [
  { id: 'admin', labelAr: 'مدير', labelEn: 'Admin', icon: 'fas fa-crown' },
  { id: 'manager', labelAr: 'مشرف', labelEn: 'Manager', icon: 'fas fa-clipboard-list' },
  { id: 'agent', labelAr: 'عميل دعم', labelEn: 'Agent', icon: 'fas fa-headset' },
  { id: 'viewer', labelAr: 'مشاهد', labelEn: 'Viewer', icon: 'fas fa-eye' },
];

const TeamManagement = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'agent' });
  const { toast } = useToast();
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = secureStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const t = (ar, en) => isArabic ? ar : en;

  const fetchData = useCallback(async () => {
    try {
      const [memRes, statsRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/team`, { headers }),
        axios.get(`${BACKEND_URL}/team/stats`, { headers }),
      ]);
      if (memRes.status === 'fulfilled') setMembers(memRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast(t('املأ كل الحقول', 'Fill all fields'), 'error');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/team`, form, { headers });
      toast(t('تمت الإضافة', 'Member added'), 'success');
      setShowForm(false);
      setForm({ name: '', email: '', role: 'agent' });
      fetchData();
    } catch (err) {
      toast(err.response?.data?.error || 'Error', 'error');
    }
  };

  const handleToggle = async (id, currentActive) => {
    try {
      await axios.patch(`${BACKEND_URL}/team/${id}`, { isActive: !currentActive }, { headers });
      fetchData();
    } catch (err) {
      toast('Error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('حذف هذا العضو؟', 'Delete this member?'))) return;
    try {
      await axios.delete(`${BACKEND_URL}/team/${id}`, { headers });
      toast(t('تم الحذف', 'Deleted'), 'success');
      fetchData();
    } catch (err) {
      toast('Error', 'error');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.patch(`${BACKEND_URL}/team/${id}`, { role: newRole }, { headers });
      fetchData();
    } catch (err) {
      toast('Error', 'error');
    }
  };

  if (loading) return <PageLoader />;

  const statsCards = [
    { label: t('إجمالي', 'Total'), value: stats?.total || 0, icon: 'fas fa-users' },
    { label: t('نشط', 'Active'), value: stats?.active || 0, icon: 'fas fa-check-circle' },
    ...(stats?.roleBreakdown ? Object.entries(stats.roleBreakdown).map(([role, count]) => ({
      label: ROLES.find(r => r.id === role)?.[isArabic ? 'labelAr' : 'labelEn'] || role,
      value: count,
      icon: ROLES.find(r => r.id === role)?.icon || 'fas fa-user',
    })) : []),
  ];

  return (
    <div className="dashboard-page" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('إدارة الفريق', 'Team Management')}</h1>
        <button className="dash-btn dash-btn-primary" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus" style={{ fontSize: 12 }}></i>
          {t('إضافة عضو', 'Add Member')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statsCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: 'var(--dash-card)', border: '1px solid var(--dash-border)',
              borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'var(--dash-bg)',
              border: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.85rem', color: 'var(--dash-text)',
            }}>
              <i className={s.icon}></i>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--dash-text-sec)', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dash-text)' }}>{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="dash-card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--dash-text)', fontSize: 15 }}>
            {t('عضو جديد', 'New Member')}
          </h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="dash-input-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
              <label className="dash-label">{t('الاسم', 'Name')}</label>
              <input className="dash-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="dash-input-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label className="dash-label">{t('البريد', 'Email')}</label>
              <input className="dash-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="dash-input-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
              <label className="dash-label">{t('الدور', 'Role')}</label>
              <select className="dash-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => (
                  <option key={r.id} value={r.id}>{isArabic ? r.labelAr : r.labelEn}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="dash-btn dash-btn-primary">
                <i className="fas fa-check" style={{ fontSize: 12 }}></i> {t('إضافة', 'Add')}
              </button>
              <button type="button" className="dash-btn dash-btn-outline" onClick={() => setShowForm(false)}>
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.length === 0 ? (
          <div className="dash-card" style={{ textAlign: 'center', padding: 40 }}>
            <i className="fas fa-users" style={{ fontSize: 36, color: 'var(--dash-text-sec)', opacity: 0.4 }}></i>
            <p style={{ color: 'var(--dash-text-sec)', marginTop: 12 }}>{t('لا يوجد أعضاء بعد', 'No team members yet')}</p>
          </div>
        ) : (
          members.map((m, i) => (
            <motion.div key={m._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="dash-card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'var(--dash-bg)',
                  border: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--dash-text)',
                }}>
                  {(m.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--dash-text)' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--dash-text-sec)' }}>{m.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="dash-badge" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className={ROLES.find(r => r.id === m.role)?.icon || 'fas fa-user'} style={{ fontSize: 10 }}></i>
                  {isArabic ? ROLES.find(r => r.id === m.role)?.labelAr : ROLES.find(r => r.id === m.role)?.labelEn}
                </span>
                <select value={m.role} onChange={e => handleRoleChange(m._id, e.target.value)}
                  style={{
                    padding: '5px 8px', borderRadius: 8, border: '1px solid var(--dash-border)',
                    background: 'var(--dash-bg)', color: 'var(--dash-text)', fontSize: 11, fontWeight: 600,
                  }}>
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{isArabic ? r.labelAr : r.labelEn}</option>
                  ))}
                </select>
                <button className="dash-btn dash-btn-outline" style={{ padding: '5px 10px', fontSize: 11 }}
                  onClick={() => handleToggle(m._id, m.isActive)}>
                  <i className={m.isActive ? 'fas fa-pause' : 'fas fa-play'}></i>
                </button>
                <button className="dash-btn dash-btn-outline" style={{ padding: '5px 10px', fontSize: 11, color: 'var(--dash-text-sec)' }}
                  onClick={() => handleDelete(m._id)}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
