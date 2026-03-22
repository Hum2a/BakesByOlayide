import React, { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase/firebase';
import {
  apiUrl,
  apiUrlAtBase,
  getApiBaseUrl,
  getRuntimeEnv,
  LIVE_API_ORIGIN,
  LOCAL_API_ORIGIN,
} from '../../../config/environment';

function envFlag(name) {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

async function pingApiTest(baseLabel, baseOrigin) {
  const url = apiUrlAtBase(baseOrigin, '/api/test');
  const start = performance.now();
  try {
    const res = await fetch(url, { method: 'GET' });
    const ms = Math.round(performance.now() - start);
    if (!res.ok) {
      return { label: baseLabel, url, ok: false, ms, message: `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    return {
      label: baseLabel,
      url,
      ok: true,
      ms,
      message: data.message || 'OK',
    };
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    return {
      label: baseLabel,
      url,
      ok: false,
      ms,
      message: e.message || 'Request failed',
    };
  }
}

async function checkFirebaseClient() {
  const start = performance.now();
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, ms: 0, message: 'No signed-in user' };
  }
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const ms = Math.round(performance.now() - start);
    if (!snap.exists()) {
      return { ok: false, ms, message: 'Firestore reachable but user document missing' };
    }
    return { ok: true, ms, message: 'Auth + Firestore read OK' };
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    return { ok: false, ms, message: e.message || 'Firestore error' };
  }
}

function ResultCard({ title, ok, url, ms, message, children }) {
  return (
    <div className={`developer-settings-card ${ok ? 'is-ok' : ok === false ? 'is-bad' : ''}`}>
      <div className="developer-settings-card-head">
        <span className="developer-settings-status">{ok === true ? 'Connected' : ok === false ? 'Not connected' : '—'}</span>
        <h3>{title}</h3>
      </div>
      {url && <div className="developer-settings-url">{url}</div>}
      {ms != null && ok != null && <div className="developer-settings-meta">{ms} ms</div>}
      {message && <p className="developer-settings-msg">{message}</p>}
      {children}
    </div>
  );
}

const DeveloperSettings = () => {
  const [running, setRunning] = useState(false);
  const [localPing, setLocalPing] = useState(null);
  const [livePing, setLivePing] = useState(null);
  const [firebaseClient, setFirebaseClient] = useState(null);
  const [serverDiag, setServerDiag] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setLastRun(new Date().toISOString());
    setServerDiag(null);

    const [fb, loc, live] = await Promise.all([
      checkFirebaseClient(),
      pingApiTest('Backend (local)', LOCAL_API_ORIGIN),
      pingApiTest('Backend (live / Render)', LIVE_API_ORIGIN),
    ]);

    setFirebaseClient(fb);
    setLocalPing(loc);
    setLivePing(live);

    const diagUrl = apiUrl('/api/integrations/status');
    const start = performance.now();
    try {
      const res = await fetch(diagUrl, { method: 'GET' });
      const ms = Math.round(performance.now() - start);
      if (!res.ok) {
        const text = await res.text();
        setServerDiag({
          ok: false,
          url: diagUrl,
          ms,
          message: `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
          body: null,
        });
      } else {
        const body = await res.json();
        setServerDiag({ ok: true, url: diagUrl, ms, message: 'Diagnostics loaded', body });
      }
    } catch (e) {
      const ms = Math.round(performance.now() - start);
      setServerDiag({
        ok: false,
        url: diagUrl,
        ms,
        message: e.message || 'Could not reach configured API',
        body: null,
      });
    }

    setRunning(false);
  }, []);

  const configured = getApiBaseUrl();
  const runtime = getRuntimeEnv();
  const matchesLocal = configured === LOCAL_API_ORIGIN || configured.includes('localhost');
  const matchesLive = configured.includes('onrender.com') || configured === LIVE_API_ORIGIN;

  return (
    <div className="developer-settings">
      <h2>Developer settings</h2>
      <p className="developer-settings-intro">
        Run connection checks against this app’s integrations. Backend email tests use the{' '}
        <strong>configured</strong> API base (see below). Probing local from a deployed site often fails in the
        browser (localhost is your machine, not the server).
      </p>

      {process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.port === '5000' && (
        <div className="developer-settings-alert developer-settings-alert--warn" role="status">
          <strong>React dev server on port 5000</strong> clashes with this project: the API is also meant to run on{' '}
          <code>5000</code>, and <code>package.json</code> proxies <code>/api</code> to that port. The dev server then
          proxies to itself and you see errors like “Proxy error… ECONNREFUSED”. Fix: remove{' '}
          <code>PORT=5000</code> for the frontend so <code>npm start</code> uses <strong>3000</strong>, then run{' '}
          <code>npm run server</code> in another terminal (or use <code>npm run dev</code> to start both). Open the
          app at <code>http://localhost:3000</code>.
        </div>
      )}

      <aside className="developer-settings-help">
        <h4 className="developer-settings-help-title">What the Node backend is for</h4>
        <p>
          The React app uses the <strong>Firebase client SDK</strong> for sign-in and almost all database access.
          The <strong>Express server</strong> is still required for things browsers cannot do safely: sending mail via{' '}
          <strong>Zoho SMTP</strong> (order confirmations, enquiry replies, newsletters, checkout enquiries) and using{' '}
          <strong>Firebase Admin</strong> on the server for the marketing email flow. Without the API running locally,
          those features fail even though Firebase looks “fine” in the checks above.
        </p>
        <h4 className="developer-settings-help-title">Local setup</h4>
        <ul>
          <li>
            Run <code>npm run dev</code> (API + React together) or two terminals: <code>npm run server</code> then{' '}
            <code>npm start</code>.
          </li>
          <li>
            Use <code>http://localhost:3000</code> for the site; keep the API on <code>5000</code> (default in{' '}
            <code>server.js</code>).
          </li>
          <li>
            Copy <code>backend/.env.example</code> to <code>.env</code> at the repo root (where <code>server.js</code>{' '}
            loads dotenv) and fill Zoho + Firebase Admin values.
          </li>
        </ul>
        <h4 className="developer-settings-help-title">Live (Render) “Failed to fetch”</h4>
        <p>
          Free/sleeping hosts can take a long time to wake; if it still fails, the service may be down or your network
          is blocking the request. Open the Render URL in a new tab—if the site does not load, the check will not
          either. Use <code>http://localhost:3000</code> not <code>127.0.0.1</code> unless CORS includes it (this
          project now allows both).
        </p>
      </aside>

      <div className="developer-settings-toolbar">
        <button type="button" className="developer-settings-run" onClick={runChecks} disabled={running}>
          {running ? 'Running checks…' : 'Run all checks'}
        </button>
        {lastRun && <span className="developer-settings-last">Last run: {lastRun}</span>}
      </div>

      <div className="developer-settings-summary">
        <ResultCard
          title="Configured API base (this build)"
          ok={null}
          message={`Runtime: ${runtime} · ${configured}`}
        />
      </div>

      <h3 className="developer-settings-h3">Reachability</h3>
      <div className="developer-settings-grid">
        <ResultCard
          title="Firebase (client)"
          ok={firebaseClient?.ok}
          ms={firebaseClient?.ms}
          message={firebaseClient?.message}
        />
        <ResultCard
          title={localPing?.label || 'Backend (local)'}
          ok={localPing?.ok}
          url={localPing?.url}
          ms={localPing?.ms}
          message={
            localPing?.ok
              ? `${localPing.message}${matchesLocal ? ' · matches configured base' : ''}`
              : localPing?.message
          }
        />
        <ResultCard
          title={livePing?.label || 'Backend (live)'}
          ok={livePing?.ok}
          url={livePing?.url}
          ms={livePing?.ms}
          message={
            livePing?.ok
              ? `${livePing.message}${matchesLive ? ' · matches configured base' : ''}`
              : livePing?.message
          }
        />
      </div>

      <h3 className="developer-settings-h3">Configured backend — SMTP &amp; Firebase Admin</h3>
      <p className="developer-settings-note">
        These checks call <code>{apiUrl('/api/integrations/status')}</code>. They verify Zoho SMTP (three inboxes) and
        server Firestore via Firebase Admin.
      </p>
      <ResultCard
        title="Server diagnostics"
        ok={serverDiag?.ok}
        url={serverDiag?.url}
        ms={serverDiag?.ms}
        message={serverDiag?.message}
      >
        {serverDiag?.body?.smtp && (
          <ul className="developer-settings-smtp-list">
            {Object.entries(serverDiag.body.smtp).map(([key, v]) => (
              <li key={key}>
                <strong>{key}</strong>: {v.ok ? 'Connected' : 'Not connected'}
                {v.label ? ` — ${v.label}` : ''}
                {!v.ok && v.error ? ` — ${v.error}` : ''}
                {v.ms != null ? ` (${v.ms} ms)` : ''}
              </li>
            ))}
          </ul>
        )}
        {serverDiag?.body?.firebaseAdmin && (
          <p className="developer-settings-sub">
            Firebase Admin / Firestore:{' '}
            {serverDiag.body.firebaseAdmin.ok ? 'Connected' : 'Not connected'}
            {serverDiag.body.firebaseAdmin.projectId
              ? ` · project <code>${serverDiag.body.firebaseAdmin.projectId}</code>`
              : ''}
            {!serverDiag.body.firebaseAdmin.ok && serverDiag.body.firebaseAdmin.error
              ? ` — ${serverDiag.body.firebaseAdmin.error}`
              : ''}
          </p>
        )}
        {serverDiag?.body?.env && (
          <details className="developer-settings-details">
            <summary>Server env flags (set / missing)</summary>
            <ul className="developer-settings-env-list">
              {Object.entries(serverDiag.body.env).map(([k, present]) => (
                <li key={k}>
                  {k}: {present ? 'set' : 'missing'}
                </li>
              ))}
            </ul>
          </details>
        )}
      </ResultCard>

      <h3 className="developer-settings-h3">Client environment (presence only)</h3>
      <div className="developer-settings-table-wrap">
        <table className="developer-settings-table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Present</th>
            </tr>
          </thead>
          <tbody>
            {[
              'REACT_APP_FIREBASE_API_KEY',
              'REACT_APP_FIREBASE_AUTH_DOMAIN',
              'REACT_APP_FIREBASE_PROJECT_ID',
              'REACT_APP_FIREBASE_STORAGE_BUCKET',
              'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
              'REACT_APP_FIREBASE_APP_ID',
              'REACT_APP_API_BASE_URL',
              'REACT_APP_RUNTIME_ENV',
              'REACT_APP_MARKETING_CONTACT_EMAIL',
              'REACT_APP_ZOHO_EMAIL',
              'REACT_APP_ZOHO_EMAIL_PASSWORD',
            ].map((name) => (
              <tr key={name}>
                <td>
                  <code>{name}</code>
                </td>
                <td>{envFlag(name) ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="developer-settings-footnote">
        Production email is sent from the Node API using Zoho SMTP (<code>ZOHO_*</code> in server env — see backend{' '}
        <code>.env.example</code>). <code>src/utils/emailService.js</code> and <code>REACT_APP_ZOHO_*</code> are not
        used by the running app. <code>@sendgrid/mail</code> and <code>zcrmsdk</code> are in{' '}
        <code>package.json</code> but not imported in source.
      </p>
    </div>
  );
};

export default DeveloperSettings;
