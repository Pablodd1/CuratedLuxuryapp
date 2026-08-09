import { Layout } from './layout'

export function DossierPage({ itemId }: { itemId?: string }) {
  return (
    <Layout title="Appraisal Dossier — CuratedLux" active="">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-serif font-bold text-white mb-1">Appraisal Dossiers</h1>
          <p class="text-white/50">Tamper-evident authentication reports with QR verification codes.</p>
        </div>
        <button onclick="document.getElementById('create-dossier-modal').classList.remove('hidden')"
          class="bg-gold hover:bg-gold-dark text-black font-semibold px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 text-sm">
          <i class="fas fa-file-certificate"></i> Generate Dossier
        </button>
      </div>

      {/* Dossier List */}
      <div id="dossiers-list" class="space-y-4 mb-8">
        <div class="bg-card border border-border rounded-xl p-8 text-center text-white/20">
          <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Loading dossiers...
        </div>
      </div>

      {/* Individual Dossier View (shown when itemId or selected) */}
      <div id="dossier-detail" class="hidden">
        <div id="dossier-certificate" class="max-w-2xl mx-auto bg-card border-2 border-gold/20 rounded-xl p-8">
          {/* Certificate Header */}
          <div class="text-center mb-8 pb-6 border-b border-gold/20">
            <div class="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-shield-halved text-gold text-xl"></i>
            </div>
            <h2 class="text-2xl font-serif font-bold text-white mb-1">Certificate of Authenticity</h2>
            <p class="text-white/40 text-sm">CuratedLux AI Authentication Report</p>
          </div>

          {/* Asset Details */}
          <div id="cert-asset" class="mb-6"></div>

          {/* Confidence Breakdown */}
          <div class="bg-surface rounded-lg p-5 mb-6">
            <h3 class="text-sm font-semibold text-white/60 mb-4">Forensic Confidence Analysis</h3>
            <div id="cert-confidence" class="space-y-3"></div>
          </div>

          {/* Reasoning */}
          <div class="bg-surface rounded-lg p-5 mb-6">
            <h3 class="text-sm font-semibold text-white/60 mb-2">AI Analysis</h3>
            <p id="cert-reasoning" class="text-sm text-white/70 leading-relaxed"></p>
          </div>

          {/* QR & Signatures */}
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-surface rounded-lg p-4 text-center">
              <p class="text-xs text-white/40 mb-2">QR Verification Code</p>
              <div class="w-24 h-24 bg-white rounded-lg mx-auto flex items-center justify-center">
                <i class="fas fa-qrcode text-black text-3xl"></i>
              </div>
              <p id="cert-qr" class="text-xs font-mono text-white/50 mt-2"></p>
            </div>
            <div class="bg-surface rounded-lg p-4">
              <p class="text-xs text-white/40 mb-2">Appraiser</p>
              <p id="cert-appraiser" class="text-sm font-semibold text-white"></p>
              <p id="cert-signature" class="text-xs text-white/50 mt-1 italic"></p>
              <p class="text-xs text-white/30 mt-3">Exports: <span id="cert-exports"></span></p>
            </div>
          </div>

          {/* Footer */}
          <div class="text-center pt-4 border-t border-white/[0.06]">
            <p class="text-xs text-white/30">Digitally certified by CuratedLux AI v2.0</p>
            <p id="cert-date" class="text-xs text-white/20 mt-1"></p>
          </div>

          {/* Export Actions */}
          <div class="flex gap-3 mt-6 justify-center">
            <button id="export-dossier-btn"
              class="border border-gold/30 hover:border-gold/50 text-gold px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-2">
              <i class="fas fa-download"></i> Export Dossier
            </button>
          </div>
        </div>
      </div>

      {/* Create Dossier Modal */}
      <div id="create-dossier-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-xl p-6 w-full max-w-md">
          <h2 class="text-lg font-semibold text-white mb-4">Generate Dossier</h2>
          <p class="text-sm text-white/50 mb-4">Select an authenticated inventory item to generate a tamper-evident appraisal certificate.</p>
          <div id="dossier-inventory-select" class="mb-4">
            <select id="dossier-inv-id" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
              <option value="">Loading items...</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-xs text-white/40 mb-1">Notes</label>
            <textarea id="dossier-notes" rows={2} placeholder="Additional appraisal notes..." class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 resize-none"></textarea>
          </div>
          <button id="create-dossier-btn"
            class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2.5 rounded-lg transition-colors text-sm">
            Generate Certificate
          </button>
        </div>
      </div>
    </Layout>
  )
}
