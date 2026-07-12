import { useState, useMemo } from 'react';
import { Search, Package, MapPin, Tag } from 'lucide-react';
 
function AssetDirectory({ allAssets = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState(null);
 
  const categories = useMemo(() => {
    const unique = new Set(allAssets.map((a) => a.category).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [allAssets]);
 
  const statuses = useMemo(() => {
    const unique = new Set(allAssets.map((a) => a.status).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [allAssets]);
 
  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.category?.toLowerCase().includes(searchTerm.toLowerCase());
 
      const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
 
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allAssets, searchTerm, statusFilter, categoryFilter]);
 
  const statusBadgeClass = (status) => {
    const map = {
      Available: 'available',
      Allocated: 'allocated',
      Reserved: 'transfers',
      'Under Maintenance': 'maintenance',
      Lost: 'overdue',
      Retired: 'overdue',
      Disposed: 'overdue',
    };
    return map[status] || 'available';
  };
 
  return (
    <div className="data-panel">
      <h2 className="section-title">Asset Directory</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Search and filter all registered assets across the organization.
      </p>
 
      {/* Search + Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '13px',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, serial number, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>
 
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Statuses' : s}
            </option>
          ))}
        </select>
 
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>
 
      {/* Result count */}
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Showing {filteredAssets.length} of {allAssets.length} assets
      </p>
 
      {/* Asset Table */}
      {filteredAssets.length === 0 ? (
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          No assets match your search/filter criteria.
        </p>
      ) : (
        <div className="directory-table-container">
          <table className="directory-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Department</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset._id}
                  onClick={() => setSelectedAsset(asset)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ color: 'var(--text-title)', fontWeight: 600 }}>
                    {asset.name}
                  </td>
                  <td>{asset.category}</td>
                  <td>
                    <code>{asset.serialNumber}</code>
                  </td>
                  <td>
                    <span className={`role-badge ${statusBadgeClass(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>{asset.department || 'N/A'}</td>
                  <td>{asset.condition || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
 
      {/* Asset Detail Modal (lightweight — full history needs a backend endpoint later) */}
      {selectedAsset && (
        <div className="modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAsset.name}</h2>
              <button className="close-btn" onClick={() => setSelectedAsset(null)}>
                ×
              </button>
            </div>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={16} /> <strong>Category:</strong> {selectedAsset.category}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={16} /> <strong>Serial Number:</strong>{' '}
                <code>{selectedAsset.serialNumber}</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} /> <strong>Department:</strong>{' '}
                {selectedAsset.department || 'N/A'}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={`role-badge ${statusBadgeClass(selectedAsset.status)}`}>
                  {selectedAsset.status}
                </span>
              </div>
              <div>
                <strong>Condition:</strong> {selectedAsset.condition || 'N/A'}
              </div>
 
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                Full allocation and maintenance history will appear here once the
                backend exposes a per-asset detail endpoint.
              </p>
            </div>
 
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedAsset(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
export default AssetDirectory;