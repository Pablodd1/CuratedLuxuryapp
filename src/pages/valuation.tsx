import { Layout } from './layout'

export function ValuationPage({ embed = false }: { embed?: boolean }) {
  return (
    <Layout title="Scan" active="scan" embed={embed}>
      <div class="max-w-6xl mx-auto">
        {/* Primary Action Bar: Camera + Mic + Manual */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Camera */}
          <button id="camera-trigger-btn"
            class="bg-gold hover:bg-gold-light text-black font-semibold py-3 rounded text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(180,150,30,0.15)] hover:shadow-[0_0_30px_rgba(180,150,30,0.25)]">
            <i class="fas fa-camera text-lg"></i> Take Photo
          </button>
          {/* Microphone */}
          <button id="voice-trigger-btn"
            class="border-2 border-gold/20 hover:border-gold/50 hover:bg-gold/[0.04] text-gold py-3 rounded text-sm transition-all flex items-center justify-center gap-2">
            <i class="fas fa-microphone text-lg"></i> <span id="voice-label">Speak to Describe</span>
          </button>
          {/* Manual Form Toggle */}
          <button id="manual-form-toggle"
            class="border border-white/10 hover:border-gold/30 text-white/40 hover:text-gold py-3 rounded text-sm transition-all flex items-center justify-center gap-2">
            <i class="fas fa-pen-to-square"></i> Manual Entry
          </button>
        </div>

        {/* Voice Status Bar */}
        <div id="voice-status-bar" class="hidden mb-4 bg-gold/[0.03] border border-gold/10 rounded px-4 py-2.5 flex items-center gap-3">
          <span class="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
          <span id="voice-status-text" class="text-xs text-gold flex-1">Listening...</span>
          <button id="voice-stop-btn" class="text-white/30 hover:text-white text-xs">Done</button>
        </div>

        {/* Main Layout */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Input Area */}
          <div class="space-y-4">

            {/* Dropzone (secondary — camera is primary) */}
            <div id="drop-zone" class="bg-card border border-dashed border-white/[0.06] hover:border-gold/20 rounded-lg p-4 text-center cursor-pointer transition-all">
              <input type="file" id="image-input" accept="image/*" class="hidden" multiple />
              <div id="drop-content">
                <i class="fas fa-cloud-arrow-up text-white/10 text-lg mb-1.5 block"></i>
                <p class="text-white/20 text-xs">Drop images here or click</p>
                <p class="text-white/5 text-[10px] mt-0.5">JPG, PNG, WebP — max 5</p>
              </div>
              <div id="previews-area" class="hidden"></div>
            </div>

            {/* Description textarea */}
            <textarea id="description-input" rows={2} placeholder="Or type: Rolex Submariner 126610LN, 2024, unworn, full set..."
              class="w-full bg-card border border-white/[0.04] rounded px-3 py-2 text-white/80 placeholder-white/8 text-xs focus:outline-none focus:border-gold/30 resize-none transition-all"></textarea>

            {/* Analyze Button */}
            <button id="analyze-btn"
              class="w-full bg-gold hover:bg-gold-light text-black font-semibold py-2.5 rounded text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(180,150,30,0.1)] hover:shadow-[0_0_25px_rgba(180,150,30,0.2)]">
              Analyze
              <span id="analyze-spinner" class="hidden"><i class="fas fa-spinner fa-spin"></i></span>
            </button>

            {/* Manual Form (hidden by default) */}
            <div id="manual-form-container" class="hidden bg-card border border-gold/[0.06] rounded-lg p-5">
              <h3 class="text-xs font-semibold text-gold mb-4 tracking-wider uppercase">Manual Valuation Form</h3>
              <form id="manual-form" class="space-y-3">
                <div>
                  <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Category</label>
                  <select id="mf-category" name="category" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                    <option value="Watches">Watches</option>
                    <option value="Handbags">Handbags</option>
                    <option value="Fine Jewelry">Fine Jewelry</option>
                    <option value="Luxury Vehicles">Luxury Vehicles</option>
                    <option value="Art & Collectibles">Art & Collectibles</option>
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-2 relative">
                  <div class="relative">
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Brand</label>
                    <input id="mf-brand" name="brand" required placeholder="Rolex" autocomplete="off" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                  <div class="relative">
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Model</label>
                    <input id="mf-model" name="model" required placeholder="Submariner Date" autocomplete="off" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 relative">
                  <div class="relative">
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Reference Number</label>
                    <input id="mf-ref" name="reference_number" placeholder="126610LN" autocomplete="off" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Serial Number</label>
                    <input id="mf-serial" name="serial_number" placeholder="If known" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                </div>

                {/* Autocomplete Suggestions Panel */}
                <div id="autocomplete-panel" class="hidden relative z-50 mb-2 bg-neutral-900/95 border border-gold/40 rounded-lg shadow-2xl overflow-hidden backdrop-blur-md">
                  <div class="bg-gold/10 px-3 py-1.5 border-b border-gold/20 flex items-center justify-between text-[10px] text-gold font-mono font-bold tracking-wider uppercase">
                    <span><i class="fas fa-magic mr-1"></i> Tier 4 Reference Suggestions</span>
                    <button type="button" id="ac-close-btn" class="text-white/40 hover:text-white">&times;</button>
                  </div>
                  <div id="ac-results-list" class="max-h-48 overflow-y-auto divide-y divide-white/5"></div>
                </div>

                {/* Watches-specific fields */}
                <div id="mf-fields-watches">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Case Material</label>
                      <select name="case_material" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                        <option value="">—</option><option>Steel</option><option>White Gold</option><option>Yellow Gold</option><option>Rose Gold</option><option>Platinum</option><option>Titanium</option><option>Ceramic</option><option>Carbon</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Case Size (mm)</label>
                      <input name="case_size_mm" type="number" min="20" max="55" placeholder="41" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Movement</label>
                      <select name="movement" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                        <option value="">—</option><option>Automatic</option><option>Manual</option><option>Quartz</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Bracelet</label>
                      <select name="bracelet_type" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                        <option value="">—</option><option>Oyster</option><option>Jubilee</option><option>President</option><option>Leather</option><option>Rubber</option><option>NATO</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Handbags-specific fields */}
                <div id="mf-fields-handbags" class="hidden">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Leather</label>
                      <select name="leather_type" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                        <option value="">—</option><option>Epsom</option><option>Togo</option><option>Clemence</option><option>Box</option><option>Swift</option><option>Crocodile</option><option>Lizard</option><option>Ostrich</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Hardware</label>
                      <select name="hardware" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                        <option value="">—</option><option>Gold (GHW)</option><option>Palladium (PHW)</option><option>Rose Gold (RGHW)</option>
                      </select>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Size</label>
                      <input name="bag_size" placeholder="25, 30, 35, 40" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Color</label>
                      <input name="color" placeholder="Black, Gold, Etoupe..." class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Jewelry-specific fields */}
                <div id="mf-fields-jewelry" class="hidden">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Metal Purity</label>
                      <select name="metal_purity" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                        <option value="">—</option><option>18K</option><option>14K</option><option>Platinum 950</option><option>Silver 925</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Gemstone</label>
                      <input name="gemstone" placeholder="Diamond, Sapphire..." class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Vehicles-specific fields */}
                <div id="mf-fields-vehicles" class="hidden">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">VIN</label>
                      <input name="vin" placeholder="Vehicle ID Number" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Mileage (km)</label>
                      <input name="mileage_km" type="number" min="0" placeholder="0" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Art-specific fields */}
                <div id="mf-fields-art" class="hidden">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Artist/Maker</label>
                      <input name="artist" placeholder="Artist name" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Medium</label>
                      <input name="medium" placeholder="Oil, Acrylic, Bronze..." class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Common fields */}
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Year</label>
                    <input name="year" type="number" min="1900" max="2026" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Condition (0-4)</label>
                    <input name="condition_grade" type="number" min="0" max="4" value="3" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Paid (USD)</label>
                    <input name="purchase_price" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Insurance Value</label>
                    <input name="insurance_value" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 transition-all" />
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Box &amp; Papers</label>
                  <select name="box_papers" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                    <option value="">—</option><option>Full Set</option><option>Box Only</option><option>Papers Only</option><option>None</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Notes</label>
                  <textarea name="notes" rows={2} placeholder="Service history, provenance, special details..." class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/8 focus:outline-none focus:border-gold/30 resize-none transition-all"></textarea>
                </div>

                <button type="submit" class="w-full bg-gold hover:bg-gold-light text-black font-semibold py-2 rounded text-xs transition-all shadow-[0_0_15px_rgba(180,150,30,0.1)] hover:shadow-[0_0_25px_rgba(180,150,30,0.2)]">
                  Submit &amp; Valuate
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Results Panel */}
          <div id="results-panel" class="bg-card border border-gold/[0.06] rounded-lg p-5">
            <div id="results-empty" class="text-center py-12 text-white/5">
              <i class="fas fa-microscope text-4xl mb-2 opacity-5 block"></i>
              <p class="text-xs text-white/10">Snap a photo, speak a description,<br/>or fill the manual form</p>
            </div>
            <div id="results-content" class="hidden">
              <div id="result-header" class="mb-4 pb-3 border-b border-gold/[0.06]"></div>
              <div id="confidence-meters" class="space-y-2 mb-4"></div>
              <div class="bg-surface rounded p-3 mb-3 border border-gold/[0.04]">
                <div class="text-[10px] text-gold/40 mb-0.5 tracking-wider uppercase">Value</div>
                <div id="result-value" class="text-xl font-bold font-mono text-gold"></div>
              </div>
              <div class="bg-surface rounded p-3 border border-gold/[0.04]">
                <div class="text-[10px] text-gold/40 mb-1 tracking-wider uppercase">Reasoning</div>
                <p id="result-reasoning" class="text-xs text-white/50 leading-relaxed"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
