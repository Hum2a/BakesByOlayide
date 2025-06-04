import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AdminTestEmail = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await fetch(`${API_BASE_URL}/api/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email }),
      });
      if (res.ok) {
        setStatus('Test email sent successfully!');
      } else {
        const data = await res.json();
        setStatus('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <div className="admin-test-email">
      <h2>Send Test Email</h2>
      <form onSubmit={handleSend} style={{ marginBottom: '1rem' }}>
        <input
          type="email"
          placeholder="Recipient email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: '1rem', minWidth: 250 }}
        />
        <button type="submit" style={{ padding: '0.5rem 1.5rem' }}>Send Test Email</button>
      </form>
      {status && <div style={{ marginTop: '1rem' }}>{status}</div>}
    </div>
  );
};

export default AdminTestEmail; 