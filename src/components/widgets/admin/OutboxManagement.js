import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, doc, deleteDoc } from 'firebase/firestore';
import { FaSync, FaChevronDown, FaChevronUp, FaRedo, FaTrash } from 'react-icons/fa';
import { auth, db } from '../../../firebase/firebase';
import { apiUrl } from '../../../config/environment';
import { readEmailApiBody } from '../../../utils/emailSendMessaging';
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

function sentAtMs(data, field = 'sentAt') {
  const t = data?.[field];
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

function recipientLineFromArrays(ccRecipients, bccRecipients, legacyCc) {
  const cc =
    Array.isArray(ccRecipients) && ccRecipients.length
      ? ccRecipients.join(', ')
      : legacyCc && String(legacyCc).trim() && String(legacyCc).toLowerCase() !== 'null'
        ? String(legacyCc).trim()
        : '';
  const bcc =
    Array.isArray(bccRecipients) && bccRecipients.length ? bccRecipients.join(', ') : '';
  return { cc, bcc };
}

/** Browser = React app sent clientSource; API = same Node endpoint but no page tag (older client, scripts, etc.). */
function triggerDetail(row) {
  if (row.clientSource) {
    return CLIENT_SOURCE_LABELS[row.clientSource] || row.clientSource;
  }
  return 'No page tag';
}

function isBrowserTriggered(row) {
  return Boolean(row.clientSource && String(row.clientSource).trim());
}

function canResendFromOutbox(row) {
  if (row.status !== 'failed') return false;
  if (row.kind === 'marketing_broadcast' && row.meta && row.meta.bccListRedacted) return false;
  return true;
}

const OutboxManagement = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [kindFilter, setKindFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [rowBusy, setRowBusy] = useState(null);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

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
      if (triggerFilter === 'browser' && !isBrowserTriggered(r)) return false;
      if (triggerFilter === 'api' && isBrowserTriggered(r)) return false;
      return true;
    });
  }, [rows, kindFilter, sourceFilter, triggerFilter]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteEntry = async (row) => {
    if (
      !window.confirm(
        'Remove this row from the Outbox log in Firestore? This does not unsend email. This cannot be undone.'
      )
    ) {
      return;
    }
    setRowBusy(`del:${row.id}`);
    try {
      await deleteDoc(doc(db, 'emailOutbox', row.id));
      setToast({ tone: 'ok', text: 'Log entry deleted.' });
      await load();
    } catch (e) {
      setToast({
        tone: 'err',
        text:
          e?.message ||
          'Could not delete. Deploy Firestore rules that allow staff to delete emailOutbox, then try again.',
      });
    } finally {
      setRowBusy(null);
    }
  };

  const resendEntry = async (row) => {
    if (!canResendFromOutbox(row)) return;
    if (!auth.currentUser) {
      setToast({ tone: 'err', text: 'Sign in again, then retry resend.' });
      return;
    }
    if (
      !window.confirm(
        'Resend this failed email now using the stored To / CC / BCC and body? Check you are not duplicating mail the recipient already received.'
      )
    ) {
      return;
    }
    setRowBusy(`resend:${row.id}`);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(apiUrl('/api/resend-outbox-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ docId: row.id }),
      });
      const data = await readEmailApiBody(res);
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      let msg = 'Resent successfully. This row is marked as sent.';
      if (Array.isArray(data.warnings) && data.warnings.length) {
        msg += ` ${data.warnings.join(' ')}`;
      }
      setToast({ tone: 'ok', text: msg });
      await load();
    } catch (e) {
      setToast({ tone: 'err', text: e?.message || 'Resend failed.' });
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="outbox-panel">
      <h2>Outbox</h2>
      <p className="outbox-lead">
        Log of mail sent through your <strong>API</strong> (Node + Zoho). <strong>Browser</strong> means a page in this
        React app called the API and sent a page id; <strong>API</strong> means the same endpoint ran without that tag
        (older builds, tests, or other clients). All delivery still happens on the server. Use{' '}
        <strong>Resend</strong> only for failed rows (newsletter blasts cannot be replayed from here).{' '}
        <strong>Delete</strong> removes the log row only. Deploy updated Firestore rules so staff can delete{' '}
        <code>emailOutbox</code> documents.
      </p>

      {toast && (
        <div
          className={`outbox-msg ${toast.tone === 'ok' ? 'outbox-msg--ok' : 'outbox-msg--err'}`}
          role="status"
        >
          {toast.text}
        </div>
      )}

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
          value={triggerFilter}
          onChange={(e) => setTriggerFilter(e.target.value)}
          aria-label="Filter by trigger"
        >
          <option value="">All triggers</option>
          <option value="browser">Browser (tagged)</option>
          <option value="api">API (no page tag)</option>
        </select>
        <select
          className="outbox-filter"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by page id"
        >
          <option value="">All page ids</option>
          <option value="__none__">No page id</option>
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
                <th>Trigger</th>
                <th>To</th>
                <th>Subject</th>
                <th>Actions</th>
                <th aria-label="Expand" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const open = expanded.has(r.id);
                const kindLabel = KIND_LABELS[r.kind] || r.kind || '—';
                const { cc: ccLine, bcc: bccLine } = recipientLineFromArrays(
                  r.ccRecipients,
                  r.bccRecipients,
                  r.cc
                );
                const browser = isBrowserTriggered(r);
                const busy = rowBusy === `del:${r.id}` || rowBusy === `resend:${r.id}`;
                const showResend = canResendFromOutbox(r);

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
                      <td className="outbox-trigger">
                        <span
                          className={`outbox-badge ${browser ? 'outbox-badge--browser' : 'outbox-badge--api'}`}
                          title={
                            browser
                              ? 'This app’s browser code called the API with a page identifier.'
                              : 'The API ran without a browser page tag (still server-side sending).'
                          }
                        >
                          {browser ? 'Browser' : 'API'}
                        </span>
                        <div className="outbox-trigger-detail">{triggerDetail(r)}</div>
                      </td>
                      <td className="outbox-to">{r.to || '—'}</td>
                      <td className="outbox-subject">{r.subject || '—'}</td>
                      <td className="outbox-actions-cell">
                        <div className="outbox-actions">
                          {showResend ? (
                            <button
                              type="button"
                              className="outbox-icon-btn outbox-icon-btn--primary"
                              disabled={busy}
                              title="Resend failed email"
                              onClick={() => resendEntry(r)}
                            >
                              <FaRedo aria-hidden /> Resend
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="outbox-icon-btn outbox-icon-btn--danger"
                            disabled={busy}
                            title="Delete log row"
                            onClick={() => deleteEntry(r)}
                          >
                            <FaTrash aria-hidden /> Delete
                          </button>
                        </div>
                      </td>
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
                        <td colSpan={8}>
                          <div className="outbox-detail">
                            <div className="outbox-detail-meta">
                              <div>
                                <strong>How it was triggered:</strong>{' '}
                                {browser ? (
                                  <>
                                    <span className="outbox-badge outbox-badge--browser">Browser</span> — this React
                                    app called the API (mail still sent from the server).
                                  </>
                                ) : (
                                  <>
                                    <span className="outbox-badge outbox-badge--api">API</span> — no{' '}
                                    <code>clientSource</code> was sent; could be an older client, Postman, or another
                                    integration.
                                  </>
                                )}
                              </div>
                              {r.clientSource ? (
                                <div>
                                  <strong>Page id:</strong> <code>{r.clientSource}</code>
                                </div>
                              ) : null}
                              {r.channel ? (
                                <div>
                                  <strong>SMTP channel:</strong> {r.channel}
                                </div>
                              ) : null}
                              {sentAtMs(r, 'resentAt') != null ? (
                                <div>
                                  <strong>Last resent:</strong> {formatWhen(sentAtMs(r, 'resentAt'))}
                                  {r.resentByUid ? (
                                    <span className="outbox-muted"> · uid {r.resentByUid}</span>
                                  ) : null}
                                </div>
                              ) : null}
                              {ccLine ? (
                                <div>
                                  <strong>CC:</strong> {ccLine}
                                </div>
                              ) : null}
                              {r.replyTo ? (
                                <div>
                                  <strong>Reply-To:</strong> {r.replyTo}
                                </div>
                              ) : null}
                              {bccLine ? (
                                <div>
                                  <strong>BCC (addresses):</strong> {bccLine}
                                </div>
                              ) : null}
                              {r.bccSummary ? (
                                <div>
                                  <strong>BCC (summary):</strong> {r.bccSummary}
                                </div>
                              ) : null}
                              {typeof r.recipientCount === 'number' && !Number.isNaN(r.recipientCount) ? (
                                <div>
                                  <strong>Recipient count:</strong> {r.recipientCount}
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
                            {!showResend && r.status === 'failed' && r.kind === 'marketing_broadcast' ? (
                              <p className="outbox-hint">
                                Newsletter failures cannot be resent from the Outbox because subscriber addresses are not
                                stored. Use <strong>Newsletter</strong> to send again.
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
