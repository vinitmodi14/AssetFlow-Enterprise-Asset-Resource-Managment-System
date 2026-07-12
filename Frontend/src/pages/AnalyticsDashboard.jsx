import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Filter } from 'lucide-react';

const MOCK_UTILIZATION_TREND = [
  { month: 'Feb', utilizationRate: 62 },
  { month: 'Mar', utilizationRate: 68 },
  { month: 'Apr', utilizationRate: 71 },
  { month: 'May', utilizationRate: 65 },
  { month: 'Jun', utilizationRate: 74 },
  { month: 'Jul', utilizationRate: 79 },
];

function AnalyticsDashboard({ allAssets = [], stats = {} }) {
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const departments = useMemo(() => {
    const unique = new Set(allAssets.map((a) => a.department).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [allAssets]);

  const categories = useMemo(() => {
    const unique = new Set(allAssets.map((a) => a.category).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [allAssets]);

  const locations = useMemo(() => {
    const unique = new Set(allAssets.map((a) => a.location).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [allAssets]);

  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      const matchesDept = departmentFilter === 'All' || asset.department === departmentFilter;
      const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
      const matchesLocation = locationFilter === 'All' || asset.location === locationFilter;
      return matchesDept && matchesCategory && matchesLocation;
    });
  }, [allAssets, departmentFilter, categoryFilter, locationFilter]);

  // Real calculation from actual asset statuses (not mock)
  const utilizationSummary = useMemo(() => {
    const total = filteredAssets.length || 1;
    const allocated = filteredAssets.filter((a) => a.status === 'Allocated').length;
    const available = filteredAssets.filter((a) => a.status === 'Available').length;
    const underMaintenance = filteredAssets.filter((a) => a.status === 'Under Maintenance').length;
    return {
      utilizationRate: Math.round((allocated / total) * 100),
      allocated,
      available,
      underMaintenance,
      total: filteredAssets.length,
    };
  }, [filteredAssets]);

  // Placeholder most-used / idle lists — real version needs usage-count data
  const mostUsedAssets = filteredAssets.filter((a) => a.status === 'Allocated').slice(0, 5);
  const idleAssets = filteredAssets.filter((a) => a.status === 'Available').slice(0, 5);

  return (
    <div className="data-panel">
      <h2 className="section-title">Analytics Dashboard & Asset Utilization</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Operational insight across departments, categories, and locations.
      </p>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />

        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ minWidth: '160px' }}>
          {departments.map((d) => (
            <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
          ))}
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ minWidth: '160px' }}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>

        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ minWidth: '160px' }}>
          {locations.map((l) => (
            <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          title="From date"
        />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          title="To date"
        />
      </div>

      {/* KPI Summary Cards — real data, computed from filtered assets */}
      <div className="kpi-grid" style={{ marginBottom: '28px' }}>
        <div className="kpi-card available">
          <div className="kpi-info">
            <h3>Utilization Rate</h3>
            <div className="kpi-value">{utilizationSummary.utilizationRate}%</div>
          </div>
          <div className="kpi-footer">Of {utilizationSummary.total} filtered assets</div>
          <div className="kpi-icon-wrapper"><BarChart3 size={20} /></div>
        </div>

        <div className="kpi-card allocated">
          <div className="kpi-info">
            <h3>Currently Allocated</h3>
            <div className="kpi-value">{utilizationSummary.allocated}</div>
          </div>
          <div className="kpi-footer">Checked out to staff</div>
          <div className="kpi-icon-wrapper"><TrendingUp size={20} /></div>
        </div>

        <div className="kpi-card returns">
          <div className="kpi-info">
            <h3>Idle / Available</h3>
            <div className="kpi-value">{utilizationSummary.available}</div>
          </div>
          <div className="kpi-footer">Not currently in use</div>
          <div className="kpi-icon-wrapper"><TrendingDown size={20} /></div>
        </div>

        <div className="kpi-card maintenance">
          <div className="kpi-info">
            <h3>Under Maintenance</h3>
            <div className="kpi-value">{utilizationSummary.underMaintenance}</div>
          </div>
          <div className="kpi-footer">Currently out of service</div>
          <div className="kpi-icon-wrapper"><BarChart3 size={20} /></div>
        </div>
      </div>

      {/* Utilization Trend — MOCK DATA, flagged clearly */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>Asset Utilization Trend</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Illustrative data — connect to a real usage-history endpoint to make this live.
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '120px' }}>
          {MOCK_UTILIZATION_TREND.map((point) => (
            <div key={point.month} style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  height: `${point.utilizationRate}px`,
                  background: 'var(--accent-bg, #2563eb)',
                  borderRadius: '4px 4px 0 0',
                  marginBottom: '6px',
                }}
                title={`${point.utilizationRate}%`}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{point.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most-used vs Idle Assets */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Most-Used Assets</h3>
          {mostUsedAssets.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No allocated assets match this filter.</p>
          ) : (
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr><th>Asset Name</th><th>Category</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {mostUsedAssets.map((a) => (
                    <tr key={a._id}>
                      <td style={{ color: 'var(--text-title)', fontWeight: 600 }}>{a.name}</td>
                      <td>{a.category}</td>
                      <td><span className="role-badge allocated">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Idle / Underutilized Assets</h3>
          {idleAssets.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No idle assets match this filter.</p>
          ) : (
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr><th>Asset Name</th><th>Category</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {idleAssets.map((a) => (
                    <tr key={a._id}>
                      <td style={{ color: 'var(--text-title)', fontWeight: 600 }}>{a.name}</td>
                      <td>{a.category}</td>
                      <td><span className="role-badge available">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;