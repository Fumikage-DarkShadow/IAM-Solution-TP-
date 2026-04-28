// Keycloak configuration
// =====================================================================
// These values match the configuration produced by the
// `keycloak-realm-export.json` file imported into Keycloak.
// Modify them if you change the realm/client/user names.
// =====================================================================

export const KEYCLOAK_CONFIG = {
  // Base URL of the Keycloak server (Docker container exposed on 8080)
  serverUrl: 'http://localhost:8080',

  // Realm to authenticate against
  realm: 'efrei-iam',

  // Public client with "Direct Access Grants" enabled
  // (Resource Owner Password Credentials flow, matches the curl in the slide)
  clientId: 'react-spa',
};

// Derived endpoint URLs (RFC 6749 / OpenID Connect Discovery)
export const TOKEN_ENDPOINT =
  `${KEYCLOAK_CONFIG.serverUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;

export const LOGOUT_ENDPOINT =
  `${KEYCLOAK_CONFIG.serverUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout`;

export const USERINFO_ENDPOINT =
  `${KEYCLOAK_CONFIG.serverUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`;

// Human-readable descriptions for the standard JWT claims.
// Used to enrich the payload table with educational context.
export const CLAIM_DESCRIPTIONS = {
  // RFC 7519 - Standard JWT claims
  iss: 'Issuer - URL of the identity provider that issued the token',
  sub: 'Subject - Unique identifier of the user (UUID in Keycloak)',
  aud: 'Audience - Recipients the token is intended for',
  exp: 'Expiration time (Unix timestamp) - Token is invalid after this date',
  iat: 'Issued At (Unix timestamp) - When the token was issued',
  nbf: 'Not Before (Unix timestamp) - Token is not valid before this date',
  jti: 'JWT ID - Unique identifier for this specific token',
  // Keycloak / OIDC specific claims
  typ: 'Token Type - Bearer token type (Access / ID / Refresh)',
  azp: 'Authorized Party - The client that requested this token',
  sid: 'Session ID - User session identifier in Keycloak',
  acr: 'Authentication Context Class Reference - Strength of authentication',
  scope: 'OAuth2 scopes granted to this token',
  email_verified: 'Whether the user email has been verified',
  name: 'Full name of the user',
  preferred_username: 'Username chosen by the user',
  given_name: 'First name of the user',
  family_name: 'Last name of the user',
  email: 'Email address of the user',
  realm_access: 'Roles assigned at the realm level',
  resource_access: 'Roles assigned at the client (resource) level',
  allowed_origins: 'CORS origins allowed for this token',
  auth_time: 'Time at which the user authenticated',
};

export const TIMESTAMP_CLAIMS = ['exp', 'iat', 'nbf', 'auth_time'];
