import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { FaUsers, FaShoppingCart, FaBirthdayCake, FaChartLine, FaCog, FaSignOutAlt, FaHome, FaPalette } from 'react-icons/fa';
import CakeManagement from '../widgets/admin/CakeManagement';
import CakeDesigner from '../widgets/admin/CakeDesigner';
import OrderManagement from '../widgets/admin/OrderManagement';
import UserManagement from '../widgets/admin/UserManagement';
import '../styles/Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          navigate('/');
          return;
        }

        const userData = userDoc.data();
        if (!userData.isAdmin && !userData.isDeveloper) {
          navigate('/');
          return;
        }

        await fetchDashboardData();
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin status');
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);

      // Fetch cakes
      const cakesSnapshot = await getDocs(collection(db, 'cakes'));
      const cakesData = cakesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCakes(cakesData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus
      });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="admin-header">
          <h2>Admin Dashboard</h2>
        </div>
        <nav className="admin-nav">
          <button
            className="nav-item home-btn"
            onClick={() => navigate('/')}
          >
            <FaHome /> Back to Site
          </button>
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartLine /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> Users
          </button>
          <button
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FaShoppingCart /> Orders
          </button>
          <button
            className={`nav-item ${activeTab === 'cakes' ? 'active' : ''}`}
            onClick={() => setActiveTab('cakes')}
          >
            <FaBirthdayCake /> Cakes
          </button>
          <button
            className={`nav-item ${activeTab === 'designer' ? 'active' : ''}`}
            onClick={() => setActiveTab('designer')}
          >
            <FaPalette /> Cake Designer
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Settings
          </button>
        </nav>
        <button className="sign-out-btn" onClick={handleSignOut}>
          <FaSignOutAlt /> Sign Out
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <h2>Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{users.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Orders</h3>
                <p>{orders.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Cakes</h3>
                <p>{cakes.length}</p>
              </div>
              <div className="stat-card">
                <h3>Active Users</h3>
                <p>{users.filter(user => user.isActive).length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'orders' && <OrderManagement />}

        {activeTab === 'cakes' && (
          <CakeManagement cakes={cakes} onUpdate={fetchDashboardData} />
        )}

        {activeTab === 'designer' && (
          <CakeDesigner />
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2>Admin Settings</h2>
            <div className="settings-grid">
              <div className="setting-card">
                <h3>System Settings</h3>
                <p>Configure system-wide settings and preferences</p>
                <button className="settings-btn">Configure</button>
              </div>
              <div className="setting-card">
                <h3>Email Templates</h3>
                <p>Manage email templates and notifications</p>
                <button className="settings-btn">Manage</button>
              </div>
              <div className="setting-card">
                <h3>Backup & Restore</h3>
                <p>Backup and restore system data</p>
                <button className="settings-btn">Backup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
