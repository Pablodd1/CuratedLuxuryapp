import { Layout } from './layout'

export function DossierPage({ itemId }: { itemId?: string }) {
  return (
    <Layout title="Dossiers" active="dossiers">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-sm font-medium text-white/60">Dossiers</h1>
        <button onclick="document.getElementById('create-dossier-modal').classList.remove('hidden')"
          class="bg-white hover:bg-white/90 text-black font-medium px-3 py-1.5 rounded text-xs transition-colors inline-flex items-center gap-1.5">
          <i class="fas fa-file-certificate text-[10px]"></i> Generate
        </button>
      </div>

      <div id="dossiers-list" class="space-y-3 mb-6">
        <div class="bg-card border border-border rounded-lg p-6 text-center text-white/15">
          <i class="fas fa-spinner fa-spin text-lg mb-1 block"></i>
        </div>
      </div>

      <div id="dossier-detail" class="hidden">
        <div id="dossier-certificate" class="max-w-xl mx-auto bg-card border border-border rounded-lg p-6">
          <div class="text-center mb-5 pb-4 border-b border-white/[0.06]">
            <h2 class="text-base font-bold text-white mb-0.5">Certificate of Authenticity</h2>
            <p class="text-[10px] text-white/25">AI Authentication Report</p>
          </div>
          <div id="cert-asset" class="mb-4"></div>
          <div class="bg-surface rounded p-4 mb-4">
            <div class="text-[10px] text-white/30 mb-3">Confidence Analysis</div>
            <div id="cert-confidence" class="space-y-2"></div>
          </div>
          <div class="bg-surface rounded p-4 mb-4">
            <div class="text-[10px] text-white/30 mb-1">Analysis</div>
            <p id="cert-reasoning" class="text-xs text-white/60 leading-relaxed"></p>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-surface rounded p-3 text-center">
              <p class="text-[10px] text-white/30 mb-1.5">QR Code</p>
              <div class="w-20 h-20 bg-white rounded mx-auto flex items-center justify-center">
                <i class="fas fa-qrcode text-black text-2xl"></i>
              </div>
              <p id="cert-qr" class="text-[10px] font-mono text-white/30 mt-1.5"></p>
            </div>
            <div class="bg-surface rounded p-3">
              <p class="text-[10px] text-white/30 mb-1">Appraiser</p>
              <p id="cert-appraiser" class="text-xs font-medium text-white"></p>
              <p id="cert-signature" class="text-[10px] text-white/30 mt-1"></p>
              <p class="text-[10px] text-white/20 mt-2">Exports: <span id="cert-exports"></span></p>
            </div>
          </div>
          <div class="text-center pt-3 border-t border-white/[0.06]">
            <p id="cert-date" class="text-[10px] text-white/20"></p>
          </div>
          <div class="flex gap-2 mt-4 justify-center">
            <button id="export-dossier-btn"
              class="border border-white/20 hover:border-white/40 text-white/60 hover:text-white/90 px-3 py-1.5 rounded text-xs transition-colors inline-flex items-center gap-1.5">
              <i class="fas fa-download text-[10px]"></i> Export
            </button>
          </div>
        </div>
      </div>

      <div id="create-dossier-modal" class="hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-lg p-5 w-full max-w-sm">
          <h2 class="text-sm font-medium text-white mb-3">Generate Dossier</h2>
          <p class="text-[10px] text-white/40 mb-3">Select an inventory item to generate a certificate.</p>
          <div class="mb-3">
            <select id="dossier-inv-id" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
              <option value="">Loading...</option>
            </select>
          </div>
          <div class="mb-3">
            <textarea id="dossier-notes" rows={2} placeholder="Notes..." class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20 resize-none"></textarea>
          </div>
          <button id="create-dossier-btn"
            class="w-full bg-white hover:bg-white/90 text-black font-medium py-2 rounded text-xs transition-colors">
            Generate
          </button>
        </div>
      </div>
    </Layout>
  )
}
