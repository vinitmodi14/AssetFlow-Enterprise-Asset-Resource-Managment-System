import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, LogOut, PlusCircle, Bookmark, Wrench,
  AlertCircle, ShieldAlert, CheckCircle, Clock, Calendar,
  ArrowLeftRight, User, Mail, Lock, RefreshCw, Building2,
  Tag, Pencil, Trash2, ChevronRight, FolderTree, X
} from 'lucide-react';
import './App.css';

const API_BASE = "http://localhost:5000/api";

/* ─── tiny helper ─── */
const apiFetch = (url, token, opts = {}) =>
  fetch(`${API_BASE}${url}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

const BLANK_DEPT = { name: '', description: '', head: '', parentDept: '', status: 'Active' };
const BLANK_CAT  = { name: '', description: '', customFields: [], status: 'Active' };
const BLANK_FIELD = { fieldName: '', fieldType: 'text', required: false };

function App() {
  /* ── Auth ── */
  const [token, setToken]           = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });

  /* ── UI ── */
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [authMode, setAuthMode]     = useState('login');
  const [currentModal, setCurrentModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading]       = useState(false);

  /* ── Org Setup ── */
  const [orgTab, setOrgTab]         = useState('departments'); // departments | categories | employees
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);

  /* ── Dept form/edit ── */
  const [deptForm, setDeptForm]     = useState(BLANK_DEPT);
  const [editingDept, setEditingDept] = useState(null);   // null = create, obj = edit
  const [showDeptModal, setShowDeptModal] = useState(false);

  /* ── Category form/edit ── */
  const [catForm, setCatForm]       = useState(BLANK_CAT);
  const [editingCat, setEditingCat] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);

  /* ── Dashboard Data ── */
  const [stats, setStats]           = useState({ availableAssets:0, allocatedAssets:0, maintenanceCount:0, activeBookings:0, pendingTransfers:0, upcomingReturns:0 });
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [upcomingReturnsList, setUpcomingReturnsList] = useState([]);
  const [allAssets, setAllAssets]   = useState([]);

  /* ── Quick Action forms ── */
  const [authForm, setAuthForm]     = useState({ name:'', email:'', password:'', confirmPassword:'', department:'' });
  const [registerAssetForm, setRegisterAssetForm] = useState({ name:'', serialNumber:'', category:'', status:'Available', department:'', condition:'Good' });
  const [bookResourceForm, setBookResourceForm]   = useState({ assetId:'', startDate:'', endDate:'', purpose:'' });
  const [maintenanceForm, setMaintenanceForm]     = useState({ assetId:'', type:'Repair', description:'', priority:'Medium' });

  /* ── auto-clear messages ── */
  useEffect(() => {
    if (!errorMessage && !successMessage) return;
    const t = setTimeout(() => { setErrorMessage(''); setSuccessMessage(''); }, 7000);
    return () => clearTimeout(t);
  }, [errorMessage, successMessage]);

  /* ── API helpers ── */
  const fetchStats = useCallback(async (tk) => {
    try {
      const res  = await apiFetch('/dashboard/stats', tk || token);
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setOverdueReturns(data.overdueReturns || []);
        setUpcomingReturnsList(data.upcomingReturns || []);
        setAllAssets(data.allAssets || []);
      }
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchDepartments = useCallback(async (tk) => {
    try {
      const res  = await apiFetch('/org/departments', tk || token);
      const data = await res.json();
      if (res.ok) setDepartments(data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchCategories = useCallback(async (tk) => {
    try {
      const res  = await apiFetch('/org/categories', tk || token);
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchDirectory = useCallback(async (tk) => {
    try {
      const res  = await apiFetch('/users', tk || token);
      const data = await res.json();
      if (res.ok) setDirectoryUsers(data);
    } catch (e) { console.error(e); }
  }, [token]);

  /* ── Session validation + initial load ── */
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res  = await apiFetch('/auth/me', token);
        const data = await res.json();
        if (!res.ok) { handleLogout(); return; }
        setCurrentUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchStats(token);
    if (currentUser?.role === 'Admin') {
      fetchDepartments(token);
      fetchCategories(token);
      fetchDirectory(token);
    }
  }, [token, currentUser?.role]);

  /* ── Logout ── */
  const handleLogout = () => {
    setToken(''); setCurrentUser(null);
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setSuccessMessage('Logged out successfully.');
    setActiveTab('dashboard');
  };

  /* ── Auth Submits ── */
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); setErrorMessage(''); setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: authForm.email, password: authForm.password }) });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        const u = { _id:data._id, name:data.name, email:data.email, role:data.role, department:data.department };
        setCurrentUser(u);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(u));
        setSuccessMessage('Welcome back!');
        setAuthForm({ name:'', email:'', password:'', confirmPassword:'', department:'' });
      } else setErrorMessage(data.message || 'Invalid credentials.');
    } catch { setErrorMessage('Cannot connect to server.'); }
    finally { setLoading(false); }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault(); setErrorMessage('');
    if (authForm.password !== authForm.confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name:authForm.name, email:authForm.email, password:authForm.password }) });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        const u = { _id:data._id, name:data.name, email:data.email, role:data.role, department:data.department };
        setCurrentUser(u);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(u));
        setSuccessMessage('Account created as Employee!');
        setAuthForm({ name:'', email:'', password:'', confirmPassword:'', department:'' });
      } else setErrorMessage(data.message || 'Registration failed.');
    } catch { setErrorMessage('Cannot connect to server.'); }
    finally { setLoading(false); }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault(); setErrorMessage(''); setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: authForm.email }) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage(data.message); setAuthMode('login'); }
      else setErrorMessage(data.message || 'Request failed.');
    } catch { setErrorMessage('Server error.'); }
    finally { setLoading(false); }
  };

  /* ── Department CRUD ── */
  const openCreateDept = () => { setEditingDept(null); setDeptForm(BLANK_DEPT); setShowDeptModal(true); };
  const openEditDept   = (d) => {
    setEditingDept(d);
    setDeptForm({ name: d.name, description: d.description||'', head: d.head?._id||'', parentDept: d.parentDept?._id||'', status: d.status });
    setShowDeptModal(true);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage('');
    const method = editingDept ? 'PATCH' : 'POST';
    const url    = editingDept ? `/org/departments/${editingDept._id}` : '/org/departments';
    try {
      const res  = await apiFetch(url, token, { method, body: JSON.stringify(deptForm) });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setShowDeptModal(false);
        fetchDepartments(token);
      } else setErrorMessage(data.message || 'Operation failed.');
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleDeactivateDept = async (id, name) => {
    if (!window.confirm(`Deactivate department "${name}"?`)) return;
    try {
      const res  = await apiFetch(`/org/departments/${id}`, token, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { setSuccessMessage(data.message); fetchDepartments(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
  };

  const handleDeptStatusToggle = async (dept) => {
    const newStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res  = await apiFetch(`/org/departments/${dept._id}`, token, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage(data.message); fetchDepartments(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
  };

  /* ── Category CRUD ── */
  const openCreateCat = () => { setEditingCat(null); setCatForm(BLANK_CAT); setShowCatModal(true); };
  const openEditCat   = (c) => {
    setEditingCat(c);
    setCatForm({ name: c.name, description: c.description||'', customFields: c.customFields.map(f => ({ ...f })), status: c.status });
    setShowCatModal(true);
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage('');
    const method = editingCat ? 'PATCH' : 'POST';
    const url    = editingCat ? `/org/categories/${editingCat._id}` : '/org/categories';
    try {
      const res  = await apiFetch(url, token, { method, body: JSON.stringify(catForm) });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setShowCatModal(false);
        fetchCategories(token);
      } else setErrorMessage(data.message || 'Operation failed.');
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleDeactivateCat = async (id, name) => {
    if (!window.confirm(`Deactivate category "${name}"?`)) return;
    try {
      const res  = await apiFetch(`/org/categories/${id}`, token, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { setSuccessMessage(data.message); fetchCategories(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
  };

  /* ── Custom Field helpers ── */
  const addCustomField  = () => setCatForm(p => ({ ...p, customFields: [...p.customFields, { ...BLANK_FIELD }] }));
  const removeCustomField = (i) => setCatForm(p => ({ ...p, customFields: p.customFields.filter((_, idx) => idx !== i) }));
  const updateCustomField = (i, key, val) => setCatForm(p => {
    const fields = [...p.customFields];
    fields[i] = { ...fields[i], [key]: val };
    return { ...p, customFields: fields };
  });

  /* ── Employee Directory actions ── */
  const handleUserRole = async (userId, role) => {
    try {
      const res  = await apiFetch(`/users/${userId}/role`, token, { method:'PATCH', body: JSON.stringify({ role }) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage(data.message); fetchDirectory(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
  };

  const handleUserStatus = async (userId, status) => {
    try {
      const res  = await apiFetch(`/users/${userId}/status`, token, { method:'PATCH', body: JSON.stringify({ status }) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage(data.message); fetchDirectory(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
  };

  const handleUserDept = async (userId, departmentId) => {
    try {
      const res  = await apiFetch(`/users/${userId}/department`, token, { method:'PATCH', body: JSON.stringify({ departmentId }) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage(data.message); fetchDirectory(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
  };

  /* ── Quick Action submits ── */
  const handleRegisterAssetSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage('');
    try {
      const res  = await apiFetch('/dashboard/register-asset', token, { method:'POST', body: JSON.stringify(registerAssetForm) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage('Asset registered!'); setCurrentModal(null); setRegisterAssetForm({ name:'', serialNumber:'', category:'', status:'Available', department:'', condition:'Good' }); fetchStats(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleBookResourceSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage('');
    try {
      const res  = await apiFetch('/dashboard/book-resource', token, { method:'POST', body: JSON.stringify(bookResourceForm) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage('Resource booked!'); setCurrentModal(null); setBookResourceForm({ assetId:'', startDate:'', endDate:'', purpose:'' }); fetchStats(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleRaiseMaintenanceSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage('');
    try {
      const res  = await apiFetch('/dashboard/raise-maintenance', token, { method:'POST', body: JSON.stringify(maintenanceForm) });
      const data = await res.json();
      if (res.ok) { setSuccessMessage('Maintenance ticket raised!'); setCurrentModal(null); setMaintenanceForm({ assetId:'', type:'Repair', description:'', priority:'Medium' }); fetchStats(token); }
      else setErrorMessage(data.message);
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  /* ── Utility ── */
  const getDaysOverdue = (d) => Math.ceil(Math.abs(new Date() - new Date(d)) / 86400000);
  const formatDate     = (d) => d ? new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : 'N/A';
  const getRoleBadgeClass = (role) => {
    if (!role) return 'employee';
    return role.toLowerCase().replace(/ /g, '-');
  };

  /* ═══════════════════════════════════════════
     AUTH SCREEN
  ═══════════════════════════════════════════ */
  if (!token || !currentUser) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-logo">
            <h1 className="logo-text"><RefreshCw size={26} style={{ animationDuration:'3s' }} /> AssetFlow</h1>
          </div>

          {errorMessage   && <div className="error-banner"><AlertCircle size={16}/><span>{errorMessage}</span></div>}
          {successMessage && <div className="success-banner"><CheckCircle size={16}/><span>{successMessage}</span></div>}

          {/* LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="auth-header"><h2>Welcome Back</h2><p>Sign in to your AssetFlow account</p></div>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{position:'relative'}}>
                  <Mail size={16} style={{position:'absolute',left:'12px',top:'13px',color:'var(--text-muted)'}}/>
                  <input type="email" required placeholder="name@company.com" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} style={{paddingLeft:'38px',width:'100%'}}/>
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{position:'relative'}}>
                  <Lock size={16} style={{position:'absolute',left:'12px',top:'13px',color:'var(--text-muted)'}}/>
                  <input type="password" required placeholder="••••••••" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} style={{paddingLeft:'38px',width:'100%'}}/>
                </div>
              </div>
              <div style={{textAlign:'right',marginBottom:'18px'}}>
                <button type="button" onClick={()=>setAuthMode('forgot')} style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:'13px'}}>Forgot Password?</button>
              </div>
              <button type="submit" disabled={loading} className="auth-btn">{loading ? 'Signing in…' : 'Sign In'}</button>
              <div className="auth-footer">No account? <button type="button" onClick={()=>setAuthMode('signup')}>Sign Up</button></div>
            </form>
          )}

          {/* SIGNUP */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit}>
              <div className="auth-header"><h2>Create Account</h2><p>Register as an Employee — roles assigned by Admin</p></div>
              <div className="form-group">
                <label>Full Name</label>
                <div style={{position:'relative'}}>
                  <User size={16} style={{position:'absolute',left:'12px',top:'13px',color:'var(--text-muted)'}}/>
                  <input type="text" required placeholder="Jane Doe" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} style={{paddingLeft:'38px',width:'100%'}}/>
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{position:'relative'}}>
                  <Mail size={16} style={{position:'absolute',left:'12px',top:'13px',color:'var(--text-muted)'}}/>
                  <input type="email" required placeholder="name@company.com" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} style={{paddingLeft:'38px',width:'100%'}}/>
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{position:'relative'}}>
                  <Lock size={16} style={{position:'absolute',left:'12px',top:'13px',color:'var(--text-muted)'}}/>
                  <input type="password" required placeholder="Min 6 characters" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} style={{paddingLeft:'38px',width:'100%'}}/>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div style={{position:'relative'}}>
                  <Lock size={16} style={{position:'absolute',left:'12px',top:'13px',color:'var(--text-muted)'}}/>
                  <input type="password" required placeholder="Repeat password" value={authForm.confirmPassword} onChange={e=>setAuthForm({...authForm,confirmPassword:e.target.value})} style={{paddingLeft:'38px',width:'100%'}}/>
                </div>
              </div>
              <button type="submit" disabled={loading} className="auth-btn">{loading ? 'Creating…' : 'Sign Up'}</button>
              <div className="auth-footer">Already have an account? <button type="button" onClick={()=>setAuthMode('login')}>Sign In</button></div>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit}>
              <div className="auth-header"><h2>Reset Password</h2><p>We'll email you reset instructions</p></div>
              <div className="form-group">
                <label>Registered Email</label>
                <div style={{position:'relative'}}>
                  <Mail size={16} style={{position:'absolute',left:'12px',top:'13px',color:'var(--text-muted)'}}/>
                  <input type="email" required placeholder="name@company.com" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} style={{paddingLeft:'38px',width:'100%'}}/>
                </div>
              </div>
              <button type="submit" disabled={loading} className="auth-btn">{loading ? 'Sending…' : 'Send Reset Link'}</button>
              <div className="auth-footer"><button type="button" onClick={()=>setAuthMode('login')}>← Back to Login</button></div>
            </form>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     AUTHENTICATED APP LAYOUT
  ═══════════════════════════════════════════ */
  return (
    <div className="app-layout">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <h2 className="logo-text" style={{fontSize:'22px'}}><RefreshCw size={20}/> AssetFlow</h2>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">{currentUser.name.charAt(0)}</div>
            <div className="profile-info">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-email">{currentUser.email}</span>
              <span className={`role-badge ${getRoleBadgeClass(currentUser.role)}`}>{currentUser.role}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab==='dashboard' ? 'active' : ''}`} onClick={()=>setActiveTab('dashboard')}>
              <LayoutDashboard size={18}/><span>Dashboard</span>
            </button>
            {currentUser.role === 'Admin' && (
              <button className={`nav-item ${activeTab==='orgSetup' ? 'active' : ''}`} onClick={()=>{ setActiveTab('orgSetup'); }}>
                <Building2 size={18}/><span>Organization Setup</span>
              </button>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><LogOut size={18}/><span>Sign Out</span></button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>{activeTab === 'dashboard' ? 'Operational Snapshot' : 'Organization Setup'}</h1>
            <p className="header-meta">Logged in as <strong style={{color:'var(--text-title)'}}>{currentUser.name}</strong> · {currentUser.role}</p>
          </div>
          <span style={{fontSize:'13px',color:'var(--text-muted)'}}>{new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'})}</span>
        </div>

        {errorMessage   && <div className="error-banner"><AlertCircle size={16}/><span>{errorMessage}</span></div>}
        {successMessage && <div className="success-banner"><CheckCircle size={16}/><span>{successMessage}</span></div>}

        {/* ══════════════ DASHBOARD TAB ══════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              {[
                { cls:'available',   label:'Assets Available',  val: stats.availableAssets,  sub:'In warehouse / ready',    Icon: CheckCircle },
                { cls:'allocated',   label:'Assets Allocated',  val: stats.allocatedAssets,  sub:'Checked out to staff',    Icon: Clock },
                { cls:'maintenance', label:'Maintenance Today', val: stats.maintenanceCount,  sub:'Service tickets open',    Icon: Wrench },
                { cls:'bookings',    label:'Active Bookings',   val: stats.activeBookings,   sub:'Reserved resources',      Icon: Bookmark },
                { cls:'transfers',   label:'Pending Transfers', val: stats.pendingTransfers, sub:'Awaiting approvals',      Icon: ArrowLeftRight },
                { cls:'returns',     label:'Upcoming Returns',  val: stats.upcomingReturns,  sub:'Due within 7 days',       Icon: Calendar },
              ].map(({ cls, label, val, sub, Icon }) => (
                <div key={cls} className={`kpi-card ${cls}`}>
                  <div className="kpi-info">
                    <h3>{label}</h3>
                    <div className="kpi-value">{val}</div>
                  </div>
                  <div className="kpi-footer">{sub}</div>
                  <div className="kpi-icon-wrapper"><Icon size={20}/></div>
                </div>
              ))}
            </div>

            {/* Overdue Panel */}
            {overdueReturns.length > 0 && (
              <div className="overdue-section">
                <div className="overdue-header">
                  <ShieldAlert size={20}/>
                  <h2>⚠️ Overdue Returns</h2>
                  <span className="overdue-badge">{overdueReturns.length} Overdue</span>
                </div>
                <div className="overdue-list">
                  {overdueReturns.map(asset => (
                    <div className="overdue-item" key={asset._id}>
                      <div className="overdue-info">
                        <span className="overdue-asset-name">{asset.name}</span>
                        <div className="overdue-meta">
                          <span>SN: <code style={{fontSize:'11px'}}>{asset.serialNumber}</code></span>
                          <span>Holder: <strong>{asset.currentHolder?.name || 'Unknown'}</strong></span>
                          <span>Expected: <span style={{color:'#fda4af'}}>{formatDate(asset.expectedReturnDate)}</span></span>
                        </div>
                      </div>
                      <div className="overdue-warning-tag"><Clock size={14}/><span>{getDaysOverdue(asset.expectedReturnDate)} Days Overdue</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="actions-grid">
                {(currentUser.role==='Admin'||currentUser.role==='Asset Manager') ? (
                  <button className="action-tile" onClick={()=>setCurrentModal('register')}>
                    <div className="action-icon"><PlusCircle size={20}/></div>
                    <div className="action-info"><h4>Register Asset</h4><p>Add to inventory</p></div>
                  </button>
                ) : (
                  <div className="action-tile" style={{opacity:.45,cursor:'not-allowed'}}>
                    <div className="action-icon" style={{background:'#27272a',color:'#71717a'}}><PlusCircle size={20}/></div>
                    <div className="action-info"><h4>Register Asset</h4><p style={{color:'var(--color-overdue)'}}>Requires Manager+</p></div>
                  </div>
                )}
                <button className="action-tile" onClick={()=>setCurrentModal('book')}>
                  <div className="action-icon"><Bookmark size={20}/></div>
                  <div className="action-info"><h4>Book Resource</h4><p>Request checkout</p></div>
                </button>
                <button className="action-tile" onClick={()=>setCurrentModal('maintenance')}>
                  <div className="action-icon"><Wrench size={20}/></div>
                  <div className="action-info"><h4>Raise Maintenance</h4><p>Report issue or service</p></div>
                </button>
              </div>
            </div>

            {/* Upcoming Returns Table */}
            <div className="data-panel">
              <h2 className="section-title">Upcoming Returns (Next 7 Days)</h2>
              {upcomingReturnsList.length === 0
                ? <p style={{fontSize:'14px',color:'var(--text-muted)'}}>No returns scheduled for the next 7 days.</p>
                : (
                  <div className="directory-table-container">
                    <table className="directory-table">
                      <thead><tr><th>Asset</th><th>Category</th><th>Serial</th><th>Holder</th><th>Return Date</th></tr></thead>
                      <tbody>
                        {upcomingReturnsList.map(a => (
                          <tr key={a._id}>
                            <td style={{color:'var(--text-title)',fontWeight:600}}>{a.name}</td>
                            <td>{a.category?.name || '—'}</td>
                            <td><code>{a.serialNumber}</code></td>
                            <td>{a.currentHolder?.name || 'N/A'}</td>
                            <td style={{color:'var(--color-upcoming)'}}>{formatDate(a.expectedReturnDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </>
        )}

        {/* ══════════════ ORGANIZATION SETUP TAB ══════════════ */}
        {activeTab === 'orgSetup' && currentUser.role === 'Admin' && (
          <>
            {/* Pill Tab Switcher */}
            <div className="org-tab-bar">
              <button className={`org-tab-btn ${orgTab==='departments' ? 'active' : ''}`} onClick={()=>setOrgTab('departments')}>
                <FolderTree size={15}/> Tab A — Departments
              </button>
              <button className={`org-tab-btn ${orgTab==='categories' ? 'active' : ''}`} onClick={()=>setOrgTab('categories')}>
                <Tag size={15}/> Tab B — Asset Categories
              </button>
              <button className={`org-tab-btn ${orgTab==='employees' ? 'active' : ''}`} onClick={()=>setOrgTab('employees')}>
                <Users size={15}/> Tab C — Employee Directory
              </button>
            </div>

            {/* ── TAB A: DEPARTMENT MANAGEMENT ── */}
            {orgTab === 'departments' && (
              <div className="data-panel">
                <div className="panel-header">
                  <h2>Department Management</h2>
                  <button className="btn-add" onClick={openCreateDept}><PlusCircle size={15}/> Add Department</button>
                </div>

                {departments.length === 0 ? (
                  <div className="empty-state"><FolderTree size={40}/><p>No departments yet. Create the first one.</p></div>
                ) : (
                  <div className="directory-table-container">
                    <table className="directory-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Department Head</th>
                          <th>Parent Dept</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(d => (
                          <tr key={d._id}>
                            <td style={{color:'var(--text-title)',fontWeight:600}}>{d.name}</td>
                            <td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.description || '—'}</td>
                            <td>{d.head ? <><span className={`role-badge ${getRoleBadgeClass(d.head.role)}`}>{d.head.name}</span></> : <span style={{color:'var(--text-muted)'}}>Unassigned</span>}</td>
                            <td>{d.parentDept ? <span className="hierarchy-label"><ChevronRight size={12}/>{d.parentDept.name}</span> : '—'}</td>
                            <td>
                              <button
                                className={`status-badge ${d.status.toLowerCase()}`}
                                onClick={()=>handleDeptStatusToggle(d)}
                              >{d.status}</button>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button className="icon-btn" onClick={()=>openEditDept(d)}><Pencil size={13}/> Edit</button>
                                <button className="icon-btn danger" onClick={()=>handleDeactivateDept(d._id, d.name)}><Trash2 size={13}/> Deactivate</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB B: ASSET CATEGORY MANAGEMENT ── */}
            {orgTab === 'categories' && (
              <div className="data-panel">
                <div className="panel-header">
                  <h2>Asset Category Management</h2>
                  <button className="btn-add" onClick={openCreateCat}><PlusCircle size={15}/> Add Category</button>
                </div>

                {categories.length === 0 ? (
                  <div className="empty-state"><Tag size={40}/><p>No categories yet.</p></div>
                ) : (
                  <div className="directory-table-container">
                    <table className="directory-table">
                      <thead>
                        <tr>
                          <th>Category Name</th>
                          <th>Description</th>
                          <th>Custom Fields</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c._id}>
                            <td style={{color:'var(--text-title)',fontWeight:600}}>{c.name}</td>
                            <td style={{maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.description || '—'}</td>
                            <td>
                              {c.customFields.length === 0
                                ? <span style={{color:'var(--text-muted)',fontSize:'12px'}}>None</span>
                                : (
                                  <div className="field-tags">
                                    {c.customFields.map((f,i)=>(
                                      <span key={i} className={`field-tag ${f.required ? 'required' : ''}`}>
                                        {f.fieldName} <em style={{opacity:.6}}>({f.fieldType})</em>
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </td>
                            <td>
                              <span className={`status-badge ${c.status.toLowerCase()}`}>{c.status}</span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button className="icon-btn" onClick={()=>openEditCat(c)}><Pencil size={13}/> Edit</button>
                                <button className="icon-btn danger" onClick={()=>handleDeactivateCat(c._id, c.name)}><Trash2 size={13}/> Deactivate</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB C: EMPLOYEE DIRECTORY ── */}
            {orgTab === 'employees' && (
              <div className="data-panel">
                <div className="panel-header">
                  <h2>Employee Directory</h2>
                  <span style={{fontSize:'13px',color:'var(--text-muted)'}}>Role assignments are only made here</span>
                </div>

                <div className="directory-table-container">
                  <table className="directory-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {directoryUsers.map(emp => (
                        <tr key={emp._id}>
                          <td style={{color:'var(--text-title)',fontWeight:600}}>{emp.name}</td>
                          <td style={{fontSize:'13px'}}>{emp.email}</td>
                          <td>
                            <select
                              value={emp.department?._id || ''}
                              onChange={e=>handleUserDept(emp._id, e.target.value || null)}
                              className="role-select"
                            >
                              <option value="">— No Department —</option>
                              {departments.filter(d=>d.status==='Active').map(d=>(
                                <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={emp.role}
                              onChange={e=>handleUserRole(emp._id, e.target.value)}
                              className="role-select"
                              disabled={emp._id === currentUser._id}
                            >
                              <option value="Employee">Employee</option>
                              <option value="Asset Manager">Asset Manager</option>
                              <option value="Department Head">Department Head</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className={`status-badge ${emp.status?.toLowerCase() || 'active'}`}
                              onClick={()=>handleUserStatus(emp._id, emp.status==='Active' ? 'Inactive' : 'Active')}
                              disabled={emp._id === currentUser._id}
                            >{emp.status || 'Active'}</button>
                          </td>
                          <td>
                            <span className={`role-badge ${getRoleBadgeClass(emp.role)}`}>{emp.role}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ══════════ DEPARTMENT MODAL ══════════ */}
      {showDeptModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'520px'}}>
            <div className="modal-header">
              <h2>{editingDept ? 'Edit Department' : 'Create Department'}</h2>
              <button className="close-btn" onClick={()=>setShowDeptModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleDeptSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input type="text" required placeholder="e.g. Finance" value={deptForm.name} onChange={e=>setDeptForm({...deptForm,name:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="2" placeholder="Brief description…" value={deptForm.description} onChange={e=>setDeptForm({...deptForm,description:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Department Head</label>
                <select value={deptForm.head} onChange={e=>setDeptForm({...deptForm,head:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Unassigned —</option>
                  {directoryUsers.filter(u=>u.role==='Department Head'||u.role==='Admin').map(u=>(
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Parent Department <span style={{color:'var(--text-muted)',fontSize:'12px'}}>(optional — for hierarchy)</span></label>
                <select value={deptForm.parentDept} onChange={e=>setDeptForm({...deptForm,parentDept:e.target.value})} style={{width:'100%'}}>
                  <option value="">— None (top-level) —</option>
                  {departments.filter(d=>d.status==='Active' && d._id !== editingDept?._id).map(d=>(
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={deptForm.status} onChange={e=>setDeptForm({...deptForm,status:e.target.value})} style={{width:'100%'}}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowDeptModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : editingDept ? 'Save Changes' : 'Create Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ CATEGORY MODAL ══════════ */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'580px',maxHeight:'90vh',overflowY:'auto'}}>
            <div className="modal-header">
              <h2>{editingCat ? 'Edit Category' : 'Create Asset Category'}</h2>
              <button className="close-btn" onClick={()=>setShowCatModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCatSubmit}>
              <div className="form-group">
                <label>Category Name *</label>
                <input type="text" required placeholder="e.g. Electronics" value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="2" placeholder="What assets belong here…" value={catForm.description} onChange={e=>setCatForm({...catForm,description:e.target.value})} style={{width:'100%'}}/>
              </div>

              {/* Custom Fields Builder */}
              <div className="form-group">
                <label>Category-Specific Fields <span style={{color:'var(--text-muted)',fontSize:'12px'}}>(optional — e.g. warranty period for Electronics)</span></label>
                <div className="custom-fields-builder">
                  {catForm.customFields.map((field, i) => (
                    <div className="custom-field-row" key={i}>
                      <input
                        type="text"
                        placeholder="Field name (e.g. warrantyPeriod)"
                        value={field.fieldName}
                        onChange={e=>updateCustomField(i,'fieldName',e.target.value)}
                        style={{width:'100%'}}
                      />
                      <select value={field.fieldType} onChange={e=>updateCustomField(i,'fieldType',e.target.value)}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Yes/No</option>
                      </select>
                      <label className="field-required-check">
                        <input type="checkbox" checked={field.required} onChange={e=>updateCustomField(i,'required',e.target.checked)}/>
                        Required
                      </label>
                      <button type="button" className="remove-field-btn" onClick={()=>removeCustomField(i)}><X size={14}/></button>
                    </div>
                  ))}
                  <button type="button" className="add-field-btn" onClick={addCustomField}><PlusCircle size={14}/> Add Custom Field</button>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={catForm.status} onChange={e=>setCatForm({...catForm,status:e.target.value})} style={{width:'100%'}}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowCatModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : editingCat ? 'Save Changes' : 'Create Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ QUICK ACTION MODALS ══════════ */}
      {currentModal === 'register' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h2>Register New Asset</h2><button className="close-btn" onClick={()=>setCurrentModal(null)}><X size={18}/></button></div>
            <form onSubmit={handleRegisterAssetSubmit}>
              <div className="form-group"><label>Asset Name *</label><input type="text" required placeholder="e.g. MacBook Pro 16" value={registerAssetForm.name} onChange={e=>setRegisterAssetForm({...registerAssetForm,name:e.target.value})} style={{width:'100%'}}/></div>
              <div className="form-group"><label>Serial Number *</label><input type="text" required placeholder="SN-XXX-000" value={registerAssetForm.serialNumber} onChange={e=>setRegisterAssetForm({...registerAssetForm,serialNumber:e.target.value})} style={{width:'100%'}}/></div>
              <div className="form-group">
                <label>Category</label>
                <select value={registerAssetForm.category} onChange={e=>setRegisterAssetForm({...registerAssetForm,category:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Select Category —</option>
                  {categories.filter(c=>c.status==='Active').map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={registerAssetForm.department} onChange={e=>setRegisterAssetForm({...registerAssetForm,department:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Select Department —</option>
                  {departments.filter(d=>d.status==='Active').map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Condition</label>
                <select value={registerAssetForm.condition} onChange={e=>setRegisterAssetForm({...registerAssetForm,condition:e.target.value})} style={{width:'100%'}}>
                  {['Excellent','Good','Fair','Damaged'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setCurrentModal(null)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Registering…' : 'Register Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentModal === 'book' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h2>Book Resource</h2><button className="close-btn" onClick={()=>setCurrentModal(null)}><X size={18}/></button></div>
            <form onSubmit={handleBookResourceSubmit}>
              <div className="form-group">
                <label>Available Asset *</label>
                <select required value={bookResourceForm.assetId} onChange={e=>setBookResourceForm({...bookResourceForm,assetId:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Choose Asset —</option>
                  {allAssets.filter(a=>a.status==='Available').map(a=><option key={a._id} value={a._id}>{a.name} — SN: {a.serialNumber}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Start Date *</label><input type="date" required value={bookResourceForm.startDate} onChange={e=>setBookResourceForm({...bookResourceForm,startDate:e.target.value})} style={{width:'100%'}}/></div>
              <div className="form-group"><label>Expected Return Date *</label><input type="date" required value={bookResourceForm.endDate} onChange={e=>setBookResourceForm({...bookResourceForm,endDate:e.target.value})} style={{width:'100%'}}/></div>
              <div className="form-group"><label>Purpose *</label><textarea required rows="2" placeholder="Describe the use case…" value={bookResourceForm.purpose} onChange={e=>setBookResourceForm({...bookResourceForm,purpose:e.target.value})} style={{width:'100%'}}/></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setCurrentModal(null)}>Cancel</button>
                <button type="submit" disabled={loading || allAssets.filter(a=>a.status==='Available').length===0} className="btn-primary">{loading ? 'Booking…' : 'Confirm Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentModal === 'maintenance' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h2>Raise Maintenance Request</h2><button className="close-btn" onClick={()=>setCurrentModal(null)}><X size={18}/></button></div>
            <form onSubmit={handleRaiseMaintenanceSubmit}>
              <div className="form-group">
                <label>Asset *</label>
                <select required value={maintenanceForm.assetId} onChange={e=>setMaintenanceForm({...maintenanceForm,assetId:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Select Asset —</option>
                  {allAssets.map(a=><option key={a._id} value={a._id}>{a.name} [{a.status}]</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={maintenanceForm.type} onChange={e=>setMaintenanceForm({...maintenanceForm,type:e.target.value})} style={{width:'100%'}}>
                  <option value="Repair">Repair</option><option value="Routine">Routine</option><option value="Upgrade">Upgrade</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={maintenanceForm.priority} onChange={e=>setMaintenanceForm({...maintenanceForm,priority:e.target.value})} style={{width:'100%'}}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
              <div className="form-group"><label>Description *</label><textarea required rows="3" placeholder="Describe the issue…" value={maintenanceForm.description} onChange={e=>setMaintenanceForm({...maintenanceForm,description:e.target.value})} style={{width:'100%'}}/></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setCurrentModal(null)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Submitting…' : 'Raise Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
