// CuratedLux — Authenticator credits + capped posted-history
// A single authenticated "post" (auto-filled from photos) consumes one credit
// and logs the item into a bounded history. Oldest entries auto-prune past the cap.

// ── Tunable constants (change here, not spread across code) ────────────────
export const DEFAULT_CREDITS = 50;        // free pool per new user
export const POSTED_HISTORY_CAP = 20;      // max posted items kept per user

export interface CreditState {
  credits: number;
  creditsUsed: number;
}

/** Read a user's current credit balance (defaults if columns missing). */
export async function getUserCredits(db: any, userId: string): Promise<CreditState> {
  try {
    const row = await db.prepare('SELECT credits, credits_used FROM users WHERE id = ?')
      .bind(userId).first()
    return {
      credits: Number(row?.credits ?? DEFAULT_CREDITS),
      creditsUsed: Number(row?.credits_used ?? 0),
    }
  } catch {
    return { credits: DEFAULT_CREDITS, creditsUsed: 0 }
  }
}

/**
 * Consume one credit for an authentication/post. Returns the new balance, or
 * throws if the user has no credits left. Appends a ledger entry for audit.
 */
export async function consumeCredit(
  db: any,
  userId: string,
  reason = 'authentication'
): Promise<CreditState> {
  const state = await getUserCredits(db, userId)
  if (state.credits <= 0) {
    throw new Error('NO_CREDITS')
  }

  await db.prepare(
    'UPDATE users SET credits = credits - 1, credits_used = credits_used + 1 WHERE id = ?'
  ).bind(userId).run()

  // Audit ledger
  try {
    await db.prepare(
      'INSERT INTO credit_ledger (id, user_id, delta, reason, created_at) VALUES (?, ?, -1, ?, ?)'
    ).bind(crypto.randomUUID(), userId, reason, new Date().toISOString()).run()
  } catch { /* ledger is best-effort */ }

  return { credits: state.credits - 1, creditsUsed: state.creditsUsed + 1 }
}

/**
 * Log a posted item into the capped history, pruning the oldest rows beyond
 * POSTED_HISTORY_CAP so the log never grows unbounded.
 */
export async function logPostedItem(db: any, userId: string, item: {
  inventory_id?: string | null;
  category?: string;
  brand?: string;
  model?: string;
  referenceNumber?: string;
  year?: number | null;
  condition_label?: string;
  estimatedValue?: number;
  currency?: string;
  confidence?: number;
  authenticityStatus?: string;
  source?: string;
}): Promise<void> {
  const id = crypto.randomUUID()
  await db.prepare(`INSERT INTO posted_items
    (id, user_id, inventory_id, category, brand, model, reference_number, year,
     condition_label, estimated_value, currency, confidence, authenticity_status, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id, userId,
      item.inventory_id || null,
      item.category || '',
      item.brand || '',
      item.model || '',
      item.referenceNumber || '',
      item.year ?? null,
      item.condition_label || '',
      item.estimatedValue ?? 0,
      item.currency || 'USD',
      item.confidence ?? 0,
      item.authenticityStatus || 'PENDING',
      item.source || 'ai',
      new Date().toISOString()
    ).run()

  // Prune: keep only the most recent POSTED_HISTORY_CAP rows for this user.
  await db.prepare(`DELETE FROM posted_items WHERE user_id = ? AND id NOT IN (
      SELECT id FROM posted_items WHERE user_id = ?
      ORDER BY created_at DESC LIMIT ?
    )`).bind(userId, userId, POSTED_HISTORY_CAP).run()
}

/** Add credits (e.g. admin grant / purchase). Returns new balance. */
export async function grantCredits(
  db: any,
  userId: string,
  amount: number,
  reason = 'grant'
): Promise<CreditState> {
  await db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
    .bind(amount, userId).run()
  try {
    await db.prepare(
      'INSERT INTO credit_ledger (id, user_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), userId, amount, reason, new Date().toISOString()).run()
  } catch { /* best-effort */ }
  return getUserCredits(db, userId)
}
