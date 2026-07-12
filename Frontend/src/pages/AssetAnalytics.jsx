import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2, PieChart as PieChartIcon, Download, AlertTriangle, FileText, CheckCircle, Activity, Box, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

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

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];

export default function AssetAnalytics({ token }) {
  const [activeTab, setActiveTab] = useState('maintenance'); // maintenance | departments | heatmaps
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Data States
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);

  // Fetch logic
  const loadData = useCallback(async () => {
    setLoading(true); setErrorMsg('');
    try {
      const [maintRes, deptRes, heatRes] = await Promise.all([
        apiFetch('/analytics/maintenance', token),
        apiFetch('/analytics/department', token),
        apiFetch('/analytics/bookings', token)
      ]);
      
      const maint = await maintRes.json();
      const dept = await deptRes.json();
      const heat = await heatRes.json();

      if (!maintRes.ok) throw new Error(maint.message || "Failed to load maintenance data");
      if (!deptRes.ok) throw new Error(dept.message || "Failed to load department data");
      if (!heatRes.ok) throw new Error(heat.message || "Failed to load heatmap data");

      setMaintenanceData(maint);
      setDepartmentData(dept);
      setHeatmapData(heat);
    } catch (err) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Export Handlers ---
  const handleExportCSV = () => {
    if (activeTab === 'maintenance' && maintenanceData) {
      const csvFreq = Papa.unparse(maintenanceData.frequentAssets);
      const csvDue = Papa.unparse(maintenanceData.dueForMaintenance);
      downloadFile(csvFreq + "\n\n" + csvDue, 'maintenance_analytics.csv', 'text/csv');
    } else if (activeTab === 'departments') {
      const csv = Papa.unparse(departmentData);
      downloadFile(csv, 'department_analytics.csv', 'text/csv');
    } else if (activeTab === 'heatmaps') {
      const csv = Papa.unparse(heatmapData);
      downloadFile(csv, 'booking_heatmap.csv', 'text/csv');
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("AssetFlow Analytics Report", 14, 15);
    doc.setFontSize(10);
    
    if (activeTab === 'maintenance' && maintenanceData) {
      doc.text("Top Frequently Repaired Assets", 14, 25);
      doc.autoTable({
        startY: 30,
        head: [['Asset Name', 'Tag', 'Repair Count']],
        body: maintenanceData.frequentAssets.map(a => [a.assetName, a.assetTag, a.count]),
      });
      
      const nextY = doc.lastAutoTable.finalY + 15;
      doc.text("Assets Due for Maintenance", 14, nextY);
      doc.autoTable({
        startY: nextY + 5,
        head: [['Asset Tag', 'Name', 'Condition', 'Status']],
        body: maintenanceData.dueForMaintenance.map(a => [a.assetTag, a.name, a.condition, a.status]),
      });
    } else if (activeTab === 'departments') {
      doc.text("Department Allocation Summary", 14, 25);
      doc.autoTable({
        startY: 30,
        head: [['Department', 'Total Assets', 'Available', 'Allocated']],
        body: departmentData.map(d => [d.departmentName, d.totalAssets, d.availableAssets, d.allocatedAssets]),
      });
    } else if (activeTab === 'heatmaps') {
      doc.text("Booking Heatmap (Peak Times)", 14, 25);
      doc.autoTable({
        startY: 30,
        head: [['Day', 'Hour', 'Booking Count']],
        body: heatmapData.map(h => [h.day, `${h.hour}:00`, h.count]),
      });
    }
    
    doc.save(`report_${activeTab}.pdf`);
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Rendering logic ---
  if (loading && !maintenanceData) {
    return <div className="data-panel" style={{ textAlign: 'center', padding: '100px' }}><div className="spinner"></div><p>Loading analytics...</p></div>;
  }

  if (errorMsg) {
    return <div className="data-panel"><div className="error-banner"><AlertTriangle size={16}/><span>{errorMsg}</span></div><button className="secondary-btn" onClick={loadData}>Retry</button></div>;
  }

  return (
    <div className="data-panel animate-fade-in" style={{ padding: '0' }}>
      {/* Header & Tabs */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: '16px' }}>Analytics & Reporting</h2>
          <div className="drawer-tabs" style={{ borderBottom: 'none' }}>
            <button className={`drawer-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
              <WrenchIcon /> Maintenance & Retirement
            </button>
            <button className={`drawer-tab ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')}>
              <BoxIcon /> Department Allocation
            </button>
            <button className={`drawer-tab ${activeTab === 'heatmaps' ? 'active' : ''}`} onClick={() => setActiveTab('heatmaps')}>
              <ActivityIcon /> Booking Heatmap
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="secondary-btn" onClick={handleExportCSV}>
            <FileText size={16} style={{ display: 'inline', marginRight: '6px' }}/> Export CSV
          </button>
          <button className="auth-btn" style={{ width: 'auto' }} onClick={handleExportPDF}>
            <Download size={16} style={{ display: 'inline', marginRight: '6px' }}/> Export PDF
          </button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* --- MAINTENANCE TAB --- */}
        {activeTab === 'maintenance' && maintenanceData && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              
              <div className="kpi-card" style={{ padding: '20px', gridColumn: 'span 2' }}>
                <h3 style={{ marginBottom: '20px' }}>Top 10 Frequently Repaired Assets</h3>
                {maintenanceData.frequentAssets.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No repairs found.</p> : (
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={maintenanceData.frequentAssets} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis type="number" />
                        <YAxis dataKey="assetName" type="category" width={150} tick={{ fill: '#a1a1aa' }} />
                        <RechartsTooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                        <Bar dataKey="count" fill="#8b5cf6" name="Repair Count" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="kpi-card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '20px' }}>Repairs by Category</h3>
                {maintenanceData.frequentCategories.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No data.</p> : (
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={maintenanceData.frequentCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="categoryName">
                          {maintenanceData.frequentCategories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="kpi-card" style={{ padding: '20px', flex: 1 }}>
                  <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#f59e0b" /> Due for Maintenance ({maintenanceData.dueForMaintenance.length})
                  </h3>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                    {maintenanceData.dueForMaintenance.map(a => (
                      <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div><strong style={{ display: 'block' }}>{a.name}</strong><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.assetTag}</span></div>
                        <span className={`status-badge ${a.condition === 'Damaged' ? 'overdue' : 'maintenance'}`}>{a.condition}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="kpi-card" style={{ padding: '20px', flex: 1 }}>
                  <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="#ef4444" /> Nearing Retirement ({maintenanceData.nearingRetirement.length})
                  </h3>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                    {maintenanceData.nearingRetirement.map(a => (
                      <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div><strong style={{ display: 'block' }}>{a.name}</strong><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Acq: {new Date(a.acquisitionDate).toLocaleDateString()}</span></div>
                        <span className="status-badge available" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Older than 4yrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- DEPARTMENTS TAB --- */}
        {activeTab === 'departments' && departmentData && (
          <div className="animate-fade-in">
             <div className="kpi-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '20px' }}>Department Allocation Summary</h3>
                <div style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="departmentName" tick={{ fill: '#a1a1aa' }} />
                      <YAxis tick={{ fill: '#a1a1aa' }} />
                      <RechartsTooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                      <Legend />
                      <Bar dataKey="availableAssets" stackId="a" name="Available (Idle)" fill="#10b981" />
                      <Bar dataKey="allocatedAssets" stackId="a" name="Allocated" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
          </div>
        )}

        {/* --- HEATMAP TAB --- */}
        {activeTab === 'heatmaps' && heatmapData && (
          <div className="animate-fade-in">
            <div className="kpi-card" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '20px' }}>Resource Booking Heatmap (Peak Usage)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Shows the number of reservations made by day of week and hour of the day.</p>
              
              {heatmapData.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Not enough booking data to generate heatmap.</p> : (
                <div style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" dataKey="hour" name="Hour" unit=":00" domain={[0, 23]} tickCount={24} tick={{ fill: '#a1a1aa' }} />
                      <YAxis type="category" dataKey="day" name="Day" tick={{ fill: '#a1a1aa' }} />
                      <ZAxis type="number" dataKey="count" range={[50, 400]} name="Bookings" />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                      <Scatter name="Bookings" data={heatmapData} fill="#ec4899" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Mini Icons
const WrenchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px' }}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
