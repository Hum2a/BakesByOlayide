import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { FaUser, FaEnvelope, FaCheck, FaTimes, FaSync, FaEdit } from 'react-icons/fa';
import '../../styles/UserManagement.css';
import EditUserModal from './EditUserModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      await fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    }
  };

  const getLastLoginDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
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
        updatedAt: new Date()
      });
      
      await fetchUsers(); // Refresh the users list
      setSelectedUser(null); // Close the modal
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchUsers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button onClick={fetchUsers} className="refresh-button">
          <FaSync /> Refresh Users
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Last Login</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} onClick={() => setSelectedUser(user)} style={{ cursor: 'pointer' }}>
                <td className="user-info">
                  <div className="user-avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user.displayName || 'Unnamed User'}
                    </div>
                    <div className="user-id">ID: {user.id.slice(0, 8)}...</div>
                  </div>
                </td>
                <td className="user-contact">
                  <div className="email">
                    <FaEnvelope className="icon" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="phone">{user.phone}</div>
                  )}
                </td>
                <td className="last-login">
                  {getLastLoginDate(user.lastLoginAt)}
                </td>
                <td className="user-role">
                  <span className={`role-badge ${user.isDeveloper ? 'developer' : user.isAdmin ? 'admin' : 'user'}`}>
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
                    className={`status-toggle ${user.isActive ? 'deactivate' : 'activate'}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click when clicking button
                      toggleUserStatus(user.id, user.isActive);
                    }}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click when clicking button
                      setSelectedUser(user);
                    }}
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
            active: selectedUser.isActive
          }}
          onClose={() => setSelectedUser(null)}
          onSave={handleEditUser}
        />
      )}
    </div>
  );
};

export default UserManagement; 