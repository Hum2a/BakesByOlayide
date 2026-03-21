import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import {
  FaUser,
  FaEnvelope,
  FaCheck,
  FaTimes,
  FaSync,
  FaEdit,
  FaSearch,
  FaSort,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import '../../styles/UserManagement.css';
import EditUserModal from './EditUserModal';

const ROLE_FILTER_OPTIONS = [
  { value: 'developer', label: 'Developer' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

function getUserRoleKey(user) {
  if (user.isDeveloper) return 'developer';
  if (user.isAdmin) return 'admin';
  return 'user';
}

function getLastLoginMs(user) {
  const t = user?.lastLoginAt;
  if (!t) return null;
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  const d = new Date(t);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatLastLoginDisplay(user) {
  const ms = getLastLoginMs(user);
  if (ms == null) return 'Never';
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilters, setRoleFilters] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('all');
  const [loginFilter, setLoginFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState('displayName');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date(),
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleEditUser = async (updatedUserData) => {
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        displayName: updatedUserData.name,
        email: updatedUserData.email,
        phone: updatedUserData.phone,
        role: updatedUserData.role,
        isAdmin: updatedUserData.role === 'admin',
        isDeveloper: updatedUserData.role === 'developer',
        isActive: updatedUserData.active,
        updatedAt: new Date(),
      });

      await fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const toggleRoleFilter = useCallback((value) => {
    setRoleFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setRoleFilters([]);
    setStatusFilter('all');
    setPhoneFilter('all');
    setLoginFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortKey('displayName');
    setSortDir('asc');
  }, []);

  const setLoginPreset = useCallback((preset) => {
    if (preset === 'clear') {
      setDateFrom('');
      setDateTo('');
      setLoginFilter('all');
      return;
    }
    setLoginFilter('range');
    const end = new Date();
    const start = new Date();
    if (preset === 'today') {
      /* same day */
    } else if (preset === 'week') {
      start.setDate(end.getDate() - 6);
    } else if (preset === 'month') {
      start.setDate(1);
    }
    const toYmd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    setDateFrom(toYmd(start));
    setDateTo(toYmd(end));
  }, []);

  const defaultSortDir = useCallback((key) => {
    if (key === 'lastLogin') return 'desc';
    if (key === 'displayName' || key === 'email' || key === 'role') return 'asc';
    if (key === 'status') return 'desc';
    return 'asc';
  }, []);

  const toggleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(defaultSortDir(key));
      }
    },
    [sortKey, defaultSortDir]
  );

  const filteredSortedUsers = useMemo(() => {
    let list = [...users];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((user) => {
        const name = (user.displayName || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const id = (user.id || '').toLowerCase();
        const short = id.slice(0, 8);
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          id.includes(q) ||
          short.includes(q)
        );
      });
    }

    if (roleFilters.length > 0) {
      list = list.filter((user) => roleFilters.includes(getUserRoleKey(user)));
    }

    if (statusFilter === 'active') {
      list = list.filter((user) => user.isActive);
    } else if (statusFilter === 'inactive') {
      list = list.filter((user) => !user.isActive);
    }

    if (phoneFilter === 'yes') {
      list = list.filter((user) => Boolean(user.phone && String(user.phone).trim()));
    } else if (phoneFilter === 'no') {
      list = list.filter((user) => !user.phone || !String(user.phone).trim());
    }

    if (loginFilter === 'never') {
      list = list.filter((user) => getLastLoginMs(user) == null);
    } else if (loginFilter === 'logged_in') {
      list = list.filter((user) => getLastLoginMs(user) != null);
    } else if (loginFilter === 'range') {
      if (dateFrom) {
        const fromMs = new Date(`${dateFrom}T00:00:00`).getTime();
        list = list.filter((user) => {
          const ms = getLastLoginMs(user);
          return ms != null && ms >= fromMs;
        });
      }
      if (dateTo) {
        const toMs = new Date(`${dateTo}T23:59:59.999`).getTime();
        list = list.filter((user) => {
          const ms = getLastLoginMs(user);
          return ms != null && ms <= toMs;
        });
      }
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'displayName':
          cmp = (a.displayName || '').localeCompare(b.displayName || '', undefined, {
            sensitivity: 'base',
          });
          break;
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '', undefined, {
            sensitivity: 'base',
          });
          break;
        case 'lastLogin': {
          const ma = getLastLoginMs(a);
          const mb = getLastLoginMs(b);
          const na = ma == null ? -Infinity : ma;
          const nb = mb == null ? -Infinity : mb;
          cmp = na - nb;
          break;
        }
        case 'role':
          cmp = getUserRoleKey(a).localeCompare(getUserRoleKey(b));
          break;
        case 'status':
          cmp = (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1);
          break;
        default:
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [
    users,
    searchQuery,
    roleFilters,
    statusFilter,
    phoneFilter,
    loginFilter,
    dateFrom,
    dateTo,
    sortKey,
    sortDir,
  ]);

  const sortIndicator = (key) =>
    sortKey === key ? (
      <span className="sort-indicator" aria-hidden>
        {sortDir === 'asc' ? <FaChevronUp /> : <FaChevronDown />}
      </span>
    ) : null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button type="button" onClick={fetchUsers}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="user-management-title-block">
          <h2>User Management</h2>
          <p className="user-management-subtitle">
            {filteredSortedUsers.length} of {users.length} users
            {users.length > 0 && filteredSortedUsers.length !== users.length ? ' (filtered)' : ''}
          </p>
        </div>
        <button type="button" onClick={fetchUsers} className="refresh-button">
          <FaSync /> Refresh Users
        </button>
      </div>

      <div className="users-toolbar">
        <div className="users-search-row">
          <label className="users-search-label" htmlFor="users-search-input">
            <FaSearch className="users-search-icon" aria-hidden />
            <span className="sr-only">Search users</span>
          </label>
          <input
            id="users-search-input"
            className="users-search-input"
            type="search"
            placeholder="Search by name, email, phone, or user ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="users-filters-grid">
          <div className="users-filter-group users-filter-group--roles">
            <span className="users-filter-label">Role</span>
            <div className="users-role-chips" role="group" aria-label="Filter by role">
              {ROLE_FILTER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`users-chip ${roleFilters.includes(value) ? 'users-chip--active' : ''}`}
                  onClick={() => toggleRoleFilter(value)}
                  aria-pressed={roleFilters.includes(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="users-filter-hint">Select none to include every role.</p>
          </div>

          <div className="users-filter-group users-filter-group--compact">
            <label className="users-field users-field--select">
              <span className="users-filter-label">Account status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Active &amp; inactive</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </label>
            <label className="users-field users-field--select">
              <span className="users-filter-label">Phone on file</span>
              <select value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value)}>
                <option value="all">Any</option>
                <option value="yes">Has phone</option>
                <option value="no">No phone</option>
              </select>
            </label>
          </div>

          <div className="users-filter-group">
            <span className="users-filter-label">Last login</span>
            <div className="users-login-presets">
              <button
                type="button"
                className="users-preset-btn"
                onClick={() => {
                  setLoginFilter('never');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Never logged in
              </button>
              <button
                type="button"
                className="users-preset-btn"
                onClick={() => {
                  setLoginFilter('logged_in');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Has logged in
              </button>
              <button type="button" className="users-preset-btn" onClick={() => setLoginPreset('today')}>
                Today
              </button>
              <button type="button" className="users-preset-btn" onClick={() => setLoginPreset('week')}>
                Last 7 days
              </button>
              <button type="button" className="users-preset-btn" onClick={() => setLoginPreset('month')}>
                This month
              </button>
              <button type="button" className="users-preset-btn users-preset-btn--ghost" onClick={() => setLoginPreset('clear')}>
                Clear login filters
              </button>
            </div>
            {loginFilter === 'range' && (
              <div className="users-date-inputs">
                <label className="users-field">
                  <span className="users-field-label">From</span>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </label>
                <label className="users-field">
                  <span className="users-field-label">To</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </label>
              </div>
            )}
          </div>

          <div className="users-filter-group users-filter-group--sort">
            <span className="users-filter-label users-filter-label--inline">
              <FaSort className="users-sort-label-icon" aria-hidden />
              Quick sort
            </span>
            <select
              className="users-sort-select"
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(':');
                setSortKey(k);
                setSortDir(d);
              }}
            >
              <option value="displayName:asc">Name A → Z</option>
              <option value="displayName:desc">Name Z → A</option>
              <option value="email:asc">Email A → Z</option>
              <option value="email:desc">Email Z → A</option>
              <option value="lastLogin:desc">Last login: recent first</option>
              <option value="lastLogin:asc">Last login: oldest first</option>
              <option value="role:asc">Role A → Z</option>
              <option value="role:desc">Role Z → A</option>
              <option value="status:desc">Status: active first</option>
              <option value="status:asc">Status: inactive first</option>
            </select>
            <button type="button" className="users-clear-filters" onClick={clearAllFilters}>
              Reset filters &amp; sort
            </button>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('displayName')}>
                  User {sortIndicator('displayName')}
                </button>
              </th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('email')}>
                  Contact {sortIndicator('email')}
                </button>
              </th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('lastLogin')}>
                  Last login {sortIndicator('lastLogin')}
                </button>
              </th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('role')}>
                  Role {sortIndicator('role')}
                </button>
              </th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('status')}>
                  Status {sortIndicator('status')}
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSortedUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="users-empty-cell">
                  <div className="users-empty">
                    <p>
                      {users.length === 0 ? 'No users yet.' : 'No users match your filters.'}
                    </p>
                    {users.length > 0 && (
                      <button type="button" className="users-clear-filters users-clear-filters--inline" onClick={clearAllFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {filteredSortedUsers.map((user) => (
              <tr key={user.id} className="users-table-row" onClick={() => setSelectedUser(user)}>
                <td className="user-info">
                  <div className="user-avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName ? `${user.displayName} profile` : 'Profile photo'} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.displayName || 'Unnamed User'}</div>
                    <div className="user-id" title={user.id}>
                      ID: {user.id.slice(0, 8)}…
                    </div>
                  </div>
                </td>
                <td className="user-contact">
                  <div className="email">
                    <FaEnvelope className="icon" />
                    {user.email || '—'}
                  </div>
                  {user.phone && <div className="phone">{user.phone}</div>}
                </td>
                <td className="last-login">{formatLastLoginDisplay(user)}</td>
                <td className="user-role">
                  <span
                    className={`role-badge ${user.isDeveloper ? 'developer' : user.isAdmin ? 'admin' : 'user'}`}
                  >
                    {user.isDeveloper ? 'Developer' : user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="user-status">
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? (
                      <>
                        <FaCheck /> Active
                      </>
                    ) : (
                      <>
                        <FaTimes /> Inactive
                      </>
                    )}
                  </span>
                </td>
                <td className="user-actions">
                  <button
                    type="button"
                    className={`status-toggle ${user.isActive ? 'deactivate' : 'activate'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUserStatus(user.id, user.isActive);
                    }}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                    }}
                    aria-label="Edit user"
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <EditUserModal
          user={{
            name: selectedUser.displayName || '',
            email: selectedUser.email || '',
            phone: selectedUser.phone || '',
            role: selectedUser.isDeveloper ? 'developer' : selectedUser.isAdmin ? 'admin' : 'user',
            active: selectedUser.isActive,
          }}
          onClose={() => setSelectedUser(null)}
          onSave={handleEditUser}
        />
      )}
    </div>
  );
};

export default UserManagement;
