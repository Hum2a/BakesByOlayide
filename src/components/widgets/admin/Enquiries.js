import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { FaEnvelope, FaCheck, FaTimes, FaClock, FaReply } from 'react-icons/fa';
import '../../styles/Enquiries.css';

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const enquiriesSnapshot = await getDocs(collection(db, 'enquiries'));
      const enquiriesData = enquiriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by timestamp, newest first
      enquiriesData.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
      setEnquiries(enquiriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setError('Failed to load enquiries');
      setLoading(false);
    }
  };

  const updateEnquiryStatus = async (enquiryId, newStatus) => {
    try {
      const enquiryRef = doc(db, 'enquiries', enquiryId);
      await updateDoc(enquiryRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      await fetchEnquiries(); // Refresh the list
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      setError('Failed to update enquiry status');
    }
  };

  const handleReply = async (enquiryId) => {
    if (!replyMessage.trim()) return;

    try {
      const enquiryRef = doc(db, 'enquiries', enquiryId);
      await updateDoc(enquiryRef, {
        status: 'replied',
        reply: replyMessage,
        repliedAt: new Date()
      });
      setReplyMessage('');
      setSelectedEnquiry(null);
      await fetchEnquiries();
    } catch (error) {
      console.error('Error sending reply:', error);
      setError('Failed to send reply');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <FaEnvelope className="status-icon new" />;
      case 'replied':
        return <FaCheck className="status-icon replied" />;
      case 'closed':
        return <FaTimes className="status-icon closed" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  if (loading) {
    return (
      <div className="enquiries-loading">
        <div className="loading-spinner"></div>
        <p>Loading enquiries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enquiries-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="enquiries-container">
      <h2>Customer Enquiries</h2>
      <div className="enquiries-list">
        {enquiries.map(enquiry => (
          <div key={enquiry.id} className="enquiry-card">
            <div className="enquiry-header">
              <div className="enquiry-status">
                {getStatusIcon(enquiry.status)}
                <span className={`status-text ${enquiry.status}`}>
                  {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                </span>
              </div>
              <div className="enquiry-date">
                {enquiry.timestamp.toDate().toLocaleDateString()}
              </div>
            </div>
            
            <div className="enquiry-details">
              <p><strong>Name:</strong> {enquiry.name}</p>
              <p><strong>Email:</strong> {enquiry.email}</p>
              <p><strong>Phone:</strong> {enquiry.phone}</p>
              <p><strong>Occasion:</strong> {enquiry.occasion}</p>
              <p><strong>Message:</strong> {enquiry.message}</p>
            </div>

            {enquiry.reply && (
              <div className="enquiry-reply">
                <p><strong>Your Reply:</strong> {enquiry.reply}</p>
                <p className="reply-date">
                  Replied on: {enquiry.repliedAt.toDate().toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="enquiry-actions">
              {enquiry.status === 'new' && (
                <button
                  className="reply-btn"
                  onClick={() => setSelectedEnquiry(enquiry.id)}
                >
                  <FaReply /> Reply
                </button>
              )}
              {enquiry.status !== 'closed' && (
                <button
                  className="close-btn"
                  onClick={() => updateEnquiryStatus(enquiry.id, 'closed')}
                >
                  <FaTimes /> Close
                </button>
              )}
            </div>

            {selectedEnquiry === enquiry.id && (
              <div className="reply-form">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  rows="4"
                />
                <div className="reply-form-actions">
                  <button
                    className="send-reply-btn"
                    onClick={() => handleReply(enquiry.id)}
                  >
                    Send Reply
                  </button>
                  <button
                    className="cancel-reply-btn"
                    onClick={() => {
                      setSelectedEnquiry(null);
                      setReplyMessage('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Enquiries; 