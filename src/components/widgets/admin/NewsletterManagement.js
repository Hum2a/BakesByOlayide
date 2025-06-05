import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import '../../styles/NewsletterManagement.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const MARKETING_EMAIL = process.env.ZOHO_MARKETING_USER || 'marketing@bakesbyolayide.com';

const NewsletterManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [subjectColor, setSubjectColor] = useState('#000000');
  const [bodyColor, setBodyColor] = useState('#000000');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubscriber, setEditSubscriber] = useState(null);
  const [editLists, setEditLists] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [selectedLists, setSelectedLists] = useState([]);
  const [availableLists, setAvailableLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [newListKey, setNewListKey] = useState('');
  const [newListLabel, setNewListLabel] = useState('');
  const [listEditStates, setListEditStates] = useState({});
  const [listManageError, setListManageError] = useState('');
  const [listManageLoading, setListManageLoading] = useState(false);
  const [showListKeyTooltip, setShowListKeyTooltip] = useState(false);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'newsletter'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubscribers(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load newsletter subscribers');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    async function fetchLists() {
      setListsLoading(true);
      try {
        const configDoc = await getDoc(doc(db, 'config', 'emailLists'));
        const data = configDoc.data();
        if (data && Array.isArray(data.lists)) {
          setAvailableLists(data.lists);
        } else {
          setAvailableLists([]);
        }
      } catch (err) {
        setAvailableLists([]);
      }
      setListsLoading(false);
    }
    fetchLists();
  }, []);

  useEffect(() => {
    if (availableLists.length > 0) {
      setSelectedLists([availableLists[0].key]);
    }
  }, [availableLists]);

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!newEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      setAddError('Please enter a valid email address.');
      return;
    }
    try {
      await setDoc(doc(db, 'newsletter', newEmail), {
        email: newEmail,
        subscribedAt: new Date(),
        optedIn: true,
        lists: ['newsletter']
      });
      setAddSuccess('Subscriber added!');
      setNewEmail('');
      fetchSubscribers();
    } catch (err) {
      setAddError('Failed to add subscriber.');
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm(`Delete subscriber ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'newsletter', email));
      fetchSubscribers();
    } catch (err) {
      alert('Failed to delete subscriber.');
    }
  };

  const handleToggleOptIn = async (email, currentStatus) => {
    try {
      await updateDoc(doc(db, 'newsletter', email), { optedIn: !currentStatus });
      fetchSubscribers();
    } catch (err) {
      alert('Failed to update opt-in status.');
    }
  };

  const handleToggleList = (listKey) => {
    setSelectedLists(prev =>
      prev.includes(listKey)
        ? prev.filter(l => l !== listKey)
        : [...prev, listKey]
    );
  };

  const handleSendMarketingEmail = async () => {
    setSending(true);
    setSendStatus('Sending...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/send-marketing-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject: emailSubject, 
          html: emailBody,
          subjectColor,
          bodyColor,
          lists: selectedLists
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSendStatus(`Email sent to ${data.sent} subscribers!`);
        setEmailSubject('');
        setEmailBody('');
        setSubjectColor('#000000');
        setBodyColor('#000000');
        setSelectedLists([availableLists[0].key]);
        setShowPreview(false);
      } else {
        setSendStatus(data.error || 'Failed to send email.');
      }
    } catch (err) {
      setSendStatus('Failed to send email.');
    }
    setSending(false);
  };

  const openEditModal = (subscriber) => {
    setEditSubscriber(subscriber);
    setEditLists(subscriber.lists || []);
    setEditError('');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditSubscriber(null);
    setEditLists([]);
    setEditError('');
  };

  const handleEditListChange = (listKey) => {
    setEditLists(prev =>
      prev.includes(listKey)
        ? prev.filter(l => l !== listKey)
        : [...prev, listKey]
    );
  };

  const handleSaveEditLists = async () => {
    if (!editSubscriber) return;
    setEditLoading(true);
    setEditError('');
    try {
      await updateDoc(doc(db, 'newsletter', editSubscriber.email), { lists: editLists });
      setEditModalOpen(false);
      fetchSubscribers();
    } catch (err) {
      setEditError('Failed to update lists.');
    }
    setEditLoading(false);
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    setListManageError('');
    if (!newListKey.trim() || !newListLabel.trim()) {
      setListManageError('Both key and label are required.');
      return;
    }
    if (availableLists.some(l => l.key === newListKey.trim())) {
      setListManageError('Key must be unique.');
      return;
    }
    setListManageLoading(true);
    try {
      const updatedLists = [...availableLists, { key: newListKey.trim(), label: newListLabel.trim() }];
      await updateDoc(doc(db, 'config', 'emailLists'), { lists: updatedLists });
      setAvailableLists(updatedLists);
      setNewListKey('');
      setNewListLabel('');
    } catch (err) {
      setListManageError('Failed to add list.');
    }
    setListManageLoading(false);
  };

  const handleStartEditList = (key, label) => {
    setListEditStates(prev => ({ ...prev, [key]: { editing: true, label } }));
  };

  const handleEditListLabelChange = (key, label) => {
    setListEditStates(prev => ({ ...prev, [key]: { ...prev[key], label } }));
  };

  const handleSaveEditList = async (key) => {
    setListManageError('');
    setListManageLoading(true);
    try {
      const updatedLists = availableLists.map(l => l.key === key ? { ...l, label: listEditStates[key].label } : l);
      await updateDoc(doc(db, 'config', 'emailLists'), { lists: updatedLists });
      setAvailableLists(updatedLists);
      setListEditStates(prev => ({ ...prev, [key]: { editing: false, label: listEditStates[key].label } }));
    } catch (err) {
      setListManageError('Failed to update list label.');
    }
    setListManageLoading(false);
  };

  const handleCancelEditList = (key) => {
    setListEditStates(prev => ({ ...prev, [key]: { editing: false, label: availableLists.find(l => l.key === key)?.label || '' } }));
  };

  const handleDeleteList = async (key) => {
    if (!window.confirm('Are you sure you want to delete this list? This cannot be undone.')) return;
    setListManageError('');
    setListManageLoading(true);
    try {
      const updatedLists = availableLists.filter(l => l.key !== key);
      await updateDoc(doc(db, 'config', 'emailLists'), { lists: updatedLists });
      setAvailableLists(updatedLists);
      setListEditStates(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    } catch (err) {
      setListManageError('Failed to delete list.');
    }
    setListManageLoading(false);
  };

  if (loading) return <div>Loading newsletter subscribers...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="newsletter-container">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, flex: 1 }}>Newsletter Subscribers</h2>
        <div
          className="newsletter-tooltip-icon"
          tabIndex={0}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          style={{ marginLeft: 8, cursor: 'pointer', position: 'relative' }}
        >
          <span style={{ fontSize: 22, color: '#F3C307', fontWeight: 700 }}>ℹ️</span>
          {showTooltip && (
            <div className="newsletter-tooltip-box">
              <strong>How this page works:</strong>
              <ul style={{ margin: '0.5em 0 0.5em 1.2em', padding: 0, fontSize: '1em' }}>
                <li>View, add, remove, and manage newsletter subscribers.</li>
                <li>Compose and send marketing emails to all opted-in subscribers.</li>
                <li>Choose custom subject and body text colors for your marketing emails.</li>
                <li>Only subscribers who are opted in will receive marketing emails.</li>
              </ul>
              <div style={{ marginTop: 8 }}>
                <strong>Marketing emails are sent from:</strong><br />
                <span style={{ color: '#388e3c', fontWeight: 500 }}>{MARKETING_EMAIL}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Marketing Email Composer */}
      <div className="marketing-email-composer">
        <h3>Send Marketing Email</h3>
        {listsLoading ? (
          <div>Loading lists...</div>
        ) : (
          <div className="newsletter-send-lists-row">
            <span style={{ fontWeight: 600, marginRight: 8 }}>Send To Lists:</span>
            {availableLists.map(list => (
              <label key={list.key} className="newsletter-list-checkbox-label" style={{ marginRight: 16 }}>
                <input
                  type="checkbox"
                  checked={selectedLists.includes(list.key)}
                  onChange={() => handleToggleList(list.key)}
                />
                {list.label}
              </label>
            ))}
          </div>
        )}
        <div className="email-subject-row">
          <input
            type="text"
            className="newsletter-add-input"
            placeholder="Email Subject"
            value={emailSubject}
            onChange={e => setEmailSubject(e.target.value)}
            style={{ marginBottom: 0, width: '100%' }}
          />
          <div className="color-picker-container-inline">
            <label>Subject Color:</label>
            <input
              type="color"
              value={subjectColor}
              onChange={e => setSubjectColor(e.target.value)}
              className="color-picker"
            />
          </div>
        </div>
        <div className="email-body-row">
          <div className="color-picker-container-inline">
            <label>Body Text Color:</label>
            <input
              type="color"
              value={bodyColor}
              onChange={e => setBodyColor(e.target.value)}
              className="color-picker"
            />
          </div>
        </div>
        <ReactQuill
          value={emailBody}
          onChange={setEmailBody}
          theme="snow"
          style={{ marginBottom: '1rem', background: '#fff' }}
        />
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            className="newsletter-add-btn"
            type="button"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            className="newsletter-add-btn"
            type="button"
            disabled={sending || !emailSubject || !emailBody || selectedLists.length === 0}
            onClick={handleSendMarketingEmail}
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
        {sendStatus && <div style={{ marginBottom: '1rem', color: '#388e3c' }}>{sendStatus}</div>}
        {showPreview && (
          <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 16, background: '#fafafa', marginBottom: 16 }}>
            <h4 style={{ marginTop: 0, color: subjectColor }}>{emailSubject}</h4>
            <div style={{ color: bodyColor }} dangerouslySetInnerHTML={{ __html: emailBody }} />
          </div>
        )}
      </div>
      {/* End Marketing Email Composer */}
      <form className="newsletter-add-form" onSubmit={handleAddSubscriber}>
        <input
          type="email"
          placeholder="Add new subscriber email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          className="newsletter-add-input"
        />
        <button type="submit" className="newsletter-add-btn">Add</button>
      </form>
      {addError && <div className="newsletter-add-error">{addError}</div>}
      {addSuccess && <div className="newsletter-add-success">{addSuccess}</div>}
      <table className="newsletter-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Subscribed At</th>
            <th>Opted In</th>
            <th>Lists</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map(sub => (
            <tr key={sub.id}>
              <td>{sub.email}</td>
              <td>{sub.subscribedAt?.toDate ? sub.subscribedAt.toDate().toLocaleString() : new Date(sub.subscribedAt).toLocaleString()}</td>
              <td className={sub.optedIn ? 'newsletter-optin-yes' : 'newsletter-optin-no'}>{sub.optedIn ? 'Yes' : 'No'}</td>
              <td>
                {(sub.lists || []).map(listKey => {
                  const list = availableLists.find(l => l.key === listKey);
                  return list ? (
                    <span key={listKey} className={`newsletter-list-badge newsletter-list-badge-${listKey}`}>{list.label}</span>
                  ) : null;
                })}
              </td>
              <td>
                <button
                  className={sub.optedIn ? 'newsletter-action-btn deactivate' : 'newsletter-action-btn activate'}
                  onClick={() => handleToggleOptIn(sub.email, sub.optedIn)}
                  title={sub.optedIn ? 'Deactivate' : 'Activate'}
                >
                  {sub.optedIn ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="newsletter-action-btn delete"
                  onClick={() => handleDelete(sub.email)}
                  title="Delete"
                >
                  Delete
                </button>
                <button
                  className="newsletter-action-btn edit"
                  onClick={() => openEditModal(sub)}
                  title="Edit Lists"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Edit Lists Modal */}
      {editModalOpen && (
        <div className="newsletter-modal-overlay">
          <div className="newsletter-modal">
            <h3>Edit Lists for {editSubscriber.email}</h3>
            <form onSubmit={e => { e.preventDefault(); handleSaveEditLists(); }}>
              <div className="newsletter-lists-checkboxes">
                {availableLists.map(list => (
                  <label key={list.key} className="newsletter-list-checkbox-label">
                    <input
                      type="checkbox"
                      checked={editLists.includes(list.key)}
                      onChange={() => handleEditListChange(list.key)}
                    />
                    {list.label}
                  </label>
                ))}
              </div>
              {editError && <div className="newsletter-add-error">{editError}</div>}
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button type="submit" className="newsletter-add-btn" disabled={editLoading}>Save</button>
                <button type="button" className="newsletter-add-btn" onClick={closeEditModal} style={{ background: '#eee', color: '#222' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="newsletter-manage-lists-section">
        <h3>Manage Email Lists</h3>
        <form className="newsletter-add-list-form" onSubmit={handleAddList}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="List Key (e.g. newsletter)"
              value={newListKey}
              onChange={e => setNewListKey(e.target.value)}
              className="newsletter-add-input"
              style={{ width: 180 }}
              disabled={listManageLoading}
              onFocus={() => setShowListKeyTooltip(true)}
              onBlur={() => setShowListKeyTooltip(false)}
            />
            <span
              className="newsletter-tooltip-icon"
              tabIndex={0}
              onMouseEnter={() => setShowListKeyTooltip(true)}
              onMouseLeave={() => setShowListKeyTooltip(false)}
              onFocus={() => setShowListKeyTooltip(true)}
              onBlur={() => setShowListKeyTooltip(false)}
              style={{ marginLeft: 6, cursor: 'pointer', fontSize: 18 }}
            >
              ℹ️
              {showListKeyTooltip && (
                <div className="newsletter-tooltip-box" style={{ left: 0, top: '2.2rem', minWidth: 260, maxWidth: 320 }}>
                  Use only lowercase letters, numbers, and underscores.<br />
                  For multiple words, use underscores (e.g. <b>special_offers</b>).
                </div>
              )}
            </span>
          </div>
          <input
            type="text"
            placeholder="List Label (e.g. Newsletter)"
            value={newListLabel}
            onChange={e => setNewListLabel(e.target.value)}
            className="newsletter-add-input"
            style={{ width: 220 }}
            disabled={listManageLoading}
          />
          <button type="submit" className="newsletter-add-btn" disabled={listManageLoading}>Add List</button>
        </form>
        {listManageError && <div className="newsletter-add-error">{listManageError}</div>}
        <div className="newsletter-lists-table">
          {availableLists.map(list => (
            <div key={list.key} className="newsletter-list-row">
              <span className={`newsletter-list-badge newsletter-list-badge-${list.key}`}>{list.key}</span>
              {listEditStates[list.key]?.editing ? (
                <>
                  <input
                    type="text"
                    value={listEditStates[list.key].label}
                    onChange={e => handleEditListLabelChange(list.key, e.target.value)}
                    className="newsletter-add-input"
                    style={{ width: 180, marginLeft: 8 }}
                    disabled={listManageLoading}
                  />
                  <button className="newsletter-add-btn" style={{ marginLeft: 8 }} onClick={() => handleSaveEditList(list.key)} disabled={listManageLoading}>Save</button>
                  <button className="newsletter-add-btn" style={{ marginLeft: 8, background: '#eee', color: '#222' }} onClick={() => handleCancelEditList(list.key)} disabled={listManageLoading}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ marginLeft: 12, fontWeight: 600 }}>{list.label}</span>
                  <button className="newsletter-add-btn" style={{ marginLeft: 8 }} onClick={() => handleStartEditList(list.key, list.label)} disabled={listManageLoading}>Rename</button>
                  <button className="newsletter-add-btn" style={{ marginLeft: 8, background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c' }} onClick={() => handleDeleteList(list.key)} disabled={listManageLoading}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsletterManagement; 