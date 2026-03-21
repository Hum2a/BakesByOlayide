import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import {
  FaEnvelope,
  FaCheck,
  FaTimes,
  FaClock,
  FaReply,
  FaSearch,
  FaSync,
  FaCopy,
  FaCalendarAlt,
  FaSort,
  FaChevronDown,
  FaChevronUp,
  FaRedo,
  FaInbox,
} from 'react-icons/fa';
import '../../styles/Enquiries.css';
import { apiUrl } from '../../../config/environment';

const MESSAGE_PREVIEW_LEN = 220;
const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
  { value: 'pending', label: 'Pending' },
];

function getTimestampMs(data) {
  const t = data?.timestamp;
  if (!t) return null;
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  const d = new Date(t);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function getRepliedAtMs(data) {
  const t = data?.repliedAt;
  if (!t) return null;
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  const d = new Date(t);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function displayName(enquiry) {
  if (enquiry.name?.trim()) return enquiry.name.trim();
  const n = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim();
  return n || '—';
}

function messageBody(enquiry) {
  return (enquiry.message || enquiry.inquiry || '').trim() || '—';
}

function occasionLine(enquiry) {
  return enquiry.occasion || enquiry.subject || '—';
}

function normalizeStatus(enquiry) {
  const s = (enquiry.status || 'new').toLowerCase();
  if (['new', 'replied', 'closed', 'pending'].includes(s)) return s;
  return 'pending';
}

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    fetchEnquiries(true);
  }, []);

  useEffect(() => {
    if (!copyFeedback) return undefined;
    const t = setTimeout(() => setCopyFeedback(''), 2200);
    return () => clearTimeout(t);
  }, [copyFeedback]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedEnquiry(null);
        setReplyMessage('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fetchEnquiries = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const q = query(collection(db, 'enquiries'), orderBy('timestamp', 'desc'));
      const enquiriesSnapshot = await getDocs(q);
      const enquiriesData = enquiriesSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setEnquiries(enquiriesData);
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError('Failed to load enquiries');
    } finally {
      if (isInitialLoad) setLoading(false);
      else setRefreshing(false);
    }
  };

  const updateEnquiryStatus = async (enquiryId, newStatus) => {
    try {
      setError(null);
      const enquiryRef = doc(db, 'enquiries', enquiryId);
      await updateDoc(enquiryRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      await fetchEnquiries(false);
    } catch (err) {
      console.error('Error updating enquiry status:', err);
      setError('Failed to update enquiry status');
    }
  };

  const handleReply = async (enquiryId) => {
    if (!replyMessage.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      setError(null);
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (!enquiry) throw new Error('Enquiry not found');

      const response = await fetch(apiUrl('/api/send-enquiry-reply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: enquiry.email,
          subject: `Re: Your Enquiry to Bakes by Olayide`,
          html: `<p>Dear ${displayName(enquiry) === '—' ? 'Customer' : displayName(enquiry)},</p>
                 <p>${replyMessage.replace(/\n/g, '<br/>')}</p>
                 <p style="margin-top:2em;">Best regards,<br/>Bakes by Olayide Team</p>`,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        setError('Failed to send reply email: ' + errorText);
        return;
      }

      const enquiryRef = doc(db, 'enquiries', enquiryId);
      await updateDoc(enquiryRef, {
        status: 'replied',
        reply: replyMessage,
        repliedAt: new Date(),
      });
      setReplyMessage('');
      setSelectedEnquiry(null);
      await fetchEnquiries(false);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply: ' + (err.message || err));
    } finally {
      setSendingReply(false);
    }
  };

  const toggleStatusFilter = useCallback((value) => {
    setStatusFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilters([]);
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  }, []);

  const toggleExpanded = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyToClipboard = useCallback((text, label) => {
    if (!text || text === '—') return;
    navigator.clipboard?.writeText(text).then(
      () => setCopyFeedback(label || 'Copied'),
      () => setCopyFeedback('Copy failed')
    );
  }, []);

  const filteredSorted = useMemo(() => {
    let list = enquiries.filter((enquiry) => {
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const name = displayName(enquiry).toLowerCase();
        const email = (enquiry.email || '').toLowerCase();
        const msg = messageBody(enquiry).toLowerCase();
        const occ = occasionLine(enquiry).toLowerCase();
        const phone = (enquiry.phone || '').toLowerCase();
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !msg.includes(q) &&
          !occ.includes(q) &&
          !phone.includes(q) &&
          !enquiry.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      const st = normalizeStatus(enquiry);
      if (statusFilters.length > 0 && !statusFilters.includes(st)) return false;

      const ms = getTimestampMs(enquiry);
      if (dateFrom && ms != null) {
        const from = new Date(`${dateFrom}T00:00:00`).getTime();
        if (ms < from) return false;
      }
      if (dateTo && ms != null) {
        const to = new Date(`${dateTo}T23:59:59.999`).getTime();
        if (ms > to) return false;
      }
      if ((dateFrom || dateTo) && ms == null) return false;

      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      const nameA = displayName(a);
      const nameB = displayName(b);
      const msA = getTimestampMs(a) ?? 0;
      const msB = getTimestampMs(b) ?? 0;
      switch (sortBy) {
        case 'oldest':
          return msA - msB;
        case 'name-asc':
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        case 'name-desc':
          return nameB.localeCompare(nameA, undefined, { sensitivity: 'base' });
        case 'newest':
        default:
          return msB - msA;
      }
    });
    return sorted;
  }, [enquiries, searchTerm, statusFilters, dateFrom, dateTo, sortBy]);

  const stats = useMemo(() => {
    const counts = { new: 0, replied: 0, closed: 0, pending: 0 };
    enquiries.forEach((e) => {
      counts[normalizeStatus(e)] += 1;
    });
    return counts;
  }, [enquiries]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <FaEnvelope className="status-icon new" aria-hidden />;
      case 'replied':
        return <FaCheck className="status-icon replied" aria-hidden />;
      case 'closed':
        return <FaTimes className="status-icon closed" aria-hidden />;
      default:
        return <FaClock className="status-icon pending" aria-hidden />;
    }
  };

  const formatDateTime = (ms) => {
    if (ms == null) return '—';
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="enquiries-admin enquiries-admin--loading" aria-busy="true">
        <div className="enquiries-skeleton enquiries-skeleton--hero" />
        <div className="enquiries-skeleton-toolbar">
          <div className="enquiries-skeleton enquiries-skeleton--search" />
          <div className="enquiries-skeleton enquiries-skeleton--chip" />
          <div className="enquiries-skeleton enquiries-skeleton--chip" />
        </div>
        <div className="enquiries-skeleton-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="enquiries-skeleton enquiries-skeleton--card" />
          ))}
        </div>
        <p className="enquiries-loading-text">Loading enquiries…</p>
      </div>
    );
  }

  if (error && enquiries.length === 0) {
    return (
      <div className="enquiries-error enquiries-error--standalone">
        <p>{error}</p>
        <button type="button" className="enquiries-btn enquiries-btn--primary" onClick={() => fetchEnquiries(true)}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="enquiries-admin">
      {copyFeedback && (
        <div className="enquiries-toast" role="status">
          {copyFeedback}
        </div>
      )}

      <header className="enquiries-header">
        <div className="enquiries-header-text">
          <h2>Customer Enquiries</h2>
          <p className="enquiries-subtitle">
            {filteredSorted.length} of {enquiries.length} shown
            {enquiries.length > 0 && filteredSorted.length !== enquiries.length ? ' · filtered' : ''}
          </p>
        </div>
        <button type="button" className="enquiries-refresh" onClick={fetchEnquiries}>
          <FaSync className={loading ? 'enquiries-refresh-icon enquiries-refresh-icon--spin' : 'enquiries-refresh-icon'} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="enquiries-banner" role="alert">
          <span>{error}</span>
          <button type="button" className="enquiries-banner-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <section className="enquiries-stats" aria-label="Enquiry counts">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <div key={value} className={`enquiries-stat enquiries-stat--${value}`}>
            <span className="enquiries-stat-value">{stats[value] ?? 0}</span>
            <span className="enquiries-stat-label">{label}</span>
          </div>
        ))}
        <div className="enquiries-stat enquiries-stat--total">
          <span className="enquiries-stat-value">{enquiries.length}</span>
          <span className="enquiries-stat-label">Total</span>
        </div>
      </section>

      <section className="enquiries-toolbar" aria-label="Search and filters">
        <div className="enquiries-search-wrap">
          <label className="enquiries-search" htmlFor="enquiries-search-input">
            <FaSearch className="enquiries-search-icon" aria-hidden />
            <span className="sr-only">Search enquiries</span>
          </label>
          <input
            id="enquiries-search-input"
            className="enquiries-search-input"
            type="search"
            placeholder="Search name, email, phone, message, subject, or ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="enquiries-toolbar-row">
          <span className="enquiries-toolbar-label">Status</span>
          <div className="enquiries-chips" role="group">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`enquiries-chip ${statusFilters.includes(value) ? 'enquiries-chip--on' : ''}`}
                onClick={() => toggleStatusFilter(value)}
                aria-pressed={statusFilters.includes(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="enquiries-hint">No chip selected = all statuses.</p>
        </div>

        <div className="enquiries-toolbar-dates">
          <span className="enquiries-toolbar-label">
            <FaCalendarAlt aria-hidden /> Received
          </span>
          <div className="enquiries-date-fields">
            <label className="enquiries-date-field">
              <span>From</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="enquiries-date-field">
              <span>To</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
            <button type="button" className="enquiries-link-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear dates
            </button>
          </div>
        </div>

        <div className="enquiries-toolbar-sort">
          <span className="enquiries-toolbar-label">
            <FaSort aria-hidden /> Sort
          </span>
          <select className="enquiries-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
          </select>
          <button type="button" className="enquiries-link-btn" onClick={clearFilters}>
            Reset filters
          </button>
        </div>
      </section>

      <div className="enquiries-list">
        {filteredSorted.length === 0 && (
          <div className="enquiries-empty">
            <span className="enquiries-empty-icon" aria-hidden>
              <FaInbox />
            </span>
            <p>{enquiries.length === 0 ? 'No enquiries yet.' : 'Nothing matches your filters.'}</p>
            {enquiries.length > 0 && (
              <button type="button" className="enquiries-btn enquiries-btn--ghost" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {filteredSorted.map((enquiry, index) => {
          const st = normalizeStatus(enquiry);
          const msg = messageBody(enquiry);
          const longMsg = msg.length > MESSAGE_PREVIEW_LEN;
          const expanded = expandedIds.has(enquiry.id);
          const showMsg = !longMsg || expanded ? msg : `${msg.slice(0, MESSAGE_PREVIEW_LEN)}…`;
          const ts = getTimestampMs(enquiry);

          return (
            <article
              key={enquiry.id}
              className={`enquiry-card enquiry-card--${st}`}
              style={{ '--enq-i': index }}
            >
              <div className="enquiry-card-glow" aria-hidden />

              <div className="enquiry-header">
                <div className="enquiry-status">
                  {getStatusIcon(st)}
                  <span className={`status-text ${st}`}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </span>
                </div>
                <time className="enquiry-date" dateTime={ts != null ? new Date(ts).toISOString() : undefined}>
                  <FaCalendarAlt className="enquiry-date-icon" aria-hidden />
                  {formatDateTime(ts)}
                </time>
              </div>

              <div className="enquiry-details">
                <div className="enquiry-field">
                  <strong>Name</strong>
                  <span>{displayName(enquiry)}</span>
                </div>
                <div className="enquiry-field enquiry-field--row">
                  <strong>Email</strong>
                  <span className="enquiry-field-grow">
                    {enquiry.email ? (
                      <a className="enquiry-mailto" href={`mailto:${enquiry.email}`}>
                        {enquiry.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                  {enquiry.email && (
                    <button
                      type="button"
                      className="enquiry-icon-btn"
                      title="Copy email"
                      onClick={() => copyToClipboard(enquiry.email, 'Email copied')}
                    >
                      <FaCopy aria-hidden />
                    </button>
                  )}
                </div>
                <div className="enquiry-field">
                  <strong>Phone</strong>
                  <span>{enquiry.phone || '—'}</span>
                </div>
                <div className="enquiry-field">
                  <strong>Occasion / subject</strong>
                  <span>{occasionLine(enquiry)}</span>
                </div>
                <div className="enquiry-field enquiry-field--message">
                  <strong>Message</strong>
                  <p className="enquiry-message">{showMsg}</p>
                  {longMsg && (
                    <button
                      type="button"
                      className="enquiry-toggle-msg"
                      onClick={() => toggleExpanded(enquiry.id)}
                    >
                      {expanded ? (
                        <>
                          Show less <FaChevronUp aria-hidden />
                        </>
                      ) : (
                        <>
                          Read more <FaChevronDown aria-hidden />
                        </>
                      )}
                    </button>
                  )}
                  {msg !== '—' && (
                    <button
                      type="button"
                      className="enquiry-toggle-msg enquiry-toggle-msg--secondary"
                      onClick={() => copyToClipboard(msg, 'Message copied')}
                    >
                      <FaCopy aria-hidden /> Copy message
                    </button>
                  )}
                </div>
              </div>

              {enquiry.reply && (
                <div className="enquiry-reply">
                  <p>
                    <strong>Your reply</strong>
                  </p>
                  <p className="enquiry-reply-body">{enquiry.reply}</p>
                  <p className="reply-date">
                    Replied {formatDateTime(getRepliedAtMs(enquiry))}
                  </p>
                </div>
              )}

              <div className="enquiry-actions">
                {st === 'new' && (
                  <button
                    type="button"
                    className="enquiries-btn enquiries-btn--reply"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEnquiry((cur) => {
                        if (cur === enquiry.id) {
                          setReplyMessage('');
                          return null;
                        }
                        setReplyMessage('');
                        return enquiry.id;
                      });
                    }}
                  >
                    <FaReply aria-hidden /> Reply
                  </button>
                )}
                {st !== 'closed' && (
                  <button
                    type="button"
                    className="enquiries-btn enquiries-btn--close"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateEnquiryStatus(enquiry.id, 'closed');
                    }}
                  >
                    <FaTimes aria-hidden /> Close
                  </button>
                )}
                {st === 'closed' && (
                  <button
                    type="button"
                    className="enquiries-btn enquiries-btn--reopen"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateEnquiryStatus(enquiry.id, 'new');
                    }}
                  >
                    <FaRedo aria-hidden /> Reopen
                  </button>
                )}
              </div>

              <div className={`reply-form-shell ${selectedEnquiry === enquiry.id ? 'reply-form-shell--open' : ''}`}>
                <div className="reply-form-measure">
                  <div className="reply-form">
                    <label className="sr-only" htmlFor={`reply-${enquiry.id}`}>
                      Reply message
                    </label>
                    <textarea
                      id={`reply-${enquiry.id}`}
                      value={selectedEnquiry === enquiry.id ? replyMessage : ''}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Write your reply… (Esc to cancel)"
                      rows={4}
                    />
                    <div className="reply-form-actions">
                      <button
                        type="button"
                        className="enquiries-btn enquiries-btn--send"
                        onClick={() => handleReply(enquiry.id)}
                        disabled={!replyMessage.trim() || sendingReply}
                      >
                        {sendingReply ? 'Sending…' : 'Send reply'}
                      </button>
                      <button
                        type="button"
                        className="enquiries-btn enquiries-btn--ghost"
                        onClick={() => {
                          setSelectedEnquiry(null);
                          setReplyMessage('');
                        }}
                        disabled={sendingReply}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Enquiries;
