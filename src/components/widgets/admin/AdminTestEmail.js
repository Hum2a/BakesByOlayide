import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { apiUrl } from '../../../config/environment';
import {
  appendUncertaintyToFailureMessage,
  readEmailApiBody,
  emailApiErrorDetail,
} from '../../../utils/emailSendMessaging';
import { TEST_EMAIL_PRESETS, getPresetBodies } from './testEmailPresets';
import '../../styles/AdminTestEmail.css';

const defaultColors = { subjectColor: '#1a1a1a', bodyColor: '#333333' };

const AdminTestEmail = () => {
  const [presetId, setPresetId] = useState('simple_orders');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [sendCustomerAck, setSendCustomerAck] = useState(true);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [shopSubject, setShopSubject] = useState('');
  const [shopHtml, setShopHtml] = useState('');
  const [customerSubject, setCustomerSubject] = useState('');
  const [customerHtml, setCustomerHtml] = useState('');
  const [subjectColor, setSubjectColor] = useState(defaultColors.subjectColor);
  const [bodyColor, setBodyColor] = useState(defaultColors.bodyColor);
  const [availableLists, setAvailableLists] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const preset = useMemo(
    () => TEST_EMAIL_PRESETS.find((p) => p.id === presetId) || TEST_EMAIL_PRESETS[0],
    [presetId]
  );

  const applyPresetDefaults = useCallback((id) => {
    const bodies = getPresetBodies(id);
    if (!bodies) {
      setSubject('');
      setHtml('');
      setShopSubject('');
      setShopHtml('');
      setCustomerSubject('');
      setCustomerHtml('');
      return;
    }
    if (bodies.shopSubject) {
      setShopSubject(bodies.shopSubject);
      setShopHtml(bodies.shopHtml || '');
      setCustomerSubject(bodies.customerSubject || '');
      setCustomerHtml(bodies.customerHtml || '');
    } else {
      setSubject(bodies.subject || '');
      setHtml(bodies.html || '');
    }
    setSubjectColor(defaultColors.subjectColor);
    setBodyColor(defaultColors.bodyColor);
  }, []);

  useEffect(() => {
    applyPresetDefaults(presetId);
  }, [presetId, applyPresetDefaults]);

  useEffect(() => {
    if (presetId !== 'marketing_broadcast') return;
    let cancelled = false;
    (async () => {
      setListsLoading(true);
      try {
        const configDoc = await getDoc(doc(db, 'config', 'emailLists'));
        const data = configDoc.data();
        const lists = data && Array.isArray(data.lists) ? data.lists : [];
        if (!cancelled) {
          setAvailableLists(lists);
          setSelectedLists(lists.length ? [lists[0].key] : []);
        }
      } catch {
        if (!cancelled) {
          setAvailableLists([]);
          setSelectedLists([]);
        }
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [presetId]);

  const toggleList = (key) => {
    setSelectedLists((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const send = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (presetId === 'marketing_broadcast') {
      const ok = window.confirm(
        'This uses the real newsletter API and emails every opted-in subscriber matching the selected lists. Continue?'
      );
      if (!ok) return;
      if (
        !window.confirm('Second confirmation: this is not a test to one inbox — it is a broadcast.')
      ) {
        return;
      }
    }

    if (!to.trim() && presetId !== 'marketing_broadcast' && presetId !== 'order_enquiry') {
      setStatus('Enter a recipient email.');
      return;
    }
    if (presetId === 'order_enquiry' && sendCustomerAck && !customerEmail.trim()) {
      setStatus('Enter a customer email when sending the acknowledgement.');
      return;
    }
    if (presetId === 'marketing_broadcast' && selectedLists.length === 0) {
      setStatus('Select at least one list, or add lists under Newsletter.');
      return;
    }

    setSending(true);
    setStatus('Sending…');

    try {
      if (presetId === 'simple_orders') {
        const res = await fetch(apiUrl('/api/test-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: to.trim() }),
        });
        const data = await readEmailApiBody(res);
        if (!res.ok) throw new Error(emailApiErrorDetail(data, res));
        setStatus('Sent: simple ping (Orders SMTP).');
        return;
      }

      if (presetId === 'order_confirmation') {
        const formData = new FormData();
        formData.append('to', to.trim());
        formData.append('subject', subject);
        formData.append('html', html);
        if (cc.trim()) formData.append('cc', cc.trim());
        const res = await fetch(apiUrl('/api/send-order-confirmation'), {
          method: 'POST',
          body: formData,
        });
        const data = await readEmailApiBody(res);
        if (!res.ok) throw new Error(emailApiErrorDetail(data, res));
        setStatus(
          cc.trim()
            ? 'Sent order confirmation to recipient with CC.'
            : 'Sent order confirmation to recipient.'
        );
        return;
      }

      if (presetId === 'enquiry_reply') {
        const res = await fetch(apiUrl('/api/send-enquiry-reply'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: to.trim(),
            subject,
            html,
            ...(cc.trim() ? { cc: cc.trim() } : {}),
          }),
        });
        const data = await readEmailApiBody(res);
        if (!res.ok) throw new Error(emailApiErrorDetail(data, res));
        setStatus('Sent enquiry reply (Enquiries SMTP).');
        return;
      }

      if (presetId === 'order_enquiry') {
        const cust = customerEmail.trim();
        const res = await fetch(apiUrl('/api/send-order-enquiry'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopSubject,
            shopHtml,
            ...(cust ? { customerEmail: cust } : {}),
            ...(sendCustomerAck && cust ? { customerSubject, customerHtml } : {}),
          }),
        });
        const data = await readEmailApiBody(res);
        if (!res.ok) throw new Error(emailApiErrorDetail(data, res));
        setStatus(
          sendCustomerAck && cust
            ? 'Sent shop copy to orders inbox + customer acknowledgement.'
            : cust
              ? 'Sent shop copy to orders inbox (Reply-To set to customer email).'
              : 'Sent shop copy to orders inbox only.'
        );
        return;
      }

      if (presetId === 'marketing_style') {
        const res = await fetch(apiUrl('/api/test-marketing-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: to.trim(),
            subject,
            html,
            subjectColor,
            bodyColor,
          }),
        });
        const data = await readEmailApiBody(res);
        if (!res.ok) throw new Error(emailApiErrorDetail(data, res));
        setStatus('Sent marketing test to the address you entered (single recipient).');
        return;
      }

      if (presetId === 'marketing_broadcast') {
        const res = await fetch(apiUrl('/api/send-marketing-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            html,
            subjectColor,
            bodyColor,
            lists: selectedLists,
          }),
        });
        const data = await readEmailApiBody(res);
        if (!res.ok) throw new Error(emailApiErrorDetail(data, res));
        setStatus(`Newsletter API: sent to ${data.sent} subscriber(s).`);
      }
    } catch (err) {
      setStatus(
        appendUncertaintyToFailureMessage('Failed: ' + (err.message || String(err)))
      );
    } finally {
      setSending(false);
    }
  };

  const showMainTo =
    presetId !== 'marketing_broadcast' && presetId !== 'order_enquiry';
  const showCc = presetId === 'order_confirmation' || presetId === 'enquiry_reply';
  const showSubjectHtml =
    ['order_confirmation', 'enquiry_reply', 'marketing_style', 'marketing_broadcast'].includes(
      presetId
    );
  const showOrderEnquiryFields = presetId === 'order_enquiry';

  return (
    <div className="admin-test-email" data-test-email-ui="v2">
      <h2>Test emails &amp; API routes</h2>
      <p className="admin-test-email-lead">
        Choose a <strong>preset</strong> for each email route (Orders / Enquiries / Marketing SMTP). Passwords stay
        in server <code>.env</code> only — never here.
      </p>
      <p className="admin-test-email-stale-banner" role="note">
        If you still see the old single-field “Send Test Email” page, the browser or server is using a cached bundle:
        run <code>npm run build</code> (or <code>npm start</code> for dev), restart the Node server if you serve{' '}
        <code>build/</code>, then hard-refresh (Ctrl+Shift+R).
      </p>

      <form className="admin-test-email-form" onSubmit={send}>
        <div className="admin-test-email-field">
          <label htmlFor="test-preset">Preset</label>
          <select
            id="test-preset"
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            disabled={sending}
          >
            {TEST_EMAIL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.smtp}){p.dangerous ? ' ⚠' : ''}
              </option>
            ))}
          </select>
          <p className="admin-test-email-hint">
            <strong>{preset.route}</strong> — {preset.description}
          </p>
        </div>

        {showMainTo && (
          <div className="admin-test-email-field">
            <label htmlFor="test-to">Send to</label>
            <input
              id="test-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="you@example.com"
              disabled={sending}
              required
            />
            <p className="admin-test-email-hint">
              Use your own inbox for tests. To include staff, use CC on order confirmation / enquiry
              reply.
            </p>
          </div>
        )}

        {showCc && (
          <div className="admin-test-email-field">
            <label htmlFor="test-cc">CC (optional)</label>
            <input
              id="test-cc"
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="orders@… , another@…"
              disabled={sending}
            />
            <p className="admin-test-email-hint">Comma-separated. Same behaviour as real admin emails.</p>
          </div>
        )}

        {showOrderEnquiryFields && (
          <>
            <div className="admin-test-email-field">
              <label htmlFor="test-customer">Customer email (optional)</label>
              <input
                id="test-customer"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                disabled={sending}
              />
              <p className="admin-test-email-hint">
                If set: <strong>Reply-To</strong> on the shop email. Required if you send the customer
                acknowledgement.
              </p>
            </div>
            <label className="admin-test-email-check">
              <input
                type="checkbox"
                checked={sendCustomerAck}
                onChange={(e) => setSendCustomerAck(e.target.checked)}
                disabled={sending}
              />
              Also send customer acknowledgement (second email)
            </label>
            <div className="admin-test-email-field">
              <label htmlFor="shop-subj">Shop email — subject</label>
              <input
                id="shop-subj"
                type="text"
                value={shopSubject}
                onChange={(e) => setShopSubject(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="admin-test-email-field">
              <label htmlFor="shop-html">Shop email — HTML body</label>
              <textarea
                id="shop-html"
                rows={5}
                value={shopHtml}
                onChange={(e) => setShopHtml(e.target.value)}
                disabled={sending}
              />
            </div>
            {sendCustomerAck && (
              <>
                <div className="admin-test-email-field">
                  <label htmlFor="cust-subj">Customer email — subject</label>
                  <input
                    id="cust-subj"
                    type="text"
                    value={customerSubject}
                    onChange={(e) => setCustomerSubject(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <div className="admin-test-email-field">
                  <label htmlFor="cust-html">Customer email — HTML body</label>
                  <textarea
                    id="cust-html"
                    rows={4}
                    value={customerHtml}
                    onChange={(e) => setCustomerHtml(e.target.value)}
                    disabled={sending}
                  />
                </div>
              </>
            )}
          </>
        )}

        {showSubjectHtml && (
          <>
            <div className="admin-test-email-field">
              <label htmlFor="test-subject">Subject</label>
              <input
                id="test-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="admin-test-email-field">
              <label htmlFor="test-html">HTML body</label>
              <textarea
                id="test-html"
                rows={6}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                disabled={sending}
              />
            </div>
            {(presetId === 'marketing_style' || presetId === 'marketing_broadcast') && (
              <div className="admin-test-email-colors">
                <div className="admin-test-email-field admin-test-email-field--inline">
                  <label htmlFor="subj-col">Heading colour</label>
                  <input
                    id="subj-col"
                    type="color"
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <div className="admin-test-email-field admin-test-email-field--inline">
                  <label htmlFor="body-col">Body colour</label>
                  <input
                    id="body-col"
                    type="color"
                    value={bodyColor}
                    onChange={(e) => setBodyColor(e.target.value)}
                    disabled={sending}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {presetId === 'marketing_broadcast' && (
          <div className="admin-test-email-field">
            <span className="admin-test-email-label-text">Lists</span>
            {listsLoading ? (
              <p className="admin-test-email-hint">Loading lists…</p>
            ) : availableLists.length === 0 ? (
              <p className="admin-test-email-hint">
                No lists in Firestore <code>config/emailLists</code>. Configure them in Newsletter.
              </p>
            ) : (
              <ul className="admin-test-email-lists">
                {availableLists.map((l) => (
                  <li key={l.key}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedLists.includes(l.key)}
                        onChange={() => toggleList(l.key)}
                        disabled={sending}
                      />
                      {l.label || l.key} <code>({l.key})</code>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="admin-test-email-actions">
          <button type="submit" className="admin-test-email-submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send test'}
          </button>
        </div>
      </form>

      {status && (
        <div
          className={`admin-test-email-status ${status.startsWith('Failed') ? 'is-error' : 'is-ok'}`}
          role="status"
        >
          {status}
        </div>
      )}

      <aside className="admin-test-email-aside">
        <h3>Mailboxes vs code</h3>
        <p>
          The server uses three SMTP accounts: <strong>Orders</strong>, <strong>Enquiries</strong>, and{' '}
          <strong>Marketing</strong> (<code>ZOHO_*</code> in <code>.env</code>). A fourth address like
          Developers@ is only useful if you point one of those env vars at it — there is no separate route
          for “developers only”.
        </p>
      </aside>
    </div>
  );
};

export default AdminTestEmail;
