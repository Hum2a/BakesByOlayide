import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { FaEnvelope, FaCheck, FaTimes, FaClock, FaReply, FaFilter, FaSearch } from 'react-icons/fa';
import '../../styles/Enquiries.css';

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchEnquiries();
  }, [sortBy]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'enquiries'), orderBy('timestamp', sortBy === 'newest' ? 'desc' : 'asc'));
      const enquiriesSnapshot = await getDocs(q);
      const enquiriesData = enquiriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
      await fetchEnquiries();
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

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      
      <div className="enquiries-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="enquiries-list">
        {filteredEnquiries.map(enquiry => (
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
                    disabled={!replyMessage.trim()}
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