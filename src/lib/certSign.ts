// CuratedLux certificate signing — ES256 (P-256 ECDSA) over a canonical
// certificate payload. Workers WebCrypto: Ed25519 sign/verify is NOT
// supported there (generate/export only), ES256 is fully supported and is
// the standard JWT signature algorithm.
//
// The keypair is persisted to the `settings` table on first use: Workers
// isolates are recreated constantly, and an in-memory key would make old
// signatures unverifiable after every deploy/cold start.

const SETTINGS_KEY = 'cert_keypair_v1'
declare const process: any // self-test trigger; @types/node is not in this project

// Canonical JSON: keys sorted, no whitespace. The signature is over THIS
// exact byte string, so any field change invalidates it.
export function canonicalCertJson(f: Record<string, unknown>): string {
  const o: Record<string, unknown> = {}
  for (const k of Object.keys(f).sort()) o[k] = f[k]
  return JSON.stringify(o)
}

async function getOrCreateKeyPair(db: any) {
  const row = (await db.prepare('SELECT value FROM settings WHERE id = ?').bind(SETTINGS_KEY).first()) as any
  if (row?.value) {
    const jwk = JSON.parse(row.value)
    return {
      privateKey: await crypto.subtle.importKey('jwk', jwk.private, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']),
      publicKey: await crypto.subtle.importKey('jwk', jwk.public, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']),
      publicKeyJwk: jwk.public,
    }
  }
  const pair: CryptoKeyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const jwk = {
    private: await crypto.subtle.exportKey('jwk', pair.privateKey),
    public: await crypto.subtle.exportKey('jwk', pair.publicKey),
  }
  await db.prepare('INSERT INTO settings (id, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
    .bind(SETTINGS_KEY, JSON.stringify(jwk), new Date().toISOString()).run()
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, publicKeyJwk: jwk.public }
}

export async function signCertificate(db: any, fields: Record<string, unknown>): Promise<{ signature: string; payload: string; publicKeyJwk: any }> {
  const payload = canonicalCertJson(fields)
  const { privateKey, publicKeyJwk } = await getOrCreateKeyPair(db)
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(payload)
  )
  return { signature: btoa(String.fromCharCode(...new Uint8Array(sig))), payload, publicKeyJwk }
}

// Returns true if the signature over `payload` verifies with the given
// public JWK (each certificate stores the public key that signed it, so
// rotation is safe — old certs verify with the old key).
export async function verifyCertificate(payload: string, signature: string, publicKeyJwk: any): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify'])
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
      new TextEncoder().encode(payload)
    )
  } catch {
    return false
  }
}

// ponytail: btoa spread on 64-byte sig is fine; if signature sizes ever grow
// (larger curves) switch to a chunked base64 encoder.

if (typeof process !== 'undefined' && process.env?.SELFTEST) {
  // Node self-check: sign → tamper → verify round-trip.
  const memdb = {
    _rows: {} as Record<string, string>,
    prepare(sql: string) {
      return {
        bind(...vals: any[]) {
          return {
            first: async () => (sql.includes('SELECT') ? { value: memdb._rows[vals[0]] } : undefined),
            run: async () => { memdb._rows[vals[0]] = vals[1]; return {} },
          }
        }
      }
    },
  } as any
  void (async () => {
    const f = {
      inventoryId: 'inv-1', dossierId: 'dos-1', brand: 'Rolex', model: 'Submariner', referenceNumber: '126610LN',
      dial: 'Black', conditionLabel: 'Excellent', authenticityStatus: 'AUTHENTIC MATCH', confidence: 91,
      estimatedValue: 14200, marketPrice: 13950, priceSource: 'chrono24_baseline', verifiedAt: '2026-08-21T00:00:00Z',
    }
    const { signature, payload, publicKeyJwk } = await signCertificate(memdb, f)
    if (!(await verifyCertificate(payload, signature, publicKeyJwk))) throw new Error('valid signature failed verification')
    if (await verifyCertificate(payload + 'x', signature, publicKeyJwk)) throw new Error('tampered payload verified (CRITICAL)')
    // second call must reuse the persisted key
    const again = await signCertificate(memdb, f)
    if (JSON.stringify(again.publicKeyJwk) !== JSON.stringify(publicKeyJwk)) throw new Error('key not persisted across calls')
    console.log('certSign self-check OK')
  })()
}
