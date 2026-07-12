import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, LogOut, PlusCircle, Bookmark, Wrench,
  AlertCircle, ShieldAlert, CheckCircle, Clock, Calendar,
  ArrowLeftRight, User, Mail, Lock, RefreshCw, Building2,
  Tag, Pencil, Trash2, ChevronRight, FolderTree, X,
  Package, CalendarRange, Eye, Upload, FileText, Check, AlertTriangle,
  Info, CalendarDays, ExternalLink, ClipboardCheck, BarChart2
} from 'lucide-react';
import './App.css';
import AssetDirectory from './pages/AssetDirectory';
import AssetAudit from './pages/AssetAudit';
import AssetAnalytics from './pages/AssetAnalytics';

const API_BASE = "http://localhost:5000/api";

/* ─── API Fetch Helper ─── */
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
  /* ── Auth State ── */
  const [token, setToken]           = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });

  /* ── Navigation / UI State ── */
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [authMode, setAuthMode]     = useState('login'); // login | signup | forgot
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading]       = useState(false);

  /* ── Org Setup State (Tab A / B / C) ── */
  const [orgTab, setOrgTab]         = useState('departments'); // departments | categories | employees
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);

  /* ── Org Setup Modals & Forms ── */
  const [deptForm, setDeptForm]     = useState(BLANK_DEPT);
  const [editingDept, setEditingDept] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const [catForm, setCatForm]       = useState(BLANK_CAT);
  const [editingCat, setEditingCat] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);

  /* ── Dashboard State ── */
  const [stats, setStats]           = useState({ availableAssets:0, allocatedAssets:0, maintenanceCount:0, activeBookings:0, pendingTransfers:0, upcomingReturns:0 });
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [upcomingReturnsList, setUpcomingReturnsList] = useState([]);
  const [allAssets, setAllAssets]   = useState([]);

  /* ── Screen 4: Asset Directory State ── */
  const [assets, setAssets]         = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterBookable, setFilterBookable] = useState('all');

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory]   = useState({ allocationHistory: [], maintenanceHistory: [] });
  const [activeDrawerTab, setActiveDrawerTab] = useState('details');

  const [showRegisterAssetModal, setShowRegisterAssetModal] = useState(false);
  const [registerAssetForm, setRegisterAssetForm] = useState({
    name: '', serialNumber: '', category: '', status: 'Available', department: '',
    condition: 'Good', location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false,
    photos: [], documents: [], customFieldValues: {}
  });

  /* ── Screen 5: Allocations & Transfers State ── */
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers]     = useState([]);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    assetId: '', allocatedToUserId: '', departmentId: '', expectedReturnDate: '', notes: ''
  });
  const [conflictError, setConflictError] = useState(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningAllocation, setReturningAllocation] = useState(null);
  const [returnForm, setReturnForm]   = useState({ returnConditionNotes: '', condition: 'Good' });
  const [transferComment, setTransferComment] = useState('');

  /* ── Screen 6: Resource Bookings State ── */
  const [bookableAssets, setBookableAssets] = useState([]);
  const [selectedBookableAsset, setSelectedBookableAsset] = useState(null);
  const [assetBookings, setAssetBookings]   = useState([]);
  const [myBookings, setMyBookings]         = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm]       = useState({
    startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', purpose: ''
  });

  /* ── Screen 7: Maintenance Management State ── */
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [myMaintenanceRequests, setMyMaintenanceRequests] = useState([]);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintForm, setMaintForm] = useState({
    assetId: '', type: 'Repair', description: '', priority: 'Medium', photoUrl: ''
  });

  const [selectedMaintRequest, setSelectedMaintRequest] = useState(null);
  const [showAssignTechModal, setShowAssignTechModal] = useState(false);
  const [techAssignForm, setTechAssignForm] = useState({ technicianName: '', scheduledDate: '' });

  const [showResolveMaintModal, setShowResolveMaintModal] = useState(false);
  const [resolveMaintForm, setResolveMaintForm] = useState({ resolutionNotes: '', postRepairCondition: 'Good' });

  const [showRejectMaintModal, setShowRejectMaintModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  /* ── Auth Forms State ── */
  const [authForm, setAuthForm]     = useState({ name: '', email: '', password: '', confirmPassword: '' });

  /* ── Auto-clear Messages ── */
  useEffect(() => {
    if (!errorMessage && !successMessage) return;
    const t = setTimeout(() => { setErrorMessage(''); setSuccessMessage(''); }, 8000);
    return () => clearTimeout(t);
  }, [errorMessage, successMessage]);

  /* ── Base stats/metadata fetchers ── */
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

  /* ── Screen 4: Fetch Assets with search/filter params ── */
  const fetchAssets = useCallback(async (tk) => {
    try {
      let url = '/assets?';
      const params = [];
      if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
      if (filterCategory) params.push(`category=${filterCategory}`);
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (filterDepartment) params.push(`department=${filterDepartment}`);
      if (filterLocation) params.push(`location=${encodeURIComponent(filterLocation)}`);
      if (filterBookable && filterBookable !== 'all') params.push(`bookable=${filterBookable}`);
      url += params.join('&');

      const res = await apiFetch(url, tk || token);
      const data = await res.json();
      if (res.ok) setAssets(data);
    } catch (e) { console.error(e); }
  }, [token, searchQuery, filterCategory, filterStatus, filterDepartment, filterLocation, filterBookable]);

  /* ── Screen 5: Fetch Allocations & Transfers ── */
  const fetchAllocations = useCallback(async (tk) => {
    try {
      const res = await apiFetch('/allocations', tk || token);
      const data = await res.json();
      if (res.ok) setAllocations(data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchTransfers = useCallback(async (tk) => {
    try {
      const res = await apiFetch('/allocations/transfers', tk || token);
      const data = await res.json();
      if (res.ok) setTransfers(data);
    } catch (e) { console.error(e); }
  }, [token]);

  /* ── Screen 6: Fetch Resource Bookings ── */
  const fetchBookableAssets = useCallback(async (tk) => {
    try {
      const res = await apiFetch('/bookings/bookable', tk || token);
      const data = await res.json();
      if (res.ok) setBookableAssets(data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchAssetBookings = useCallback(async (assetId, tk) => {
    if (!assetId) return;
    try {
      const res = await apiFetch(`/bookings/asset/${assetId}`, tk || token);
      const data = await res.json();
      if (res.ok) setAssetBookings(data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchMyBookings = useCallback(async (tk) => {
    try {
      const res = await apiFetch('/bookings/mine', tk || token);
      const data = await res.json();
      if (res.ok) setMyBookings(data);
    } catch (e) { console.error(e); }
  }, [token]);

  /* ── Screen 7: Fetch Maintenance Requests ── */
  const fetchMaintenanceRequests = useCallback(async (tk) => {
    try {
      const res = await apiFetch('/maintenance', tk || token);
      const data = await res.json();
      if (res.ok) setMaintenanceRequests(data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchMyMaintenanceRequests = useCallback(async (tk) => {
    try {
      const res = await apiFetch('/maintenance/mine', tk || token);
      const data = await res.json();
      if (res.ok) setMyMaintenanceRequests(data);
    } catch (e) { console.error(e); }
  }, [token]);

  /* ── Trigger fetches on tab change ── */
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') {
      fetchStats(token);
    } else if (activeTab === 'assets') {
      fetchAssets(token);
    } else if (activeTab === 'allocation') {
      fetchAllocations(token);
      fetchTransfers(token);
    } else if (activeTab === 'booking') {
      fetchBookableAssets(token);
      fetchMyBookings(token);
    } else if (activeTab === 'maintenance') {
      fetchMaintenanceRequests(token);
      fetchMyMaintenanceRequests(token);
    }
  }, [activeTab, token, fetchStats, fetchAssets, fetchAllocations, fetchTransfers, fetchBookableAssets, fetchMyBookings, fetchMaintenanceRequests, fetchMyMaintenanceRequests]);

  /* ── Check local credentials on mount ── */
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

  /* ── Load metadata once logged in ── */
  useEffect(() => {
    if (!token) return;
    fetchStats(token);
    fetchDepartments(token);
    fetchCategories(token);
    fetchDirectory(token);
  }, [token, fetchStats, fetchDepartments, fetchCategories, fetchDirectory]);

  /* ── Logout Handler ── */
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
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        const u = { _id:data._id, name:data.name, email:data.email, role:data.role, department:data.department };
        setCurrentUser(u);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(u));
        setSuccessMessage('Welcome back!');
        setAuthForm({ name:'', email:'', password:'', confirmPassword:'' });
      } else setErrorMessage(data.message || 'Invalid credentials.');
    } catch { setErrorMessage('Cannot connect to server.'); }
    finally { setLoading(false); }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault(); setErrorMessage('');
    if (authForm.password !== authForm.confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name:authForm.name, email:authForm.email, password:authForm.password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        const u = { _id:data._id, name:data.name, email:data.email, role:data.role, department:data.department };
        setCurrentUser(u);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(u));
        setSuccessMessage('Account created successfully as Employee!');
        setAuthForm({ name:'', email:'', password:'', confirmPassword:'' });
      } else setErrorMessage(data.message || 'Registration failed.');
    } catch { setErrorMessage('Cannot connect to server.'); }
    finally { setLoading(false); }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault(); setErrorMessage(''); setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/forgot-password`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: authForm.email })
      });
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

  const addCustomField  = () => setCatForm(p => ({ ...p, customFields: [...p.customFields, { ...BLANK_FIELD }] }));
  const removeCustomField = (i) => setCatForm(p => ({ ...p, customFields: p.customFields.filter((_, idx) => idx !== i) }));
  const updateCustomField = (i, key, val) => setCatForm(p => {
    const fields = [...p.customFields];
    fields[i] = { ...fields[i], [key]: val };
    return { ...p, customFields: fields };
  });

  /* ── Directory Operations ── */
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

  /* ── Base64 conversion helper for photo/document uploads ── */
  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoUploadChange = async (e) => {
    const files = Array.from(e.target.files);
    const converted = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`File ${file.name} is too large. Max size is 5MB.`);
        continue;
      }
      try {
        const base64 = await convertBase64(file);
        converted.push(base64);
      } catch (err) { console.error(err); }
    }
    setRegisterAssetForm(p => ({ ...p, photos: [...p.photos, ...converted] }));
  };

  const handleDocUploadChange = async (e) => {
    const files = Array.from(e.target.files);
    const converted = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`File ${file.name} is too large. Max size is 5MB.`);
        continue;
      }
      try {
        const base64 = await convertBase64(file);
        converted.push({ name: file.name, data: base64 });
      } catch (err) { console.error(err); }
    }
    setRegisterAssetForm(p => ({ ...p, documents: [...p.documents, ...converted] }));
  };

  /* ── Screen 4: Register Asset ── */
  const handleRegisterAssetSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch('/assets', token, {
        method: 'POST',
        body: JSON.stringify(registerAssetForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Asset registered successfully.');
        setShowRegisterAssetModal(false);
        setRegisterAssetForm({
          name: '', serialNumber: '', category: '', status: 'Available', department: '',
          condition: 'Good', location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false,
          photos: [], documents: [], customFieldValues: {}
        });
        fetchAssets(token);
        fetchStats(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  /* ── Screen 4: Detail Drawer & History ── */
  const handleOpenAssetDrawer = async (asset) => {
    setSelectedAsset(asset);
    setActiveDrawerTab('details');
    // Fetch History
    try {
      const res = await apiFetch(`/assets/${asset._id}/history`, token);
      const data = await res.json();
      if (res.ok) {
        setAssetHistory(data);
      }
    } catch (e) { console.error(e); }
  };

  /* ── Screen 5: Allocate Asset ── */
  const handleAllocateSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage(''); setConflictError(null);
    try {
      const res = await apiFetch('/allocations', token, {
        method: 'POST',
        body: JSON.stringify(allocateForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setShowAllocateModal(false);
        setAllocateForm({ assetId:'', allocatedToUserId:'', departmentId:'', expectedReturnDate:'', notes:'' });
        fetchAllocations(token);
        fetchAssets(token);
        fetchStats(token);
      } else if (res.status === 409) {
        // Conflict
        setConflictError({
          message: data.message,
          currentHolder: data.currentHolder,
          canRequestTransfer: data.canRequestTransfer
        });
      } else {
        setErrorMessage(data.message || 'Allocation failed');
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleRequestTransfer = async () => {
    if (!allocateForm.assetId || !allocateForm.allocatedToUserId) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch('/allocations/transfer-request', token, {
        method: 'POST',
        body: JSON.stringify({
          assetId: allocateForm.assetId,
          toUserId: allocateForm.allocatedToUserId,
          comments: transferComment || 'Urgent project allocation transfer requested.'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Transfer request submitted successfully.');
        setShowAllocateModal(false);
        setConflictError(null);
        setTransferComment('');
        fetchTransfers(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault(); if (!returningAllocation) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch(`/allocations/${returningAllocation._id}/return`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          returnConditionNotes: returnForm.returnConditionNotes,
          condition: returnForm.condition
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Asset returned successfully.');
        setShowReturnModal(false);
        setReturningAllocation(null);
        setReturnForm({ returnConditionNotes: '', condition: 'Good' });
        fetchAllocations(token);
        fetchAssets(token);
        fetchStats(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleApproveTransfer = async (id) => {
    if (!window.confirm('Approve this asset transfer? The allocation will be reassigned immediately.')) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch(`/allocations/transfers/${id}/approve`, token, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Transfer completed.');
        fetchTransfers(token);
        fetchAllocations(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleRejectTransferClick = (t) => {
    setSelectedMaintRequest(t); // re-use this to hold target object
    setRejectReason('');
    setShowRejectMaintModal(true);
  };

  const handleRejectTransferSubmit = async (e) => {
    e.preventDefault(); if (!selectedMaintRequest) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch(`/allocations/transfers/${selectedMaintRequest._id}/reject`, token, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason: rejectReason })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Transfer request rejected.');
        setShowRejectMaintModal(false);
        setSelectedMaintRequest(null);
        fetchTransfers(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  /* ── Screen 6: Resource Bookings ── */
  const handleSelectBookableAsset = (asset) => {
    setSelectedBookableAsset(asset);
    fetchAssetBookings(asset._id, token);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault(); if (!selectedBookableAsset) return;
    setLoading(true); setErrorMessage('');
    const startTimeStr = `${bookingForm.startDate}T${bookingForm.startTime}:00`;
    const endTimeStr = `${bookingForm.startDate}T${bookingForm.endTime}:00`;
    try {
      const res = await apiFetch('/bookings', token, {
        method: 'POST',
        body: JSON.stringify({
          assetId: selectedBookableAsset._id,
          startTime: startTimeStr,
          endTime: endTimeStr,
          purpose: bookingForm.purpose
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Booking confirmed!');
        setShowBookingModal(false);
        setBookingForm({ startDate:'', startTime:'09:00', endDate:'', endTime:'10:00', purpose:'' });
        fetchAssetBookings(selectedBookableAsset._id, token);
        fetchMyBookings(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await apiFetch(`/bookings/${id}/cancel`, token, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Booking cancelled.');
        fetchMyBookings(token);
        if (selectedBookableAsset) fetchAssetBookings(selectedBookableAsset._id, token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
  };

  /* ── Screen 7: Maintenance Workflows ── */
  const handleRaiseMaintSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch('/maintenance', token, {
        method: 'POST',
        body: JSON.stringify(maintForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Maintenance request raised successfully.');
        setShowMaintModal(false);
        setMaintForm({ assetId: '', type: 'Repair', description: '', priority: 'Medium', photoUrl: '' });
        fetchMaintenanceRequests(token);
        fetchMyMaintenanceRequests(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleMaintPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Photo must be less than 5MB');
      return;
    }
    try {
      const base64 = await convertBase64(file);
      setMaintForm(p => ({ ...p, photoUrl: base64 }));
    } catch (err) { console.error(err); }
  };

  const handleApproveMaint = async (id) => {
    try {
      const res = await apiFetch(`/maintenance/${id}/approve`, token, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        fetchMaintenanceRequests(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
  };

  const handleOpenAssignTech = (reqObj) => {
    setSelectedMaintRequest(reqObj);
    setTechAssignForm({ technicianName: '', scheduledDate: '' });
    setShowAssignTechModal(true);
  };

  const handleAssignTechSubmit = async (e) => {
    e.preventDefault(); if (!selectedMaintRequest) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch(`/maintenance/${selectedMaintRequest._id}/assign`, token, {
        method: 'PATCH',
        body: JSON.stringify(techAssignForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Technician assigned successfully.');
        setShowAssignTechModal(false);
        setSelectedMaintRequest(null);
        fetchMaintenanceRequests(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleStartMaintWork = async (id) => {
    try {
      const res = await apiFetch(`/maintenance/${id}/start`, token, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Work started.');
        fetchMaintenanceRequests(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
  };

  const handleOpenResolveMaint = (reqObj) => {
    setSelectedMaintRequest(reqObj);
    setResolveMaintForm({ resolutionNotes: '', postRepairCondition: 'Good' });
    setShowResolveMaintModal(true);
  };

  const handleResolveMaintSubmit = async (e) => {
    e.preventDefault(); if (!selectedMaintRequest) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch(`/maintenance/${selectedMaintRequest._id}/resolve`, token, {
        method: 'PATCH',
        body: JSON.stringify(resolveMaintForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Maintenance request resolved. Asset is now Available.');
        setShowResolveMaintModal(false);
        setSelectedMaintRequest(null);
        fetchMaintenanceRequests(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  const handleOpenRejectMaint = (reqObj) => {
    setSelectedMaintRequest(reqObj);
    setRejectReason('');
    setShowRejectMaintModal(true);
  };

  const handleRejectMaintSubmit = async (e) => {
    e.preventDefault(); if (!selectedMaintRequest) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiFetch(`/maintenance/${selectedMaintRequest._id}/reject`, token, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason: rejectReason })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Maintenance request rejected.');
        setShowRejectMaintModal(false);
        setSelectedMaintRequest(null);
        fetchMaintenanceRequests(token);
      } else {
        setErrorMessage(data.message);
      }
    } catch { setErrorMessage('Network error.'); }
    finally { setLoading(false); }
  };

  /* ── Utilities ── */
  const getDaysOverdue = (d) => Math.ceil((new Date() - new Date(d)) / 86400000);
  const formatDate     = (d) => d ? new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : 'N/A';
  const getRoleBadgeClass = (role) => role ? role.toLowerCase().replace(/ /g, '-') : 'employee';
  const getStatusColorClass = (s) => s ? s.toLowerCase().replace(/ /g, '-') : 'available';

  /* ═══════════════════════════════════════════
     AUTH SCREEN (UNAUTHENTICATED)
  ═══════════════════════════════════════════ */
  if (!token || !currentUser) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container animate-fade-in">
          <div className="auth-logo">
            <h1 className="logo-text"><RefreshCw size={26} style={{ animationDuration:'3s' }} /> AssetFlow</h1>
          </div>

          {errorMessage   && <div className="error-banner"><AlertCircle size={16}/><span>{errorMessage}</span></div>}
          {successMessage && <div className="success-banner"><CheckCircle size={16}/><span>{successMessage}</span></div>}

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
  const isAdminOrManager = currentUser.role === 'Admin' || currentUser.role === 'Asset Manager';
  const isApprover = currentUser.role === 'Admin' || currentUser.role === 'Asset Manager' || currentUser.role === 'Department Head';

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
            <button className={`nav-item ${activeTab==='assets' ? 'active' : ''}`} onClick={()=>setActiveTab('assets')}>
              <Package size={18}/><span>Asset Directory</span>
            </button>
            {isApprover && (
              <button className={`nav-item ${activeTab==='allocation' ? 'active' : ''}`} onClick={()=>setActiveTab('allocation')}>
                <ArrowLeftRight size={18}/><span>Allocation & Transfers</span>
              </button>
            )}
            <button className={`nav-item ${activeTab==='booking' ? 'active' : ''}`} onClick={()=>setActiveTab('booking')}>
              <CalendarRange size={18}/><span>Resource Booking</span>
            </button>
            <button className={`nav-item ${activeTab==='maintenance' ? 'active' : ''}`} onClick={()=>setActiveTab('maintenance')}>
              <Wrench size={18}/><span>Maintenance</span>
            </button>
            <button className={`nav-item ${activeTab==='audit' ? 'active' : ''}`} onClick={()=>setActiveTab('audit')}>
              <ClipboardCheck size={18}/><span>Asset Audits</span>
            </button>
            {(currentUser.role === 'Admin' || currentUser.role === 'Asset Manager') && (
              <button className={`nav-item ${activeTab==='analytics' ? 'active' : ''}`} onClick={()=>setActiveTab('analytics')}>
                <BarChart2 size={18}/><span>Analytics & Reports</span>
              </button>
            )}
            {currentUser.role === 'Admin' && (
              <button className={`nav-item ${activeTab==='orgSetup' ? 'active' : ''}`} onClick={()=>setActiveTab('orgSetup')}>
                <Building2 size={18}/><span>Organization Setup</span>
              </button>
            )}
            <button 
  className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
  onClick={() => setActiveTab('assets')}
>
  <Package size={18} />
  <span>Asset Directory</span>
</button>
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
            <h1>
              {activeTab === 'dashboard' && 'Operational Snapshot'}
              {activeTab === 'assets' && 'Asset Directory'}
              {activeTab === 'allocation' && 'Asset Allocations & Transfers'}
              {activeTab === 'booking' && 'Resource Bookings'}
              {activeTab === 'maintenance' && 'Maintenance Center'}
              {activeTab === 'audit' && 'Asset Audits'}
              {activeTab === 'analytics' && 'Analytics & Reports'}
              {activeTab === 'orgSetup' && 'Organization Setup'}
            </h1>
            <p className="header-meta">Logged in as <strong style={{color:'var(--text-title)'}}>{currentUser.name}</strong> · {currentUser.role}</p>
          </div>
          <span style={{fontSize:'13px',color:'var(--text-muted)'}}>{new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'})}</span>
        </div>

        {errorMessage   && <div className="error-banner"><AlertCircle size={16}/><span>{errorMessage}</span></div>}
        {successMessage && <div className="success-banner"><CheckCircle size={16}/><span>{successMessage}</span></div>}

        {/* ══════════════ DASHBOARD ══════════════ */}
        {activeTab === 'dashboard' && (
          <>
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
                          <span>Tag: <code className="asset-tag">{asset.assetTag}</code></span>
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

            <div className="quick-actions-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="actions-grid">
                {isAdminOrManager ? (
                  <button className="action-tile" onClick={()=>{ setRegisterAssetForm({ name: '', serialNumber: '', category: '', status: 'Available', department: '', condition: 'Good', location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false, photos: [], documents: [], customFieldValues: {} }); setShowRegisterAssetModal(true); }}>
                    <div className="action-icon"><PlusCircle size={20}/></div>
                    <div className="action-info"><h4>Register Asset</h4><p>Add to inventory</p></div>
                  </button>
                ) : (
                  <div className="action-tile" style={{opacity:.45,cursor:'not-allowed'}}>
                    <div className="action-icon" style={{background:'#27272a',color:'#71717a'}}><PlusCircle size={20}/></div>
                    <div className="action-info"><h4>Register Asset</h4><p style={{color:'var(--color-overdue)'}}>Requires Manager+</p></div>
                  </div>
                )}
                <button className="action-tile" onClick={()=>{ setActiveTab('booking'); }}>
                  <div className="action-icon"><Bookmark size={20}/></div>
                  <div className="action-info"><h4>Book Resource</h4><p>Reserve room or slot</p></div>
                </button>
                <button className="action-tile" onClick={()=>{ setMaintForm({ assetId: '', type: 'Repair', description: '', priority: 'Medium', photoUrl: '' }); setShowMaintModal(true); }}>
                  <div className="action-icon"><Wrench size={20}/></div>
                  <div className="action-info"><h4>Raise Maintenance</h4><p>Report hardware issues</p></div>
                </button>
              </div>
            </div>

            <div className="data-panel">
              <h2 className="section-title">Upcoming Returns (Next 7 Days)</h2>
              {upcomingReturnsList.length === 0
                ? <p style={{fontSize:'14px',color:'var(--text-muted)'}}>No returns scheduled for the next 7 days.</p>
                : (
                  <div className="directory-table-container">
                    <table className="directory-table">
                      <thead><tr><th>Asset Tag</th><th>Name</th><th>Category</th><th>Holder</th><th>Expected Return</th></tr></thead>
                      <tbody>
                        {upcomingReturnsList.map(a => (
                          <tr key={a._id}>
                            <td><code className="asset-tag">{a.assetTag}</code></td>
                            <td style={{color:'var(--text-title)',fontWeight:600}}>{a.name}</td>
                            <td>{a.category?.name || '—'}</td>
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

        {/* ══════════════ ASSET DIRECTORY ══════════════ */}
        {activeTab === 'assets' && (
          <>
            <div className="search-bar">
              <div className="search-input-wrap">
                <Users size={16} style={{top:'50%'}}/>
                <input
                  type="text"
                  placeholder="Search by Asset Tag, Serial, Name, QR, or Location..."
                  value={searchQuery}
                  onChange={e=>setSearchQuery(e.target.value)}
                />
              </div>

              <select className="filter-select" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>

              <select className="filter-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"].map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select className="filter-select" value={filterDepartment} onChange={e=>setFilterDepartment(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
              </select>

              <select className="filter-select" value={filterBookable} onChange={e=>setFilterBookable(e.target.value)}>
                <option value="all">All Booking States</option>
                <option value="true">Shared / Bookable Only</option>
              </select>

              {isAdminOrManager && (
                <button className="btn-add" onClick={()=>{ setRegisterAssetForm({ name: '', serialNumber: '', category: '', status: 'Available', department: '', condition: 'Good', location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false, photos: [], documents: [], customFieldValues: {} }); setShowRegisterAssetModal(true); }}>
                  <PlusCircle size={15}/> Register Asset
                </button>
              )}
            </div>

            {assets.length === 0 ? (
              <div className="empty-state">
                <Package size={40}/>
                <p>No assets found matching filters.</p>
              </div>
            ) : (
              <div className="asset-grid">
                {assets.map(asset => (
                  <div className="asset-card animate-fade-in" key={asset._id} onClick={()=>handleOpenAssetDrawer(asset)}>
                    <div className="asset-card-top">
                      <code className="asset-tag">{asset.assetTag}</code>
                      <span className={`asset-status ${getStatusColorClass(asset.status)}`}>{asset.status}</span>
                    </div>
                    <h4 className="asset-card-name">{asset.name}</h4>
                    <div className="asset-card-meta">
                      <span><strong>Serial:</strong> {asset.serialNumber}</span>
                      <span><strong>Location:</strong> {asset.location || 'Storage'}</span>
                      {asset.category && <span><strong>Category:</strong> {asset.category.name}</span>}
                      {asset.currentHolder && <span><strong>Holder:</strong> {asset.currentHolder.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════ ALLOCATIONS & TRANSFERS ══════════════ */}
        {activeTab === 'allocation' && isApprover && (
          <>
            <div className="screen-tab-strip">
              <button className={`screen-tab ${orgTab==='departments' ? 'active' : ''}`} onClick={()=>setOrgTab('departments')}>Active Allocations</button>
              <button className={`screen-tab ${orgTab==='categories' ? 'active' : ''}`} onClick={()=>setOrgTab('categories')}>Transfer Requests</button>
            </div>

            {orgTab === 'departments' && (
              <div className="data-panel animate-fade-in">
                <div className="panel-header">
                  <h2>Active Allocations</h2>
                  {isAdminOrManager && (
                    <button className="btn-add" onClick={()=>{ setAllocateForm({ assetId:'', allocatedToUserId:'', departmentId:'', expectedReturnDate:'', notes:'' }); setConflictError(null); setShowAllocateModal(true); }}><PlusCircle size={15}/> Allocate Asset</button>
                  )}
                </div>

                <div className="directory-table-container">
                  <table className="directory-table">
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Asset Name</th>
                        <th>Allocated To</th>
                        <th>Department</th>
                        <th>Start Date</th>
                        <th>Expected Return</th>
                        <th>Status</th>
                        {isAdminOrManager && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map(a => {
                        const isOverdue = a.isOverdue || (a.status === 'Active' && a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date());
                        return (
                          <tr key={a._id} className={isOverdue ? 'overdue-row' : ''}>
                            <td><code className="asset-tag">{a.asset?.assetTag}</code></td>
                            <td style={{fontWeight:600}}>{a.asset?.name}</td>
                            <td>{a.allocatedTo?.name}</td>
                            <td>{a.department?.name || 'General'}</td>
                            <td>{formatDate(a.startDate)}</td>
                            <td>{a.expectedReturnDate ? formatDate(a.expectedReturnDate) : 'Indefinite'}</td>
                            <td>
                              <span className={`asset-status ${isOverdue ? 'lost' : getStatusColorClass(a.status)}`}>
                                {isOverdue ? 'Overdue' : a.status}
                              </span>
                            </td>
                            {isAdminOrManager && (
                              <td>
                                {(a.status === 'Active' || a.status === 'Overdue') && (
                                  <button className="icon-btn" onClick={()=>{ setReturningAllocation(a); setReturnForm({ returnConditionNotes:'', condition: a.asset?.condition || 'Good' }); setShowReturnModal(true); }}>
                                    Return Asset
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {orgTab === 'categories' && (
              <div className="data-panel animate-fade-in">
                <div className="panel-header">
                  <h2>Pending Transfer Requests</h2>
                </div>

                <div className="directory-table-container">
                  <table className="directory-table">
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Asset</th>
                        <th>From User</th>
                        <th>To User</th>
                        <th>Requested By</th>
                        <th>Comments</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map(t => (
                        <tr key={t._id}>
                          <td><code className="asset-tag">{t.asset?.assetTag}</code></td>
                          <td style={{fontWeight:600}}>{t.asset?.name}</td>
                          <td>{t.fromUser?.name}</td>
                          <td>{t.toUser?.name}</td>
                          <td>{t.requestedBy?.name}</td>
                          <td style={{maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.comments || '—'}</td>
                          <td>
                            <span className={`asset-status ${getStatusColorClass(t.status)}`}>{t.status}</span>
                          </td>
                          <td>
                            {t.status === 'Requested' ? (
                              <div className="table-actions">
                                <button className="icon-btn" onClick={()=>handleApproveTransfer(t._id)}><Check size={13}/> Approve</button>
                                <button className="icon-btn danger" onClick={()=>handleRejectTransferClick(t)}><X size={13}/> Reject</button>
                              </div>
                            ) : (
                              <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{t.approvedBy ? `By ${t.approvedBy.name}` : 'Processed'}</span>
                            )}
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

        {/* ══════════════ RESOURCE BOOKINGS ══════════════ */}
        {activeTab === 'booking' && (
          <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'20px'}} className="animate-fade-in">
            {/* Left list of bookable resources */}
            <div className="data-panel" style={{margin:0,padding:'16px'}}>
              <h3 style={{fontSize:'14px',marginBottom:'12px',fontWeight:600,color:'var(--text-title)'}}>Shared Resources</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {bookableAssets.map(ba => (
                  <button
                    key={ba._id}
                    className={`bookable-card ${selectedBookableAsset?._id === ba._id ? 'selected' : ''}`}
                    onClick={()=>handleSelectBookableAsset(ba)}
                  >
                    <h4>{ba.name}</h4>
                    <p>{ba.location || 'No Location'} · Cap: {ba.customFieldValues?.capacity || '—'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right scheduler view */}
            <div className="data-panel" style={{margin:0}}>
              {selectedBookableAsset ? (
                <>
                  <div className="panel-header">
                    <div>
                      <h2>{selectedBookableAsset.name} Booking Schedule</h2>
                      <p style={{fontSize:'13px',color:'var(--text-muted)',marginTop:'4px'}}>{selectedBookableAsset.location}</p>
                    </div>
                    <button className="btn-add" onClick={()=>setShowBookingModal(true)}><CalendarDays size={15}/> Book Time Slot</button>
                  </div>

                  <div className="timeline-header">
                    {/* Render next 7 days starting from today */}
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const day = new Date();
                      day.setDate(day.getDate() + idx);
                      const formattedDay = day.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
                      const dayString = day.toISOString().split('T')[0];

                      const dayBookings = assetBookings.filter(b => b.startTime.startsWith(dayString));

                      return (
                        <div className="timeline-day-card" key={idx}>
                          <h4>{formattedDay}</h4>
                          {dayBookings.length === 0 ? (
                            <p style={{fontSize:'12px',color:'var(--text-muted)'}}>No slots reserved</p>
                          ) : (
                            dayBookings.map(db => (
                              <div key={db._id} className="timeline-slot">
                                <strong>{new Date(db.startTime).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})} - {new Date(db.endTime).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</strong>
                                <div style={{fontSize:'11px',opacity:0.9}}>{db.purpose}</div>
                                <div style={{fontSize:'10px',opacity:0.7,marginTop:'2px'}}>By: {db.bookedBy?.name}</div>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{marginTop:'30px'}}>
                    <h3>My Bookings</h3>
                    <div className="directory-table-container" style={{marginTop:'10px'}}>
                      <table className="directory-table">
                        <thead>
                          <tr>
                            <th>Resource</th>
                            <th>Date / Time</th>
                            <th>Purpose</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myBookings.map(mb => (
                            <tr key={mb._id}>
                              <td style={{fontWeight:600}}>{mb.asset?.name}</td>
                              <td>{formatDate(mb.startTime)} · {new Date(mb.startTime).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})} - {new Date(mb.endTime).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</td>
                              <td>{mb.purpose}</td>
                              <td><span className={`asset-status ${getStatusColorClass(mb.status)}`}>{mb.status}</span></td>
                              <td>
                                {mb.status === 'Upcoming' && (
                                  <button className="icon-btn danger" onClick={()=>handleCancelBooking(mb._id)}><X size={12}/> Cancel</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{padding:'80px 20px'}}>
                  <CalendarRange size={50}/>
                  <p>Select a bookable resource from the left to view timeline & bookings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ MAINTENANCE CENTER ══════════════ */}
        {activeTab === 'maintenance' && (
          <>
            <div className="screen-tab-strip">
              <button className={`screen-tab ${orgTab==='departments' ? 'active' : ''}`} onClick={()=>setOrgTab('departments')}>
                {isAdminOrManager ? 'All Maintenance Requests' : 'My Requests'}
              </button>
            </div>

            <div style={{marginBottom:'16px',textAlign:'right'}}>
              <button className="btn-add" onClick={()=>{ setMaintForm({ assetId: '', type: 'Repair', description: '', priority: 'Medium', photoUrl: '' }); setShowMaintModal(true); }}><Wrench size={15}/> Raise Maintenance Request</button>
            </div>

            {/* Request Card Grid */}
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}} className="animate-fade-in">
              {(isAdminOrManager ? maintenanceRequests : myMaintenanceRequests).map(req => {
                const stepNames = ["Pending", "Approved", "Technician Assigned", "In Progress", "Resolved"];
                const currentStepIdx = stepNames.indexOf(req.status);

                return (
                  <div className="maint-card" key={req._id}>
                    <div className="maint-card-header">
                      <div>
                        <h4 style={{fontSize:'15px',fontWeight:600,color:'var(--text-title)'}}>{req.asset?.name} <code className="asset-tag">{req.asset?.assetTag}</code></h4>
                        <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'4px'}}>Requested By: {req.requestedBy?.name} · Priority: <span className={`priority-badge ${req.priority.toLowerCase()}`}>{req.priority}</span></p>
                      </div>
                      <span className={`asset-status ${getStatusColorClass(req.status)}`}>{req.status}</span>
                    </div>

                    <div style={{fontSize:'13px',color:'var(--text-body)',marginBottom:'14px'}}>
                      <strong>Issue:</strong> {req.description}
                      {req.photoUrl && (
                        <div style={{marginTop:'10px'}}>
                          <img src={req.photoUrl} alt="issue" style={{maxWidth:'100px',borderRadius:'8px',border:'1px solid var(--border-color)'}}/>
                        </div>
                      )}
                    </div>

                    {/* Stepper Workflow tracker */}
                    {req.status !== 'Rejected' && (
                      <div className="workflow-stepper">
                        {stepNames.map((step, idx) => (
                          <div key={idx} className={`step ${idx < currentStepIdx ? 'done' : ''} ${idx === currentStepIdx ? 'active' : ''}`}>
                            <div className="step-circle">{idx + 1}</div>
                            <span className="step-label">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {req.status === 'Rejected' && (
                      <div style={{fontSize:'12px',background:'rgba(239,68,68,0.08)',padding:'10px 14px',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.2)',color:'#fca5a5'}}>
                        <strong>Rejected:</strong> {req.rejectionReason || 'No reason provided.'}
                      </div>
                    )}

                    {req.status === 'Resolved' && req.resolutionNotes && (
                      <div style={{fontSize:'12px',background:'rgba(16,185,129,0.08)',padding:'10px 14px',borderRadius:'8px',border:'1px solid rgba(16,185,129,0.2)',color:'#a7f3d0',marginTop:'8px'}}>
                        <strong>Resolution notes:</strong> {req.resolutionNotes}
                      </div>
                    )}

                    {isAdminOrManager && (
                      <div className="maint-card-actions">
                        {req.status === 'Pending' && (
                          <>
                            <button className="icon-btn" onClick={()=>handleApproveMaint(req._id)}><Check size={12}/> Approve</button>
                            <button className="icon-btn danger" onClick={()=>handleOpenRejectMaint(req)}><X size={12}/> Reject</button>
                          </>
                        )}
                        {req.status === 'Approved' && (
                          <button className="icon-btn" onClick={()=>handleOpenAssignTech(req)}>Assign Technician</button>
                        )}
                        {req.status === 'Technician Assigned' && (
                          <button className="icon-btn" onClick={()=>handleStartMaintWork(req._id)}>Start Work</button>
                        )}
                        {req.status === 'In Progress' && (
                          <button className="icon-btn" onClick={()=>handleOpenResolveMaint(req)}>Mark Resolved</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══════════════ ORGANIZATION SETUP ══════════════ */}
        {activeTab === 'orgSetup' && currentUser.role === 'Admin' && (
          <>
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

            {/* TAB A: DEPARTMENT MANAGEMENT */}
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
                              <button className={`status-badge ${d.status.toLowerCase()}`} onClick={()=>handleDeptStatusToggle(d)}>{d.status}</button>
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

            {/* TAB B: ASSET CATEGORY MANAGEMENT */}
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

            {/* TAB C: EMPLOYEE DIRECTORY */}
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
        {activeTab === 'assets' && (
          <AssetDirectory allAssets={allAssets} />
        )}
        {activeTab === 'audit' && (
          <AssetAudit 
            token={token} 
            currentUser={currentUser} 
            departments={departments}
            directoryUsers={directoryUsers} 
          />
        )}
        {activeTab === 'analytics' && (
          <AssetAnalytics token={token} />
        )}
      </main>

      {/* ══════════ DETAIL DRAWER ══════════ */}
      {selectedAsset && (
        <div className="drawer-overlay" onClick={()=>setSelectedAsset(null)}>
          <div className="detail-drawer" onClick={e=>e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>{selectedAsset.name}</h2>
                <code className="asset-tag" style={{marginTop:'4px'}}>{selectedAsset.assetTag}</code>
              </div>
              <button className="close-btn" onClick={()=>setSelectedAsset(null)}><X size={18}/></button>
            </div>

            <div className="drawer-tabs">
              <button className={`drawer-tab ${activeDrawerTab === 'details' ? 'active' : ''}`} onClick={()=>setActiveDrawerTab('details')}>Details</button>
              <button className={`drawer-tab ${activeDrawerTab === 'history' ? 'active' : ''}`} onClick={()=>setActiveDrawerTab('history')}>History Timeline</button>
            </div>

            <div className="drawer-body">
              {activeDrawerTab === 'details' ? (
                <div className="drawer-section">
                  <div className="detail-grid">
                    <div className="detail-item"><label>Serial Number</label><span>{selectedAsset.serialNumber}</span></div>
                    <div className="detail-item"><label>Status</label><span className={`asset-status ${getStatusColorClass(selectedAsset.status)}`}>{selectedAsset.status}</span></div>
                    <div className="detail-item"><label>Category</label><span>{selectedAsset.category?.name || '—'}</span></div>
                    <div className="detail-item"><label>Location</label><span>{selectedAsset.location || 'General Storage'}</span></div>
                    <div className="detail-item"><label>Condition</label><span>{selectedAsset.condition}</span></div>
                    <div className="detail-item"><label>Bookable</label><span>{selectedAsset.isBookable ? 'Yes (Shared Resource)' : 'No (Direct Assignment)'}</span></div>
                    <div className="detail-item"><label>Acquisition Cost</label><span>{selectedAsset.acquisitionCost ? `$${selectedAsset.acquisitionCost}` : '—'}</span></div>
                    <div className="detail-item"><label>Acquisition Date</label><span>{formatDate(selectedAsset.acquisitionDate)}</span></div>
                  </div>

                  {/* Render category specific fields */}
                  {selectedAsset.category?.customFields?.length > 0 && (
                    <div style={{marginTop:'24px',borderTop:'1px solid var(--border-color)',paddingTop:'18px'}}>
                      <h3 style={{fontSize:'12px',color:'var(--text-muted)',textTransform:'uppercase',marginBottom:'8px'}}>Category Parameters</h3>
                      <div className="detail-grid">
                        {selectedAsset.category.customFields.map((cf, i) => {
                          const val = selectedAsset.customFieldValues ? selectedAsset.customFieldValues[cf.fieldName] : null;
                          return (
                            <div className="detail-item" key={i}>
                              <label>{cf.fieldName}</label>
                              <span>{val !== null && val !== undefined ? String(val) : '—'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Render photos/documents */}
                  {selectedAsset.photos?.length > 0 && (
                    <div style={{marginTop:'24px',borderTop:'1px solid var(--border-color)',paddingTop:'18px'}}>
                      <h3 style={{fontSize:'12px',color:'var(--text-muted)',textTransform:'uppercase',marginBottom:'8px'}}>Photos</h3>
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        {selectedAsset.photos.map((p,i)=>(
                          <img key={i} src={p} alt="asset" style={{width:'80px',height:'80px',objectFit:'cover',borderRadius:'8px',border:'1px solid var(--border-color)'}}/>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAsset.documents?.length > 0 && (
                    <div style={{marginTop:'24px',borderTop:'1px solid var(--border-color)',paddingTop:'18px'}}>
                      <h3 style={{fontSize:'12px',color:'var(--text-muted)',textTransform:'uppercase',marginBottom:'8px'}}>Attachments</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                        {selectedAsset.documents.map((d,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px'}}>
                            <FileText size={16} style={{color:'var(--text-muted)'}}/>
                            <span style={{color:'var(--text-body)',textDecoration:'underline',cursor:'pointer'}} onClick={()=>{
                              const link = document.createElement('a');
                              link.href = d.data;
                              link.download = d.name;
                              link.click();
                            }}>{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 style={{fontSize:'12px',color:'var(--text-muted)',textTransform:'uppercase',marginBottom:'12px'}}>Allocation History</h3>
                  {assetHistory.allocationHistory?.length === 0 ? (
                    <p style={{fontSize:'13px',color:'var(--text-muted)'}}>No allocations logged</p>
                  ) : (
                    assetHistory.allocationHistory?.map((ah, i) => (
                      <div className="history-item" key={i}>
                        <div className="history-dot" style={{background:'#6366f1'}}/>
                        <div className="history-content">
                          <p>Allocated to <strong>{ah.allocatedTo?.name}</strong> by {ah.allocatedBy?.name}</p>
                          <span>{formatDate(ah.startDate)} - {ah.returnedAt ? formatDate(ah.returnedAt) : 'Present'}</span>
                          {ah.returnConditionNotes && <div style={{fontSize:'11px',marginTop:'4px',opacity:0.8}}>Notes: {ah.returnConditionNotes}</div>}
                        </div>
                      </div>
                    ))
                  )}

                  <h3 style={{fontSize:'12px',color:'var(--text-muted)',textTransform:'uppercase',marginTop:'24px',marginBottom:'12px'}}>Maintenance Log</h3>
                  {assetHistory.maintenanceHistory?.length === 0 ? (
                    <p style={{fontSize:'13px',color:'var(--text-muted)'}}>No maintenance logged</p>
                  ) : (
                    assetHistory.maintenanceHistory?.map((mh, i) => (
                      <div className="history-item" key={i}>
                        <div className="history-dot" style={{background:'#fb923c'}}/>
                        <div className="history-content">
                          <p><strong>{mh.type}</strong> - {mh.description}</p>
                          <span style={{display:'block'}}>Priority: {mh.priority} · Status: {mh.status}</span>
                          {mh.resolutionNotes && <span style={{display:'block',marginTop:'4px'}}>Resolution: {mh.resolutionNotes}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ REGISTER ASSET MODAL ══════════ */}
      {showRegisterAssetModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'580px',maxHeight:'90vh',overflowY:'auto'}}>
            <div className="modal-header">
              <h2>Register New Asset</h2>
              <button className="close-btn" onClick={()=>setShowRegisterAssetModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleRegisterAssetSubmit}>
              <div className="form-group">
                <label>Asset Name *</label>
                <input type="text" required placeholder="e.g. MacBook Pro M3" value={registerAssetForm.name} onChange={e=>setRegisterAssetForm({...registerAssetForm,name:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Serial Number *</label>
                <input type="text" required placeholder="e.g. SN-XYZ-9082" value={registerAssetForm.serialNumber} onChange={e=>setRegisterAssetForm({...registerAssetForm,serialNumber:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={registerAssetForm.category} onChange={e=>{
                  const catId = e.target.value;
                  setRegisterAssetForm({...registerAssetForm,category:catId,customFieldValues:{}});
                }} style={{width:'100%'}}>
                  <option value="">— Select Category —</option>
                  {categories.filter(c=>c.status==='Active').map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              {/* Category parameter renderer */}
              {(() => {
                const selectedCatObj = categories.find(c => c._id === registerAssetForm.category);
                if (selectedCatObj?.customFields?.length > 0) {
                  return (
                    <div style={{background:'rgba(15,23,42,0.3)',padding:'12px',borderRadius:'8px',marginBottom:'16px'}}>
                      <h4 style={{fontSize:'12px',fontWeight:600,color:'var(--text-title)',marginBottom:'8px'}}>Category Settings</h4>
                      {selectedCatObj.customFields.map((cf, i) => (
                        <div className="form-group" key={i}>
                          <label>{cf.fieldName} {cf.required ? '*' : ''}</label>
                          {cf.fieldType === 'boolean' ? (
                            <select required={cf.required} value={registerAssetForm.customFieldValues[cf.fieldName] || 'false'} onChange={e=>setRegisterAssetForm({
                              ...registerAssetForm,
                              customFieldValues: { ...registerAssetForm.customFieldValues, [cf.fieldName]: e.target.value === 'true' }
                            })} style={{width:'100%'}}>
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                          ) : (
                            <input
                              type={cf.fieldType === 'number' ? 'number' : cf.fieldType === 'date' ? 'date' : 'text'}
                              required={cf.required}
                              placeholder={cf.fieldName}
                              value={registerAssetForm.customFieldValues[cf.fieldName] || ''}
                              onChange={e=>setRegisterAssetForm({
                                ...registerAssetForm,
                                customFieldValues: { ...registerAssetForm.customFieldValues, [cf.fieldName]: cf.fieldType === 'number' ? Number(e.target.value) : e.target.value }
                              })}
                              style={{width:'100%'}}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

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
                  {["Excellent", "Good", "Fair", "Damaged"].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input type="text" placeholder="e.g. IT Storage Room" value={registerAssetForm.location} onChange={e=>setRegisterAssetForm({...registerAssetForm,location:e.target.value})} style={{width:'100%'}}/>
              </div>

              <div className="detail-grid">
                <div className="form-group">
                  <label>Acquisition Cost</label>
                  <input type="number" placeholder="$" value={registerAssetForm.acquisitionCost} onChange={e=>setRegisterAssetForm({...registerAssetForm,acquisitionCost:Number(e.target.value)})} style={{width:'100%'}}/>
                </div>
                <div className="form-group">
                  <label>Acquisition Date</label>
                  <input type="date" value={registerAssetForm.acquisitionDate} onChange={e=>setRegisterAssetForm({...registerAssetForm,acquisitionDate:e.target.value})} style={{width:'100%'}}/>
                </div>
              </div>

              <div className="form-group">
                <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
                  <input type="checkbox" checked={registerAssetForm.isBookable} onChange={e=>setRegisterAssetForm({...registerAssetForm,isBookable:e.target.checked})} style={{width:'auto',margin:0}}/>
                  Mark as shared/bookable resource (available in Booking screen)
                </label>
              </div>

              {/* Photo & Document uploading zone */}
              <div className="form-group">
                <label>Photos</label>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUploadChange}/>
                <div className="upload-preview">
                  {registerAssetForm.photos.map((p,i)=><img key={i} src={p} alt="upload"/>)}
                </div>
              </div>

              <div className="form-group">
                <label>Attachments (Documents)</label>
                <input type="file" multiple onChange={handleDocUploadChange}/>
                <div style={{marginTop:'6px'}}>
                  {registerAssetForm.documents.map((d,i)=>(
                    <div key={i} style={{fontSize:'12px',color:'var(--text-muted)'}}>{d.name}</div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowRegisterAssetModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Register Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ ALLOCATE ASSET MODAL ══════════ */}
      {showAllocateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'520px'}}>
            <div className="modal-header">
              <h2>Allocate Asset</h2>
              <button className="close-btn" onClick={()=>setShowAllocateModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleAllocateSubmit}>
              <div className="form-group">
                <label>Select Asset *</label>
                <select required value={allocateForm.assetId} onChange={e=>{
                  setAllocateForm({...allocateForm,assetId:e.target.value});
                  setConflictError(null);
                }} style={{width:'100%'}}>
                  <option value="">— Select Asset —</option>
                  {allAssets.map(a=>(
                    <option key={a._id} value={a._id}>{a.name} [{a.assetTag}] · {a.status}</option>
                  ))}
                </select>
              </div>

              {conflictError && (
                <div className="form-group">
                  <div className="conflict-alert">
                    <div>
                      <strong>Conflict:</strong> This asset is currently occupied.
                    </div>
                    {conflictError.currentHolder && (
                      <div style={{fontSize:'12px',opacity:0.9}}>
                        Held by: {conflictError.currentHolder.name} ({conflictError.currentHolder.email})
                      </div>
                    )}
                    {conflictError.canRequestTransfer && (
                      <div style={{marginTop:'8px'}}>
                        <label>Transfer Reason / Comment</label>
                        <input
                          type="text"
                          placeholder="e.g. Urgently needed for production release..."
                          value={transferComment}
                          onChange={e=>setTransferComment(e.target.value)}
                          style={{width:'100%',background:'rgba(0,0,0,0.2)',borderColor:'rgba(239,68,68,0.2)',color:'white',marginTop:'4px'}}
                        />
                        <button type="button" className="btn-primary" onClick={handleRequestTransfer} style={{marginTop:'10px',background:'#ef4444',borderColor:'#ef4444',width:'100%'}}>
                          Request Transfer Instead
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Allocate To User *</label>
                <select required value={allocateForm.allocatedToUserId} onChange={e=>setAllocateForm({...allocateForm,allocatedToUserId:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Select User —</option>
                  {directoryUsers.filter(u=>u.status==='Active').map(u=>(
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select value={allocateForm.departmentId} onChange={e=>setAllocateForm({...allocateForm,departmentId:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Select Department —</option>
                  {departments.filter(d=>d.status==='Active').map(d=>(
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Expected Return Date <span style={{color:'var(--text-muted)',fontSize:'12px'}}>(optional)</span></label>
                <input type="date" value={allocateForm.expectedReturnDate} onChange={e=>setAllocateForm({...allocateForm,expectedReturnDate:e.target.value})} style={{width:'100%'}}/>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea rows="2" placeholder="Allocation comments..." value={allocateForm.notes} onChange={e=>setAllocateForm({...allocateForm,notes:e.target.value})} style={{width:'100%'}}/>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowAllocateModal(false)}>Cancel</button>
                <button type="submit" disabled={loading || !!conflictError} className="btn-primary">{loading ? 'Allocating…' : 'Allocate Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ RETURN ASSET MODAL ══════════ */}
      {showReturnModal && returningAllocation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'500px'}}>
            <div className="modal-header">
              <h2>Confirm Return of Asset</h2>
              <button className="close-btn" onClick={()=>setShowReturnModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleReturnSubmit}>
              <p style={{fontSize:'14px',color:'var(--text-body)',marginBottom:'16px'}}>
                You are marking the asset <strong>{returningAllocation.asset?.name}</strong> [{returningAllocation.asset?.assetTag}] as returned.
              </p>
              <div className="form-group">
                <label>Asset Condition on check-in</label>
                <select value={returnForm.condition} onChange={e=>setReturnForm({...returnForm,condition:e.target.value})} style={{width:'100%'}}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className="form-group">
                <label>Condition Check-in Notes</label>
                <textarea rows="3" placeholder="Condition details, scratches, missing components..." value={returnForm.returnConditionNotes} onChange={e=>setReturnForm({...returnForm,returnConditionNotes:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowReturnModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Processing…' : 'Confirm Return'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ BOOK RESOURCE MODAL ══════════ */}
      {showBookingModal && selectedBookableAsset && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'500px'}}>
            <div className="modal-header">
              <h2>Book {selectedBookableAsset.name}</h2>
              <button className="close-btn" onClick={()=>setShowBookingModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Booking Date *</label>
                <input type="date" required value={bookingForm.startDate} onChange={e=>setBookingForm({...bookingForm,startDate:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="detail-grid">
                <div className="form-group">
                  <label>Start Time *</label>
                  <select value={bookingForm.startTime} onChange={e=>setBookingForm({...bookingForm,startTime:e.target.value})} style={{width:'100%'}}>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const hourStr = String(h).padStart(2, '0');
                      return (
                        <optgroup key={h} label={`${hourStr}:00`}>
                          <option value={`${hourStr}:00`}>{hourStr}:00</option>
                          <option value={`${hourStr}:30`}>{hourStr}:30</option>
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <select value={bookingForm.endTime} onChange={e=>setBookingForm({...bookingForm,endTime:e.target.value})} style={{width:'100%'}}>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const hourStr = String(h).padStart(2, '0');
                      return (
                        <optgroup key={h} label={`${hourStr}:00`}>
                          <option value={`${hourStr}:00`}>{hourStr}:00</option>
                          <option value={`${hourStr}:30`}>{hourStr}:30</option>
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Purpose *</label>
                <textarea required rows="2" placeholder="e.g. Design review with product team" value={bookingForm.purpose} onChange={e=>setBookingForm({...bookingForm,purpose:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowBookingModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Reserving…' : 'Reserve Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ DEPT MODAL ══════════ */}
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

      {/* ══════════ RAISE MAINTENANCE MODAL ══════════ */}
      {showMaintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'500px'}}>
            <div className="modal-header">
              <h2>Raise Maintenance Request</h2>
              <button className="close-btn" onClick={()=>setShowMaintModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleRaiseMaintSubmit}>
              <div className="form-group">
                <label>Select Asset *</label>
                <select required value={maintForm.assetId} onChange={e=>setMaintForm({...maintForm,assetId:e.target.value})} style={{width:'100%'}}>
                  <option value="">— Choose Asset —</option>
                  {allAssets.map(a=>(
                    <option key={a._id} value={a._id}>{a.name} [{a.assetTag}]</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select value={maintForm.type} onChange={e=>setMaintForm({...maintForm,type:e.target.value})} style={{width:'100%'}}>
                  <option value="Repair">Repair</option>
                  <option value="Routine">Routine</option>
                  <option value="Upgrade">Upgrade</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select value={maintForm.priority} onChange={e=>setMaintForm({...maintForm,priority:e.target.value})} style={{width:'100%'}}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description of Issue *</label>
                <textarea required rows="3" placeholder="Describe the fault or service needed..." value={maintForm.description} onChange={e=>setMaintForm({...maintForm,description:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Attach Photo of Fault</label>
                <input type="file" accept="image/*" onChange={handleMaintPhotoUpload}/>
                {maintForm.photoUrl && (
                  <div style={{marginTop:'8px'}}>
                    <img src={maintForm.photoUrl} alt="upload fault" style={{maxWidth:'100px',borderRadius:'8px'}}/>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowMaintModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Raising…' : 'Raise Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ ASSIGN TECHNICIAN MODAL ══════════ */}
      {showAssignTechModal && selectedMaintRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'480px'}}>
            <div className="modal-header">
              <h2>Assign Technician</h2>
              <button className="close-btn" onClick={()=>setShowAssignTechModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleAssignTechSubmit}>
              <div className="form-group">
                <label>Technician Name *</label>
                <input type="text" required placeholder="e.g. John Repairer" value={techAssignForm.technicianName} onChange={e=>setTechAssignForm({...techAssignForm,technicianName:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Scheduled Service Date</label>
                <input type="date" value={techAssignForm.scheduledDate} onChange={e=>setTechAssignForm({...techAssignForm,scheduledDate:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowAssignTechModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Assigning…' : 'Assign & Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ RESOLVE MAINTENANCE MODAL ══════════ */}
      {showResolveMaintModal && selectedMaintRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'480px'}}>
            <div className="modal-header">
              <h2>Resolve Maintenance Work</h2>
              <button className="close-btn" onClick={()=>setShowResolveMaintModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleResolveMaintSubmit}>
              <div className="form-group">
                <label>Resolution / Repairs Made *</label>
                <textarea required rows="3" placeholder="Explain what was fixed..." value={resolveMaintForm.resolutionNotes} onChange={e=>setResolveMaintForm({...resolveMaintForm,resolutionNotes:e.target.value})} style={{width:'100%'}}/>
              </div>
              <div className="form-group">
                <label>Post-Repair Asset Condition</label>
                <select value={resolveMaintForm.postRepairCondition} onChange={e=>setResolveMaintForm({...resolveMaintForm,postRepairCondition:e.target.value})} style={{width:'100%'}}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowResolveMaintModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Resolving…' : 'Mark Resolved'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ REJECT MODAL (Maint & Transfers) ══════════ */}
      {showRejectMaintModal && selectedMaintRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'460px'}}>
            <div className="modal-header">
              <h2>Reject Request</h2>
              <button className="close-btn" onClick={()=>setShowRejectMaintModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={selectedMaintRequest.assetTag ? handleRejectTransferSubmit : handleRejectMaintSubmit}>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea required rows="3" placeholder="Provide a reason for rejection..." value={rejectReason} onChange={e=>setRejectReason(e.target.value)} style={{width:'100%'}}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowRejectMaintModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{background:'#ef4444',borderColor:'#ef4444'}}>{loading ? 'Rejecting…' : 'Reject Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
