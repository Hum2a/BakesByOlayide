import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, getDocs, orderBy, doc as firestoreDoc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { FaCalendar, FaUser, FaClock, FaBox, FaTruck, FaTimes, FaFileInvoice, FaEnvelope, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import InvoiceModal from './InvoiceModal';
import '../../styles/OrderManagement.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
      alert('Failed to delete order.');
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
    if (!emailOrder?.customerEmail) {
      setEmailStatus('No customer email found.');
      return;
    }
    setSendingEmail(true);
    setEmailStatus('Sending...');
    try {
      const formData = new FormData();
      formData.append('to', emailOrder.customerEmail);
      formData.append('subject', emailSubject);
      formData.append('html', emailBody);
      if (emailCC) formData.append('cc', emailCC);
      emailAttachments.forEach((file, idx) => {
        formData.append('attachments', file);
      });
      const response = await fetch('/api/send-order-confirmation', {
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
      .replace(/\{customerName\}/g, order.customerName || 'Customer')
      .replace(/\{orderId\}/g, order.id || '');
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
        <h2>Order Management</h2>
        <button onClick={fetchOrders} className="refresh-button">
          Refresh Orders
        </button>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Invoice</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
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
                      {/* Show userId and userEmail if available */}
                      {order.userId && (
                        <div className="customer-userid" style={{ color: '#bbb', fontSize: '0.8em', marginLeft: '1.5rem' }}>User ID: {order.userId}</div>
                      )}
                      {order.userEmail && order.userEmail !== order.customerEmail && (
                        <div className="customer-useremail" style={{ color: '#bbb', fontSize: '0.8em', marginLeft: '1.5rem' }}>User Email: {order.userEmail}</div>
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
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item-mini">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">×{item.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td className="order-total">£{order.total.toFixed(2)}</td>
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
                        <span style={{ color: '#bbb' }}>N/A</span>
                      )}
                    </td>
                    <td className="order-actions">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value, order.invoiceRef)}
                        className="status-select"
                      >
                        <option value="confirmed">Confirm</option>
                        <option value="ready">Ready for Pickup</option>
                        <option value="completed">Complete</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                      {/* Manual confirm button for incomplete/unpaid/pending orders */}
                      {['pending', 'unpaid', 'incomplete'].includes((order.status || '').toLowerCase()) && (
                        <button
                          className="manual-confirm-btn"
                          style={{ marginTop: 8, background: '#f3c307', color: '#111', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => updateOrderStatus(order.id, 'confirmed', order.invoiceRef)}
                          title="Manually confirm this order and mark invoice as paid"
                        >
                          Confirm Order
                        </button>
                      )}
                      {/* Expand Email Actions */}
                      <button
                        className="expand-email-btn"
                        style={{ marginTop: 8, background: '#ffe066', color: '#222', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => toggleExpandRow(order.id)}
                        title={isExpanded ? 'Hide Email Actions' : 'Show Email Actions'}
                        type="button"
                      >
                        <FaEnvelope /> Email {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      {/* Delete order button */}
                      <button
                        className="delete-order-btn"
                        style={{ marginTop: 8, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleDeleteClick(order)}
                        title="Delete this order and its invoice"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="email-actions-row">
                      <td colSpan={8} style={{ background: '#fffbe6', padding: '1.2em 2em' }}>
                        <div style={{ display: 'flex', gap: '1.2em', flexWrap: 'wrap' }}>
                          <button
                            className="send-email-btn"
                            style={{ background: '#3498db', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1.2rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => openEmailModal(order, 'confirmation')}
                            title="Send Order Confirmation Email"
                            type="button"
                          >
                            <FaEnvelope /> Confirmation
                          </button>
                          <button
                            className="send-email-btn"
                            style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1.2rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => openEmailModal(order, 'complete')}
                            title="Send Order Complete Email"
                            type="button"
                          >
                            <FaEnvelope /> Complete
                          </button>
                          <button
                            className="send-email-btn"
                            style={{ background: '#f3c307', color: '#111', border: 'none', borderRadius: 6, padding: '0.4rem 1.2rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => openEmailModal(order, 'delivery')}
                            title="Send Delivery Email"
                            type="button"
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
                <input type="email" value={emailOrder?.customerEmail || ''} disabled className="newsletter-add-input" style={{ width: '100%', marginTop: 4 }} />
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="newsletter-add-btn" style={{ background: '#ffe066', color: '#222' }} onClick={openManageTemplates}>
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
    </div>
  );
};

export default OrderManagement; 