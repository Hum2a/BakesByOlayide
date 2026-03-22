import React, { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase/firebase';
import {
  apiUrl,
  apiUrlAtBase,
  getApiBaseUrl,
  getRuntimeEnv,
  isLocalRuntime,
  LIVE_API_ORIGIN,
  LOCAL_API_ORIGIN,
  normalizeBaseUrl,
} from '../../../config/environment';

function envFlag(name) {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Turn browser "Failed to fetch" into actionable hints (mixed content, localhost from prod, API down).
 */
function explainFetchFailure(requestUrl, error) {
  const raw = error?.message || String(error);
  if (typeof window === 'undefined') return raw;

  const isFailedFetch =
    raw === 'Failed to fetch' ||
    raw.includes('NetworkError') ||
    raw.includes('Load failed') ||
    raw.includes('Network request failed');

  if (!isFailedFetch) return raw;

  const hints = [raw];
  const pageHttps = window.location.protocol === 'https:';
  const apiHttp = /^http:\/\//i.test(requestUrl);
  const apiPointsAtLoopback = /localhost|127\.0\.0\.1/i.test(requestUrl);
  const pageOnLoopback =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const pageOnPublicHost = !pageOnLoopback;

  if (pageHttps && apiHttp) {
    hints.push(
      'Mixed content: this page is HTTPS but the API URL is plain HTTP. Browsers block that. For local dev open the app at http://localhost:3000 (not an https:// preview), or serve the API over HTTPS.'
    );
  } else if (apiPointsAtLoopback && pageOnPublicHost) {
    hints.push(
      'The API URL points at your own computer (localhost), but you opened Admin from a public/deployed origin. The browser cannot reach your PC’s localhost from here. Set REACT_APP_API_BASE_URL to your live API (e.g. Render) for production builds, or run these checks on your machine at http://localhost:3000.'
    );
  } else if (apiPointsAtLoopback && pageOnLoopback) {
    hints.push(
      'Nothing answered on that URL—start the API (`npm run server` or `npm run dev`), match PORT to REACT_APP_API_BASE_URL / package.json proxy, and avoid running the React dev app on the same port as the API.'
    );
  } else {
    hints.push(
      'Possible causes: host sleeping (Render free tier), firewall/VPN/ad-block, strict browser privacy, or CORS if the page origin is not allowed by the API.'
    );
  }

  return hints.join('\n\n');
}

async function pingApiTest(baseLabel, baseOrigin, { timeoutMs } = {}) {
  const url = apiUrlAtBase(baseOrigin, '/api/test');
  const start = performance.now();
  const controller = new AbortController();
  const tid =
    timeoutMs != null && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
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
    if (e?.name === 'AbortError') {
      const isRender = /onrender\.com/i.test(url);
      return {
        label: baseLabel,
        url,
        ok: false,
        ms,
        message: isRender
          ? `Timed out after ${timeoutMs}ms — Render free tier often sleeps; open ${url} in a new tab to wake the service, wait until you see JSON, then run checks again.`
          : `Timed out after ${timeoutMs}ms — nothing responded in time.`,
      };
    }
    return {
      label: baseLabel,
      url,
      ok: false,
      ms,
      message: explainFetchFailure(url, e),
    };
  } finally {
    if (tid) clearTimeout(tid);
  }
}

/** CRA only: hits /api/test on the dev server origin so package.json "proxy" forwards to Node. */
async function pingRelativeDevProxy() {
  if (typeof window === 'undefined') return null;
  const url = `${window.location.origin}/api/test`;
  const start = performance.now();
  try {
    const res = await fetch(url, { method: 'GET' });
    const ms = Math.round(performance.now() - start);
    if (!res.ok) {
      return {
        label: 'Backend (dev · CRA proxy)',
        url,
        ok: false,
        ms,
        message: `HTTP ${res.status}`,
      };
    }
    const data = await res.json().catch(() => ({}));
    return {
      label: 'Backend (dev · CRA proxy)',
      url,
      ok: true,
      ms,
      message: `${data.message || 'OK'} · uses package.json "proxy" → Node (works even if REACT_APP_API_BASE_URL is wrong)`,
    };
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    return {
      label: 'Backend (dev · CRA proxy)',
      url,
      ok: false,
      ms,
      message: explainFetchFailure(url, e),
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
  const [localPings, setLocalPings] = useState([]);
  const [livePing, setLivePing] = useState(null);
  const [firebaseClient, setFirebaseClient] = useState(null);
  const [serverDiag, setServerDiag] = useState(null);
  const [devProxyPing, setDevProxyPing] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setLastRun(new Date().toISOString());
    setServerDiag(null);
    setDevProxyPing(null);

    const configuredBase = getApiBaseUrl();
    const localTasks = [];
    if (isLocalRuntime) {
      localTasks.push(
        pingApiTest('Backend (local · this app’s URL)', configuredBase, { timeoutMs: 12000 })
      );
      if (normalizeBaseUrl(configuredBase) !== normalizeBaseUrl(LOCAL_API_ORIGIN)) {
        localTasks.push(
          pingApiTest('Backend (localhost:5000 — default dev port)', LOCAL_API_ORIGIN, {
            timeoutMs: 12000,
          })
        );
      }
    } else {
      localTasks.push(
        pingApiTest('Backend (localhost:5000)', LOCAL_API_ORIGIN, { timeoutMs: 12000 })
      );
    }

    const devProxyPromise =
      process.env.NODE_ENV === 'development' ? pingRelativeDevProxy() : Promise.resolve(null);

    const [fb, live, devProxy, ...locals] = await Promise.all([
      checkFirebaseClient(),
      pingApiTest('Backend (live / Render)', LIVE_API_ORIGIN, { timeoutMs: 120000 }),
      devProxyPromise,
      ...localTasks,
    ]);

    setFirebaseClient(fb);
    setLocalPings(locals);
    setLivePing(live);
    setDevProxyPing(devProxy);

    const diagUrl = apiUrl('/api/integrations/status');
    const diagTimeoutMs = /onrender\.com/i.test(diagUrl) ? 120000 : 25000;
    const start = performance.now();
    const controller = new AbortController();
    const diagTid = setTimeout(() => controller.abort(), diagTimeoutMs);
    try {
      const currentUser = auth.currentUser;
      const msBase = () => Math.round(performance.now() - start);
      if (!currentUser) {
        setServerDiag({
          ok: false,
          url: diagUrl,
          ms: msBase(),
          message:
            'Sign in with a staff account to load server diagnostics (the API requires Authorization).',
          body: null,
        });
      } else {
        const token = await currentUser.getIdToken();
        const res = await fetch(diagUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        const ms = msBase();
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
      }
    } catch (e) {
      const ms = Math.round(performance.now() - start);
      const aborted = e?.name === 'AbortError';
      setServerDiag({
        ok: false,
        url: diagUrl,
        ms,
        message: aborted
          ? `Timed out after ${diagTimeoutMs}ms — ${
              /onrender\.com/i.test(diagUrl)
                ? 'Render may be sleeping; open the URL in a new tab, wait for JSON, retry.'
                : 'API did not respond — is npm run server running on the expected PORT?'
            }`
          : explainFetchFailure(diagUrl, e),
        body: null,
      });
    } finally {
      clearTimeout(diagTid);
    }

    setRunning(false);
  }, []);

  const configured = getApiBaseUrl();
  const runtime = getRuntimeEnv();
  const matchesLive = configured.includes('onrender.com') || configured === LIVE_API_ORIGIN;

  return (
    <div className="developer-settings">
      <h2>Developer settings</h2>
      <p className="developer-settings-intro">
        Run connection checks against this app’s integrations. Backend email tests use the{' '}
        <strong>configured</strong> API base (see below). Probing local from a deployed site often fails in the
        browser (localhost is your machine, not the server).
      </p>

      {typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        /^http:\/\//i.test(configured) && (
          <div className="developer-settings-alert developer-settings-alert--warn" role="status">
            <strong>Mixed content risk</strong>: you are on <strong>HTTPS</strong> but the configured API is{' '}
            <strong>HTTP</strong> (<code>{configured}</code>). Browsers usually block fetches from secure pages to
            insecure APIs, so every backend check may show “Failed to fetch” even if the server is running. Use{' '}
            <code>http://localhost:3000</code> for local admin, or put the API behind HTTPS.
          </div>
        )}

      {typeof window !== 'undefined' &&
        !/^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname) &&
        /localhost|127\.0\.0\.1/i.test(configured) && (
          <div className="developer-settings-alert developer-settings-alert--warn" role="status">
            <strong>localhost API from a non-local site</strong>: <code>REACT_APP_API_BASE_URL</code> points at your
            machine (<code>{configured}</code>), but this page is served from{' '}
            <code>{window.location.origin}</code>. The browser cannot reach your PC’s localhost. Point the build at
            your deployed API URL, or open Admin from <code>http://localhost:3000</code> when developing.
          </div>
        )}

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
            Env files: root <code>server.js</code> loads <code>.env</code> at the repo root and{' '}
            <code>backend/.env</code>. Either location can hold Zoho + Firebase Admin keys.
          </li>
          <li>
            <strong>Port 5000 busy?</strong> You may have had the React dev server on 5000 because CRA reads{' '}
            <code>PORT</code> from <code>.env</code>. This project pins the dev UI to <strong>3000</strong> in{' '}
            <code>craco.config.js</code>. Stop all Node terminals, run <code>npm run free-port-5000</code>, then{' '}
            <code>npm run dev</code> again.
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
        {process.env.NODE_ENV === 'development' && devProxyPing && (
          <ResultCard
            title={devProxyPing.label}
            ok={devProxyPing.ok}
            url={devProxyPing.url}
            ms={devProxyPing.ms}
            message={devProxyPing.message}
          />
        )}
        {localPings.map((lp, idx) => (
          <ResultCard
            key={`${lp.url}-${idx}`}
            title={lp.label || 'Backend (local)'}
            ok={lp.ok}
            url={lp.url}
            ms={lp.ms}
            message={
              lp.ok
                ? `${lp.message}${idx === 0 && isLocalRuntime ? ' · primary URL for this build' : ''}`
                : lp.message
            }
          />
        ))}
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
        These checks call <code>{apiUrl('/api/integrations/status')}</code> with your staff ID token. They verify Zoho
        SMTP (three inboxes) and
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
        <code>.env.example</code>). A legacy client-side SMTP helper was removed; do not put SMTP passwords in{' '}
        <code>REACT_APP_*</code>. <code>@sendgrid/mail</code> and <code>zcrmsdk</code> are in{' '}
        <code>package.json</code> but not imported in source.
      </p>
    </div>
  );
};

export default DeveloperSettings;
