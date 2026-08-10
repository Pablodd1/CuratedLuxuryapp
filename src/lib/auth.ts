// src/lib/auth.ts — JWT (HS256) + PBKDF2-SHA256 password hash + session middleware
// Web Crypto API only (Workers-compatible — no Node crypto)

import type { Context, MiddlewareHandler } from 'hono'
/// <reference types="@cloudflare/workers-types" />

// ---------- Types ----------

export type User = {
  id: string
  email: string
  display_name: string
  avatar_url: string
  role: 'user' | 'admin' | 'curator'
  api_token: string
  created_at: string
  last_seen_at: string | null
}

export type Session = {
  id: string
  user_id: string
  expires_at: string
  created_at: string
}

export type AuthBindings = {
  DB: D1Database
  AUTH_SECRET?: string
}

// ---------- Config ----------

const TOKEN_TTL_HOURS = 24 * 30 // 30 days
const SESSION_TTL_HOURS = 24 * 30
const PBKDF2_ITERATIONS = 100_000
const PBKDF2_HASH = 'SHA-256'
const PBKDF2_KEYLEN = 256
const DEFAULT_SECRET = 'curatedlux-dev-secret-change-me-in-production'

function getSecret(env: AuthBindings): string {
  return env.AUTH_SECRET || DEFAULT_SECRET
}

// ---------- Base64URL ----------

function b64urlEncode(bytes: Uint8Array | ArrayBuffer): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let str = ''
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4)
  const base = (s + '='.repeat(pad)).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(base)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ---------- UTF-8 ----------

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

// ---------- Random ----------

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return a
}

export function randomId(prefix = ''): string {
  const b = randomBytes(16)
  const hex = Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${prefix}${hex}`
}

// ---------- HMAC-SHA256 (for JWT + webhook signing) ----------

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    utf8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function signHmac(secret: string, data: string): Promise<string> {
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, utf8(data))
  return b64urlEncode(sig)
}

export async function verifyHmac(secret: string, data: string, signature: string): Promise<boolean> {
  try {
    const key = await hmacKey(secret)
    const sigBytes = b64urlDecode(signature)
    return await crypto.subtle.verify('HMAC', key, sigBytes, utf8(data))
  } catch {
    return false
  }
}

// ---------- JWT (HS256) ----------

export type JwtPayload = {
  sub: string // user_id
  email: string
  role: string
  iat: number
  exp: number
  jti: string // session id
}

export async function signJwt(env: AuthBindings, claims: Omit<JwtPayload, 'iat' | 'exp' | 'jti'>): Promise<{ token: string; session_id: string; expires_at: string }> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + TOKEN_TTL_HOURS * 3600
  const jti = randomId()
  const payload: JwtPayload = { ...claims, iat: now, exp, jti }
  const header = b64urlEncode(utf8(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64urlEncode(utf8(JSON.stringify(payload)))
  const data = `${header}.${body}`
  const sig = await signHmac(getSecret(env), data)
  return {
    token: `${data}.${sig}`,
    session_id: jti,
    expires_at: new Date(exp * 1000).toISOString(),
  }
}

export async function verifyJwt(env: AuthBindings, token: string): Promise<JwtPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const data = `${header}.${body}`
  const ok = await verifyHmac(getSecret(env), data, sig)
  if (!ok) return null
  let payload: JwtPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)))
  } catch {
    return null
  }
  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

// ---------- PBKDF2-SHA256 password hash ----------

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = randomBytes(16)
  const salt = b64urlEncode(saltBytes)
  const key = await crypto.subtle.importKey(
    'raw',
    utf8(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    key,
    PBKDF2_KEYLEN
  )
  return { hash: b64urlEncode(bits), salt }
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const saltBytes = b64urlDecode(storedSalt)
  const key = await crypto.subtle.importKey(
    'raw',
    utf8(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    key,
    PBKDF2_KEYLEN
  )
  const candidate = b64urlEncode(bits)
  return timingSafeEqual(candidate, storedHash)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ---------- D1 user / session helpers ----------

export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  display_name = ''
): Promise<User | null> {
  const id = randomId('u_')
  const { hash, salt } = await hashPassword(password)
  const api_token = randomId('tok_')
  const now = new Date().toISOString()
  try {
    await db
      .prepare(
        `INSERT INTO users (id, email, password_hash, password_salt, display_name, api_token, role, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'user', ?)`
      )
      .bind(id, email.toLowerCase().trim(), hash, salt, display_name, api_token, now)
      .run()
  } catch (e: any) {
    if (String(e?.message || '').includes('UNIQUE')) return null
    throw e
  }
  return {
    id,
    email: email.toLowerCase().trim(),
    display_name,
    avatar_url: '',
    role: 'user',
    api_token,
    created_at: now,
    last_seen_at: null,
  }
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const row = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email.toLowerCase().trim())
    .first<User>()
  return row || null
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>()
  return row || null
}

export async function getUserByApiToken(db: D1Database, token: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE api_token = ?').bind(token).first<User>()
  return row || null
}

export async function recordSession(
  db: D1Database,
  session_id: string,
  user_id: string,
  expires_at: string,
  ip: string | null,
  user_agent: string | null,
  embed_origin: string | null
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent, embed_origin)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(session_id, user_id, expires_at, ip, user_agent, embed_origin)
    .run()
}

export async function deleteSession(db: D1Database, session_id: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(session_id).run()
}

export async function touchLastSeen(db: D1Database, user_id: string): Promise<void> {
  await db
    .prepare('UPDATE users SET last_seen_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), user_id)
    .run()
}

// ---------- Current-user extraction from request ----------

export async function getCurrentUser(c: Context<{ Bindings: AuthBindings }>): Promise<User | null> {
  // 1. Bearer token (preferred for API / embed)
  const auth = c.req.header('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim()
    // Try JWT first
    const payload = await verifyJwt(c.env, token)
    if (payload) {
      const user = await getUserById(c.env.DB, payload.sub)
      if (user) return user
    }
    // Fallback: API token (long-lived)
    const user = await getUserByApiToken(c.env.DB, token)
    if (user) return user
  }
  // 2. Cookie (browser session)
  const cookie = c.req.header('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)clx_session=([^;]+)/)
  if (m) {
    const sessionId = decodeURIComponent(m[1])
    const payload = await verifyJwt(c.env, sessionId)
    if (payload) {
      const user = await getUserById(c.env.DB, payload.sub)
      if (user) return user
    }
  }
  // 3. gsk-hosted-identity header fallback (read-only — site is on cf-byok-deploy)
  const gsEmail = c.req.header('x-genspark-user-email')
  if (gsEmail) {
    const u = await getUserByEmail(c.env.DB, gsEmail)
    if (u) return u
  }
  return null
}

// ---------- Middleware ----------

export const requireAuth: MiddlewareHandler<{ Bindings: AuthBindings; Variables: { user: User } }> = async (c, next) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'unauthorized', message: 'Sign in required' }, 401)
  c.set('user', user)
  // touch last_seen async (don't await)
  c.executionCtx.waitUntil(touchLastSeen(c.env.DB, user.id))
  await next()
}

export const optionalAuth: MiddlewareHandler<{ Bindings: AuthBindings; Variables: { user: User | null } }> = async (c, next) => {
  const user = await getCurrentUser(c)
  c.set('user', user)
  await next()
}

// ---------- Password Reset ----------

export async function createResetToken(db: D1Database, user_id: string): Promise<{ raw_token: string; expires_at: string } | null> {
  const raw_token = randomId('rst_')
  const tokenHash = await sha256(raw_token)
  const id = randomId('prt_')
  const expires_at = new Date(Date.now() + 3600_000).toISOString() // 1 hour
  try {
    await db
      .prepare(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used)
         VALUES (?, ?, ?, ?, 0)`
      )
      .bind(id, user_id, tokenHash, expires_at)
      .run()
    return { raw_token, expires_at }
  } catch {
    return null
  }
}

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', utf8(input))
  return b64urlEncode(digest)
}

export async function consumeResetToken(db: D1Database, rawToken: string): Promise<string | null> {
  const tokenHash = await sha256(rawToken)
  const row = await db
    .prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0')
    .bind(tokenHash)
    .first<{ id: string; user_id: string; expires_at: string; used: number }>()
  if (!row) return null
  if (new Date(row.expires_at) < new Date()) return null // expired
  // Mark as used
  await db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').bind(row.id).run()
  return row.user_id
}

export async function resetPassword(db: D1Database, user_id: string, newPassword: string): Promise<boolean> {
  try {
    const { hash, salt } = await hashPassword(newPassword)
    await db
      .prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
      .bind(hash, salt, user_id)
      .run()
    return true
  } catch {
    return false
  }
}

// ---------- Cookie helpers ----------

export function buildSessionCookie(token: string, expiresAtISO: string): string {
  const exp = Math.floor(new Date(expiresAtISO).getTime() / 1000)
  const flags = [
    `clx_session=${encodeURIComponent(token)}`,
    `Path=/`,
    `Expires=${new Date(exp * 1000).toUTCString()}`,
    `HttpOnly`,
    `SameSite=Lax`,
  ]
  return flags.join('; ')
}

export function clearSessionCookie(): string {
  return `clx_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
}
