import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Users, Bot, LogOut, Trash2, ShieldAlert, Ban, Settings2, Megaphone } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:5001/api/admin';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem('adminToken', res.data.token);
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <ShieldAlert size={48} color="#e4405f" style={{ margin: '0 auto 20px', display: 'block' }} />
        <h2>VOXIO Admin Dashboard</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

const Sidebar = ({ setAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAuth(false);
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <h2><ShieldAlert size={24} /> Admin</h2>
      <nav>
        <div className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
          <Users size={20} /> Users & Companies
        </div>
        <div className={`nav-item ${location.pathname === '/agents' ? 'active' : ''}`} onClick={() => navigate('/agents')}>
          <Bot size={20} /> Agents / Integrations
        </div>
        <div className={`nav-item ${location.pathname === '/broadcast' ? 'active' : ''}`} onClick={() => navigate('/broadcast')}>
          <Megaphone size={20} /> System Broadcast
        </div>
      </nav>
      <div className="logout" onClick={handleLogout}>
        <LogOut size={20} /> Logout
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [usersRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/analytics`)
      ]);
      setUsers(usersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and ALL their associated data? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleSuspend = async (userId) => {
    try {
      const res = await axios.put(`${API_URL}/users/${userId}/suspend`);
      setUsers(users.map(u => u._id === userId ? { ...u, isSuspended: res.data.isSuspended } : u));
    } catch (err) {
      alert('Failed to update suspension status');
    }
  };

  const handleLimit = async (companyId, currentLimit) => {
    if (!companyId) return alert('No company associated with this user');
    const newLimit = window.prompt('Enter new message limit (e.g. 5000):', currentLimit || 1000);
    if (!newLimit || isNaN(newLimit)) return;
    try {
      await axios.put(`${API_URL}/companies/${companyId}/limit`, { limit: newLimit });
      alert('Limit updated successfully');
    } catch (err) {
      alert('Failed to update limit');
    }
  };

  return (
    <div className="page-content">
      <h2>Global Dashboard</h2>
      
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'var(--color-card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>Total Users</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.usersCount}</p>
          </div>
          <div style={{ background: 'var(--color-card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>Active Agents</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.integrationsCount}</p>
          </div>
          <div style={{ background: 'var(--color-card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>AI Messages Sent</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{analytics.totalAIMessages}</p>
          </div>
        </div>
      )}

      <h2>Users & Companies ({users.length})</h2>
      {loading ? <p>Loading...</p> : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Company</th>
                <th>Status</th>
                <th>Integrations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td>{u.companyName}</td>
                  <td>
                    {u.isSuspended ? <span className="status-badge inactive">Suspended</span> : <span className="status-badge active">Active</span>}
                  </td>
                  <td>{u.integrationsCount}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-danger" onClick={() => handleDelete(u._id)} style={{ padding: '6px', minWidth: 'auto' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                      <button className="btn-danger" onClick={() => handleSuspend(u._id)} style={{ background: 'transparent', color: u.isSuspended ? '#2ecc71' : '#f39c12', borderColor: u.isSuspended ? '#2ecc71' : '#f39c12', padding: '6px', minWidth: 'auto' }} title="Suspend / Unsuspend">
                        <Ban size={16} />
                      </button>
                      <button className="btn-danger" onClick={() => handleLimit(u.companyId, u.messageLimit)} style={{ background: 'transparent', color: '#3498db', borderColor: '#3498db', padding: '6px', minWidth: 'auto' }} title="Edit Limit">
                        <Settings2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      const res = await axios.get(`${API_URL}/agents`);
      setAgents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleDelete = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    try {
      await axios.delete(`${API_URL}/agents/${agentId}`);
      setAgents(agents.filter(a => a._id !== agentId));
    } catch (err) {
      alert('Failed to delete agent');
    }
  };

  return (
    <div className="page-content">
      <h2>Active Agents / Integrations ({agents.length})</h2>
      {loading ? <p>Loading...</p> : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Company</th>
                <th>Owner Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a._id}>
                  <td className="truncate" title={a._id}>{a._id}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.platform}</td>
                  <td>{a.isActive ? <span className="status-badge active">Active</span> : <span className="status-badge inactive">Inactive</span>}</td>
                  <td>{a.companyName}</td>
                  <td>{a.ownerEmail}</td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(a._id)}><Trash2 size={16} /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BroadcastPage = () => {
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/broadcast`, { message, isActive });
      alert('Broadcast updated successfully!');
    } catch (err) {
      alert('Failed to update broadcast');
    }
  };

  return (
    <div className="page-content">
      <h2>System Broadcast</h2>
      <div style={{ background: 'var(--color-card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--color-border)', maxWidth: '600px' }}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Push a message to all users on their VOXIO dashboard.</p>
        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <textarea 
            rows="4" 
            placeholder="E.g. We will be performing maintenance tonight at 12 AM."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', fontFamily: 'inherit' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: '18px', height: '18px' }} />
            Activate Broadcast
          </label>
          <button type="submit" style={{ padding: '15px', borderRadius: '10px', background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Update Broadcast
          </button>
        </form>
      </div>
    </div>
  );
};

const MainLayout = ({ children, setAuth }) => (
  <div className="dashboard-layout">
    <Sidebar setAuth={setAuth} />
    <div className="main-area">
      {children}
    </div>
  </div>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        {isAuthenticated ? (
          <>
            <Route path="/" element={<MainLayout setAuth={setIsAuthenticated}><UsersPage /></MainLayout>} />
            <Route path="/agents" element={<MainLayout setAuth={setIsAuthenticated}><AgentsPage /></MainLayout>} />
            <Route path="/broadcast" element={<MainLayout setAuth={setIsAuthenticated}><BroadcastPage /></MainLayout>} />
          </>
        ) : (
          <Route path="*" element={<Login setAuth={setIsAuthenticated} />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
