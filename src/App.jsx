import React, { useState, useEffect, useMemo } from 'react';
import {
  KEYCLOAK_CONFIG,
  TOKEN_ENDPOINT,
  LOGOUT_ENDPOINT,
  CLAIM_DESCRIPTIONS,
  TIMESTAMP_CLAIMS,
} from './config.js';
import { decodeJwt, formatClaimValue } from './jwt.js';

const STORAGE_KEY = 'efrei_iam_kc_session';

export default function App() {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('access');

  useEffect(() => {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [session]);

  // Decode the active token (access or id) for display.
  // Memoized so we only re-parse when the token or tab changes.
  const decoded = useMemo(() => {
    if (!session) return null;
    const token = activeTab === 'id' ? session.id_token : session.access_token;
    if (!token) return null;
    try {
      return decodeJwt(token);
    } catch (e) {
      return { error: e.message };
    }
  }, [session, activeTab]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Resource Owner Password Credentials grant — matches the curl in the slide:
    //   curl -X POST .../token -d client_id=... -d username=... -d password=... -d grant_type=password
    const body = new URLSearchParams({
      client_id: KEYCLOAK_CONFIG.clientId,
      username,
      password,
      grant_type: 'password',
      scope: 'openid profile email',
    });

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = data.error_description || data.error || `HTTP ${response.status}`;
        throw new Error(detail);
      }
      setSession({ ...data, issued_at: Date.now() });
    } catch (err) {
      // Network / CORS / server errors all land here.
      const message = err.message || 'Unknown error';
      if (message === 'Failed to fetch') {
        setError(
          'Network error: the Keycloak server is unreachable. Check that the Docker container is running on http://localhost:8080 and that CORS "Web Origins" includes http://localhost:5173 (or *).'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (!session?.refresh_token) {
      setSession(null);
      return;
    }
    try {
      await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: KEYCLOAK_CONFIG.clientId,
          refresh_token: session.refresh_token,
        }).toString(),
      });
    } catch {
      // Best-effort logout; clear the local session regardless.
    }
    setSession(null);
    setError(null);
  }

  function copyToClipboard(value) {
    navigator.clipboard?.writeText(value);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔐 Keycloak SSO + JWT Decoder</h1>
        <div className="subtitle">
          Single Page React App — OAuth 2.0 / OpenID Connect via Resource Owner Password
          Credentials
        </div>
        <span className="author-tag">Ilyes SADADOU · IAM M1-CSM 2026 · EFREI</span>
      </header>

      {!session && (
        <div className="card">
          <div className="card-title">
            <span className="icon">🔑</span>
            Sign in with Keycloak
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="demo"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
            <div className="btn-row">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? '⏳ Signing in...' : '🚀 Sign in & get JWT'}
              </button>
            </div>
          </form>

          {error && (
            <div className="status error">
              <span>❌</span>
              <span>{error}</span>
            </div>
          )}

          <div className="status info" style={{ marginTop: '1rem' }}>
            <span>ℹ️</span>
            <div>
              <strong>Endpoint :</strong> <code>{TOKEN_ENDPOINT}</code>
              <br />
              <strong>Realm :</strong> {KEYCLOAK_CONFIG.realm} &nbsp;·&nbsp;
              <strong>Client :</strong> {KEYCLOAK_CONFIG.clientId}
            </div>
          </div>
        </div>
      )}

      {session && (
        <>
          <div className="card">
            <div className="card-title">
              <span className="icon">✅</span>
              Authenticated session
            </div>
            <UserPanel decoded={decoded} session={session} />
            <div className="btn-row">
              <button onClick={handleLogout} className="btn danger">
                🚪 Logout
              </button>
              <button
                onClick={() => copyToClipboard(session.access_token)}
                className="btn secondary"
              >
                📋 Copy access token
              </button>
              <a
                href={`https://www.jwt.io/?token=${session.access_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn secondary"
              >
                🔗 Open in jwt.io
              </a>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span className="icon">🧬</span>
              Raw JWT (color-coded)
            </div>
            <RawTokenView token={session.access_token} onCopy={copyToClipboard} />
          </div>

          <div className="card">
            <div className="card-title">
              <span className="icon">📊</span>
              Decoded JWT — payload & header
            </div>
            <div className="jwt-tabs">
              <button
                className={`jwt-tab ${activeTab === 'access' ? 'active' : ''}`}
                onClick={() => setActiveTab('access')}
              >
                Access Token
              </button>
              {session.id_token && (
                <button
                  className={`jwt-tab ${activeTab === 'id' ? 'active' : ''}`}
                  onClick={() => setActiveTab('id')}
                >
                  ID Token
                </button>
              )}
            </div>
            {decoded && !decoded.error && (
              <>
                <h3 style={{ marginBottom: '0.75rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                  HEADER
                </h3>
                <ClaimsTable claims={decoded.header} />
                <h3
                  style={{
                    marginTop: '1.5rem',
                    marginBottom: '0.75rem',
                    color: '#9ca3af',
                    fontSize: '0.9rem',
                  }}
                >
                  PAYLOAD
                </h3>
                <ClaimsTable claims={decoded.payload} />
              </>
            )}
            {decoded?.error && (
              <div className="status error">
                <span>❌</span>
                <span>Failed to decode token: {decoded.error}</span>
              </div>
            )}
          </div>
        </>
      )}

      <footer className="app-footer">
        Built with React + Vite · Keycloak {' '}
        <a href="https://www.keycloak.org/" target="_blank" rel="noopener noreferrer">
          keycloak.org
        </a>{' '}
        · Decode tokens at{' '}
        <a href="https://www.jwt.io/" target="_blank" rel="noopener noreferrer">
          jwt.io
        </a>
        <br />© 2026 Ilyes SADADOU · EFREI IAM M1-CSM
      </footer>
    </div>
  );
}

function UserPanel({ decoded, session }) {
  if (!decoded || decoded.error) return null;
  const p = decoded.payload;
  const display = p.name || p.preferred_username || p.email || p.sub || 'user';
  const initials = display.slice(0, 2).toUpperCase();
  const expiresIn = p.exp ? Math.max(0, p.exp - Math.floor(Date.now() / 1000)) : null;

  return (
    <div className="user-panel">
      <div className="avatar">{initials}</div>
      <div className="user-info">
        <div className="user-name">{display}</div>
        <div className="user-meta">
          sub: {p.sub?.slice(0, 8)}…
          {p.email && ` · ${p.email}`}
          {expiresIn !== null && ` · expires in ${expiresIn}s`}
        </div>
      </div>
    </div>
  );
}

function RawTokenView({ token, onCopy }) {
  const [h, p, s] = token.split('.');
  return (
    <div>
      <div className="token-row">
        <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>
          access_token
        </span>
        <button className="copy-btn" onClick={() => onCopy(token)}>
          Copy
        </button>
      </div>
      <div className="raw-token">
        <span className="header-part">{h}</span>
        <span className="dot">.</span>
        <span className="payload-part">{p}</span>
        <span className="dot">.</span>
        <span className="signature-part">{s}</span>
      </div>
    </div>
  );
}

function ClaimsTable({ claims }) {
  const entries = Object.entries(claims);
  return (
    <table className="payload-table">
      <thead>
        <tr>
          <th style={{ width: '22%' }}>Claim</th>
          <th style={{ width: '12%' }}>Type</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, value]) => {
          const isTimestamp = TIMESTAMP_CLAIMS.includes(key);
          const { type, formatted } = formatClaimValue(key, value, isTimestamp);
          const description = CLAIM_DESCRIPTIONS[key];
          return (
            <tr key={key}>
              <td>
                <div className="claim-key">{key}</div>
                {description && <div className="claim-description">{description}</div>}
              </td>
              <td>
                <span className="claim-type">{type}</span>
              </td>
              <td>
                <pre className={`claim-value value-${type}`}>{formatted}</pre>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
