// src/routes/api/auth.ts — signup / login / logout / me
import { Hono } from 'hono'
import {
  createUser,
  getUserByEmail,
  getUserById,
  recordSession,
  deleteSession,
  signJwt,
  verifyJwt,
  verifyPassword,
  buildSessionCookie,
  clearSessionCookie,
  createResetToken,
  consumeResetToken,
  resetPassword,
  type User,
} from '../../lib/auth'
import { getCurrentUser } from '../../lib/auth'

type Bindings = {
  DB: D1Database
  AUTH_SECRET?: string
  COOKIE_DOMAIN?: string
}

const app = new Hono<{ Bindings: Bindings; Variables: { user: User | null } }>()

function clientIp(c: any): string | null {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  )
}

function embedOrigin(req: Request): string | null {
  const ref = req.referrer || req.headers.get('referer')
  if (!ref) return null
  try {
    const u = new URL(ref)
    return u.origin
  } catch {
    return null
  }
}

// ── Audit H3: brute-force throttle ──────────────────────────────────────────
// Two layers: fast in-memory (per isolate) + durable D1 counter (shared across
// all isolates/colos). D1 is authoritative; memory short-circuits when warm.
const authFails = new Map<string, { n: number; ts: number }>()
const AUTH_FAIL_LIMIT = 8
const AUTH_WINDOW_MS = 15 * 60_000

function memThrottled(key: string): boolean {
  const f = authFails.get(key)
  if (!f || Date.now() - f.ts > AUTH_WINDOW_MS) return false
  return f.n >= AUTH_FAIL_LIMIT
}
function memRecord(key: string) {
  const now = Date.now()
  const f = authFails.get(key)
  if (!f || now - f.ts > AUTH_WINDOW_MS) { authFails.set(key, { n: 1, ts: now }); return }
  f.n++
}
function memClear(key: string) { authFails.delete(key) }
function clientKey(c: any, email: string): string {
  return `${email}|${c.req.header('cf-connecting-ip') || 'unknown'}`
}

// D1-backed counters (table: sessions reused pattern — dedicated table created
// via REST during audit; tolerant if absent).
async function d1Throttled(db: any, key: string): Promise<boolean> {
  try {
    const row = await db.prepare('SELECT fails, ts FROM auth_throttle WHERE k = ?').bind(key).first()
    if (!row) return false
    if (Date.now() - Number(row.ts) > AUTH_WINDOW_MS) return false
    return Number(row.fails) >= AUTH_FAIL_LIMIT
  } catch { return false }
}
async function d1Record(db: any, key: string) {
  try {
    await db.prepare(`INSERT INTO auth_throttle (k, fails, ts) VALUES (?, 1, ?)
      ON CONFLICT(k) DO UPDATE SET
        fails = CASE WHEN ? - ts > ${AUTH_WINDOW_MS} THEN 1 ELSE fails + 1 END,
        ts = CASE WHEN ? - ts > ${AUTH_WINDOW_MS} THEN ? ELSE ts END`)
      .bind(key, Date.now(), Date.now(), Date.now(), Date.now()).run()
  } catch { /* table missing — memory layer still applies */ }
}
async function d1Clear(db: any, key: string) {
  try { await db.prepare('DELETE FROM auth_throttle WHERE k = ?').bind(key).run() } catch {}
}

// POST /api/auth/signup — { email, password, display_name }
app.post('/signup', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; password?: string; display_name?: string }>()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const display_name = (body.display_name || '').trim()
    if (!email || !password) return c.json({ error: 'email_and_password_required' }, 400)
    if (password.length < 8) return c.json({ error: 'password_too_short', message: 'Password must be at least 8 characters' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'invalid_email' }, 400)
    // audit H3: signup spam throttle (memory OR durable D1 counter)
    const skey = clientKey(c, email)
    if (memThrottled(skey) || await d1Throttled(c.env.DB, skey)) {
      return c.json({ error: 'too_many_attempts', message: 'Too many attempts — try again in 15 minutes' }, 429)
    }

    const existing = await getUserByEmail(c.env.DB, email)
    if (existing) return c.json({ error: 'email_taken', message: 'Account already exists — try signing in' }, 409)

    const user = await createUser(c.env.DB, email, password, display_name)
    if (!user) return c.json({ error: 'create_failed' }, 500)

    // Issue session
    const { token, session_id, expires_at } = await signJwt(c.env, {
      sub: user.id,
      email: user.email,
      role: user.role,
    })
    await recordSession(
      c.env.DB,
      session_id,
      user.id,
      expires_at,
      clientIp(c),
      c.req.header('user-agent') || null,
      embedOrigin(c.req.raw)
    )

    c.header('Set-Cookie', buildSessionCookie(token, expires_at))
    return c.json({ user: { ...user, password_hash: undefined, password_salt: undefined } as any, token, expires_at }, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// POST /api/auth/login — { email, password }
app.post('/login', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; password?: string }>()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    if (!email || !password) return c.json({ error: 'email_and_password_required' }, 400)

    // audit H3: throttle before touching the DB (memory OR durable D1 counter)
    const ckey = clientKey(c, email)
    if (memThrottled(ckey) || await d1Throttled(c.env.DB, ckey)) {
      return c.json({ error: 'too_many_attempts', message: 'Too many failed attempts — try again in 15 minutes' }, 429)
    }

    const user = await getUserByEmail(c.env.DB, email)
    if (!user) {
      memRecord(ckey); c.executionCtx.waitUntil(d1Record(c.env.DB, ckey))
      return c.json({ error: 'invalid_credentials' }, 401)
    }

    const ok = await verifyPassword(password, user.password_hash, user.password_salt)
    if (!ok) {
      memRecord(ckey); c.executionCtx.waitUntil(d1Record(c.env.DB, ckey))
      return c.json({ error: 'invalid_credentials' }, 401)
    }
    memClear(ckey)
    c.executionCtx.waitUntil(d1Clear(c.env.DB, ckey))

    const { token, session_id, expires_at } = await signJwt(c.env, {
      sub: user.id,
      email: user.email,
      role: user.role,
    })
    await recordSession(
      c.env.DB,
      session_id,
      user.id,
      expires_at,
      clientIp(c),
      c.req.header('user-agent') || null,
      embedOrigin(c.req.raw)
    )

    c.header('Set-Cookie', buildSessionCookie(token, expires_at))
    return c.json({
      user: { ...user, password_hash: undefined, password_salt: undefined } as any,
      token,
      expires_at,
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// POST /api/auth/logout — clears session
app.post('/logout', async (c) => {
  const cookie = c.req.header('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)clx_session=([^;]+)/)
  if (m) {
    const sessionId = decodeURIComponent(m[1])
    const payload = await verifyJwt(c.env, sessionId)
    if (payload) await deleteSession(c.env.DB, payload.jti)
  }
  c.header('Set-Cookie', clearSessionCookie())
  return c.json({ success: true })
})

// GET /api/auth/me — current user from cookie or bearer
app.get('/me', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ user: null, authenticated: false })
  return c.json({
    user: { ...user, password_hash: undefined, password_salt: undefined } as any,
    authenticated: true,
  })
})

// GET /api/auth/token — mint a long-lived API token for the logged-in user (one per session)
app.post('/token', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  return c.json({ api_token: user.api_token })
})

// POST /api/auth/forgot — initiate password reset (sends reset link)
// In production: email via Resend/SendGrid. Dev mode: returns token in response.
app.post('/forgot', async (c) => {
  try {
    const body = await c.req.json<{ email?: string }>()
    const email = (body.email || '').trim().toLowerCase()
    if (!email) return c.json({ error: 'email_required' }, 400)

    const user = await getUserByEmail(c.env.DB, email)
    // Always return success to prevent email enumeration
    if (!user) return c.json({ success: true, message: 'If that account exists, a reset link has been sent.' })

    const reset = await createResetToken(c.env.DB, user.id)
    if (!reset) return c.json({ error: 'reset_init_failed' }, 500)

    // TODO: email reset.raw_token via Resend / SendGrid in production
    // For dev, return the reset link directly
    const origin = c.req.header('origin') || 'https://curatedlux.pages.dev'
    const resetLink = `${origin}/reset-password?token=${reset.raw_token}`

    return c.json({
      success: true,
      message: 'If that account exists, a reset link has been sent.',
      // DEV ONLY — remove in production when email is wired:
      dev_reset_link: resetLink,
      dev_reset_token: reset.raw_token,
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// POST /api/auth/reset — consume token and set new password
app.post('/reset', async (c) => {
  try {
    const body = await c.req.json<{ token?: string; password?: string }>()
    const token = (body.token || '').trim()
    const password = body.password || ''
    if (!token || !password) return c.json({ error: 'token_and_password_required' }, 400)
    if (password.length < 8) return c.json({ error: 'password_too_short', message: 'Password must be at least 8 characters' }, 400)

    const user_id = await consumeResetToken(c.env.DB, token)
    if (!user_id) return c.json({ error: 'invalid_or_expired_token', message: 'Reset link is invalid or has expired (1-hour window)' }, 400)

    const ok = await resetPassword(c.env.DB, user_id, password)
    if (!ok) return c.json({ error: 'reset_failed' }, 500)

    return c.json({ success: true, message: 'Password has been reset. You can now sign in.' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default app
