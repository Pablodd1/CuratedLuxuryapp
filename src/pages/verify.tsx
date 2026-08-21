import { html } from 'hono/html'
import { Layout } from './layout'

interface VerifyProps {
  id: string
  valid: boolean
  dossier?: any
  verificationHash?: string
}

export function VerifyPage({ id, valid, dossier, verificationHash }: VerifyProps) {
  return (
    <Layout title={`Verification — Certificate #${id}`}>
      <div class="max-w-3xl mx-auto py-10 px-4">
        {/* Verification Status Banner */}
        <div class={`rounded-2xl p-6 border text-center mb-8 backdrop-blur-md ${
          valid
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.15)]'
            : 'bg-red-500/10 border-red-500/30 text-red-300 shadow-[0_0_50px_rgba(239,68,68,0.15)]'
        }`}>
          <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl border bg-black/40 border-current">
            <i class={valid ? 'fas fa-shield-check text-emerald-400' : 'fas fa-triangle-exclamation text-red-400'}></i>
          </div>
          <h1 class="text-2xl font-serif font-bold text-white mb-1">
            {valid ? 'AUTHENTIC CERTIFICATE VERIFIED' : 'UNVERIFIED OR INVALID CERTIFICATE'}
          </h1>
          <p class="text-xs font-mono text-white/60">
            {valid ? `Certificate Record ID: ${id}` : `No authentic record found matching ID: ${id}`}
          </p>
        </div>

        {valid && dossier ? (
          <div class="bg-surface border border-gold/30 rounded-2xl p-6 space-y-6 shadow-2xl">
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span class="text-[10px] uppercase font-mono text-gold tracking-widest">Verified Asset Record</span>
                <h2 class="text-2xl font-serif font-bold text-white">{dossier.brand} {dossier.model}</h2>
                <p class="text-xs text-white/50 font-mono">Ref: {dossier.reference_number || 'N/A'}</p>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-white/40 block">Estimated Valuation</span>
                <span class="text-xl font-bold font-mono text-gold">${dossier.estimated_value?.toLocaleString() || '—'} USD</span>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div class="bg-black/30 p-3 rounded-lg border border-white/5">
                <span class="text-white/40 block text-[9px] uppercase">Category</span>
                <span class="text-white font-semibold">{dossier.category || 'Watches'}</span>
              </div>
              <div class="bg-black/30 p-3 rounded-lg border border-white/5">
                <span class="text-white/40 block text-[9px] uppercase">Condition</span>
                <span class="text-white font-semibold">{dossier.condition_label || 'Grade ' + (dossier.condition_grade || 3)}</span>
              </div>
              <div class="bg-black/30 p-3 rounded-lg border border-white/5">
                <span class="text-white/40 block text-[9px] uppercase">Authenticity Status</span>
                <span class="text-emerald-400 font-bold">{dossier.authenticity_status || 'VERIFIED MATCH'}</span>
              </div>
              <div class="bg-black/30 p-3 rounded-lg border border-white/5">
                <span class="text-white/40 block text-[9px] uppercase">Verification Score</span>
                <span class="text-gold font-bold">{dossier.confidence || 98}%</span>
              </div>
            </div>

            {/* Verification Cryptographic Signature */}
            <div class="bg-black/40 rounded-lg p-4 border border-gold/20 font-mono text-[10px] text-white/60 space-y-1">
              <div class="flex items-center justify-between text-gold">
                <span><i class="fas fa-key mr-1"></i> CRYPTOGRAPHIC SIGNATURE (ES256 / ECDSA P-256)</span>
                <span class={valid ? 'text-emerald-400' : 'text-red-400'}>
                  <i class={`fas ${valid ? 'fa-check-circle' : 'fa-xmark-circle'} mr-1`}></i>
                  {valid ? 'MATCHED' : 'FAILED'}
                </span>
              </div>
              <p class="break-all text-white/40">{verificationHash || '—'}</p>
            </div>

            <div class="pt-2 flex justify-center gap-4">
              <a href={`/dossier/${id}`} class="px-6 py-2.5 bg-gold hover:bg-gold-light text-black font-bold text-xs rounded-lg transition-all flex items-center gap-2">
                <i class="fas fa-certificate"></i> View Official Dossier
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
