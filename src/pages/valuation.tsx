import { Layout } from './layout'

export function ValuationPage() {
  return (
    <Layout title="Scan" active="scan">
      <div class="max-w-3xl mx-auto">
        <div class="mb-4">
          <h1 class="text-sm font-medium text-white/60">Valuation Scanner</h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div class="bg-card border border-border rounded-lg p-5">
            <div id="drop-zone" class="border border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-white/20 transition-colors mb-4">
              <input type="file" id="image-input" accept="image/*" class="hidden" multiple />
              <div id="drop-content">
                <i class="fas fa-cloud-arrow-up text-white/20 text-xl mb-2 block"></i>
                <p class="text-white/40 text-xs">Drop images or click</p>
              </div>
              <div id="preview-container" class="hidden">
                <img id="preview-img" class="max-h-48 mx-auto rounded object-contain" alt="" />
              </div>
            </div>

            <div class="mb-3">
              <textarea id="description-input" rows={2} placeholder="Or type a description..."
                class="w-full bg-surface border border-border rounded px-3 py-2 text-white placeholder-white/15 text-xs focus:outline-none focus:border-white/20 resize-none"></textarea>
            </div>

            <button id="analyze-btn"
              class="w-full bg-white hover:bg-white/90 text-black font-medium py-2 rounded text-sm transition-colors flex items-center justify-center gap-2">
              <i class="fas fa-microscope text-xs"></i> Analyze
              <span id="analyze-spinner" class="hidden"><i class="fas fa-spinner fa-spin"></i></span>
            </button>

            <div class="mt-3 pt-3 border-t border-white/[0.06]">
              <button id="voice-btn"
                class="w-full border border-white/10 hover:border-white/20 text-white/50 hover:text-white/80 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5">
                <i class="fas fa-microphone text-[10px]"></i> Voice
              </button>
              <div id="voice-status" class="text-center text-white/20 text-[10px] mt-1.5 hidden">Listening...</div>
            </div>
          </div>

          {/* Results */}
          <div id="results-panel" class="bg-card border border-border rounded-lg p-5">
            <div id="results-empty" class="text-center py-10 text-white/15">
              <i class="fas fa-image text-3xl mb-2 opacity-15 block"></i>
              <p class="text-xs">Results appear here</p>
            </div>
            <div id="results-content" class="hidden">
              <div id="result-header" class="mb-4 pb-3 border-b border-white/[0.06]"></div>
              <div id="confidence-meters" class="space-y-2 mb-4"></div>
              <div class="bg-surface rounded p-3 mb-3">
                <div class="text-[10px] text-white/30 mb-0.5">VALUE</div>
                <div id="result-value" class="text-xl font-bold font-mono text-white"></div>
              </div>
              <div class="bg-surface rounded p-3">
                <div class="text-[10px] text-white/30 mb-1">REASONING</div>
                <p id="result-reasoning" class="text-xs text-white/60 leading-relaxed"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
