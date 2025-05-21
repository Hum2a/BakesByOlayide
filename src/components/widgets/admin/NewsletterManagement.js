import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import '../../styles/NewsletterManagement.css';

const NewsletterManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

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

  if (loading) return <div>Loading newsletter subscribers...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="newsletter-container">
      <h2>Newsletter Subscribers</h2>
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