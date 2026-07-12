import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck, Search, PlusCircle, CheckCircle, AlertTriangle, XCircle, FileText, Lock, ChevronLeft, ArrowRight
} from 'lucide-react';

const API_BASE = "http://localhost:5000/api";

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API_BASE}${url}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

export default function AssetAudit({ token, currentUser, departments, directoryUsers }) {
  const [activeView, setActiveView] = useState('list'); // list | detail | report
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [discrepancyReport, setDiscrepancyReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    scopeType: 'department',
    scopeDepartment: '',
    scopeLocation: '',
    startDate: '',
    endDate: '',
    auditors: []
  });

  const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Asset Manager';

  // --- Fetchers ---
  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isAdminOrManager ? '/audits' : '/audits/mine';
      const res = await apiFetch(endpoint, token);
      const data = await res.json();
      if (res.ok) setCycles(data);
      else setErrorMsg(data.message || 'Failed to load audit cycles');
    } catch (err) {
      setErrorMsg('Network error');
    }
    setLoading(false);
  }, [token, isAdminOrManager]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  // --- Handlers ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');
    try {
      const res = await apiFetch('/audits', token, {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setShowCreateModal(false);
        setCreateForm({ name: '', scopeType: 'department', scopeDepartment: '', scopeLocation: '', startDate: '', endDate: '', auditors: [] });
        fetchCycles();
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const loadCycleDetail = async (id) => {
    setLoading(true); setErrorMsg('');
    try {
      const res = await apiFetch(`/audits/${id}`, token);
      const data = await res.json();
      if (res.ok) {
        setSelectedCycle(data.cycle);
        setAuditItems(data.items);
        setActiveView('detail');
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const markItem = async (itemId, status, notes = '') => {
    try {
      const res = await apiFetch(`/audits/items/${itemId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        // Refresh detail
        if (selectedCycle) loadCycleDetail(selectedCycle._id);
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg('Network error.');
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Mark this audit cycle as Completed?')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/audits/${selectedCycle._id}/complete`, token, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadCycleDetail(selectedCycle._id);
        fetchCycles();
      } else setErrorMsg(data.message);
    } catch { setErrorMsg('Network error.'); }
    finally { setLoading(false); }
  };

  const handleClose = async () => {
    if (!window.confirm('Close and lock this audit? This updates asset statuses (Lost/Maintenance) based on discrepancies!')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/audits/${selectedCycle._id}/close`, token, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadCycleDetail(selectedCycle._id);
        fetchCycles();
      } else setErrorMsg(data.message);
    } catch { setErrorMsg('Network error.'); }
    finally { setLoading(false); }
  };

  const viewReport = async (id) => {
    setLoading(true); setErrorMsg('');
    try {
      const res = await apiFetch(`/audits/${id}/report`, token);
      const data = await res.json();
      if (res.ok) {
        setDiscrepancyReport(data);
        setActiveView('report');
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---
  const getStatusBadge = (status) => {
    const map = {
      'Planned': 'available', // green-ish
      'In Progress': 'allocated', // blue-ish
      'Completed': 'maintenance', // orange-ish
      'Closed': 'overdue', // red/gray
    };
    return map[status] || 'available';
  };

  const getItemBadge = (status) => {
    const map = {
      'Pending': { bg: '#3f3f46', col: '#d4d4d8' },
      'Verified': { bg: '#059669', col: '#d1fae5' },
      'Missing': { bg: '#e11d48', col: '#ffe4e6' },
      'Damaged': { bg: '#d97706', col: '#fef3c7' }
    };
    const style = map[status] || map['Pending'];
    return <span style={{ background: style.bg, color: style.col, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{status}</span>;
  };

  // ----------------------------------------------------
  // LIST VIEW
  // ----------------------------------------------------
  if (activeView === 'list') {
    return (
      <div className="data-panel animate-fade-in">
        {errorMsg && <div className="error-banner" style={{marginBottom:'20px'}}><AlertTriangle size={16}/><span>{errorMsg}</span></div>}
        {successMsg && <div className="success-banner" style={{marginBottom:'20px'}}><CheckCircle size={16}/><span>{successMsg}</span></div>}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 className="section-title">Asset Audits</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage and track verification cycles.</p>
          </div>
          {isAdminOrManager && (
            <button className="auth-btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setShowCreateModal(true)}>
              <PlusCircle size={16} style={{ display: 'inline', marginRight: '6px' }} /> Create Audit Cycle
            </button>
          )}
        </div>

        {cycles.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No audit cycles found.</p>
        ) : (
          <div className="directory-table-container">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Cycle Name</th>
                  <th>Scope</th>
                  <th>Date Range</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map(cycle => {
                  const verifiedPct = cycle.totalAssets > 0 ? Math.round((cycle.verifiedCount / cycle.totalAssets) * 100) : 0;
                  const auditedCount = cycle.verifiedCount + cycle.missingCount + cycle.damagedCount;
                  
                  return (
                    <tr key={cycle._id}>
                      <td style={{ fontWeight: 600 }}>{cycle.name}</td>
                      <td>
                        {cycle.scopeType === 'department' ? `Dept: ${cycle.scopeDepartment?.name || 'Unknown'}` : `Loc: ${cycle.scopeLocation}`}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '100px', height: '6px', background: '#3f3f46', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(auditedCount / (cycle.totalAssets||1))*100}%`, height: '100%', background: 'var(--color-primary)' }}></div>
                          </div>
                          <span style={{ fontSize: '12px' }}>{auditedCount}/{cycle.totalAssets}</span>
                        </div>
                      </td>
                      <td><span className={`status-badge ${getStatusBadge(cycle.status)}`}>{cycle.status}</span></td>
                      <td>
                        <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => loadCycleDetail(cycle._id)}>
                          View <ArrowRight size={14} style={{ display:'inline', marginLeft:'4px', verticalAlign:'middle' }}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create Audit Cycle</h3>
                <button className="close-btn" onClick={() => setShowCreateModal(false)}><XCircle size={20}/></button>
              </div>
              <form onSubmit={handleCreateSubmit} className="modal-form">
                <div className="form-group">
                  <label>Audit Name</label>
                  <input type="text" required value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} placeholder="e.g. Q3 IT Hardware Audit" />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Start Date</label>
                    <input type="date" required value={createForm.startDate} onChange={e => setCreateForm({...createForm, startDate: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>End Date</label>
                    <input type="date" required value={createForm.endDate} onChange={e => setCreateForm({...createForm, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Scope Type</label>
                  <select value={createForm.scopeType} onChange={e => setCreateForm({...createForm, scopeType: e.target.value})}>
                    <option value="department">By Department</option>
                    <option value="location">By Location</option>
                  </select>
                </div>
                {createForm.scopeType === 'department' ? (
                  <div className="form-group">
                    <label>Select Department</label>
                    <select value={createForm.scopeDepartment} onChange={e => setCreateForm({...createForm, scopeDepartment: e.target.value})} required>
                      <option value="">-- Choose Dept --</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Location Name</label>
                    <input type="text" value={createForm.scopeLocation} onChange={e => setCreateForm({...createForm, scopeLocation: e.target.value})} required placeholder="e.g. Building A" />
                  </div>
                )}
                <div className="form-group">
                  <label>Assign Auditors (Hold Ctrl/Cmd to select multiple)</label>
                  <select multiple required size="4" value={createForm.auditors} onChange={e => {
                    const vals = Array.from(e.target.selectedOptions, option => option.value);
                    setCreateForm({...createForm, auditors: vals});
                  }}>
                    {directoryUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Creating...' : 'Create Cycle'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // DETAIL VIEW
  // ----------------------------------------------------
  if (activeView === 'detail' && selectedCycle) {
    const isAuditor = selectedCycle.auditors.some(a => a._id === currentUser?._id);
    const canMark = (isAuditor || isAdminOrManager) && selectedCycle.status !== 'Closed';
    const canClose = isAdminOrManager && selectedCycle.status === 'Completed';

    return (
      <div className="data-panel animate-fade-in">
        {errorMsg && <div className="error-banner" style={{marginBottom:'20px'}}><AlertTriangle size={16}/><span>{errorMsg}</span></div>}
        {successMsg && <div className="success-banner" style={{marginBottom:'20px'}}><CheckCircle size={16}/><span>{successMsg}</span></div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button className="secondary-btn" style={{ padding: '6px' }} onClick={() => setActiveView('list')}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 className="section-title" style={{ marginBottom: '4px' }}>{selectedCycle.name}</h2>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Scope: {selectedCycle.scopeType === 'department' ? selectedCycle.scopeDepartment?.name : selectedCycle.scopeLocation}</span>
              <span>•</span>
              <span>Target: {selectedCycle.totalAssets} Assets</span>
              <span>•</span>
              <span className={`status-badge ${getStatusBadge(selectedCycle.status)}`} style={{ padding: '2px 8px' }}>{selectedCycle.status}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedCycle.status === 'Closed' && (
              <button className="secondary-btn" onClick={() => viewReport(selectedCycle._id)}>
                <FileText size={16} style={{ marginRight: '6px', display: 'inline' }} /> View Report
              </button>
            )}
            {isAdminOrManager && selectedCycle.status !== 'Closed' && selectedCycle.status !== 'Completed' && (
              <button className="secondary-btn" onClick={handleComplete}>Mark Completed</button>
            )}
            {canClose && (
              <button className="auth-btn" style={{ background: '#e11d48', width: 'auto' }} onClick={handleClose}>
                <Lock size={16} style={{ marginRight: '6px', display: 'inline' }} /> Close & Lock
              </button>
            )}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="kpi-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi-card available" style={{ padding: '16px' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Verified</h4>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{selectedCycle.verifiedCount}</div>
          </div>
          <div className="kpi-card overdue" style={{ padding: '16px', borderLeftColor: '#e11d48' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Missing</h4>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{selectedCycle.missingCount}</div>
          </div>
          <div className="kpi-card maintenance" style={{ padding: '16px' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Damaged</h4>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{selectedCycle.damagedCount}</div>
          </div>
          <div className="kpi-card" style={{ padding: '16px', background: '#18181b', borderLeftColor: '#3f3f46' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Remaining</h4>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>
              {selectedCycle.totalAssets - (selectedCycle.verifiedCount + selectedCycle.missingCount + selectedCycle.damagedCount)}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="directory-table-container">
          <table className="directory-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Expected Location</th>
                <th>Status</th>
                <th>Audited By</th>
                {canMark && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {auditItems.map(item => (
                <tr key={item._id}>
                  <td><code className="asset-tag">{item.asset.assetTag}</code></td>
                  <td>{item.asset.name}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {item.asset.department?.name || item.asset.location || 'Unknown'}
                  </td>
                  <td>{getItemBadge(item.status)}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.auditedBy ? `${item.auditedBy.name} (${new Date(item.auditedAt).toLocaleDateString()})` : '-'}
                  </td>
                  {canMark && (
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="secondary-btn" 
                          style={{ padding: '4px 8px', fontSize: '12px', borderColor: '#059669', color: '#059669' }}
                          onClick={() => markItem(item._id, 'Verified')}
                        >
                          Verify
                        </button>
                        <button 
                          className="secondary-btn" 
                          style={{ padding: '4px 8px', fontSize: '12px', borderColor: '#e11d48', color: '#e11d48' }}
                          onClick={() => {
                            const notes = window.prompt("Optional notes for missing asset:");
                            if (notes !== null) markItem(item._id, 'Missing', notes);
                          }}
                        >
                          Missing
                        </button>
                        <button 
                          className="secondary-btn" 
                          style={{ padding: '4px 8px', fontSize: '12px', borderColor: '#d97706', color: '#d97706' }}
                          onClick={() => {
                            const notes = window.prompt("Optional notes for damaged asset:");
                            if (notes !== null) markItem(item._id, 'Damaged', notes);
                          }}
                        >
                          Damaged
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // REPORT VIEW
  // ----------------------------------------------------
  if (activeView === 'report' && discrepancyReport) {
    return (
      <div className="data-panel animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button className="secondary-btn" style={{ padding: '6px' }} onClick={() => setActiveView('detail')}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="section-title" style={{ marginBottom: '4px' }}>Discrepancy Report: {discrepancyReport.cycleName}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Generated on {new Date(discrepancyReport.report.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {discrepancyReport.report.flaggedItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 16px', color: '#059669', opacity: 0.8 }} />
            <h3>Perfect Audit!</h3>
            <p>No missing or damaged items were reported during this cycle.</p>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
              The following {discrepancyReport.report.flaggedItems.length} items were flagged. Their system statuses have been automatically updated.
            </p>
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Name</th>
                    <th>Audit Result</th>
                    <th>Status Change</th>
                    <th>Notes</th>
                    <th>Auditor</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancyReport.report.flaggedItems.map((flag, idx) => (
                    <tr key={idx}>
                      <td><code className="asset-tag">{flag.assetTag}</code></td>
                      <td>{flag.assetName}</td>
                      <td>{getItemBadge(flag.auditResult)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{flag.previousStatus}</span>
                          <ArrowRight size={12} />
                          <span style={{ fontWeight: 600, color: flag.newStatus === 'Lost' ? '#e11d48' : '#d97706' }}>{flag.newStatus}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{flag.notes || '-'}</td>
                      <td style={{ fontSize: '13px' }}>{flag.auditedBy?.name || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
