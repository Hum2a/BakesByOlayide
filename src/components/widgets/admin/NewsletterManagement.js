import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import '../../styles/NewsletterManagement.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

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
        optedIn: true
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
          bodyColor
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSendStatus(`Email sent to ${data.sent} subscribers!`);
        setEmailSubject('');
        setEmailBody('');
        setSubjectColor('#000000');
        setBodyColor('#000000');
        setShowPreview(false);
      } else {
        setSendStatus(data.error || 'Failed to send email.');
      }
    } catch (err) {
      setSendStatus('Failed to send email.');
    }
    setSending(false);
  };

  if (loading) return <div>Loading newsletter subscribers...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="newsletter-container">
      <h2>Newsletter Subscribers</h2>
      {/* Marketing Email Composer */}
      <div className="marketing-email-composer">
        <h3>Send Marketing Email</h3>
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
            disabled={sending || !emailSubject || !emailBody}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NewsletterManagement; 