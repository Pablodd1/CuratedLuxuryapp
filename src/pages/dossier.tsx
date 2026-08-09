import { Layout } from './layout'

export function DossierPage({ itemId }: { itemId?: string }) {
  return (
    <Layout title="Dossiers" active="dossiers">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-sm font-semibold text-gold/60 tracking-wider uppercase">Dossiers</h1>
        <button onclick="document.getElementById('create-dossier-modal').classList.remove('hidden')"
          class="bg-gold hover:bg-gold-light text-black font-semibold px-3 py-1.5 rounded text-xs transition-all inline-flex items-center gap-1.5">
          <i class="fas fa-file-certificate text-[10px]"></i> Generate
        </button>
      </div>

      <div id="dossiers-list" class="space-y-3 mb-6">
        <div class="bg-card border border-gold/[0.04] rounded-lg p-6 text-center text-white/10">
          <i class="fas fa-spinner fa-spin text-lg mb-1 block"></i>
        </div>
      </div>

      <div id="dossier-detail" class="hidden">
        <div id="dossier-certificate" class="max-w-xl mx-auto bg-card border border-gold/20 rounded-lg p-6">
          <div class="text-center mb-5 pb-4 border-b border-gold/[0.08]">
            <h2 class="text-base font-bold text-gold mb-0.5">Certificate of Authenticity</h2>
            <p class="text-[10px] text-gold/25 tracking-wider uppercase">AI Authentication Report</p>
          </div>
          <div id="cert-asset" class="mb-4"></div>
          <div class="bg-surface rounded p-4 mb-4 border border-gold/[0.04]">
            <div class="text-[10px] text-gold/40 mb-3 tracking-wider uppercase">Confidence Analysis</div>
            <div id="cert-confidence" class="space-y-2"></div>
          </div>
          <div class="bg-surface rounded p-4 mb-4 border border-gold/[0.04]">
            <div class="text-[10px] text-gold/40 mb-1 tracking-wider uppercase">Analysis</div>
            <p id="cert-reasoning" class="text-xs text-white/50 leading-relaxed"></p>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-surface rounded p-3 text-center border border-gold/[0.04]">
              <p class="text-[10px] text-gold/30 mb-1.5 tracking-wider uppercase">QR Code</p>
              <div class="w-20 h-20 bg-white rounded mx-auto flex items-center justify-center">
                <i class="fas fa-qrcode text-black text-2xl"></i>
              </div>
              <p id="cert-qr" class="text-[10px] font-mono text-white/20 mt-1.5"></p>
            </div>
            <div class="bg-surface rounded p-3 border border-gold/[0.04]">
              <p class="text-[10px] text-gold/30 mb-1 tracking-wider uppercase">Appraiser</p>
              <p id="cert-appraiser" class="text-xs font-medium text-gold"></p>
              <p id="cert-signature" class="text-[10px] text-white/20 mt-1"></p>
              <p class="text-[10px] text-white/15 mt-2">Exports: <span id="cert-exports"></span></p>
            </div>
          </div>
          <div class="text-center pt-3 border-t border-gold/[0.08]">
            <p id="cert-date" class="text-[10px] text-white/15"></p>
          </div>
          <div class="flex gap-2 mt-4 justify-center">
            <button id="export-dossier-btn"
              class="border border-gold/20 hover:border-gold/40 text-gold/50 hover:text-gold px-3 py-1.5 rounded text-xs transition-all inline-flex items-center gap-1.5">
              <i class="fas fa-download text-[10px]"></i> Export
            </button>
          </div>
        </div>
      </div>

      <div id="create-dossier-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-gold/[0.06] rounded-lg p-5 w-full max-w-sm">
          <h2 class="text-sm font-semibold text-gold mb-3 tracking-wider uppercase">Generate Dossier</h2>
          <p class="text-[10px] text-white/30 mb-3">Select an inventory item to generate a certificate.</p>
          <div class="mb-3">
            <select id="dossier-inv-id" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
              <option value="">Loading...</option>
            </select>
          </div>
          <div class="mb-3">
            <textarea id="dossier-notes" rows={2} placeholder="Notes..." class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all resize-none"></textarea>
          </div>
          <button id="create-dossier-btn"
            class="w-full bg-gold hover:bg-gold-light text-black font-semibold py-2 rounded text-xs transition-all">
            Generate
          </button>
        </div>
      </div>
    </Layout>
  )
}
