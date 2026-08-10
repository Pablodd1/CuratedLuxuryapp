// src/routes/api/webhooks.ts — subscription management + test + history
import { Hono } from 'hono'
import { requireAuth, type User } from '../../lib/auth'
import { signWebhookBody } from '../../lib/webhooks'

type Bindings = {
  DB: D1Database
  AUTH_SECRET?: string
}

const app = new Hono<{ Bindings: Bindings; Variables: { user: User } }>()

// All routes require auth — webhook secrets are sensitive
app.use('*', requireAuth)

function randomSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0')
  return `whsec_${s}`
}

// POST /api/webhooks — create webhook subscription
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json<{
      name?: string
      target_url?: string
      event_types?: string[] | string
      retry_max?: number
      retry_backoff?: 'linear' | 'exponential'
      timeout_ms?: number
    }>()

    const target_url = (body.target_url || '').trim()
    if (!target_url || !/^https?:\/\//.test(target_url)) {
      return c.json({ error: 'invalid_target_url' }, 400)
    }
    const event_types = Array.isArray(body.event_types)
      ? body.event_types.join(',')
      : (body.event_types || 'scan.created').toString()

    const id = `wh_${crypto.randomUUID()}`
    const secret = randomSecret()
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      `INSERT INTO webhooks
        (id, user_id, name, target_url, signing_secret, event_types, is_active, retry_max, retry_backoff, timeout_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
    )
      .bind(
        id,
        user.id,
        body.name || 'Untitled Webhook',
        target_url,
        secret,
        event_types,
        Math.min(body.retry_max || 3, 10),
        body.retry_backoff || 'exponential',
        Math.min(body.timeout_ms || 10_000, 30_000),
        now
      )
      .run()

    const row = await c.env.DB.prepare('SELECT * FROM webhooks WHERE id = ?').bind(id).first()
    return c.json({ webhook: row, signing_secret: secret, signing_instructions: getSigningInstructions() }, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// GET /api/webhooks — list user's webhooks
app.get('/', async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB
    .prepare('SELECT id, name, target_url, event_types, is_active, retry_max, retry_backoff, timeout_ms, created_at FROM webhooks WHERE user_id = ? ORDER BY created_at DESC')
    .bind(user.id)
    .all()
  return c.json({ webhooks: results })
})

// POST /api/webhooks/:id/test — fire a test ping
app.post('/:id/test', async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    const row = await c.env.DB
      .prepare('SELECT * FROM webhooks WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .first<any>()
    if (!row) return c.json({ error: 'not_found' }, 404)

    const eventId = crypto.randomUUID()
    const testBody = JSON.stringify({ test: true, message: 'Hello from CuratedLux', sent_at: new Date().toISOString() })
    const { signature, timestamp } = await signWebhookBody(row.signing_secret, 'webhook.test', eventId, testBody)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    let status = 0
    let responseText: string | null = null
    try {
      const resp = await fetch(row.target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CuratedLux-Webhook/1.0',
          'X-CLX-Event': 'webhook.test',
          'X-CLX-Event-Id': eventId,
          'X-CLX-Signature': signature,
        },
        body: testBody,
        signal: controller.signal,
      })
      status = resp.status
      responseText = (await resp.text()).slice(0, 1024)
    } catch (e: any) {
      responseText = `network_error: ${e?.message?.slice(0, 200) || e}`.slice(0, 1024)
    } finally {
      clearTimeout(timeout)
    }

    return c.json({ delivered: status >= 200 && status < 300, status, response: responseText, signature, timestamp, event_id: eventId })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// GET /api/webhooks/:id/deliveries — recent delivery history
app.get('/:id/deliveries', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const limit = Math.min(Number(c.req.query('limit')) || 30, 100)
  const { results } = await c.env.DB
    .prepare(
      `SELECT d.* FROM webhook_deliveries d
       INNER JOIN webhooks w ON w.id = d.webhook_id
       WHERE w.id = ? AND w.user_id = ? ORDER BY d.created_at DESC LIMIT ?`
    )
    .bind(id, user.id, limit)
    .all()
  return c.json({ deliveries: results })
})

// DELETE /api/webhooks/:id
app.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM webhooks WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return c.json({ success: true, id })
})

function getSigningInstructions(): string {
  return `Verify the X-CLX-Signature header on incoming POSTs.
Header format: "t=<ISO8601>,v1=<HMAC-SHA256-hex>"
To verify:
  payload = '<event_type>\\n<event_id>\\n<t_value>\\n<raw_body>'
  expected = HMAC-SHA256(payload, signing_secret, hex)
Reject if v1 != expected or timestamp is older than 5 minutes.`
}

export default app
