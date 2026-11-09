/**
 * Origins Atlas — Admin Authentication Service
 * Secure HMAC-SHA256 session token generation and verification using Web Crypto API.
 * Compatible with Next.js Edge Middleware, Server Components, and API Route Handlers.
 */

import { cookies } from 'next/headers';

export interface AdminSessionPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}

export const ADMIN_COOKIE_NAME = 'oa_admin_session';
export const ADMIN_SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SECURITY CONFIGURATION ERROR: ADMIN_SESSION_SECRET environment variable is missing. ' +
      'Admin session creation and verification cannot proceed without an explicitly configured secret.'
    );
  }
  return secret;
}

// Convert ArrayBuffer to URL-safe base64 string
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert URL-safe base64 string to Uint8Array
function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Generate a signed session token.
 */
export async function createSessionToken(
  email: string,
  maxAgeSeconds = ADMIN_SESSION_DURATION
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    email: email.toLowerCase().trim(),
    role: 'admin',
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const enc = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = bufferToBase64Url(enc.encode(payloadJson).buffer);

  const cryptoKey = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    enc.encode(payloadBase64)
  );
  const signatureBase64 = bufferToBase64Url(signatureBuffer);

  return `${payloadBase64}.${signatureBase64}`;
}

/**
 * Verify a signed session token and return the payload if valid and not expired.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signatureBase64] = parts;

  try {
    const enc = new TextEncoder();
    const cryptoKey = await getCryptoKey();
    const signatureBytes = base64UrlToBuffer(signatureBase64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      enc.encode(payloadBase64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlToBuffer(payloadBase64);
    const dec = new TextDecoder();
    const payloadJson = dec.decode(payloadBytes);
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validate submitted admin email and password.
 */
export async function validateAdminCredentials(
  emailRaw: string,
  passwordRaw: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  const email = (emailRaw || '').trim().toLowerCase();
  const password = passwordRaw || '';

  if (!email || !password) {
    return { valid: false, error: 'Email and password are required' };
  }

  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    return {
      valid: false,
      error: 'Admin authentication is not configured on the server. Please define ADMIN_EMAIL and ADMIN_PASSWORD environment variables.',
    };
  }

  // 1. Check primary configured admin credentials
  if (email === configuredEmail && password === configuredPassword) {
    return { valid: true, email: configuredEmail };
  }

  // 2. Allow secondary check via Supabase Auth (if user configured Supabase Auth account)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user?.email) {
        return { valid: true, email: data.user.email };
      }
    }
  } catch {
    // Ignore Supabase auth check fallback errors
  }

  return { valid: false, error: 'Invalid email or password' };
}

/**
 * Server-side helper to verify admin session from Next.js request cookies.
 * Returns payload if authenticated, or null if unauthorized.
 */
export async function requireAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
