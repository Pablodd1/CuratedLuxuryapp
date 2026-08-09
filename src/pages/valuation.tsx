import { Layout } from './layout'

export function ValuationPage() {
  return (
    <Layout title="AI Valuation Scanner — CuratedLux" active="valuation">
      <div class="mb-8">
        <h1 class="text-3xl font-serif font-bold text-white mb-2">AI Valuation Scanner</h1>
        <p class="text-white/50">Upload an image or describe an item. Gemini 2.0 Flash authenticates and prices luxury assets in seconds.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fas fa-upload text-gold"></i> Asset Submission
          </h2>

          {/* Upload Area */}
          <div id="drop-zone" class="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-gold/40 transition-colors mb-4">
            <input type="file" id="image-input" accept="image/*" class="hidden" />
            <div id="drop-content">
              <div class="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-cloud-arrow-up text-gold text-xl"></i>
              </div>
              <p class="text-white/70 font-medium mb-1">Drop an image here or click to browse</p>
              <p class="text-white/30 text-sm">PNG, JPG, WebP up to 10MB</p>
            </div>
            <div id="preview-container" class="hidden">
              <img id="preview-img" class="max-h-64 mx-auto rounded-lg object-contain" alt="Preview" />
              <p class="text-white/40 text-sm mt-2">Click to change image</p>
            </div>
          </div>

          {/* Text Description */}
          <div class="mb-4">
            <label class="block text-sm text-white/60 mb-1.5">Or describe the item</label>
            <textarea id="description-input" rows={3} placeholder="e.g., Rolex Submariner Date 126610LN, 2024, unworn, full set..."
              class="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-gold/50 resize-none"></textarea>
          </div>

          <button id="analyze-btn"
            class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
            <i class="fas fa-microscope"></i> Analyze Asset
            <span id="analyze-spinner" class="hidden"><i class="fas fa-spinner fa-spin"></i></span>
          </button>

          {/* Voice Input */}
          <div class="mt-4 pt-4 border-t border-white/[0.06]">
            <button id="voice-btn"
              class="w-full border border-white/10 hover:border-gold/30 text-white/70 hover:text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
              <i class="fas fa-microphone text-rose-400"></i> Voice Description
            </button>
            <div id="voice-status" class="text-center text-white/30 text-xs mt-2 hidden">Listening...</div>
          </div>
        </div>

        {/* Results Panel */}
        <div id="results-panel" class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fas fa-clipboard-check text-emerald-400"></i> Analysis Results
          </h2>
          <div id="results-empty" class="text-center py-12 text-white/30">
            <i class="fas fa-image text-5xl mb-4 opacity-20"></i>
            <p class="text-sm">Upload an image or enter a description<br/>to see valuation results here.</p>
          </div>
          <div id="results-content" class="hidden">
            {/* Brand/Model Header */}
            <div id="result-header" class="mb-6 pb-4 border-b border-white/[0.06]"></div>
            {/* Confidence Meters */}
            <h3 class="text-sm font-semibold text-white/60 mb-3">Authentication Confidence</h3>
            <div id="confidence-meters" class="space-y-3 mb-6"></div>
            {/* Value */}
            <div class="bg-surface rounded-lg p-4 mb-4">
              <div class="text-xs text-white/40 mb-1">ESTIMATED MARKET VALUE</div>
              <div id="result-value" class="text-3xl font-bold font-mono text-gold"></div>
            </div>
            {/* Reasoning */}
            <div class="bg-surface rounded-lg p-4">
              <div class="text-xs text-white/40 mb-2">AI REASONING</div>
              <p id="result-reasoning" class="text-sm text-white/70 leading-relaxed"></p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
