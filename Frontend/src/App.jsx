import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  PlusCircle, 
  Bookmark, 
  Wrench, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Calendar, 
  ArrowLeftRight, 
  User, 
  Mail, 
  Lock, 
  Key, 
  RefreshCw 
} from 'lucide-react';
import './App.css';

const API_BASE = "http://localhost:5000/api";

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login'); // login, signup, forgot
  const [currentModal, setCurrentModal] = useState(null); // register, book, maintenance, null
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data State
  const [stats, setStats] = useState({
    availableAssets: 0,
    allocatedAssets: 0,
    maintenanceCount: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    upcomingReturns: 0
  });
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [upcomingReturnsList, setUpcomingReturnsList] = useState([]);
  const [allAssets, setAllAssets] = useState([]);

  // Employee Directory State
  const [directoryUsers, setDirectoryUsers] = useState([]);

  // Form Inputs
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '', department: 'General' });
  const [registerAssetForm, setRegisterAssetForm] = useState({ name: '', serialNumber: '', category: '', status: 'Available', department: 'General', condition: 'Good' });
  const [bookResourceForm, setBookResourceForm] = useState({ assetId: '', startDate: '', endDate: '', purpose: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ assetId: '', type: 'Repair', description: '', priority: 'Medium' });

  // Clear messages after a short time
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Fetch dashboard statistics
  const fetchStats = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setOverdueReturns(data.overdueReturns || []);
        setUpcomingReturnsList(data.upcomingReturns || []);
        setAllAssets(data.allAssets || []);
      } else {
        setErrorMessage(data.message || "Failed to load dashboard data.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error loading dashboard statistics.");
    }
  };

  // Fetch employee directory (Admin only)
  const fetchDirectory = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setDirectoryUsers(data);
      } else {
        setErrorMessage(data.message || "Failed to load employee directory.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error loading employee directory.");
    }
  };

  // Handle automatic data fetching on authentication
  useEffect(() => {
    if (token) {
      fetchStats(token);
      if (currentUser && currentUser.role === 'Admin') {
        fetchDirectory(token);
      }
    }
  }, [token, currentUser?.role]);

  // Session validation endpoint check on load
  useEffect(() => {
    const validateSession = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (!res.ok) {
            // Token expired or invalid
            handleLogout();
          } else {
            setCurrentUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          }
        } catch (err) {
          console.error("Session validation failed:", err);
        }
      }
    };
    validateSession();
  }, []);

  // Handle Logout
  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setDirectoryUsers([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSuccessMessage("Logged out successfully.");
    setActiveTab('dashboard');
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setCurrentUser({ _id: data._id, name: data.name, email: data.email, role: data.role, department: data.department });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email, role: data.role, department: data.department }));
        setSuccessMessage("Welcome back! Logged in successfully.");
        // Clear input form
        setAuthForm({ name: '', email: '', password: '', confirmPassword: '', department: 'General' });
      } else {
        setErrorMessage(data.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Cannot connect to server. Ensure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (authForm.password !== authForm.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: authForm.name, 
          email: authForm.email, 
          password: authForm.password,
          department: authForm.department
        })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setCurrentUser({ _id: data._id, name: data.name, email: data.email, role: data.role, department: data.department });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email, role: data.role, department: data.department }));
        setSuccessMessage("Account created successfully as Employee!");
        setAuthForm({ name: '', email: '', password: '', confirmPassword: '', department: 'General' });
      } else {
        setErrorMessage(data.message || "Failed to create account.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Cannot connect to server. Ensure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message);
        setAuthMode('login');
      } else {
        setErrorMessage(data.message || "Failed to process forgot password request.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin user promotion
  const handlePromoteUser = async (userId, newRole) => {
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message);
        fetchDirectory(token); // Reload list
        
        // If current admin updated their own role (though endpoint blocks it, safe keeping)
        if (userId === currentUser._id) {
          const updated = { ...currentUser, role: newRole };
          setCurrentUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }
      } else {
        setErrorMessage(data.message || "Failed to update employee role.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error updating role.");
    }
  };

  // Handle Asset Registration Submission
  const handleRegisterAssetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/dashboard/register-asset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(registerAssetForm)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Asset registered successfully!");
        setCurrentModal(null);
        setRegisterAssetForm({ name: '', serialNumber: '', category: '', status: 'Available', department: 'General', condition: 'Good' });
        fetchStats(token); // Refresh lists & counts
      } else {
        setErrorMessage(data.message || "Failed to register asset.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error registering asset.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Booking Resource Submission
  const handleBookResourceSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/dashboard/book-resource`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookResourceForm)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Resource booked successfully!");
        setCurrentModal(null);
        setBookResourceForm({ assetId: '', startDate: '', endDate: '', purpose: '' });
        fetchStats(token);
      } else {
        setErrorMessage(data.message || "Failed to book resource.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error booking resource.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Maintenance Request Submission
  const handleRaiseMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/dashboard/raise-maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceForm)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Maintenance ticket raised successfully!");
        setCurrentModal(null);
        setMaintenanceForm({ assetId: '', type: 'Repair', description: '', priority: 'Medium' });
        fetchStats(token);
      } else {
        setErrorMessage(data.message || "Failed to submit maintenance ticket.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error submitting maintenance ticket.");
    } finally {
      setLoading(false);
    }
  };

  // Utility: calculate days overdue
  const getDaysOverdue = (dateStr) => {
    const expected = new Date(dateStr);
    const diffTime = Math.abs(new Date() - expected);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Utility: format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // If not authenticated, render Login/Signup/Forgot Password Screen
  if (!token || !currentUser) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-logo">
            <h1 className="logo-text">
              <RefreshCw className="animate-spin" style={{ animationDuration: '3s' }} /> AssetFlow
            </h1>
          </div>

          {errorMessage && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="success-banner">
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="auth-header">
                <h2>Welcome Back</h2>
                <p>Enter your credentials to access your dashboard</p>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: '18px' }}>
                <button type="button" onClick={() => setAuthMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Forgot Password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="auth-footer">
                Don't have an account? 
                <button type="button" onClick={() => setAuthMode('signup')}>Sign Up</button>
              </div>
            </form>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit}>
              <div className="auth-header">
                <h2>Create Account</h2>
                <p>Register as a team employee to request resources</p>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    required 
                    placeholder="Jane Doe" 
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select 
                  value={authForm.department}
                  onChange={(e) => setAuthForm({ ...authForm, department: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="General">General</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="IT Operations">IT Operations</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="Min 6 characters" 
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="Confirm password" 
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="auth-footer">
                Already have an account? 
                <button type="button" onClick={() => setAuthMode('login')}>Sign In</button>
              </div>
            </form>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit}>
              <div className="auth-header">
                <h2>Forgot Password</h2>
                <p>We'll email you instructions to reset your password</p>
              </div>

              <div className="form-group">
                <label>Registered Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? 'Sending Request...' : 'Send Recovery Link'}
              </button>

              <div className="auth-footer">
                <button type="button" onClick={() => setAuthMode('login')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // authenticated layout
  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-header">
            <h2 className="logo-text">
              <RefreshCw className="text-primary animate-spin" style={{ animationDuration: '6s' }} size={24} /> AssetFlow
            </h2>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">
              {currentUser.name.charAt(0)}
            </div>
            <div className="profile-info">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-email">{currentUser.email}</span>
              <span className={`role-badge ${currentUser.role.toLowerCase().replace(' ', '-')}`}>
                {currentUser.role}
              </span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            
            {currentUser.role === 'Admin' && (
              <button 
                className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`}
                onClick={() => setActiveTab('directory')}
              >
                <Users size={18} />
                <span>Employee Directory</span>
              </button>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>{activeTab === 'dashboard' ? 'Operational Snapshot' : 'Employee Directory'}</h1>
            <p className="header-meta">
              Logged in as: <strong style={{ color: 'var(--text-title)' }}>{currentUser.name} ({currentUser.role})</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="success-banner">
            <CheckCircle size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Cards Grid */}
            <div className="kpi-grid">
              <div className="kpi-card available">
                <div className="kpi-info">
                  <h3>Assets Available</h3>
                  <div className="kpi-value">{stats.availableAssets}</div>
                </div>
                <div className="kpi-footer">In warehouse / ready</div>
                <div className="kpi-icon-wrapper">
                  <CheckCircle size={20} />
                </div>
              </div>

              <div className="kpi-card allocated">
                <div className="kpi-info">
                  <h3>Assets Allocated</h3>
                  <div className="kpi-value">{stats.allocatedAssets}</div>
                </div>
                <div className="kpi-footer">Checked out to staff</div>
                <div className="kpi-icon-wrapper">
                  <Clock size={20} />
                </div>
              </div>

              <div className="kpi-card maintenance">
                <div className="kpi-info">
                  <h3>Maintenance Today</h3>
                  <div className="kpi-value">{stats.maintenanceCount}</div>
                </div>
                <div className="kpi-footer">Service tickets open</div>
                <div className="kpi-icon-wrapper">
                  <Wrench size={20} />
                </div>
              </div>

              <div className="kpi-card bookings">
                <div className="kpi-info">
                  <h3>Active Bookings</h3>
                  <div className="kpi-value">{stats.activeBookings}</div>
                </div>
                <div className="kpi-footer">Reserved resources</div>
                <div className="kpi-icon-wrapper">
                  <Bookmark size={20} />
                </div>
              </div>

              <div className="kpi-card transfers">
                <div className="kpi-info">
                  <h3>Pending Transfers</h3>
                  <div className="kpi-value">{stats.pendingTransfers}</div>
                </div>
                <div className="kpi-footer">Awaiting approvals</div>
                <div className="kpi-icon-wrapper">
                  <ArrowLeftRight size={20} />
                </div>
              </div>

              <div className="kpi-card returns">
                <div className="kpi-info">
                  <h3>Upcoming Returns</h3>
                  <div className="kpi-value">{stats.upcomingReturns}</div>
                </div>
                <div className="kpi-footer">Due within 7 days</div>
                <div className="kpi-icon-wrapper">
                  <Calendar size={20} />
                </div>
              </div>
            </div>

            {/* Overdue Returns Panel */}
            {overdueReturns.length > 0 && (
              <div className="overdue-section">
                <div className="overdue-header">
                  <ShieldAlert size={20} />
                  <h2>⚠️ Overdue Returns Checklist</h2>
                  <span className="overdue-badge">{overdueReturns.length} Assets Overdue</span>
                </div>
                <div className="overdue-list">
                  {overdueReturns.map((asset) => (
                    <div className="overdue-item" key={asset._id}>
                      <div className="overdue-info">
                        <span className="overdue-asset-name">{asset.name} ({asset.category})</span>
                        <div className="overdue-meta">
                          <span>Serial: <code style={{ fontSize: '11px' }}>{asset.serialNumber}</code></span>
                          <span>Holder: <strong>{asset.currentHolder?.name || 'Unknown'} ({asset.currentHolder?.department || 'General'})</strong></span>
                          <span>Expected Return Date: <span style={{ color: '#fda4af' }}>{formatDate(asset.expectedReturnDate)}</span></span>
                        </div>
                      </div>
                      <div className="overdue-warning-tag">
                        <Clock size={14} />
                        <span>{getDaysOverdue(asset.expectedReturnDate)} Days Overdue</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            <div className="quick-actions-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="actions-grid">
                {/* Register Asset (Admin or Manager Only) */}
                {(currentUser.role === 'Admin' || currentUser.role === 'Asset Manager') ? (
                  <button className="action-tile" onClick={() => setCurrentModal('register')}>
                    <div className="action-icon">
                      <PlusCircle size={20} />
                    </div>
                    <div className="action-info">
                      <h4>Register Asset</h4>
                      <p>Add serials to repository</p>
                    </div>
                  </button>
                ) : (
                  <div className="action-tile" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <div className="action-icon" style={{ background: '#27272a', color: '#71717a' }}>
                      <PlusCircle size={20} />
                    </div>
                    <div className="action-info">
                      <h4>Register Asset</h4>
                      <p style={{ color: 'var(--color-overdue)' }}>Requires Manager Role</p>
                    </div>
                  </div>
                )}

                <button className="action-tile" onClick={() => setCurrentModal('book')}>
                  <div className="action-icon">
                    <Bookmark size={20} />
                  </div>
                  <div className="action-info">
                    <h4>Book Resource</h4>
                    <p>Request item check-out</p>
                  </div>
                </button>

                <button className="action-tile" onClick={() => setCurrentModal('maintenance')}>
                  <div className="action-icon">
                    <Wrench size={20} />
                  </div>
                  <div className="action-info">
                    <h4>Raise Maintenance</h4>
                    <p>Report damage or schedule service</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Upcoming Returns List (Normal List View) */}
            <div className="data-panel">
              <h2 className="section-title">Upcoming Returns (Next 7 Days)</h2>
              {upcomingReturnsList.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No returns scheduled for the next 7 days.</p>
              ) : (
                <div className="directory-table-container">
                  <table className="directory-table">
                    <thead>
                      <tr>
                        <th>Asset Name</th>
                        <th>Category</th>
                        <th>Serial Number</th>
                        <th>Current Holder</th>
                        <th>Expected Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingReturnsList.map((asset) => (
                        <tr key={asset._id}>
                          <td style={{ color: 'var(--text-title)', fontWeight: 600 }}>{asset.name}</td>
                          <td>{asset.category}</td>
                          <td><code>{asset.serialNumber}</code></td>
                          <td>{asset.currentHolder?.name || 'N/A'}</td>
                          <td style={{ color: 'var(--color-upcoming)' }}>{formatDate(asset.expectedReturnDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: EMPLOYEE DIRECTORY */}
        {activeTab === 'directory' && currentUser.role === 'Admin' && (
          <div className="data-panel">
            <h2 className="section-title">Corporate Employee Registry</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Promote staff members to Department Heads and Asset Managers from here.
            </p>
            
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Department</th>
                    <th>Current Role</th>
                    <th>Promotion / Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {directoryUsers.map((emp) => (
                    <tr key={emp._id}>
                      <td style={{ color: 'var(--text-title)', fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.department}</td>
                      <td>
                        <span className={`role-badge ${emp.role.toLowerCase().replace(' ', '-')}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td>
                        <select 
                          value={emp.role}
                          onChange={(e) => handlePromoteUser(emp._id, e.target.value)}
                          className="role-select"
                          disabled={emp._id === currentUser._id} // Lock self role updates to prevent lockout
                        >
                          <option value="Employee">Employee</option>
                          <option value="Asset Manager">Asset Manager</option>
                          <option value="Department Head">Department Head</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: REGISTER ASSET */}
      {currentModal === 'register' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Register New Corporate Asset</h2>
              <button className="close-btn" onClick={() => setCurrentModal(null)}>×</button>
            </div>
            
            <form onSubmit={handleRegisterAssetSubmit}>
              <div className="form-group">
                <label>Asset Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. MacBook Pro 16"
                  value={registerAssetForm.name}
                  onChange={(e) => setRegisterAssetForm({ ...registerAssetForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Serial Number (Unique ID)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. SN-MBP-8821"
                  value={registerAssetForm.serialNumber}
                  onChange={(e) => setRegisterAssetForm({ ...registerAssetForm, serialNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Laptops, Monitors, Furniture"
                  value={registerAssetForm.category}
                  onChange={(e) => setRegisterAssetForm({ ...registerAssetForm, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Assigned Department</label>
                <select 
                  value={registerAssetForm.department}
                  onChange={(e) => setRegisterAssetForm({ ...registerAssetForm, department: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="IT Operations">IT Operations</option>
                </select>
              </div>

              <div className="form-group">
                <label>Physical Condition</label>
                <select 
                  value={registerAssetForm.condition}
                  onChange={(e) => setRegisterAssetForm({ ...registerAssetForm, condition: e.target.value })}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCurrentModal(null)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BOOK RESOURCE */}
      {currentModal === 'book' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Book Resource / Checkout Asset</h2>
              <button className="close-btn" onClick={() => setCurrentModal(null)}>×</button>
            </div>

            <form onSubmit={handleBookResourceSubmit}>
              <div className="form-group">
                <label>Select Available Asset</label>
                <select 
                  required
                  value={bookResourceForm.assetId}
                  onChange={(e) => setBookResourceForm({ ...bookResourceForm, assetId: e.target.value })}
                >
                  <option value="">-- Choose an Available Asset --</option>
                  {allAssets.filter(asset => asset.status === 'Available').map(asset => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.category}) - SN: {asset.serialNumber}
                    </option>
                  ))}
                </select>
                {allAssets.filter(asset => asset.status === 'Available').length === 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--color-overdue)', marginTop: '4px' }}>
                    No available assets in inventory.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  required
                  value={bookResourceForm.startDate}
                  onChange={(e) => setBookResourceForm({ ...bookResourceForm, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Expected Return Date</label>
                <input 
                  type="date" 
                  required
                  value={bookResourceForm.endDate}
                  onChange={(e) => setBookResourceForm({ ...bookResourceForm, endDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Purpose of Booking</label>
                <textarea 
                  required
                  placeholder="Detail the project use case..."
                  rows="3"
                  value={bookResourceForm.purpose}
                  onChange={(e) => setBookResourceForm({ ...bookResourceForm, purpose: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCurrentModal(null)}>Cancel</button>
                <button 
                  type="submit" 
                  disabled={loading || allAssets.filter(asset => asset.status === 'Available').length === 0} 
                  className="btn-primary"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RAISE MAINTENANCE REQUEST */}
      {currentModal === 'maintenance' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Raise Maintenance / Repair Request</h2>
              <button className="close-btn" onClick={() => setCurrentModal(null)}>×</button>
            </div>

            <form onSubmit={handleRaiseMaintenanceSubmit}>
              <div className="form-group">
                <label>Select Asset to Service</label>
                <select 
                  required
                  value={maintenanceForm.assetId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assetId: e.target.value })}
                >
                  <option value="">-- Choose Asset --</option>
                  {allAssets.map(asset => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.category}) - SN: {asset.serialNumber} [{asset.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Maintenance Type</label>
                <select 
                  value={maintenanceForm.type}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
                >
                  <option value="Repair">Repair (Fix issues/damage)</option>
                  <option value="Routine">Routine Service (Maintenance/Checkup)</option>
                  <option value="Upgrade">System Upgrade (Software/Hardware enhancement)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ticket Priority</label>
                <select 
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Issue Description</label>
                <textarea 
                  required
                  placeholder="Please describe the malfunction or requirements..."
                  rows="3"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCurrentModal(null)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Submitting...' : 'Raise Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
