import { useState, useMemo } from 'react';
import {
  Package,
  User,
  Building2,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

/**
 * Asset Allocation & Transfer Screen (Problem Statement Screen 5)
 *
 * ASSUMPTIONS (no backend endpoint for allocations exists yet, so this
 * follows the same pattern as AssetDirectory.jsx — reuse data already on
 * hand, manage allocation actions in local state, and leave clear TODOs
 * for wiring to real POST/PATCH endpoints once the backend team adds them):
 *
 *  - `allAssets` items look like:
 *      { id, tag, name, category, status, department, location,
 *        assignedTo: { id, name, department } | null,
 *        expectedReturnDate: 'YYYY-MM-DD' | null }
 *  - `employees` items look like: { id, name, department }
 *  - `departments` is an array of department name strings
 *
 * If your real field names differ, the only things to rename are in the
 * `normalizeAsset` helper below — everything else reads from that shape.
 */

const TODAY = new Date().toISOString().slice(0, 10);

function normalizeAsset(asset) {
  return {
    id: asset.id ?? asset._id ?? asset.tag,
    tag: asset.tag ?? asset.assetTag ?? asset.serialNumber ?? '—',
    name: asset.name ?? 'Unnamed asset',
    category: asset.category ?? 'Uncategorized',
    status: asset.status ?? 'Available',
    department: asset.department ?? null,
    location: asset.location ?? '—',
    assignedTo: asset.assignedTo ?? asset.currentHolder ?? null,
    expectedReturnDate: asset.expectedReturnDate ?? null,
    history: asset.history ?? [],
  };
}

function normalizeEmployee(emp) {
  return {
    id: emp.id ?? emp._id,
    name: emp.name ?? emp.email ?? 'Unnamed employee',
    department: emp.department ?? 'General',
  };
}

function isOverdue(asset) {
  return (
    asset.status === 'Allocated' &&
    asset.expectedReturnDate &&
    asset.expectedReturnDate < TODAY
  );
}

function StatusBadge({ status, overdue }) {
  if (overdue) {
    return (
      <span className="role-badge role-badge-danger">
        <AlertTriangle size={12} /> Overdue
      </span>
    );
  }
  const tone =
    status === 'Available'
      ? 'role-badge-success'
      : status === 'Allocated'
      ? 'role-badge-info'
      : status === 'Reserved'
      ? 'role-badge-warning'
      : 'role-badge-default';
  return <span className={`role-badge ${tone}`}>{status}</span>;
}

export default function AssetAllocation({
  allAssets = [],
  employees = [],
  departments = [],
}) {
  const [assets, setAssets] = useState(() => allAssets.map(normalizeAsset));
  const normalizedEmployees = useMemo(
    () => employees.map(normalizeEmployee),
    [employees]
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [allocateTarget, setAllocateTarget] = useState(null); // asset being allocated
  const [transferTarget, setTransferTarget] = useState(null); // asset being transferred
  const [returnTarget, setReturnTarget] = useState(null); // asset being returned

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.tag.toLowerCase().includes(search.toLowerCase()) ||
        (a.assignedTo?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' ? true : a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  const kpis = useMemo(() => {
    const allocated = assets.filter((a) => a.status === 'Allocated').length;
    const overdue = assets.filter(isOverdue).length;
    const pendingTransfer = assets.filter((a) => a.status === 'Transfer Pending')
      .length;
    const available = assets.filter((a) => a.status === 'Available').length;
    return { allocated, overdue, pendingTransfer, available };
  }, [assets]);

  function updateAsset(id, patch, historyEntry) {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...patch,
              history: historyEntry ? [historyEntry, ...a.history] : a.history,
            }
          : a
      )
    );
  }

  function handleAllocate(asset, employeeId, expectedReturnDate) {
    const employee = normalizedEmployees.find((e) => e.id === employeeId);
    if (!employee) return;
    updateAsset(
      asset.id,
      {
        status: 'Allocated',
        assignedTo: { id: employee.id, name: employee.name, department: employee.department },
        expectedReturnDate: expectedReturnDate || null,
      },
      {
        action: 'Allocated',
        to: employee.name,
        date: TODAY,
      }
    );
    setAllocateTarget(null);
  }

  function handleTransferRequest(asset, employeeId) {
    const employee = normalizedEmployees.find((e) => e.id === employeeId);
    if (!employee) return;
    updateAsset(
      asset.id,
      {
        status: 'Transfer Pending',
        pendingTransferTo: { id: employee.id, name: employee.name },
      },
      {
        action: 'Transfer requested',
        to: employee.name,
        date: TODAY,
      }
    );
    setTransferTarget(null);
  }

  function handleApproveTransfer(asset) {
    const target = asset.pendingTransferTo;
    if (!target) return;
    updateAsset(
      asset.id,
      {
        status: 'Allocated',
        assignedTo: { id: target.id, name: target.name },
        pendingTransferTo: null,
      },
      {
        action: 'Transfer approved',
        to: target.name,
        date: TODAY,
      }
    );
  }

  function handleReturn(asset, conditionNotes) {
    updateAsset(
      asset.id,
      {
        status: 'Available',
        assignedTo: null,
        expectedReturnDate: null,
      },
      {
        action: 'Returned',
        notes: conditionNotes,
        date: TODAY,
      }
    );
    setReturnTarget(null);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Asset Allocation &amp; Transfer</h2>
        <p className="page-subtitle">
          Assign assets to employees or departments, route transfer requests,
          and process returns.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <Package size={20} />
          <div>
            <div className="kpi-value">{kpis.allocated}</div>
            <div className="kpi-label">Assets Allocated</div>
          </div>
        </div>
        <div className="kpi-card">
          <AlertTriangle size={20} />
          <div>
            <div className="kpi-value">{kpis.overdue}</div>
            <div className="kpi-label">Overdue Returns</div>
          </div>
        </div>
        <div className="kpi-card">
          <ArrowRightLeft size={20} />
          <div>
            <div className="kpi-value">{kpis.pendingTransfer}</div>
            <div className="kpi-label">Pending Transfers</div>
          </div>
        </div>
        <div className="kpi-card">
          <CheckCircle2 size={20} />
          <div>
            <div className="kpi-value">{kpis.available}</div>
            <div className="kpi-label">Available to Allocate</div>
          </div>
        </div>
      </div>

      <div className="data-panel">
        <div className="panel-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by asset, tag, or holder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Transfer Pending">Transfer Pending</option>
            <option value="Reserved">Reserved</option>
          </select>
        </div>

        <table className="directory-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Category</th>
              <th>Status</th>
              <th>Held By</th>
              <th>Expected Return</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((asset) => {
              const overdue = isOverdue(asset);
              return (
                <tr key={asset.id}>
                  <td>
                    <div className="asset-cell">
                      <strong>{asset.name}</strong>
                      <span className="muted">{asset.tag}</span>
                    </div>
                  </td>
                  <td>{asset.category}</td>
                  <td>
                    <StatusBadge status={asset.status} overdue={overdue} />
                  </td>
                  <td>
                    {asset.assignedTo ? (
                      <span className="held-by">
                        <User size={14} /> {asset.assignedTo.name}
                      </span>
                    ) : (
                      <span className="muted">Unassigned</span>
                    )}
                  </td>
                  <td>
                    {asset.expectedReturnDate ? (
                      <span className={overdue ? 'text-danger' : ''}>
                        <Clock size={14} /> {asset.expectedReturnDate}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {asset.status === 'Available' && (
                      <button
                        className="action-tile"
                        onClick={() => setAllocateTarget(asset)}
                      >
                        Allocate
                      </button>
                    )}
                    {asset.status === 'Allocated' && (
                      <div className="action-group">
                        <button
                          className="action-tile"
                          onClick={() => setTransferTarget(asset)}
                        >
                          Request Transfer
                        </button>
                        <button
                          className="action-tile action-tile-secondary"
                          onClick={() => setReturnTarget(asset)}
                        >
                          <RotateCcw size={14} /> Return
                        </button>
                      </div>
                    )}
                    {asset.status === 'Transfer Pending' && (
                      <button
                        className="action-tile"
                        onClick={() => handleApproveTransfer(asset)}
                      >
                        Approve Transfer → {asset.pendingTransferTo?.name}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No assets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {allocateTarget && (
        <AllocateModal
          asset={allocateTarget}
          employees={normalizedEmployees}
          onClose={() => setAllocateTarget(null)}
          onSubmit={handleAllocate}
        />
      )}

      {transferTarget && (
        <TransferModal
          asset={transferTarget}
          employees={normalizedEmployees}
          onClose={() => setTransferTarget(null)}
          onSubmit={handleTransferRequest}
        />
      )}

      {returnTarget && (
        <ReturnModal
          asset={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSubmit={handleReturn}
        />
      )}
    </div>
  );
}

function AllocateModal({ asset, employees, onClose, onSubmit }) {
  const [employeeId, setEmployeeId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Allocate {asset.name}</h3>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <label>
            Employee / Department
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select an employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department}
                </option>
              ))}
            </select>
          </label>
          <label>
            Expected Return Date (optional)
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!employeeId}
            onClick={() => onSubmit(asset, employeeId, expectedReturnDate)}
          >
            Allocate
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ asset, employees, onClose, onSubmit }) {
  const [employeeId, setEmployeeId] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request Transfer — {asset.name}</h3>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p className="muted">
            Currently held by <strong>{asset.assignedTo?.name}</strong>.
            Submitting this request needs Asset Manager or Department Head
            approval before the asset re-allocates.
          </p>
          <label>
            Transfer to
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select an employee...</option>
              {employees
                .filter((e) => e.id !== asset.assignedTo?.id)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!employeeId}
            onClick={() => onSubmit(asset, employeeId)}
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnModal({ asset, onClose, onSubmit }) {
  const [notes, setNotes] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Return {asset.name}</h3>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <label>
            Condition check-in notes
            <textarea
              rows={4}
              placeholder="Describe the asset's condition on return..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => onSubmit(asset, notes)}>
            Mark Returned
          </button>
        </div>
      </div>
    </div>
  );
}