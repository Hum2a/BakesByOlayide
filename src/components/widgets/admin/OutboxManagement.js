import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { FaSync, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { db } from '../../../firebase/firebase';
import '../../styles/Outbox.css';

const KIND_LABELS = {
  order_confirmation: 'Order confirmation',
  enquiry_reply: 'Enquiry reply',
  marketing_broadcast: 'Newsletter broadcast',
  order_enquiry_shop: 'Basket enquiry (shop)',
  order_enquiry_customer_ack: 'Basket enquiry (customer)',
  order_enquiry: 'Basket enquiry (failed)',
  contact_form_notify: 'Contact form',
  new_review_notify: 'New review',
  admin_test_email: 'Test email (orders SMTP)',
  admin_marketing_test: 'Test email (marketing SMTP)',
};

/** Maps `clientSource` from the frontend API payload to a short label. */
const CLIENT_SOURCE_LABELS = {
  contact_page: 'Contact page',
  checkout: 'Checkout (basket)',
  customer_review_modal: 'Review modal (customer)',
  admin_enquiries: 'Admin · Enquiries',
  admin_orders: 'Admin · Orders',
  admin_newsletter: 'Admin · Newsletter',
  admin_reviews: 'Admin · Reviews',
  admin_test_email: 'Admin · Test emails',
};

function clientSourceLabel(raw) {
  if (!raw) return '—';
  return CLIENT_SOURCE_LABELS[raw] || raw;
}

function sentAtMs(data) {
  const t = data?.sentAt;
  if (!t) return null;
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  const d = new Date(t);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatWhen(ms) {
  if (ms == null) return '—';
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const OutboxManagement = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [kindFilter, setKindFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'emailOutbox'), orderBy('sentAt', 'desc'), limit(200));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (sentAtMs(b) || 0) - (sentAtMs(a) || 0));
      setRows(list);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Could not load Outbox.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kindOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.kind).filter(Boolean));
    return [...set].sort();
  }, [rows]);

  const sourceOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.clientSource).filter(Boolean));
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (kindFilter && r.kind !== kindFilter) return false;
      if (sourceFilter === '__none__') {
        if (r.clientSource) return false;
      } else if (sourceFilter && r.clientSource !== sourceFilter) return false;
      return true;
    });
  }, [rows, kindFilter, sourceFilter]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="outbox-panel">
      <h2>Outbox</h2>
      <p className="outbox-lead">
        Emails sent through the site API are logged here (subject, body, recipients, and send status). The{' '}
        <strong>Sent from</strong> column shows which screen triggered the send when the app supplies it; older rows may
        show a dash. Newsletter broadcasts store subscriber count only, not individual addresses.
      </p>

      {error && (
        <div className="outbox-msg outbox-msg--err" role="alert">
          {error}
        </div>
      )}

      <div className="outbox-toolbar">
        <button type="button" onClick={load} disabled={loading}>
          <FaSync /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <select
          className="outbox-filter"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {kindOptions.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k] || k}
            </option>
          ))}
        </select>
        <select
          className="outbox-filter"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by sent-from"
        >
          <option value="">All origins</option>
          <option value="__none__">Not set</option>
          {sourceOptions.map((s) => (
            <option key={s} value={s}>
              {CLIENT_SOURCE_LABELS[s] || s}
            </option>
          ))}
        </select>
      </div>

      {loading && !rows.length ? (
        <div className="outbox-loading">Loading…</div>
      ) : null}

      {!loading && !filtered.length ? (
        <div className="outbox-empty">No logged emails yet.</div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="outbox-table-wrap">
          <table className="outbox-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Status</th>
                <th>Type</th>
                <th>Sent from</th>
                <th>To</th>
                <th>Subject</th>
                <th aria-label="Expand" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const open = expanded.has(r.id);
                const kindLabel = KIND_LABELS[r.kind] || r.kind || '—';
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>{formatWhen(sentAtMs(r))}</td>
                      <td>
                        <span
                          className={`outbox-status outbox-status--${r.status === 'failed' ? 'failed' : 'sent'}`}
                        >
                          {r.status === 'failed' ? 'Failed' : 'Sent'}
                        </span>
                      </td>
                      <td className="outbox-kind">{kindLabel}</td>
                      <td className="outbox-source">{clientSourceLabel(r.clientSource)}</td>
                      <td className="outbox-to">{r.to || '—'}</td>
                      <td className="outbox-subject">{r.subject || '—'}</td>
                      <td>
                        <button type="button" className="outbox-expand-btn" onClick={() => toggle(r.id)}>
                          {open ? (
                            <>
                              Hide <FaChevronUp aria-hidden />
                            </>
                          ) : (
                            <>
                              View <FaChevronDown aria-hidden />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {open ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="outbox-detail">
                            <div className="outbox-detail-meta">
                              {r.clientSource ? (
                                <div>
                                  <strong>Client source id:</strong> {r.clientSource}
                                </div>
                              ) : null}
                              {r.channel ? (
                                <div>
                                  <strong>Channel:</strong> {r.channel}
                                </div>
                              ) : null}
                              {r.cc ? (
                                <div>
                                  <strong>CC:</strong> {r.cc}
                                </div>
                              ) : null}
                              {r.replyTo ? (
                                <div>
                                  <strong>Reply-To:</strong> {r.replyTo}
                                </div>
                              ) : null}
                              {r.bccSummary ? (
                                <div>
                                  <strong>BCC:</strong> {r.bccSummary}
                                </div>
                              ) : null}
                              {typeof r.recipientCount === 'number' ? (
                                <div>
                                  <strong>Recipients:</strong> {r.recipientCount}
                                </div>
                              ) : null}
                              {r.meta && Object.keys(r.meta).length > 0 ? (
                                <div>
                                  <strong>Meta:</strong> {JSON.stringify(r.meta)}
                                </div>
                              ) : null}
                            </div>
                            {r.status === 'failed' && r.errorMessage ? (
                              <p className="outbox-error">
                                <strong>Error:</strong> {r.errorMessage}
                              </p>
                            ) : null}
                            <iframe
                              className="outbox-html-frame"
                              title={`Email preview ${r.id}`}
                              sandbox=""
                              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${r.html || ''}</body></html>`}
                            />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default OutboxManagement;
