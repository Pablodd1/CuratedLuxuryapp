// src/lib/webhooks.ts — HMAC-SHA256 signing, delivery queue, retry logic
// Powers /api/webhooks/* routes. Webhooks export scan data to external systems
// like watchfact.com, Squarespace, Versatile, etc.

import { signHmac } from './auth'

export type Webhook = {
  id: string
  user_id: string | null
  name: string
  target_url: string
  signing_secret: string
  event_types: string // CSV
  is_active: number // 0|1
  retry_max: number
  retry_backoff: 'linear' | 'exponential'
  timeout_ms: number
  created_at: string
}

export type DeliveryRow = {
  id: string
  webhook_id: string
  event_id: string
  event_type: string
  payload: string
  signature: string
  attempts: number
  last_status: number | null
  last_response: string | null
  next_retry_at: string | null
  delivered_at: string | null
  created_at: string
}

export function buildSigningPayload(eventType: string, eventId: string, timestamp: string, body: string): string {
  return `${eventType}\n${eventId}\n${timestamp}\n${body}`
}

export async function signWebhookBody(secret: string, eventType: string, eventId: string, body: string): Promise<{ signature: string; timestamp: string }> {
  const timestamp = new Date().toISOString()
  const payload = buildSigningPayload(eventType, eventId, timestamp, body)
  const sig = await signHmac(secret, payload)
  return { signature: `t=${timestamp},v1=${sig}`, timestamp }
}

export async function deliverWebhook(c: any, webhook: Webhook, eventType: string, payload: any): Promise<{ delivery_id: string; status: number; response: string | null }> {
  const bodyJson = JSON.stringify(payload)
  const eventId = crypto.randomUUID()
  const { signature } = await signWebhookBody(webhook.signing_secret, eventType, eventId, bodyJson)
  const deliveryId = crypto.randomUUID()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), webhook.timeout_ms || 10_000)

  let status = 0
  let responseText: string | null = null
  try {
    const resp = await fetch(webhook.target_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CuratedLux-Webhook/1.0',
        'X-CLX-Event': eventType,
        'X-CLX-Event-Id': eventId,
        'X-CLX-Signature': signature,
      },
      body: bodyJson,
      signal: controller.signal,
    })
    status = resp.status
    responseText = (await resp.text()).slice(0, 2048)
  } catch (e: any) {
    responseText = `network_error: ${e?.message?.slice(0, 200) || e}`.slice(0, 2048)
  } finally {
    clearTimeout(timeout)
  }

  await c.env.DB.prepare(
    `INSERT INTO webhook_deliveries
      (id, webhook_id, event_id, event_type, payload, signature, attempts, last_status, last_response)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(deliveryId, webhook.id, eventId, eventType, bodyJson, signature, 1, status || null, responseText)
    .run()

  if (status >= 200 && status < 300) {
    await c.env.DB
      .prepare('UPDATE webhook_deliveries SET delivered_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), deliveryId)
      .run()
  } else if (webhook.retry_max > 1) {
    const backoff = webhook.retry_backoff === 'exponential' ? 2 : 1
    const nextRetryMin = backoff * Math.pow(2, 1 - 1) // ~2 min for exponential
    const nextRetry = new Date(Date.now() + nextRetryMin * 60 * 1000).toISOString()
    await c.env.DB
      .prepare('UPDATE webhook_deliveries SET next_retry_at = ? WHERE id = ?')
      .bind(nextRetry, deliveryId)
      .run()
  }

  return { delivery_id: deliveryId, status, response: responseText }
}

// Fire any webhooks subscribed to this event type
export async function fanOutEvent(c: any, eventType: string, payload: any): Promise<{ sub_count: number; results: any[] }> {
  const db = c.env.DB
  const { results: webhooks } = await db
    .prepare('SELECT * FROM webhooks WHERE is_active = 1')
    .all<Webhook>()
  const matching = (webhooks || []).filter((w) => {
    const types = (w.event_types || '').split(',').map((s) => s.trim())
    return types.includes(eventType) || types.includes('*')
  })
  const results = []
  for (const wh of matching) {
    const r = await deliverWebhook(c, wh, eventType, payload)
    results.push({ webhook_id: wh.id, name: wh.name, ...r })
  }
  return { sub_count: matching.length, results }
}
