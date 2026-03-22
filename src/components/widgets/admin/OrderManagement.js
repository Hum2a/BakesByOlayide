import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, getDocs, orderBy, doc as firestoreDoc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  FaCalendar,
  FaUser,
  FaClock,
  FaBox,
  FaTruck,
  FaTimes,
  FaFileInvoice,
  FaEnvelope,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaSort,
} from 'react-icons/fa';
import InvoiceModal from './InvoiceModal';
import MessageModal from '../../modals/MessageModal';
import '../../styles/OrderManagement.css';
import { apiUrl } from '../../../config/environment';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const STATUS_FILTER_OPTIONS = [
  { value: 'pending', label: 'Awaiting approval' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'paid', label: 'Paid (legacy)' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'incomplete', label: 'Incomplete' },
];

function getOrderCreatedMs(order) {
  if (!order?.createdAt?.toDate) return 0;
  return order.createdAt.toDate().getTime();
}

function orderTotalNumber(order) {
  const n = Number(order?.total);
  return Number.isFinite(n) ? n : 0;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailType, setEmailType] = useState(null); // 'confirmation' | 'complete' | 'delivery'
  const [emailOrder, setEmailOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [emailCC, setEmailCC] = useState('');
  const [emailAttachments, setEmailAttachments] = useState([]);
  const [templates, setTemplates] = useState({});
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState('confirmation');
  const [editTemplateSubject, setEditTemplateSubject] = useState('');
  const [editTemplateBody, setEditTemplateBody] = useState('');
  const [templateStatus, setTemplateStatus] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [noticeModal, setNoticeModal] = useState({ open: false, message: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (emailModalOpen && emailOrder && emailType) {
      let subject = '';
      let body = '';
      // Use template if available
      if (templates[emailType]) {
        subject = fillTemplate(templates[emailType].subject, emailOrder);
        body = fillTemplate(templates[emailType].body, emailOrder);
      } else {
        // fallback to hardcoded
        const customerName = emailOrder.customerName || 'Customer';
        switch (emailType) {
          case 'confirmation':
            subject = `Order Confirmation - Bakes by Olayide`;
            body = `<p>Dear ${customerName},</p><p>Thank you for your order! We have received your order and will begin processing it soon.</p><p>Order ID: <b>${emailOrder.id}</b></p><p>We will notify you when your order is ready.</p><p>Best regards,<br/>Bakes by Olayide</p>`;
            break;
          case 'complete':
            subject = `Order Complete - Bakes by Olayide`;
            body = `<p>Dear ${customerName},</p><p>Your order is now complete and ready for pickup or delivery.</p><p>Order ID: <b>${emailOrder.id}</b></p><p>Thank you for choosing Bakes by Olayide!</p>`;
            break;
          case 'delivery':
            subject = `Order Out for Delivery - Bakes by Olayide`;
            body = `<p>Dear ${customerName},</p><p>Your order is on its way! Our driver will deliver your order soon.</p><p>Order ID: <b>${emailOrder.id}</b></p><p>Thank you for your patience.</p>`;
            break;
          default:
            subject = '';
            body = '';
        }
      }
      setEmailSubject(subject);
      setEmailBody(body);
      setEmailStatus('');
      setEmailCC('');
      setEmailAttachments([]);
    }
  }, [emailModalOpen, emailOrder, emailType, templates]);

  useEffect(() => {
    async function fetchTemplates() {
      setTemplatesLoading(true);
      try {
        const docSnap = await getDoc(firestoreDoc(db, 'config', 'orderEmailTemplates'));
        if (docSnap.exists()) {
          setTemplates(docSnap.data());
        }
      } catch (err) {
        // ignore
      }
      setTemplatesLoading(false);
    }
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (manageTemplatesOpen && templates[selectedTemplateType]) {
      setEditTemplateSubject(templates[selectedTemplateType].subject || '');
      setEditTemplateBody(templates[selectedTemplateType].body || '');
      setTemplateStatus('');
    }
  }, [manageTemplatesOpen, selectedTemplateType, templates]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        
        // Fetch user data if userId exists
        if (orderData.userId) {
          try {
            const userDoc = await getDoc(firestoreDoc(db, 'users', orderData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              orderData.customerName = userData.displayName;
              orderData.customerEmail = userData.email;
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            orderData.customerName = 'Unknown Customer';
            orderData.customerEmail = 'N/A';
          }
        }
        
        orderData.customerName =
          orderData.customerName || orderData.guestInfo?.name || orderData.guestInfo?.displayName;
        orderData.customerEmail =
          orderData.customerEmail || orderData.guestInfo?.email;

        return orderData;
      }));
      
      setOrders(ordersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, invoiceRef) => {
    try {
      const orderRef = firestoreDoc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      // If confirming, also update invoice status to paid
      if (newStatus === 'confirmed' && invoiceRef) {
        try {
          await setDoc(firestoreDoc(db, invoiceRef), { status: 'paid' }, { merge: true });
        } catch (e) {
          // ignore
        }
      }
      await fetchOrders(); // Refresh orders after update
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const deleteOrder = async (orderId, invoiceRef, userId) => {
    if (!window.confirm('Are you sure you want to delete this order? This cannot be undone.')) return;
    try {
      // Delete from main orders collection
      await deleteDoc(firestoreDoc(db, 'orders', orderId));
      console.log('Deleted from main orders collection:', orderId);
      // Delete from user's subcollection if userId exists
      if (userId) {
        try {
          await deleteDoc(firestoreDoc(db, 'users', userId, 'Orders', orderId));
          console.log('Deleted from user subcollection:', userId, orderId);
        } catch (e) {
          console.error('Error deleting from user subcollection:', e);
        }
      }
      // Delete invoice if invoiceRef exists
      if (invoiceRef) {
        try {
          await deleteDoc(firestoreDoc(db, invoiceRef));
          console.log('Deleted invoice:', invoiceRef);
        } catch (e) {
          console.error('Error deleting invoice:', e);
        }
      }
      await fetchOrders();
    } catch (error) {
      setNoticeModal({ open: true, message: 'Failed to delete order.' });
      console.error('Error deleting order:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          icon: <FaClock />,
          class: 'status-pending',
          label: 'Awaiting approval',
        };
      case 'paid':
        return {
          icon: <FaBox />,
          class: 'status-confirmed',
          label: 'Paid (legacy)',
        };
      case 'confirmed':
        return {
          icon: <FaBox />,
          class: 'status-confirmed',
          label: 'Confirmed'
        };
      case 'ready':
        return {
          icon: <FaTruck />,
          class: 'status-ready',
          label: 'Ready for Pickup'
        };
      case 'completed':
        return {
          icon: <FaBox />,
          class: 'status-completed',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          icon: <FaTimes />,
          class: 'status-cancelled',
          label: 'Cancelled'
        };
      default:
        return {
          icon: <FaClock />,
          class: 'status-pending',
          label: 'Processing'
        };
    }
  };

  const handleViewInvoice = (url) => {
    setInvoiceUrl(url);
    setInvoiceModalOpen(true);
  };

  const openEmailModal = (order, type) => {
    setEmailOrder(order);
    setEmailType(type);
    setEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    setEmailOrder(null);
    setEmailType(null);
  };

  const toggleExpandRow = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const handleAttachmentChange = (e) => {
    setEmailAttachments(Array.from(e.target.files));
  };

  const handleRemoveAttachment = (index) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendOrderEmail = async () => {
    const recipient = emailOrder?.guestInfo?.email || emailOrder?.customerEmail;
    if (!recipient) {
      setEmailStatus('No customer email found.');
      return;
    }
    setSendingEmail(true);
    setEmailStatus('Sending...');
    try {
      const formData = new FormData();
      formData.append('to', recipient);
      formData.append('subject', emailSubject);
      formData.append('html', emailBody);
      if (emailCC) formData.append('cc', emailCC);
      emailAttachments.forEach((file, idx) => {
        formData.append('attachments', file);
      });
      const response = await fetch(apiUrl('/api/send-order-confirmation'), {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setEmailStatus('Email sent successfully!');
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailStatus('');
          setEmailCC('');
          setEmailAttachments([]);
        }, 1200);
      } else {
        setEmailStatus(data.error || 'Failed to send email.');
      }
    } catch (err) {
      setEmailStatus('Failed to send email.');
    }
    setSendingEmail(false);
  };

  const openManageTemplates = () => setManageTemplatesOpen(true);
  const closeManageTemplates = () => setManageTemplatesOpen(false);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    setTemplateStatus('Saving...');
    try {
      const updatedTemplates = {
        ...templates,
        [selectedTemplateType]: {
          subject: editTemplateSubject,
          body: editTemplateBody
        }
      };
      await updateDoc(firestoreDoc(db, 'config', 'orderEmailTemplates'), updatedTemplates);
      setTemplates(updatedTemplates);
      setTemplateStatus('Saved!');
      setTimeout(() => setTemplateStatus(''), 1200);
    } catch (err) {
      setTemplateStatus('Failed to save.');
    }
    setSavingTemplate(false);
  };

  // Helper to replace placeholders
  function fillTemplate(str, order) {
    if (!str) return '';
    return str
      .replace(/\{customerName\}/g, order.customerName || order.guestInfo?.name || 'Customer')
      .replace(/\{orderId\}/g, order.id || order.orderId || '');
  }

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    await deleteOrder(orderToDelete.id, orderToDelete.invoiceRef, orderToDelete.userId);
    setDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const toggleStatusFilter = useCallback((value) => {
    setStatusFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilters([]);
    setDateFrom('');
    setDateTo('');
    setMinTotal('');
    setMaxTotal('');
    setInvoiceFilter('all');
    setAccountFilter('all');
    setSortKey('createdAt');
    setSortDir('desc');
  }, []);

  const setDatePreset = useCallback((preset) => {
    const end = new Date();
    const start = new Date();
    if (preset === 'today') {
      /* start already today */
    } else if (preset === 'week') {
      start.setDate(end.getDate() - 6);
    } else if (preset === 'month') {
      start.setDate(1);
    } else if (preset === 'clear') {
      setDateFrom('');
      setDateTo('');
      return;
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
    if (key === 'createdAt' || key === 'total') return 'desc';
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

  const filteredSortedOrders = useMemo(() => {
    let list = [...orders];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((order) => {
        const name = (order.customerName || '').toLowerCase();
        const email = (order.customerEmail || '').toLowerCase();
        const id = (order.id || '').toLowerCase();
        const shortId = id.slice(-8);
        const uid = (order.userId || '').toLowerCase();
        const itemsStr = (order.items || [])
          .map((i) => `${i?.name || ''} ${i?.quantity || ''}`.toLowerCase())
          .join(' ');
        return (
          id.includes(q) ||
          shortId.includes(q) ||
          name.includes(q) ||
          email.includes(q) ||
          uid.includes(q) ||
          itemsStr.includes(q)
        );
      });
    }

    if (statusFilters.length > 0) {
      list = list.filter((order) =>
        statusFilters.includes((order.status || 'pending').toLowerCase())
      );
    }

    if (dateFrom) {
      const fromMs = new Date(`${dateFrom}T00:00:00`).getTime();
      list = list.filter((order) => getOrderCreatedMs(order) >= fromMs);
    }
    if (dateTo) {
      const toMs = new Date(`${dateTo}T23:59:59.999`).getTime();
      list = list.filter((order) => getOrderCreatedMs(order) <= toMs);
    }

    const minN = minTotal === '' ? null : Number(minTotal);
    const maxN = maxTotal === '' ? null : Number(maxTotal);
    if (minN !== null && !Number.isNaN(minN)) {
      list = list.filter((order) => orderTotalNumber(order) >= minN);
    }
    if (maxN !== null && !Number.isNaN(maxN)) {
      list = list.filter((order) => orderTotalNumber(order) <= maxN);
    }

    if (invoiceFilter === 'yes') {
      list = list.filter((order) => Boolean(order.invoiceRef));
    } else if (invoiceFilter === 'no') {
      list = list.filter((order) => !order.invoiceRef);
    }

    if (accountFilter === 'guest') {
      list = list.filter((order) => !order.userId);
    } else if (accountFilter === 'registered') {
      list = list.filter((order) => Boolean(order.userId));
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'createdAt':
          cmp = getOrderCreatedMs(a) - getOrderCreatedMs(b);
          break;
        case 'total':
          cmp = orderTotalNumber(a) - orderTotalNumber(b);
          break;
        case 'customer':
          cmp = (a.customerName || '').localeCompare(b.customerName || '', undefined, {
            sensitivity: 'base',
          });
          break;
        case 'id':
          cmp = (a.id || '').localeCompare(b.id || '');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '', undefined, { sensitivity: 'base' });
          break;
        default:
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [
    orders,
    searchQuery,
    statusFilters,
    dateFrom,
    dateTo,
    minTotal,
    maxTotal,
    invoiceFilter,
    accountFilter,
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
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchOrders}>Retry</button>
      </div>
    );
  }

  return (
    <div className="order-management">
      <div className="order-management-header">
        <div className="order-management-title-block">
          <h2>Order Management</h2>
          <p className="order-management-subtitle">
            {filteredSortedOrders.length} of {orders.length} orders
            {orders.length > 0 && filteredSortedOrders.length !== orders.length ? ' (filtered)' : ''}
          </p>
        </div>
        <button type="button" onClick={fetchOrders} className="refresh-button">
          Refresh Orders
        </button>
      </div>

      <div className="orders-toolbar">
        <div className="orders-search-row">
          <label className="orders-search-label" htmlFor="orders-search-input">
            <FaSearch className="orders-search-icon" aria-hidden />
            <span className="sr-only">Search orders</span>
          </label>
          <input
            id="orders-search-input"
            className="orders-search-input"
            type="search"
            placeholder="Search by order ID, customer, email, user ID, or product name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="orders-filters-grid">
          <div className="orders-filter-group orders-filter-group--status">
            <span className="orders-filter-label">Status</span>
            <div className="orders-status-chips" role="group" aria-label="Filter by status">
              {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`orders-chip ${statusFilters.includes(value) ? 'orders-chip--active' : ''}`}
                  onClick={() => toggleStatusFilter(value)}
                  aria-pressed={statusFilters.includes(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="orders-filter-hint">Select none to show all statuses.</p>
          </div>

          <div className="orders-filter-group">
            <span className="orders-filter-label">Placed on</span>
            <div className="orders-date-presets">
              <button type="button" className="orders-preset-btn" onClick={() => setDatePreset('today')}>
                Today
              </button>
              <button type="button" className="orders-preset-btn" onClick={() => setDatePreset('week')}>
                Last 7 days
              </button>
              <button type="button" className="orders-preset-btn" onClick={() => setDatePreset('month')}>
                This month
              </button>
              <button type="button" className="orders-preset-btn orders-preset-btn--ghost" onClick={() => setDatePreset('clear')}>
                Clear dates
              </button>
            </div>
            <div className="orders-date-inputs">
              <label className="orders-field">
                <span className="orders-field-label">From</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <label className="orders-field">
                <span className="orders-field-label">To</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="orders-filter-group orders-filter-group--compact">
            <span className="orders-filter-label">Total (£)</span>
            <div className="orders-range-row">
              <label className="orders-field">
                <span className="orders-field-label">Min</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={minTotal}
                  onChange={(e) => setMinTotal(e.target.value)}
                />
              </label>
              <label className="orders-field">
                <span className="orders-field-label">Max</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Any"
                  value={maxTotal}
                  onChange={(e) => setMaxTotal(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="orders-filter-group orders-filter-group--compact">
            <label className="orders-field orders-field--select">
              <span className="orders-filter-label">Invoice</span>
              <select value={invoiceFilter} onChange={(e) => setInvoiceFilter(e.target.value)}>
                <option value="all">All orders</option>
                <option value="yes">Has invoice</option>
                <option value="no">No invoice</option>
              </select>
            </label>
            <label className="orders-field orders-field--select">
              <span className="orders-filter-label">Account</span>
              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                <option value="all">All customers</option>
                <option value="registered">Registered</option>
                <option value="guest">Guest checkout</option>
              </select>
            </label>
          </div>

          <div className="orders-filter-group orders-filter-group--sort">
            <span className="orders-filter-label orders-filter-label--inline">
              <FaSort className="orders-sort-label-icon" aria-hidden />
              Quick sort
            </span>
            <select
              className="orders-sort-select"
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(':');
                setSortKey(k);
                setSortDir(d);
              }}
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="total:desc">Total: high → low</option>
              <option value="total:asc">Total: low → high</option>
              <option value="customer:asc">Customer A → Z</option>
              <option value="customer:desc">Customer Z → A</option>
              <option value="status:asc">Status A → Z</option>
              <option value="status:desc">Status Z → A</option>
              <option value="id:asc">Order ID (ascending)</option>
              <option value="id:desc">Order ID (descending)</option>
            </select>
            <button type="button" className="orders-clear-filters" onClick={clearAllFilters}>
              Reset filters &amp; sort
            </button>
          </div>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('id')}>
                  Order ID {sortIndicator('id')}
                </button>
              </th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('customer')}>
                  Customer {sortIndicator('customer')}
                </button>
              </th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('createdAt')}>
                  Date {sortIndicator('createdAt')}
                </button>
              </th>
              <th>Items</th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('total')}>
                  Total {sortIndicator('total')}
                </button>
              </th>
              <th>
                <button type="button" className="sortable-th" onClick={() => toggleSort('status')}>
                  Status {sortIndicator('status')}
                </button>
              </th>
              <th className="orders-th-invoice" scope="col">
                Invoice
              </th>
              <th className="orders-th-actions" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSortedOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="orders-empty-cell">
                  <div className="orders-empty">
                    <p>
                      {orders.length === 0
                        ? 'No orders yet.'
                        : 'No orders match your filters.'}
                    </p>
                    {orders.length > 0 && (
                      <button type="button" className="orders-clear-filters orders-clear-filters--inline" onClick={clearAllFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {filteredSortedOrders.map(order => {
              const formattedDate = formatDate(order.createdAt);
              const statusInfo = getStatusInfo(order.status);
              const isExpanded = expandedOrderId === order.id;
              
              return (
                <React.Fragment key={order.id}>
                  <tr>
                    <td className="order-id">
                      <span className="id-label">#{order.id.slice(-8)}</span>
                    </td>
                    <td className="customer-info">
                      <div className="customer-name">
                        <FaUser className="icon" />
                        {order.customerName || 'Unknown Customer'}
                      </div>
                      <div className="customer-email">{order.customerEmail || 'N/A'}</div>
                      {order.userId && (
                        <div className="customer-meta">User ID: {order.userId}</div>
                      )}
                      {order.userEmail && order.userEmail !== order.customerEmail && (
                        <div className="customer-meta">Account email: {order.userEmail}</div>
                      )}
                    </td>
                    <td className="order-date">
                      <div className="date">
                        <FaCalendar className="icon" />
                        {formattedDate.date}
                      </div>
                      <div className="time">{formattedDate.time}</div>
                    </td>
                    <td className="order-items">
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="order-item-mini">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">×{item.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td className="order-total">£{orderTotalNumber(order).toFixed(2)}</td>
                    <td className="order-status">
                      <span className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                    </td>
                    <td className="order-invoice">
                      {order.invoiceRef ? (
                        <button
                          className="invoice-link-btn"
                          onClick={() => handleViewInvoice(order.invoiceRef)}
                          title="View Invoice"
                          type="button"
                        >
                          <FaFileInvoice style={{ marginRight: '0.4em' }} />View Invoice
                        </button>
                      ) : (
                        <span className="orders-na">—</span>
                      )}
                    </td>
                    <td className="order-actions">
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value, order.invoiceRef)}
                        className="status-select"
                      >
                        <option value="pending">Awaiting approval</option>
                        <option value="confirmed">Confirm</option>
                        <option value="ready">Ready for Pickup</option>
                        <option value="completed">Complete</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                      {/* Manual confirm button for incomplete/unpaid/pending orders */}
                      {['pending', 'unpaid', 'incomplete'].includes((order.status || '').toLowerCase()) && (
                        <button
                          type="button"
                          className="manual-confirm-btn"
                          onClick={() => updateOrderStatus(order.id, 'confirmed', order.invoiceRef)}
                          title="Manually confirm this order and mark invoice as paid"
                        >
                          Confirm Order
                        </button>
                      )}
                      <button
                        type="button"
                        className="expand-email-btn"
                        onClick={() => toggleExpandRow(order.id)}
                        title={isExpanded ? 'Hide Email Actions' : 'Show Email Actions'}
                      >
                        <FaEnvelope /> Email {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      <button
                        type="button"
                        className="delete-order-btn"
                        onClick={() => handleDeleteClick(order)}
                        title="Delete this order and its invoice"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="email-actions-row">
                      <td colSpan={8} className="email-actions-cell">
                        <div className="email-actions-inner">
                          <button
                            type="button"
                            className="send-email-btn send-email-btn--primary"
                            onClick={() => openEmailModal(order, 'confirmation')}
                            title="Send Order Confirmation Email"
                          >
                            <FaEnvelope /> Confirmation
                          </button>
                          <button
                            type="button"
                            className="send-email-btn send-email-btn--success"
                            onClick={() => openEmailModal(order, 'complete')}
                            title="Send Order Complete Email"
                          >
                            <FaEnvelope /> Complete
                          </button>
                          <button
                            type="button"
                            className="send-email-btn send-email-btn--muted"
                            onClick={() => openEmailModal(order, 'delivery')}
                            title="Send Delivery Email"
                          >
                            <FaEnvelope /> Delivery
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoiceUrl={invoiceUrl}
      />
      {emailModalOpen && (
        <div className="newsletter-modal-overlay">
          <div className="newsletter-modal" style={{ maxWidth: 540, position: 'relative' }}>
            <button
              className="modal-close-btn"
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 24, color: '#888', cursor: 'pointer', zIndex: 2 }}
              onClick={closeEmailModal}
              type="button"
              aria-label="Close"
              disabled={sendingEmail}
            >
              <FaTimes />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>Send {emailType === 'confirmation' ? 'Order Confirmation' : emailType === 'complete' ? 'Order Complete' : 'Delivery'} Email</h3>
            <form onSubmit={e => { e.preventDefault(); handleSendOrderEmail(); }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>To:</label>
                <input type="email" value={emailOrder?.guestInfo?.email || emailOrder?.customerEmail || ''} disabled className="newsletter-add-input" style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>CC:</label>
                <input type="text" value={emailCC} onChange={e => setEmailCC(e.target.value)} className="newsletter-add-input" style={{ width: '100%', marginTop: 4 }} placeholder="Comma-separated emails (optional)" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>Subject:</label>
                <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="newsletter-add-input" style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>Body:</label>
                <ReactQuill value={emailBody} onChange={setEmailBody} theme="snow" style={{ background: '#fff', marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>Attachments:</label>
                <input type="file" multiple onChange={handleAttachmentChange} style={{ marginTop: 4 }} />
                {emailAttachments.length > 0 && (
                  <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {emailAttachments.map((file, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.97em', marginBottom: 2 }}>
                        <span>{file.name}</span>
                        <button type="button" style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 16 }} onClick={() => handleRemoveAttachment(idx)} title="Remove attachment">&times;</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {emailStatus && <div style={{ marginBottom: 10, color: emailStatus.includes('success') ? '#388e3c' : '#e74c3c' }}>{emailStatus}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end' }}>
                <button type="submit" className="newsletter-add-btn" disabled={sendingEmail}>{sendingEmail ? 'Sending...' : 'Send Email'}</button>
                <button type="button" className="newsletter-add-btn" style={{ background: '#eee', color: '#222' }} onClick={closeEmailModal} disabled={sendingEmail}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="order-mgmt-footer">
        <button type="button" className="order-mgmt-templates-btn" onClick={openManageTemplates}>
          Manage Email Templates
        </button>
      </div>
      {manageTemplatesOpen && (
        <div className="newsletter-modal-overlay">
          <div className="newsletter-modal" style={{ maxWidth: 600, position: 'relative' }}>
            <button
              className="modal-close-btn"
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 24, color: '#888', cursor: 'pointer', zIndex: 2 }}
              onClick={closeManageTemplates}
              type="button"
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>Manage Order Email Templates</h3>
            {templatesLoading ? (
              <div>Loading templates...</div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSaveTemplate(); }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, marginRight: 8 }}>Email Type:</label>
                  <select value={selectedTemplateType} onChange={e => setSelectedTemplateType(e.target.value)} className="newsletter-add-input" style={{ width: 220 }}>
                    <option value="confirmation">Order Confirmation</option>
                    <option value="complete">Order Complete</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 600 }}>Subject:</label>
                  <input type="text" value={editTemplateSubject} onChange={e => setEditTemplateSubject(e.target.value)} className="newsletter-add-input" style={{ width: '100%', marginTop: 4 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 600 }}>Body:</label>
                  <ReactQuill value={editTemplateBody} onChange={setEditTemplateBody} theme="snow" style={{ background: '#fff', marginTop: 4 }} />
                  <div style={{ fontSize: '0.95em', color: '#888', marginTop: 6 }}>
                    You can use placeholders: <b>{'{customerName}'}</b>, <b>{'{orderId}'}</b>
                  </div>
                </div>
                {templateStatus && <div style={{ marginBottom: 10, color: templateStatus.includes('Saved') ? '#388e3c' : '#e74c3c' }}>{templateStatus}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end' }}>
                  <button type="submit" className="newsletter-add-btn" disabled={savingTemplate}>{savingTemplate ? 'Saving...' : 'Save Template'}</button>
                  <button type="button" className="newsletter-add-btn" style={{ background: '#eee', color: '#222' }} onClick={closeManageTemplates} disabled={savingTemplate}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {deleteModalOpen && (
        <div className="newsletter-modal-overlay">
          <div className="newsletter-modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ color: '#e74c3c', marginTop: 0 }}>Delete Order?</h3>
            <p>Are you sure you want to delete this order and its invoice?</p>
            <div style={{ margin: '1.2em 0', fontWeight: 600 }}>
              Order ID: <span style={{ color: '#888' }}>#{orderToDelete?.id?.slice(-8)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="newsletter-add-btn" style={{ background: '#e74c3c', color: '#fff' }} onClick={handleConfirmDelete}>Delete</button>
              <button className="newsletter-add-btn" style={{ background: '#eee', color: '#222' }} onClick={handleCancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <MessageModal
        isOpen={noticeModal.open}
        onClose={() => setNoticeModal({ open: false, message: '' })}
        title="Error"
        message={noticeModal.message}
        variant="error"
      />
    </div>
  );
};

export default OrderManagement; 