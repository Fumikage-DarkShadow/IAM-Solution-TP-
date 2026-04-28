// =====================================================================
// JWT decoder utilities
// =====================================================================
// A JSON Web Token has 3 parts separated by dots:
//   header.payload.signature
// Each part is Base64URL-encoded JSON (except the signature, which is raw).
// We only need to decode the header and the payload here.
// We do NOT verify the signature client-side because:
//   1) The HS256 / RS256 secrets must NEVER leave the server.
//   2) Decoding for display is safe; trust decisions must be made server-side.
// =====================================================================

/**
 * Decode a Base64URL string into a UTF-8 string.
 * Base64URL replaces '+' with '-' and '/' with '_', and strips '=' padding.
 */
function base64UrlDecode(input) {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad === 2) str += '==';
  else if (pad === 3) str += '=';
  else if (pad === 1) throw new Error('Invalid base64url string');

  const binary = atob(str);
  // Convert binary string -> UTF-8 (handles non-ASCII characters such as accents)
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Parse a JWT and return { header, payload, signature, parts }.
 * Throws if the token is malformed.
 */
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is empty or not a string');
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT: expected 3 parts, got ${parts.length}`);
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlDecode(headerB64));
  const payload = JSON.parse(base64UrlDecode(payloadB64));
  return {
    header,
    payload,
    signature: signatureB64,
    parts: { header: headerB64, payload: payloadB64, signature: signatureB64 },
  };
}

/**
 * Format a value for display, returning { type, formatted } where:
 * - type is one of: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'date'
 * - formatted is the string to render in the table
 */
export function formatClaimValue(key, value, isTimestamp = false) {
  if (value === null) return { type: 'null', formatted: 'null' };

  if (isTimestamp && typeof value === 'number') {
    const date = new Date(value * 1000);
    const iso = date.toISOString().replace('T', ' ').slice(0, 19);
    const relative = formatRelativeTime(value);
    return { type: 'date', formatted: `${value} → ${iso} UTC (${relative})` };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', formatted: '[]' };
    return { type: 'array', formatted: JSON.stringify(value, null, 2) };
  }

  if (typeof value === 'object') {
    return { type: 'object', formatted: JSON.stringify(value, null, 2) };
  }

  if (typeof value === 'boolean') return { type: 'boolean', formatted: String(value) };
  if (typeof value === 'number') return { type: 'number', formatted: String(value) };
  return { type: 'string', formatted: String(value) };
}

function formatRelativeTime(unixTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = unixTimestamp - now;
  const abs = Math.abs(diff);
  const future = diff > 0;

  if (abs < 60) return future ? `in ${abs}s` : `${abs}s ago`;
  if (abs < 3600) return future ? `in ${Math.floor(abs / 60)}min` : `${Math.floor(abs / 60)}min ago`;
  if (abs < 86400) return future ? `in ${Math.floor(abs / 3600)}h` : `${Math.floor(abs / 3600)}h ago`;
  return future ? `in ${Math.floor(abs / 86400)}d` : `${Math.floor(abs / 86400)}d ago`;
}
