/**
 * CuratedLux v2.0 — Client-side application logic
 * Gemini 3.5 Flash edition (Aug 2026)
 * Full interactive JS for all 6 pages + shared utilities
 */

// ========== Utility Helpers ==========

// Shot-quality floor: Laplacian-variance sharpness below this on a 256px
// downscale reads as soft/blurry. Used to HINT a retake (not to drop frames) —
// see snap() — so the user always gets photo-was-taken feedback.
const SHARPNESS_FLOOR = 8

async function api(path, options = {}) {
  try {
    const res = await axios({ url: path, ...options, timeout: 30000 });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    toast(msg, 'error');
    throw err;
  }
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icons = { info: 'fa-circle-info', error: 'fa-circle-exclamation', success: 'fa-circle-check', warning: 'fa-triangle-exclamation' };
  el.innerHTML = `<i class="fas ${icons[type] || icons.info} mr-2"></i>${esc(msg)}`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(10px)'; }, 2800);
  setTimeout(() => el.remove(), 3300);
}

function fmtCurrency(n) {
  if (!n || n === 0) return '$0';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + ',' + String(Math.round(n) % 1000 || 0).padStart(3, '0');
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function $id(id) { return document.getElementById(id); }
function $q(sel, ctx) { return (ctx || document).querySelector(sel); }
function show(el) { el?.classList.remove('hidden'); }
function hide(el) { el?.classList.add('hidden'); }

// ── Audit H2: HTML-escape every user/AI string before innerHTML ──────────────
// Brand/model/ref fields come from AI parsing of attacker-controlled photos or
// from direct inventory writes — never trust them in template literals.
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Pre-analyze confirmation: shows photo count + description before submission ──
function showAnalyzeConfirmation(photoCount, description) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6';
    overlay.innerHTML = `
      <div class="bg-card border border-gold/20 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(138,28,44,0.15)]">
        <div class="text-center mb-5">
          <div class="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-3">
            <i class="fas fa-circle-check text-gold text-xl"></i>
          </div>
          <h3 class="text-lg font-serif font-bold text-white mb-1">Ready to Analyze?</h3>
          <p class="text-white/40 text-xs">Review your submission before sending to AI authentication.</p>
        </div>
        <div class="space-y-2.5 mb-5">
          <div class="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
            <span class="text-white/50 text-xs"><i class="fas fa-images mr-1.5 text-gold/60"></i>Photos captured</span>
            <span class="text-white font-semibold text-sm">${photoCount}</span>
          </div>
          ${description ? `
          <div class="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
            <span class="text-white/50 text-xs"><i class="fas fa-keyboard mr-1.5 text-gold/60"></i>Description</span>
            <span class="text-white/70 text-xs max-w-[180px] truncate">"${description}"</span>
          </div>` : ''}
          <div class="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
            <span class="text-white/50 text-xs"><i class="fas fa-brain mr-1.5 text-gold/60"></i>AI pipeline</span>
            <span class="text-white/70 text-xs">Gemini 3.5 + OCR</span>
          </div>
        </div>
        ${photoCount < 2 ? `
        <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
          <p class="text-amber-300/80 text-[11px]"><i class="fas fa-triangle-exclamation mr-1"></i>For best results, capture at least 2 photos — the item + a serial/certificate close-up. OCR needs a second image to extract serials.</p>
        </div>` : ''}
        <div class="flex gap-3">
          <button id="cl-confirm-cancel" class="flex-1 border border-white/10 hover:border-white/30 text-white/50 hover:text-white/80 py-2.5 rounded-lg text-sm transition-all">Cancel</button>
          <button id="cl-confirm-go" class="flex-1 bg-gold hover:bg-gold-light text-black font-semibold py-2.5 rounded-lg text-sm transition-all">Analyze Now</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#cl-confirm-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.querySelector('#cl-confirm-go').addEventListener('click', () => { overlay.remove(); resolve(true); });
  });
}

// ── Image Compression: canvas resize to max 1024px before upload ──
// Cuts payload ~80%, prevents Worker timeouts, preserves quality for AI analysis
function compressImage(dataUrl, maxDim = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w <= maxDim && h <= maxDim) return resolve(dataUrl);
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('unsupported image'));
    img.src = dataUrl;
  });
}

function renderConfidenceBar(label, score) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-gold' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return `<div class="flex items-center gap-3">
    <span class="text-xs text-white/50 w-28 text-right">${label}</span>
    <div class="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
      <div class="h-full ${color} rounded-full confidence-bar-fill" style="width:${pct}%"></div>
    </div>
    <span class="text-xs font-mono text-white/60 w-8 text-right">${pct}%</span>
  </div>`;
}

function statusBadge(status) {
  const map = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    locked: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sold: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    archived: 'bg-white/5 text-white/30 border-white/10',
    matched: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    fulfilled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  const c = map[status] || map.active;
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c}">${status}</span>`;
}

function urgencyBadge(urgency) {
  const map = {
    'Immediate': 'text-rose-400',
    '1-2 weeks': 'text-amber-400',
    'Flexible': 'text-white/40',
  };
  return `<span class="text-xs font-medium ${map[urgency] || 'text-white/40'}"><i class="fas fa-circle text-[6px] align-middle mr-1"></i>${urgency}</span>`;
}

// ========== Home Page ==========

function initHome() {
  document.querySelectorAll('.hero-gradient').forEach(el => {
    el.style.animation = 'shimmer 4s ease-in-out infinite alternate';
  });
}

// ========== Valuation Page ==========

function initValuation() {
  const dropZone = $id('drop-zone');
  const imageInput = $id('image-input');
  const dropContent = $id('drop-content');
  const previewsArea = $id('previews-area');
  const analyzeBtn = $id('analyze-btn');
  const analyzeSpinner = $id('analyze-spinner');
  const descriptionInput = $id('description-input');
  const resultsEmpty = $id('results-empty');
  const resultsContent = $id('results-content');

  // Multi-image support
  const images = [];
  const MAX_IMAGES = 5;

  // ── PRIMARY: Camera Trigger Button ────────────────────────────────────────
  const cameraTriggerBtn = $id('camera-trigger-btn');
  if (cameraTriggerBtn) {
    cameraTriggerBtn.addEventListener('click', showPrepScreen);
  }
  function openSavedPhotoPicker() {
    if (!imageInput) { toast('File picker unavailable', 'error'); return; }
    imageInput.click();
  }
  const libraryTriggerBtn = $id('library-trigger-btn');
  if (libraryTriggerBtn) {
    libraryTriggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSavedPhotoPicker();
    });
  }

  // ── AUTHENTICATE YOUR ITEM hero wiring (landing card on the scan page) ──
  // Category chips + "Start Authentication" open the same prep→capture flow,
  // carrying the chosen category into capture (RAG/accuracy pipeline intact).
  const authCatBtns = document.querySelectorAll('.cl-auth-cat');
  authCatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.authCat;
      authCatBtns.forEach(b => {
        b.className = b === btn
          ? 'cl-auth-cat flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all border-gold/40 bg-gold/10 text-gold'
          : 'cl-auth-cat flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all border-white/10 bg-zinc-900/70 text-white/50 hover:border-gold/30 hover:text-gold';
      });
    });
  });
  const startAuthBtn = $id('cl-start-auth');
  if (startAuthBtn) startAuthBtn.addEventListener('click', showPrepScreen);
  const howItWorksBtn = $id('cl-how-it-works');
  if (howItWorksBtn) howItWorksBtn.addEventListener('click', () => {
    if (typeof openExampleGallery === 'function') openExampleGallery(activeCategory);
  });

  // ── PRIMARY: Voice Trigger Button ─────────────────────────────────────────
  const voiceTriggerBtn = $id('voice-trigger-btn');
  const voiceStatusBar = $id('voice-status-bar');
  const voiceStatusText = $id('voice-status-text');
  const voiceStopBtn = $id('voice-stop-btn');
  const voiceLabel = $id('voice-label');

  let recognition = null;

  function startVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast('Voice input not supported in this browser. Try Chrome.', 'warning');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    if (voiceTriggerBtn) {
      voiceTriggerBtn.classList.add('border-rose-400/60', 'bg-rose-500/5');
      voiceTriggerBtn.querySelector('i')?.classList.add('animate-pulse');
    }
    if (voiceLabel) voiceLabel.textContent = 'Listening...';
    if (voiceStatusBar) show(voiceStatusBar);
    if (voiceStatusText) voiceStatusText.textContent = 'Listening... speak clearly';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (voiceStatusText) voiceStatusText.textContent = transcript || 'Listening...';
      if (descriptionInput) descriptionInput.value = transcript;
      window._voiceTranscript = transcript;
    };

    recognition.onerror = (event) => {
      toast('Voice error: ' + event.error, 'error');
      stopVoice();
    };

    recognition.onend = () => stopVoice();

    recognition.start();
  }

  function stopVoice() {
    if (recognition) {
      try { recognition.stop(); } catch (e) { /* ignore */ }
    }
    if (voiceTriggerBtn) {
      voiceTriggerBtn.classList.remove('border-rose-400/60', 'bg-rose-500/5');
      const icon = voiceTriggerBtn.querySelector('i');
      if (icon) icon.classList.remove('animate-pulse');
    }
    if (voiceLabel) voiceLabel.textContent = 'Speak to Describe';
    if (voiceStatusBar) hide(voiceStatusBar);
    if (!window._voiceTranscript && voiceStatusText) {
      voiceStatusText.textContent = '';
    }
  }

  if (voiceTriggerBtn) {
    voiceTriggerBtn.addEventListener('click', () => {
      if (recognition && recognition.listening) {
        stopVoice();
      } else {
        startVoice();
      }
    });
  }

  if (voiceStopBtn) {
    voiceStopBtn.addEventListener('click', stopVoice);
  }

  // ── Manual Form Toggle ────────────────────────────────────────────────────
  const manualFormToggle = $id('manual-form-toggle');
  const manualFormContainer = $id('manual-form-container');
  const manualForm = $id('manual-form');
  const mfCategory = $id('mf-category');

  if (manualFormToggle && manualFormContainer) {
    manualFormToggle.addEventListener('click', () => {
      if (manualFormContainer.classList.contains('hidden')) {
        show(manualFormContainer);
        manualFormToggle.classList.add('border-white/30', 'text-white');
        manualFormContainer.scrollIntoView({ behavior: 'smooth' });
      } else {
        hide(manualFormContainer);
        manualFormToggle.classList.remove('border-white/30', 'text-white');
      }
    });
  }

  // Category field switcher
  if (mfCategory) {
    const fieldGroups = {
      'Watches': 'mf-fields-watches',
      'Handbags': 'mf-fields-handbags',
      'Fine Jewelry': 'mf-fields-jewelry',
      'Luxury Vehicles': 'mf-fields-vehicles',
      'Art & Collectibles': 'mf-fields-art',
    };

    function switchCategoryFields() {
      const val = mfCategory.value;
      Object.entries(fieldGroups).forEach(([cat, id]) => {
        const el = $id(id);
        if (!el) return;
        if (cat === val) show(el);
        else hide(el);
      });
    }

    mfCategory.addEventListener('change', switchCategoryFields);
    switchCategoryFields(); // init
  }

  // Manual form submit handler
  if (manualForm) {
    manualForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(manualForm);
      const data = Object.fromEntries(formData.entries());

      // Clean: remove empty strings
      for (const key of Object.keys(data)) {
        if (data[key] === '' || data[key] === '—') delete data[key];
      }
      // Number conversions
      if (data.condition_grade) data.condition_grade = parseInt(data.condition_grade);
      if (data.year) data.year = parseInt(data.year);
      if (data.case_size_mm) data.case_size_mm = parseFloat(data.case_size_mm);
      if (data.purchase_price) data.purchase_price = parseFloat(data.purchase_price);
      if (data.insurance_value) data.insurance_value = parseFloat(data.insurance_value);
      if (data.mileage_km) data.mileage_km = parseFloat(data.mileage_km);

      if (!data.brand) {
        toast('Brand is required', 'warning');
        return;
      }

      const submitBtn = manualForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Valuating...';

      hide(resultsEmpty);
      hide(resultsContent);

      try {
        const res = await api('/api/valuation/manual', {
          method: 'POST',
          data: data,
        });

        hide(manualFormContainer);
        if (manualFormToggle) manualFormToggle.classList.remove('border-white/30', 'text-white');
        renderValuationResult(res, res);
        toast(res.stored ? 'Asset stored to inventory' : 'Valuation complete', res.stored ? 'success' : 'warning');
      } catch (err) {
        toast(err.response?.data?.error || 'Manual valuation failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit & Valuate';
      }
    });
  }

  // ── Image handling: drag & drop + click ──────────────────────────────────
  if (dropZone) {
    dropZone.addEventListener('click', () => imageInput?.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-gold/60'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-gold/60'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('border-gold/60');
      handleFiles({ target: { files: e.dataTransfer.files } });
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', handleFiles);
  }

  function filledCount() {
    return images.filter(Boolean).length;
  }

  function nextImageSlot() {
    for (let i = 0; i < images.length; i++) if (!images[i]) return i;
    return images.length;
  }

  function uploadTierForSlot(slot) {
    try {
      const seq = (typeof currentGuide === 'function') ? currentGuide() : [];
      if (seq[slot] && seq[slot].tier) return seq[slot].tier;
    } catch { /* guide not ready */ }
    return slot === 0 ? 'hero' : 'macro';
  }

  function handleFiles(e) {
    const files = Array.from((e && e.target && e.target.files) || []);
    if (!files.length) return;
    let added = 0;
    files.forEach(file => {
      const type = (file.type || '').toLowerCase();
      const name = (file.name || '').toLowerCase();
      const looksImage = type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|gif)$/.test(name);
      if (!looksImage) return;
      if (filledCount() + added >= MAX_IMAGES) { toast('Max 5 images per scan', 'warning'); return; }
      added += 1;
      const reader = new FileReader();
      reader.onerror = () => toast(`Could not read ${file.name}. Try JPG or PNG.`, 'error');
      reader.onload = async () => {
        try {
          const compressed = await compressImage(reader.result);
          const slot = nextImageSlot();
          images[slot] = {
            data: compressed,
            name: file.name || `photo-${slot + 1}.jpg`,
            tier: uploadTierForSlot(slot),
            source: 'library',
          };
          renderPreviews();
          const n = filledCount();
          toast(n === 1 ? 'Photo attached. Add a serial close-up if you have one, or tap Analyze.' : `${n} photos attached`, 'success');
        } catch {
          toast(`Could not use ${file.name}. Try another image.`, 'error');
        }
      };
      reader.readAsDataURL(file);
    });
    if (!added) toast('Choose a photo (JPG, PNG, HEIC, or WebP). One is enough.', 'warning');
    if (imageInput) imageInput.value = '';
  }

  function renderPreviews() {
    if (!previewsArea || !dropContent) return;
    const filled = images.filter(Boolean)          // step-indexed array may have skip holes
    if (filled.length === 0) {
      hide(previewsArea);
      show(dropContent);
      return;
    }
    hide(dropContent);
    show(previewsArea);
    previewsArea.innerHTML = '';

    filled.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'relative inline-block m-1 cursor-pointer group';
      thumb.innerHTML = `
        <img src="${img.data}" class="w-16 h-16 object-cover rounded-lg border-2 ${i === 0 ? 'border-gold' : 'border-white/10'} hover:border-gold/60 transition-colors" />
        <button class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
        <span class="text-[10px] text-white/30 mt-1 block text-center truncate w-16">${img.name.slice(0, 12)}</span>
      `;
      thumb.querySelector('button').addEventListener('click', e => {
        e.stopPropagation();
        // Clear this slot from the step-indexed array (keep others' step slots)
        const realIdx = images.indexOf(img)
        if (realIdx >= 0) images[realIdx] = undefined
        stepCaptured.delete(realIdx)   // re-opens that step as not-yet-acquired
        renderPreviews();
      });
      previewsArea.appendChild(thumb);
    });

    // Add more button
    if (filled.length < MAX_IMAGES) {
      const addBtn = document.createElement('button');
      addBtn.className = 'w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-gold/40 inline-flex items-center justify-center text-white/30 hover:text-gold transition-colors m-1';
      addBtn.innerHTML = '<i class="fas fa-plus text-lg"></i>';
      addBtn.title = 'Add another image';
      addBtn.addEventListener('click', () => imageInput?.click());
      previewsArea.appendChild(addBtn);

      const camBtn = document.createElement('button');
      camBtn.className = 'w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-gold/40 inline-flex items-center justify-center text-white/30 hover:text-gold transition-colors m-1';
      camBtn.innerHTML = '<i class="fas fa-camera text-lg"></i>';
      camBtn.title = 'Take a photo';
      camBtn.addEventListener('click', openCamera);
      previewsArea.appendChild(camBtn);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // HIGH-QUALITY CAMERA w/ ImageCapture, 4K, 60fps, RAW, MACRO MODE
  // Browser APIs used:
  //   • MediaStream with constraints (width 3840/1920/1280 → height 2160/1080/720)
  //   • Frame-rate 60fps front, 30fps rear (configurable)
  //   • ImageCapture API for uncompressed stills (Chrome/Edge)
  //   • MediaRecorder for raw-audio (256 kbps opus) w/ live waveform
  //   • Macro mode via ZoomMediaStreamTrack + tiny subject framing
  //   • Burst capture (3 frames, picks sharpest via edge-detection)
  // ════════════════════════════════════════════════════════════════════════
  // ── SHARED category guide data + examples (hoisted so the prep screen,
  //    example gallery and camera capture all use the SAME sequences) ──
    let activeCategory = 'Watches'  // shared prep + capture

    const GUIDE_SEQUENCES = {
      Watches: [
        { icon: 'fa-clock', shot: 'Dial / Face', distance: '25–35 cm (Straight-on)', tier: 'hero',
        tip: "Lay the watch flat or prop it upright; hold the phone 25-35 cm away, perfectly parallel to the dial (no tilt), and block glare by staying between the light and the crystal.",
          instruction: 'Photograph the dial straight-on so the face fills the golden reticle.',
          details: ['Logo + brand text sharp', 'Hands + date window visible', 'No glare on crystal'], macro: false, example: 'dial' },
        { icon: 'fa-magnifying-glass-plus', shot: 'Caseback / Serial', distance: '10–15 cm (Macro)', tier: 'macro',
        tip: "Rest the watch face-down on a dark cloth, hold the phone 10-15 cm above, dead-vertical, and let the camera focus 1s on the engraving before shooting.",
          instruction: 'Flip watch — macro on the caseback engravings and serial number.',
          details: ['Serial must be perfectly readable', 'Shoot straight down, not tilted'], macro: true, example: 'macro' },
        { icon: 'fa-link', shot: 'Clasp / Bracelet', distance: '10–15 cm (Macro)', tier: 'detail',
        tip: "Unfold the clasp flat on a plain surface and shoot straight down so both the logo and the end-link stamps are square to the lens.",
          instruction: 'Macro on the clasp mechanism and end-link hallmarks.',
          details: ['Crown/hallmark stamps sharp', 'Clasp logo readable'], macro: true, example: 'macro' },
        { icon: 'fa-box-archive', shot: 'Box & Papers', distance: '20–30 cm (Card)', tier: 'standard',
        tip: "Press the card completely flat under even indoor light, shoot top-down from 20-30 cm so the reference number zone is centered.",
          instruction: 'Warranty card, box label, receipt — flat and well-lit for OCR.',
          details: ['Card flat, no curl', 'Reference number on card readable'], macro: false, example: 'card' },
      ],
      Handbags: [
        { icon: 'fa-bag-shopping', shot: 'Full Bag — Front', distance: '40–60 cm (Full View)', tier: 'hero',
        tip: "Stand the bag upright on a table, step back 40-60 cm until the entire silhouette fits with margin, phone square to the bag front at chest height.",
          instruction: 'Entire bag front, straight-on — shape, grain, handle alignment.',
          details: ['Full silhouette in frame', 'Brand emblem centered', 'Neutral background'], macro: false, example: 'bag' },
        { icon: 'fa-fire', shot: 'Heat Stamp / Logo', distance: '10–15 cm (Macro)', tier: 'macro',
        tip: "Bring the phone to 10-15 cm, directly facing the stamp (never at an angle - foil looks embossed or flat depending on tilt), tap to focus on the letters.",
          instruction: 'Macro on the brand heat stamp — kerning + foil depth.',
          details: ['Stamp sharp and readable', 'Foil depth visible', 'Straight-on, no angle'], macro: true, example: 'macro' },
        { icon: 'fa-hashtag', shot: 'Date Code / Serial', distance: '10–15 cm (Macro)', tier: 'macro',
        tip: "Open the flap or lift the tag and hold it flat; shoot straight-on with soft light so every character of the code is legible edge-to-edge.",
          instruction: 'Date code / blind stamp inside tag or under flap — for OCR.',
          details: ['Code fully in frame', 'Backing label flat + lit'], macro: true, example: 'macro' },
        { icon: 'fa-grip-lines', shot: 'Stitching & Hardware', distance: '10–15 cm (Macro)', tier: 'detail',
        tip: "Lay the bag on its side so the stitching run is horizontal; shoot 10-15 cm away, parallel to the seam, with the zipper pull or turn-lock centered.",
          instruction: 'Stitch tension + hardware engravings (zipper pull, turn-lock).',
          details: ['Stitch pattern clear', 'Hardware logo sharp'], macro: true, example: 'macro' },
        { icon: 'fa-box-archive', shot: 'Box & Dust Bag', distance: '30–45 cm (Overview)', tier: 'standard',
        tip: "Arrange box, dust bag and booklet in one frame from 30-45 cm at 45 degrees above, under even light so printed logos are readable.",
          instruction: 'Original box, dust bag, authenticity booklet.',
          details: ['Box logo/print visible', 'Booklet title readable'], macro: false, example: 'card' },
      ],
      'Fine Jewelry': [
        { icon: 'fa-gem', shot: 'Full Piece', distance: '20–30 cm (Centered)', tier: 'hero',
        tip: "Place the piece on a plain dark cloth, prop the phone 20-30 cm above, centered, with a single soft light from the top to kill reflections.",
          instruction: 'Full piece on neutral background — overall design + symmetry.',
          details: ['Center the piece', 'Show both sides of symmetry', 'No reflections'], macro: false, example: 'gem' },
        { icon: 'fa-stamp', shot: 'Hallmark / Stamp', distance: '8–12 cm (Ultra Macro)', tier: 'macro',
        tip: "Get within 8-12 cm with MACRO on; hold nearly touching-distance, dead-still, and angle slightly off direct light so the metal stamp casts a micro-shadow (that is what makes it readable).",
          instruction: 'Metal hallmark stamp — 750 / Pt950 / 18K. Confirms purity.',
          details: ['Hallmark fully readable', 'Macro engaged', 'Best under direct light'], macro: true, example: 'macro' },
        { icon: 'fa-snowflake', shot: 'Gemstone / Setting', distance: '8–12 cm (Ultra Macro)', tier: 'detail',
        tip: "Shoot 8-12 cm away through the side of the stone so facets catch light - rotate the piece a few degrees until fire flashes, then shoot.",
          instruction: 'Main gemstone — facet clarity + prong setting.',
          details: ['Facets in focus', 'Prongs visible', 'No light reflection'], macro: true, example: 'gem' },
        { icon: 'fa-weight-hanging', shot: 'Clasp / Serial', distance: '10–15 cm (Macro)', tier: 'detail',
        tip: "Open the clasp flat and shoot straight down at 10-15 cm; the micro-engraving reads best with light raking across at a low angle.",
          instruction: 'Clasp mechanism + micro-serial engraving.',
          details: ['Serial readable under loop', 'Clasp maker mark sharp'], macro: true, example: 'macro' },
      ],
      'Luxury Vehicles': [
        { icon: 'fa-car-side', shot: '3/4 Front Angle', distance: '2–3 meters (Full Vehicle)', tier: 'hero',
        tip: "Stand 2-3 m from the nose at bumper height, angle ~30 degrees off head-on, sun behind you so badge and panel gaps are evenly lit.",
          instruction: '3/4 front angle — badge, headlights, panel gaps.',
          details: ['Full nose in frame', 'Badge readable', 'Even daylight, no harsh shadow'], macro: false, example: 'car' },
        { icon: 'fa-gauge-high', shot: 'Dashboard / Odometer', distance: '50–70 cm (Interior)', tier: 'detail',
        tip: "Shoot from the driver's seat at 50-70 cm, screen off all dash lights you can, and cup a hand above the lens to kill windshield reflection.",
          instruction: 'Dashboard — odometer reading clearly in focus.',
          details: ['Odometer digits sharp', 'No reflection on cluster'], macro: false, example: 'dash' },
        { icon: 'fa-id-card', shot: 'VIN Plate', distance: '15–25 cm (Close-Up)', tier: 'macro',
        tip: "Shoot the windshield-base plate from outside at 15-25 cm, phone parallel to the glass, with your body shading the reflection.",
          instruction: 'VIN plate at windshield base or door jamb — 17-digit OCR.',
          details: ['All 17 chars readable', 'Plate flat + lit'], macro: true, example: 'macro' },
        { icon: 'fa-couch', shot: 'Interior Stitching', distance: '30–50 cm (Detail)', tier: 'detail',
        tip: "Open the door and shoot along the seat from 30-50 cm with daylight falling across the stitching - the low angle makes the pattern pop.",
          instruction: 'Seat leather stitching, headrest badge, carbon weave.',
          details: ['Stitch pattern clear', 'Material weave in focus'], macro: false, example: 'macro' },
      ],
      'Art & Collectibles': [
        { icon: 'fa-image', shot: 'Full Work', distance: '1–2 meters (Straight-on)', tier: 'hero',
        tip: "Center the piece on a wall at eye level, stand square 1-2 m back, and kill glare by standing slightly left or right of any window reflection.",
          instruction: 'Entire artwork centered, straight-on, no glare.',
          details: ['Full canvas in frame', 'Edge-to-edge visible', 'No crop'], macro: false, example: 'art' },
        { icon: 'fa-signature', shot: 'Signature', distance: '15–25 cm (Close-Up)', tier: 'macro',
        tip: "Shoot 15-25 cm from the signature at a slight angle (5 degrees) so ink texture is visible; never use flash - it whites out the strokes.",
          instruction: 'Artist signature / maker stamp sharp — verify stroke style.',
          details: ['Signature fully readable', 'Stroke line in focus'], macro: true, example: 'macro' },
        { icon: 'fa-list-ol', shot: 'Edition / Markings', distance: '15–25 cm (Close-Up)', tier: 'detail',
        tip: "Shoot the numbering straight-on from 15-25 cm; if it is on the back or corner, turn the work so the marking faces the light.",
          instruction: 'Edition numbering (12/50) + corner/rear markings.',
          details: ['Numbering readable', 'Markings not cropped'], macro: true, example: 'macro' },
        { icon: 'fa-certificate', shot: 'Certificate / COA', distance: '25–35 cm (Doc)', tier: 'standard',
        tip: "Flatten the COA completely, no curls, and shoot top-down from 25-35 cm with two-side even lighting.",
          instruction: 'Certificate of Authenticity or provenance docs.',
          details: ['COA title readable', 'Doc flat + well-lit'], macro: false, example: 'card' },
      ],
    }
    function currentGuide() { return GUIDE_SEQUENCES[activeCategory] || GUIDE_SEQUENCES['Watches'] }


    // ── "Like this / Not this" example diagrams (inline SVG — no external assets) ──
    // Each key shows a correct framing (left) vs a bad one (right) with a one-line caption.
    const EXAMPLES = {
      dial: { good: 'Dial fills the frame, straight-on, logo crisp, no glare', bad: 'Lifestyle angle, too far, scene stealing the face', goodSrc: '/static/examples/dial-good.jpg', badSrc: '/static/examples/dial-bad.jpg' },
      macro: { good: 'Serial / engraving fills the frame and is fully readable', bad: 'Too far — characters too small, motion blur', goodSrc: '/static/examples/macro-good.jpg', badSrc: '/static/examples/macro-bad.jpg' },
      card: { good: 'Document flat, square, even light, reference readable', bad: 'Curled paper, shadow band across the text', goodSrc: '/static/examples/card-good.jpg', badSrc: '/static/examples/card-bad.jpg' },
      bag: { good: 'Whole bag front-on, handles up, silhouette complete', bad: 'Side angle, hardware and shape distorted', goodSrc: '/static/examples/bag-good.jpg', badSrc: '/static/examples/bag-bad.jpg' },
      gem: { good: 'Piece centered on a plain ground, facets catching light', bad: 'Tilted, glare wash, subject lost in the frame', goodSrc: '/static/examples/gem-good.jpg', badSrc: '/static/examples/gem-bad.jpg' },
      car: { good: '3/4 front, full nose in frame, badge readable', bad: 'Cropped, harsh shadow across the panels', goodSrc: '/static/examples/car-good.jpg', badSrc: '/static/examples/car-bad.jpg' },
      dash: { good: 'Cluster sharp, odometer digits clearly readable', bad: 'Reflection washing out the display', goodSrc: '/static/examples/dash-good.jpg', badSrc: '/static/examples/dash-bad.jpg' },
      art: { good: 'Whole work edge-to-edge, square, glare-free', bad: 'Skewed from the side with a glare hotspot', goodSrc: '/static/examples/art-good.jpg', badSrc: '/static/examples/art-bad.jpg' },
    }
    function examplePairHtml(ex, compact) {
      if (!ex) return ''
      const h = compact ? 'h-24' : 'h-44'
      return `<div class="cl-ex-pair grid grid-cols-2 gap-2">
        <figure class="cl-ex-good m-0">
          <div class="${h} rounded-lg overflow-hidden border border-emerald-500/40 bg-black">
            <img src="${ex.goodSrc}" alt="Like this" class="w-full h-full object-cover" loading="lazy"/>
          </div>
          <figcaption class="mt-1.5 text-[10px] leading-snug text-emerald-300/90"><span class="font-mono uppercase tracking-wide text-[9px]">✓ Like this</span> — ${ex.good}</figcaption>
        </figure>
        <figure class="cl-ex-bad m-0">
          <div class="${h} rounded-lg overflow-hidden border border-rose-500/40 bg-black">
            <img src="${ex.badSrc}" alt="Not this" class="w-full h-full object-cover" loading="lazy"/>
          </div>
          <figcaption class="mt-1.5 text-[10px] leading-snug text-rose-300/90"><span class="font-mono uppercase tracking-wide text-[9px]">✗ Not this</span> — ${ex.bad}</figcaption>
        </figure>
      </div>`
    }

  // ── PREP SCREEN: "Prepare for Capture" (Step 1 of 10) ──────────────────
  // Faithful mimic of the reference frame: CL logo, serif title, gold-on-black,
  // 5 prep checklist items, gold "Begin Capture" CTA, "See example photos" link.
  // BEGIN CAPTURE hands off to openCamera() (existing camera-first flow) so the
  // RAG + shot-tier accuracy pipeline stays fully intact.
  const PREP_TIPS = [
    { icon: 'fa-camera',   label: 'Clean your camera lens' },
    { icon: 'fa-sun',      label: 'Use bright, indirect light' },
    { icon: 'fa-table',    label: 'Place item on a plain surface' },
    { icon: 'fa-street-view', label: 'Avoid reflections and shadows' },
    { icon: 'fa-magnifying-glass-minus', label: 'Do not use digital zoom' },
  ];

  // Gold-rimmed black-dial dress watch — recreated from the reference frame using
  // the app palette (#8a1c2c gold on #111827 black, black leather strap). Inline
  // SVG = zero asset weight, offline-safe, themeable.
  const PREP_HEROES = {
    Watches: '<img src="/static/examples/prep-dial.jpg" alt="Watch capture reference" class="w-full h-[190px] object-cover rounded-xl"/>',
    Handbags: '<img src="/static/examples/prep-bag.jpg" alt="Handbag capture reference" class="w-full h-[190px] object-cover rounded-xl"/>',
    'Fine Jewelry': '<img src="/static/examples/prep-gem.jpg" alt="Jewelry capture reference" class="w-full h-[190px] object-cover rounded-xl"/>',
    'Luxury Vehicles': '<img src="/static/examples/prep-car.jpg" alt="Vehicle capture reference" class="w-full h-[190px] object-cover rounded-xl"/>',
    'Art & Collectibles': '<img src="/static/examples/prep-art.jpg" alt="Artwork capture reference" class="w-full h-[190px] object-cover rounded-xl"/>',
  };
  const PREP_HERO_TITLES = {
    Watches: 'GOLD & BLACK DRESS WATCH', Handbags: 'LUXURY HANDBAG',
    'Fine Jewelry': 'FINE JEWELRY', 'Luxury Vehicles': 'LUXURY VEHICLE',
    'Art & Collectibles': 'ART & COLLECTIBLE',
  };

  function showPrepScreen() {
    // Never prep if the user already dropped images (they're past this step)
    if (images.length) { openCamera(); return; }
    let prepCat = activeCategory;
    const close = () => prepModal.remove();
    const render = () => {
      heroBox.innerHTML = PREP_HEROES[prepCat] || PREP_HEROES['Watches'];
      heroLabel.textContent = PREP_HERO_TITLES[prepCat] || 'WATCH OR LUXURY ITEM';
    };
    const prepModal = document.createElement('div');
    prepModal.className = 'fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm overflow-y-auto overscroll-contain';
    prepModal.innerHTML = `
      <div class="relative max-w-2xl w-full min-h-full mx-auto flex flex-col justify-center p-5">
        <!-- close -->
        <button id="cl-prep-close" class="absolute top-3 right-3 z-40 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 border border-white/10">&times;</button>

        <!-- CL logo + wordmark -->
        <div class="flex items-center justify-center gap-2 mb-1">
          <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="none" stroke="#8a1c2c" stroke-width="2"/>
            <text x="20" y="26" text-anchor="middle" fill="#8a1c2c" font-family="Georgia, 'Times New Roman', serif" font-size="19" font-weight="bold">CL</text>
          </svg>
          <span class="text-sm tracking-[0.35em] uppercase text-gold font-semibold" style="font-family: Georgia, 'Times New Roman', serif;">CuratedLux</span>
        </div>

        <!-- Step indicator -->
        <p class="text-center text-[11px] text-white/35 font-mono tracking-widest uppercase mt-1.5">Step 1 of 10</p>

        <!-- Title + subtitle (serif, matching reference) -->
        <h1 class="text-center text-3xl font-bold text-gold mt-2" style="font-family: Georgia, 'Times New Roman', serif;">Prepare for Capture</h1>
        <p class="text-center text-[13px] text-white/55 mt-2 max-w-sm mx-auto leading-relaxed" style="font-family: Georgia, 'Times New Roman', serif;">
          Better photos create more accurate authentication results.
        </p>

        <!-- Hero reference (category-aware, gold+black dress watch by default) -->
        <div class="mt-5 rounded-2xl bg-zinc-900/80 border border-gold/15 p-4 flex flex-col items-center">
          <div id="cl-prep-hero" class="w-full" style="max-height:190px; overflow:hidden;"></div>
          <span id="cl-prep-hero-label" class="mt-2 text-[10px] font-mono tracking-[0.3em] text-gold/70 uppercase"></span>
        </div>

        <!-- Category chips (mirror existing capture selector) -->
        <div class="flex items-center justify-center gap-1.5 mt-4 flex-wrap">
          ${['Watches','Handbags','Fine Jewelry','Luxury Vehicles','Art & Collectibles'].map(c =>
            `<button data-prep-cat="${c}" class="cl-prep-cat px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${c===prepCat?'border-gold/40 bg-gold/10 text-gold':'border-white/15 text-white/45 hover:text-gold hover:border-gold/40'}">${c==='Fine Jewelry'?'Jewelry':c==='Luxury Vehicles'?'Vehicles':c==='Art & Collectibles'?'Art':c}</button>`
          ).join('')}
        </div>

        <!-- 5 prep checklist items (icon + label + check) -->
        <div class="mt-4 space-y-1.5">
          ${PREP_TIPS.map((t,i)=>`
            <div class="flex items-center gap-3 bg-zinc-900/60 border border-white/[0.06] rounded-xl px-3 py-2.5">
              <span class="w-8 h-8 shrink-0 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center text-gold text-[13px]"><i class="fas ${t.icon}"></i></span>
              <span class="flex-1 text-[13px] text-white/85" style="font-family: Georgia, 'Times New Roman', serif;">${t.label}</span>
              <span class="w-5 h-5 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><i class="fas fa-check text-[9px] text-emerald-400"></i></span>
            </div>`).join('')}
        </div>

        <!-- Info note -->
        <p class="text-center text-[12px] text-white/40 mt-4" style="font-family: Georgia, 'Times New Roman', serif;">We will guide you through each required angle.</p>

        <!-- Begin Capture CTA -->
        <button id="cl-prep-begin" class="mt-4 w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-black font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(138,28,44,0.3)]" style="font-family: Georgia, 'Times New Roman', serif;">
          <i class="fas fa-camera text-base"></i> Begin Capture <i class="fas fa-chevron-right text-xs"></i>
        </button>

        <!-- See example photos -->
        <button id="cl-prep-examples" class="mt-2 text-center text-[12px] text-gold/70 hover:text-gold font-mono underline underline-offset-4 tracking-wide">See example photos</button>
      </div>
    `;
    document.body.appendChild(prepModal);

    const heroBox = prepModal.querySelector('#cl-prep-hero');
    const heroLabel = prepModal.querySelector('#cl-prep-hero-label');
    render();

    prepModal.querySelectorAll('.cl-prep-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        prepCat = btn.dataset.prepCat;
        prepModal.querySelectorAll('.cl-prep-cat').forEach(b => {
          b.className = b === btn
            ? b.className.replace(/\b(?:border-gold\/40|bg-gold\/10|text-gold|border-white\/15|text-white\/45)\b/g, '') + ' border-gold/40 bg-gold/10 text-gold'
            : b.className.replace(/\b(?:border-gold\/40|bg-gold\/10|text-gold|border-white\/15|text-white\/45)\b/g, '') + ' border-white/15 text-white/45';
        });
        render();
      });
    });

    prepModal.querySelector('#cl-prep-close').addEventListener('click', close);
    prepModal.querySelector('#cl-prep-begin').addEventListener('click', () => {
      prepModal.remove();
      activeCategory = prepCat;      // carry the chosen category into capture
      openCamera();
    });
    prepModal.querySelector('#cl-prep-examples').addEventListener('click', () => {
      if (typeof openExampleGallery === 'function') openExampleGallery(prepCat);
    });
  }

  // "See example photos" → gallery of the selected category's step samples.
  // Reuses the existing EXAMPLES "like this / not this" cards + GUIDE_SEQUENCES
  // step labels (same assets the camera flow shows) — no fabricated reference.
  function openExampleGallery(category) {
    const seq = GUIDE_SEQUENCES[category] || GUIDE_SEQUENCES['Watches'];
    const exModal = document.createElement('div');
    exModal.className = 'fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm overflow-y-auto overscroll-contain';
    exModal.innerHTML = `
      <div class="relative max-w-2xl w-full mx-auto px-4 pt-5 pb-8 flex flex-col items-stretch">
        <div class="sticky top-0 z-30 -mx-4 px-4 py-3 bg-black/90 backdrop-blur-md border-b border-gold/15 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gold leading-tight" style="font-family: Georgia, 'Times New Roman', serif;">How It Works</h2>
            <p class="text-[11px] text-white/50 mt-0.5">${category} · ${seq.length} guided photos · follow the examples for the best accuracy</p>
          </div>
          <button id="cl-exclose" class="shrink-0 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 border border-white/10">&times;</button>
        </div>

        <div class="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3 flex items-start gap-3">
          <i class="fas fa-bullseye text-gold mt-0.5"></i>
          <p class="text-[11.5px] text-white/70 leading-snug">Copy these photos, not a drawing of them. <span class="text-white font-semibold">Straight-on, fill the frame, serial readable, no glare.</span> High confidence needs a hero plus a macro serial. Phone photos will not hit 99% authenticity — they produce a strong review-grade file.</p>
        </div>

        <div class="mt-4 space-y-4">
          ${seq.map((s, i) => {
            const ex = EXAMPLES[s.example];
            if (!ex) return '';
            return `
              <div class="bg-zinc-900/80 border border-white/10 rounded-2xl p-3.5">
                <div class="flex items-center justify-between gap-2 mb-2.5">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="shrink-0 w-6 h-6 rounded-full bg-gold/20 border border-gold/50 text-gold text-[11px] font-bold flex items-center justify-center">${i + 1}</span>
                    <span class="text-[13px] font-semibold text-gold truncate" style="font-family: Georgia, 'Times New Roman', serif;"><i class="fas ${s.icon} mr-1.5 text-[11px]"></i>${s.shot}</span>
                  </div>
                  <span class="shrink-0 text-[9px] font-mono text-white/35 uppercase tracking-wider border border-white/10 rounded px-1.5 py-0.5">${s.tier}</span>
                </div>
                <div class="cl-example-photos w-full">${examplePairHtml(ex, false)}</div>
                ${s.tip ? `<div class="mt-2 flex items-start gap-2 text-[10.5px] text-gold/80 leading-snug"><i class="fas fa-crosshairs mt-0.5 text-[10px]"></i><span><span class="font-semibold">Best position:</span> ${s.tip}</span></div>` : ''}
                ${s.details && s.details.length ? `<div class="mt-2 flex flex-wrap gap-1.5">${s.details.map(d => `<span class="text-[9.5px] text-white/50 border border-white/10 rounded-full px-2 py-0.5"><i class="fas fa-check text-emerald-400/70 mr-1 text-[8px]"></i>${d}</span>`).join('')}</div>` : ''}
              </div>`;
          }).join('')}
        </div>
        <button id="cl-ex-done" class="mt-5 w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-black font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(138,28,44,0.25)]" style="font-family: Georgia, 'Times New Roman', serif;">
          <i class="fas fa-camera text-base"></i> Start Capture
        </button>
      </div>
    `;
    document.body.appendChild(exModal);
    exModal.querySelector('#cl-exclose').addEventListener('click', () => exModal.remove());
    exModal.querySelector('#cl-ex-done').addEventListener('click', () => {
      exModal.remove();
      activeCategory = category;
      openCamera();
    });
  }

  async function openCamera() {
    const modal = document.createElement('div');
    // Mobile-first: scrollable so the guide (top) and video never overlap on
    // phones. The inner card is a flex column [guide · video · controls] that
    // fits height and scrolls when content exceeds the viewport.
    modal.className = 'clx-camera-modal fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm overflow-y-auto overscroll-contain';
    modal.innerHTML = `
      <div class="clx-camera-inner relative max-w-2xl w-full min-h-full mx-auto flex flex-col justify-center p-4">
        <button id="cl-cam-close" class="absolute top-2 right-2 z-40 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 border border-white/10">&times;</button>

        <!-- Mode & Quality Toolbar (compact top row) -->
        <div class="flex items-center justify-between gap-2 mb-2 px-1 flex-wrap">
          <div class="flex items-center gap-1">
            <button data-res="4k" class="cl-res-btn px-2 py-1 rounded text-[11px] font-mono border border-white/15 text-white/70 hover:text-gold hover:border-gold/40">4K</button>
            <button data-res="1080" class="cl-res-btn px-2 py-1 rounded text-[11px] font-mono border border-white/15 text-white/70 hover:text-gold hover:border-gold/40">1080p</button>
            <button data-res="720" class="cl-res-btn px-2 py-1 rounded text-[11px] font-mono border border-white/15 text-white/70 hover:text-gold hover:border-gold/40">720p</button>
          </div>
          <div class="flex items-center gap-1">
            <button id="cl-macro-btn" class="cl-toggle px-2 py-1 rounded text-[11px] font-mono border border-white/15 text-white/70 hover:text-gold hover:border-gold/40" title="Macro — for tiny luxury details (watch dial, handbag stamp, jewelry hallmark)">
              <i class="fas fa-search-plus mr-1"></i>MACRO
            </button>
            <button id="cl-burst-btn" class="cl-toggle px-2 py-1 rounded text-[11px] font-mono border border-white/15 text-white/70 hover:text-gold hover:border-gold/40" title="3-frame burst — picks sharpest">
              <i class="fas fa-layer-group mr-1"></i>BURST
            </button>
          </div>
          <div class="flex items-center gap-1">
            <button id="cl-mic-btn" class="cl-toggle px-2 py-1 rounded text-[11px] font-mono border border-white/15 text-white/70 hover:text-rose-300 hover:border-rose-400/40" title="High-fidelity voice notes">
              <i class="fas fa-microphone mr-1"></i>RAW MIC
            </button>
          </div>
        </div>

        <!-- Category selector (compact, horizontal) -->
        <div class="flex items-center gap-1.5 mb-2 flex-wrap">
          <span class="text-[10px] text-white/30 uppercase tracking-wider mr-1">Asset type:</span>
          <button data-cat="Watches" class="cl-cat-btn px-2.5 py-1 rounded text-[11px] font-medium border border-gold/40 bg-gold/10 text-gold transition-all">Watches</button>
          <button data-cat="Handbags" class="cl-cat-btn px-2.5 py-1 rounded text-[11px] font-medium border border-white/15 text-white/50 hover:text-gold hover:border-gold/40 transition-all">Handbags</button>
          <button data-cat="Fine Jewelry" class="cl-cat-btn px-2.5 py-1 rounded text-[11px] font-medium border border-white/15 text-white/50 hover:text-gold hover:border-gold/40 transition-all">Jewelry</button>
          <button data-cat="Luxury Vehicles" class="cl-cat-btn px-2.5 py-1 rounded text-[11px] font-medium border border-white/15 text-white/50 hover:text-gold hover:border-gold/40 transition-all">Vehicles</button>
          <button data-cat="Art & Collectibles" class="cl-cat-btn px-2.5 py-1 rounded text-[11px] font-medium border border-white/15 text-white/50 hover:text-gold hover:border-gold/40 transition-all">Art</button>
        </div>

        <!-- CAMERA-FIRST: video fills available height; guide overlays bottom -->
        <div class="clx-camera-feed relative overflow-hidden rounded-xl bg-black">
          <video id="cl-cam-video" class="w-full bg-black" autoplay playsinline muted></video>

          <!-- LIVE TOP FLOATING HUD BANNER -->
          <div id="cl-live-hud-banner" class="absolute top-2 left-2 right-14 z-30 bg-black/75 border border-gold/40 rounded-lg px-3 py-2 backdrop-blur-md shadow-2xl flex items-center justify-between pointer-events-none">
            <div class="flex items-center gap-2">
              <span id="cl-hud-step-badge" class="px-2 py-0.5 bg-gold/20 border border-gold/40 text-gold text-[10px] font-mono font-bold rounded uppercase">Step 1/4</span>
              <div>
                <div id="cl-hud-shot-title" class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i class="fas fa-crosshairs text-gold text-[10px]"></i>
                  <span>Dial / Face</span>
                </div>
                <div id="cl-hud-distance-text" class="text-[10px] font-mono text-gold/90 font-medium">📏 Distance</div>
              </div>
            </div>
            <div class="text-right">
              <span id="cl-hud-instruction-short" class="text-[10px] text-white/70 block max-w-[130px] truncate"></span>
              <span id="cl-hud-macro-badge" class="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded hidden">MACRO ON</span>
            </div>
          </div>

          <!-- PHOTO THUMBNAIL RAIL — every captured shot shown as a small icon on the side -->
          <div id="cl-thumb-rail" class="absolute top-2 right-2 z-30 flex flex-col gap-1.5 max-h-[70%] overflow-y-auto"></div>

          <!-- Framing guides + gold reticle (corner brackets + center circle → reference) -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-1/3 left-0 right-0 h-px bg-white/10"></div>
            <div class="absolute top-2/3 left-0 right-0 h-px bg-white/10"></div>
            <div class="absolute left-1/3 top-0 bottom-0 w-px bg-white/10"></div>
            <div class="absolute left-2/3 top-0 bottom-0 w-px bg-white/10"></div>
            <!-- Center circle guide -->
            <div class="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 border-2 border-gold/60 rounded-full animate-pulse shadow-[0_0_20px_rgba(138,28,44,0.3)]"></div>
            <!-- Corner brackets (reference "Capture Dial" overlay) -->
            <div class="absolute top-[29%] left-[39%] w-5 h-5 border-t-2 border-l-2 border-gold/70 rounded-tl-md"></div>
            <div class="absolute top-[29%] right-[39%] w-5 h-5 border-t-2 border-r-2 border-gold/70 rounded-tr-md"></div>
            <div class="absolute bottom-[29%] left-[39%] w-5 h-5 border-b-2 border-l-2 border-gold/70 rounded-bl-md"></div>
            <div class="absolute bottom-[29%] right-[39%] w-5 h-5 border-b-2 border-r-2 border-gold/70 rounded-br-md"></div>
          </div>
          <div id="cl-cam-info" class="absolute bottom-2 left-2 text-[10px] font-mono text-gold/80 bg-black/40 px-2 py-0.5 rounded z-30"></div>
        </div>

        <!-- Compact guide dock BELOW the camera (not pushing it off screen) -->
        <div id="cl-guide-panel" class="mt-2 bg-zinc-900/95 border border-gold/15 rounded-xl px-3 py-2.5">
          <!-- Prominent progress banner: how many photos taken / needed -->
          <div class="flex items-center justify-between mb-2 px-2.5 py-2 rounded-lg bg-gold/10 border border-gold/25">
            <span class="text-sm font-bold text-gold"><i class="fas fa-images mr-1.5"></i><span id="cl-progress-count">0</span> of <span id="cl-progress-total">4</span> photos taken</span>
            <span id="cl-progress-remaining" class="text-[11px] text-white/50 font-medium">4 more needed</span>
          </div>

          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span id="cl-step-icon" class="w-6 h-6 shrink-0 rounded-full bg-gold/20 flex items-center justify-center text-[10px] text-gold"><i class="fas fa-crosshairs"></i></span>
              <span id="cl-step-label" class="text-xs font-semibold text-gold whitespace-nowrap overflow-hidden text-ellipsis">Step 1 of 4 — Dial / Face</span>
              <span id="cl-shot-count" class="text-[10px] text-white/40 font-mono shrink-0">0/4</span>
            </div>
            <img id="cl-step-thumb" class="hidden w-8 h-8 rounded-lg object-cover border border-emerald-500/40 ring-1 ring-emerald-500/30 shrink-0 ml-1" alt="captured" />
          </div>

          <p id="cl-step-instruction" class="text-sm leading-snug text-white font-semibold">Frame the dial — fill the center reticle</p>

          <!-- Lens / prep accuracy strip — always visible (critical for extraction) -->
          <div class="mt-2 px-2.5 py-2 rounded-lg border border-white/10 bg-black/30">
            <div class="flex items-start gap-1.5 text-[10px] text-gold-dim font-mono leading-relaxed">
              <i class="fas fa-sparkles text-gold/70 mt-0.5 text-[9px]"></i>
              <span>Wipe the lens clean · steady hands · <span id="cl-prep-distance" class="text-gold">hold steady</span> · even light, no glare on the surface</span>
            </div>
            <div id="cl-prep-desktop" class="hidden mt-1 text-[9px] text-amber-300/90 font-mono leading-relaxed">
              <i class="fas fa-triangle-exclamation mr-1"></i>Laptop camera cannot focus close-up. Shoot macro steps (serial, hallmark) on your phone and upload, or open the app on your phone for detail shots.
            </div>
          </div>

          <!-- Details checklist + example (collapsible on mobile) -->
          <button id="cl-details-toggle" type="button" class="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gold/80 hover:text-gold font-mono uppercase tracking-wider">
            <i class="fas fa-list-check text-[9px]"></i> <span>Capture details</span> <i class="fas fa-chevron-down text-[8px]"></i>
          </button>
          <div id="cl-step-details" class="hidden mt-1.5 space-y-1"></div>

          <!-- Big TAKE PICTURE CTA -->
          <button id="cl-mega-snap" class="mt-2 w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-black font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(138,28,44,0.25)]">
            <i class="fas fa-camera-retro text-base"></i> Take Picture
          </button>
          <button id="cl-use-saved" type="button" class="mt-2 w-full py-2.5 rounded-xl border border-gold/35 text-gold hover:bg-gold/10 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2">
            <i class="fas fa-images"></i> Use a saved photo for this step
          </button>

          <!-- Step nav row -->
          <div class="mt-2 flex items-center gap-2">
            <button id="cl-guide-skip-step" class="flex-1 py-2.5 rounded-lg border border-white/15 text-white/50 hover:text-white/80 text-xs font-medium transition-colors">Skip shot</button>
            <button id="cl-guide-skip" class="flex-1 py-2.5 rounded-lg border border-white/10 text-white/30 hover:text-white/50 text-xs transition-colors">Skip all</button>
            <button id="cl-guide-next" class="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:cursor-not-allowed bg-white/10 text-white/25" disabled>Next →</button>
          </div>

          <!-- ANALYZE NOW — always visible once ≥1 photo taken, works on iPhone + Android -->
          <button id="cl-analyze-now-btn" class="hidden mt-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <i class="fas fa-wand-magic-sparkles text-base"></i> Analyze Now
          </button>

          <!-- LIVE readiness checklist (matches "Capture Dial" reference chips:
               Lighting · Focus · Centered + Reduce glare warning) -->
          <div id="cl-live-checks" class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <div id="cl-check-light" class="flex items-center justify-center gap-1 text-[10px] font-mono px-1 py-1 rounded bg-white/5 border border-white/10 text-white/40"><i class="fas fa-sun text-[9px]"></i><span>Lighting</span></div>
            <div id="cl-check-steady" class="flex items-center justify-center gap-1 text-[10px] font-mono px-1 py-1 rounded bg-white/5 border border-white/10 text-white/40"><i class="fas fa-crosshairs text-[9px]"></i><span>Focus</span></div>
            <div id="cl-check-frame" class="flex items-center justify-center gap-1 text-[10px] font-mono px-1 py-1 rounded bg-white/5 border border-white/10 text-white/40"><i class="fas fa-expand text-[9px]"></i><span>Centered</span></div>
            <div id="cl-check-glare" class="flex items-center justify-center gap-1 text-[10px] font-mono px-1 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300"><i class="fas fa-triangle-exclamation text-[9px]"></i><span>Reduce glare</span></div>
          </div>


          <!-- Per-step captured preview strip -->
          <div id="cl-step-dots" class="flex items-center gap-1.5 mt-2"></div>

          <!-- Example card (kept, collapsible) -->
          <div id="cl-example-card" class="mt-2 bg-black/30 border border-white/10 rounded-lg p-2 hidden">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[9px] uppercase tracking-wider text-white/30 font-mono">Example</span>
              <span class="text-[9px] text-white/30">tap to expand</span>
            </div>
            <div class="cl-example-body">
              <div id="cl-example-svg" class="w-full"></div>
            </div>
          </div>
        </div>


        <!-- Mic waveform + status -->
        <div id="cl-mic-panel" class="hidden mt-3 bg-black/40 rounded-lg p-3 border border-rose-400/20">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-mono text-rose-300"><i class="fas fa-circle text-[6px] mr-1 animate-pulse"></i>RAW MIC 256 kbps</span>
            <span id="cl-mic-meter" class="text-[10px] font-mono text-rose-200/50">0 dB</span>
          </div>
          <canvas id="cl-mic-wave" class="w-full h-8 bg-black/30 rounded"></canvas>
        </div>

        <!-- Snap controls (reference layout: Retake · shutter · AUTO auto-capture) -->
        <div class="mt-4 flex items-center justify-center gap-6">
          <div class="flex flex-col items-center gap-1">
            <button id="cl-cam-retake" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-gold flex items-center justify-center" title="Retake this shot">
              <i class="fas fa-rotate-left"></i>
            </button>
            <span class="text-[9px] font-mono text-white/35 uppercase">Retake</span>
          </div>
          <button id="cl-cam-snap" class="relative w-20 h-20 rounded-full bg-white border-4 border-gold flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(138,28,44,0.4)]" title="Take photo">
            <i class="fas fa-camera text-black text-2xl"></i>
            <span id="cl-ready-ring" class="hidden absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[8px] font-mono font-bold animate-pulse">READY</span>
          </button>
          <div class="flex flex-col items-center gap-1">
            <button id="cl-cam-auto" class="w-10 h-10 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all bg-white/5 border-white/10 text-white/40" title="Auto-capture when the shot is READY">
              AUTO
            </button>
            <span class="text-[9px] font-mono text-white/35 uppercase">Auto-capture</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // ── State ──────────────────────────────────────────────────────────
    let stream = null
    let facingMode = 'environment'
    let isDesktopCam = false   // true when no rear camera → likely laptop/desktop webcam
    let resolution = '1080'
    let macroOn = false
    let burstOn = false
    let micOn = false
    let guideStep = 0
    let guideSkipped = false
    let stepCaptured = new Set()     // indices of guided shots already taken (accuracy accounting)

    const TIER_LABEL = { hero: '⭐ hero shot', macro: '🔬 detail — high accuracy', detail: 'detail', standard: 'standard' }


    // Renders every captured photo as a small green-checked icon on the side
    // rail inside the camera view, so the user always sees "this shot was
    // saved" without leaving the camera. Tap a thumbnail to jump to (and
    // retake) that step.
    function renderThumbRail() {
      const rail = modal.querySelector('#cl-thumb-rail')
      if (!rail) return
      const seq = currentGuide()
      rail.innerHTML = images.map((img, i) => {
        if (!img || !img.data) return ''
        const stepInfo = seq[i]
        const label = stepInfo ? stepInfo.shot : `Photo ${i + 1}`
        return `<button class="cl-rail-thumb relative w-11 h-11 rounded-lg overflow-hidden border-2 border-emerald-500/70 shadow-lg" data-step="${i}" title="${esc(label)} — captured">
          <img src="${img.data}" class="w-full h-full object-cover" />
          <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center border border-black/40"><i class="fas fa-check"></i></span>
        </button>`
      }).join('')
      rail.querySelectorAll('.cl-rail-thumb').forEach(btn => {
        btn.addEventListener('click', () => updateGuideStep(parseInt(btn.dataset.step, 10)))
      })
    }

    function updateGuideStep(step) {
      guideStep = step
      const seq = currentGuide()
      const panel = modal.querySelector('#cl-guide-panel')
      if (!panel || guideSkipped) return
      const icon = modal.querySelector('#cl-step-icon i')
      const label = modal.querySelector('#cl-step-label')
      const instruction = modal.querySelector('#cl-step-instruction')
      const dotsContainer = modal.querySelector('#cl-step-dots')
      const detailsContainer = modal.querySelector('#cl-step-details')
      const shotCount = modal.querySelector('#cl-shot-count')
      const nextBtn = modal.querySelector('#cl-guide-next')
      const stepThumb = modal.querySelector('#cl-step-thumb')

      const cur = seq[step] || seq[seq.length - 1]
      const total = seq.length

      if (icon) { icon.className = `fas ${cur.icon}` }
      if (label) label.textContent = `Step ${step + 1} of ${total} — ${cur.shot}`
      if (shotCount) shotCount.textContent = `${stepCaptured.size}/${total}`
      if (instruction) instruction.textContent = cur.instruction + `  (${cur.distance || ''})`;

      // Best-position tip line (accuracy guidance per step)
      let tipEl = modal.querySelector('#cl-step-tip')
      if (cur.tip) {
        if (!tipEl) {
          tipEl = document.createElement('p')
          tipEl.id = 'cl-step-tip'
          tipEl.className = 'text-[11px] leading-snug text-gold/85 mt-1 flex items-start gap-1.5'
          instruction?.parentElement?.appendChild(tipEl)
        }
        tipEl.innerHTML = `<i class="fas fa-crosshairs mt-0.5 text-[9px]"></i><span><span class="font-semibold">Best position:</span> ${cur.tip}</span>`
      } else if (tipEl) tipEl.remove()

      // Update the lens/prep accuracy strip distance for this shot
      const prepDist = modal.querySelector('#cl-prep-distance')
      if (prepDist) prepDist.textContent = cur.distance || 'hold steady'

      // Surface the laptop/desktop macro warning when relevant (desktop webcam
      // can't do macro — steer user to phone for serial/hallmark close-ups)
      const prepDesktop = modal.querySelector('#cl-prep-desktop')
      if (prepDesktop) {
        const needsMacro = cur.macro === true
        prepDesktop.classList.toggle('hidden', !(isDesktopCam && needsMacro))
      }

      // Prominent progress banner: "N of TOTAL photos taken" + remaining count
      const progCount = modal.querySelector('#cl-progress-count')
      const progTotal = modal.querySelector('#cl-progress-total')
      const progRemaining = modal.querySelector('#cl-progress-remaining')
      const takenCount = images.filter(Boolean).length
      if (progCount) progCount.textContent = String(takenCount)
      if (progTotal) progTotal.textContent = String(total)
      if (progRemaining) {
        const remaining = Math.max(0, total - stepCaptured.size)
        progRemaining.textContent = remaining === 0 ? 'All set — ready to analyze!' : `${remaining} more needed`
        progRemaining.className = remaining === 0 ? 'text-[11px] text-emerald-400 font-semibold' : 'text-[11px] text-white/50 font-medium'
      }

      // ANALYZE NOW button: visible the moment there is at least 1 usable photo
      // or a typed/spoken description — reachable without leaving the camera,
      // works identically on iPhone (Safari) and Android (Chrome).
      const analyzeNowBtn = modal.querySelector('#cl-analyze-now-btn')
      if (analyzeNowBtn) {
        const hasContent = takenCount > 0 || !!descriptionInput?.value?.trim() || !!window._voiceTranscript
        analyzeNowBtn.classList.toggle('hidden', !hasContent)
      }

      // Render every captured photo as a small icon on the side rail
      renderThumbRail()

      // Details checklist is hidden by default; filled for the toggle to reveal
      if (detailsContainer) {
        const tierText = TIER_LABEL[cur.tier] || ''
        detailsContainer.innerHTML = (cur.details || []).map(d =>
          `<div class="flex items-start gap-1.5 text-[11px] text-white/50"><i class="fas fa-circle-check text-[9px] mt-0.5 ${cur.tier === 'macro' || cur.tier === 'hero' ? 'text-gold/70' : 'text-white/25'}"></i><span>${esc(d)}</span></div>`
        ).join('') + (tierText ? `<div class="mt-1 text-[9px] font-mono text-gold/60 uppercase tracking-wider">${tierText}</div>` : '')
      }

      // This step's captured thumbnail, if any
      const cap = stepCaptured.has(step)
      if (stepThumb) {
        if (cap && images[step]?.data) { stepThumb.src = images[step].data; stepThumb.classList.remove('hidden') }
        else { stepThumb.classList.add('hidden') }
      }

      // Next unlocks only after this step is captured OR explicitly skipped
      if (nextBtn) {
        const unlocked = cap
        nextBtn.disabled = !unlocked
        nextBtn.className = `flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          unlocked ? 'bg-gold text-black' : 'bg-white/10 text-white/25 disabled:cursor-not-allowed'
        }`
        nextBtn.textContent = step >= total - 1 ? (cap ? 'Done ✓' : 'Next →') : 'Next →'
      }

      // Collapse the example chip on mobile when moving between steps
      const exCardEl = panel.closest?.('#cl-example-card') || modal.querySelector('#cl-example-card')
      if (exCardEl && window.innerWidth < 768) exCardEl.classList.remove('cl-example-open')

      // Render the "like this / not this" example card for this step
      const ex = EXAMPLES[cur.example]
      const exSvg = modal.querySelector('#cl-example-svg')
      const exCard = modal.querySelector('#cl-example-card')
      if (exCard) {
        if (ex) {
          exCard.style.display = ''
          if (exSvg) exSvg.innerHTML = examplePairHtml(ex, true)
        } else {
          exCard.style.display = 'none'
        }
      }

      // Update Live Floating HUD Overlay on top of camera screen
      const hudBadge = modal.querySelector('#cl-hud-step-badge')
      const hudTitle = modal.querySelector('#cl-hud-shot-title span')
      const hudTitleIcon = modal.querySelector('#cl-hud-shot-title i')
      const hudInst = modal.querySelector('#cl-hud-instruction-short')
      const hudMacro = modal.querySelector('#cl-hud-macro-badge')

      if (hudBadge) hudBadge.textContent = `Step ${step + 1}/${total}${cap ? ' ✓' : ''}`
      if (hudTitle) hudTitle.textContent = cur.shot
      if (hudTitleIcon) hudTitleIcon.className = `fas ${cur.icon} text-gold text-[10px]`
      if (hudInst) hudInst.textContent = cur.instruction.slice(0, 45) + '...'
      if (hudMacro) {
        if (cur.macro) hudMacro.classList.remove('hidden')
        else hudMacro.classList.add('hidden')
      }

      // Per-step captured preview strip: one chip per shot, ✓ or empty
      if (dotsContainer) {
        dotsContainer.innerHTML = seq.map((_, i) => {
          const done = stepCaptured.has(i)
          const cur2 = seq[i]
          const style = done
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
            : (i === step ? 'border-gold/60 bg-gold/10 text-gold' : 'border-white/10 text-white/25')
          return `<span class="cl-step-chip flex-1 text-center py-1 rounded border text-[9px] font-mono ${style}">${done ? '✓' : (i === step ? (i + 1) : (cur2.icon ? `<i class="fas ${cur2.icon}"></i>` : '·'))}</span>`
        }).join('')
        // make each chip clickable to jump to that step
        Array.from(dotsContainer.children).forEach((chip, i) => {
          chip.addEventListener('click', () => updateGuideStep(i))
        })
      }

      // Auto-set macro per step's recommendation
      if (cur.macro && !macroOn) {
        toggleMacro(true)
      } else if (!cur.macro && macroOn) {
        toggleMacro(false)
      }
    }

    function markStepCaptured(stepIndex) {
      if (!guideSkipped) {
        stepCaptured.add(stepIndex)
        // tie the captured image to this step index for accuracy weighting
        if (images[stepIndex] && images[stepIndex].data) {
          images[stepIndex].tier = (currentGuide()[stepIndex] || {}).tier || 'standard'
        }
      }
      updateGuideStep(guideStep)
    }

    function nextStep() {
      const seq = currentGuide()
      if (guideStep < seq.length - 1) {
        updateGuideStep(guideStep + 1)
      } else {
        hideGuide()
        toast(`All ${seq.length} guided shots accounted for. You can analyze now or add more.`, 'success')
      }
    }

    function skipStep() {
      // Skipping accounts for the step as an explicit skip — Next unlocks.
      if (!guideSkipped) stepCaptured.add(guideStep)
      nextStep()
    }

    // Re-render the guide when category changes (called from the selector)
    function switchCategory(cat) {
      activeCategory = cat
      guideStep = 0
      guideSkipped = false
      stepCaptured = new Set()
      const panel = modal.querySelector('#cl-guide-panel')
      if (panel) panel.style.display = ''
      updateGuideStep(0)
    }

    function hideGuide() {
      guideSkipped = true
      const panel = modal.querySelector('#cl-guide-panel')
      if (panel) panel.style.display = 'none'
    }
    let audioContext = null
    let mediaRecorder = null
    let audioChunks = []
    let torchTrack = null

    const videoEl = modal.querySelector('#cl-cam-video')
    const infoEl = modal.querySelector('#cl-cam-info')

    // Resolution tiers — request 4K if supported, else 1080p.
    // Note: most phones won't deliver native 4K but will saturate to their max.
    const RES = {
      '4k':   { w: 3840, h: 2160, fps: 30 },
      '1080': { w: 1920, h: 1080, fps: 60 },
      '720':  { w: 1280, h: 720,  fps: 60 },
    }

    async function startStream() {
      if (stream) stream.getTracks().forEach(t => t.stop())
      const r = RES[resolution]
      const c = {
        audio: micOn ? {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2,
        } : false,
        video: {
          facingMode,
          width: { ideal: r.w },
          height: { ideal: r.h },
          frameRate: { ideal: r.fps },
        },
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia(c)
        videoEl.srcObject = stream
        const track = stream.getVideoTracks()[0]
        torchTrack = track
        const s = track.getSettings()
        infoEl.textContent = `${s.width || r.w}x${s.height || r.h} · ${s.frameRate || r.fps}fps · ${facingMode === 'environment' ? 'REAR' : 'FRONT'}`
        // Detect desktop/laptop webcam: a track label that isn't "back/rear" on a
        // non-mobile UA means we got a forward webcam, not a rear macro camera.
        const lbl = (track.label || '').toLowerCase()
        if (!/mobile|phone|iphone|android/i.test(navigator.userAgent)) {
          isDesktopCam = !/back|rear/i.test(lbl)
        }
        // Re-render the guide now that we know if this is a laptop webcam
        // (so the desktop macro warning shows on macro steps)
        if (!guideSkipped) updateGuideStep(guideStep)
        if (macroOn) await toggleMacro(true)

        if (micOn) startMicCapture(stream)

        // Live readiness checks + READY shutter ring
        startLiveQA()
      } catch (err) {
        toast('Camera access denied: ' + (err.message || err), 'error')
        cleanup()
      }
    }

    async function toggleMacro(forceOn) {
      const on = forceOn !== undefined ? forceOn : !macroOn
      macroOn = on
      const btn = modal.querySelector('#cl-macro-btn')
      btn.classList.toggle('border-gold', on)
      btn.classList.toggle('text-gold', on)
      btn.classList.toggle('bg-gold/10', on)
      const track = stream?.getVideoTracks()[0]
      if (!track) return
      const caps = track.getCapabilities ? track.getCapabilities() : {}
      if (caps.zoom && caps.zoom.max > 1) {
        try {
          const zoom = on ? Math.min(4, caps.zoom.max) : 1
          await track.applyConstraints({ advanced: [{ zoom }] })
          infoEl.textContent = (infoEl.textContent || '') + ' · MACRO'
        } catch { /* some devices don't expose zoom */ }
      } else if (on) {
        toast('This device does not support optical zoom — move closer', 'info')
        macroOn = false
        btn.classList.remove('border-gold', 'text-gold', 'bg-gold/10')
      }
    }

    function startMicCapture(stream) {
      const audioTracks = stream.getAudioTracks()
      if (!audioTracks.length) return
      const panel = modal.querySelector('#cl-mic-panel')
      const meter = modal.querySelector('#cl-mic-meter')
      const canvas = modal.querySelector('#cl-mic-wave')
      const ctx = canvas.getContext('2d')
      panel.classList.remove('hidden')

      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      const data = new Uint8Array(analyser.fftSize)

      audioChunks = []
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mime,
          audioBitsPerSecond: 256_000,
        })
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data) }
        mediaRecorder.start(1000)
      } catch (e) {
        console.warn('MediaRecorder not available', e)
      }

      function tick() {
        if (!audioContext) return
        analyser.getByteTimeDomainData(data)
        let peak = 0
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128))
        const db = peak > 0 ? Math.round(20 * Math.log10(peak / 128)) : -Infinity
        meter.textContent = isFinite(db) ? `${db} dB` : '−∞ dB'

        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        ctx.fillStyle = 'rgba(0,0,0,0.4)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.lineWidth = 1.5
        ctx.strokeStyle = '#fb7185'
        ctx.beginPath()
        const slice = canvas.width / data.length
        let x = 0
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0
          const y = (v * canvas.height) / 2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
          x += slice
        }
        ctx.stroke()
        requestAnimationFrame(tick)
      }
      tick()
    }

    function stopMicCapture() {
      if (audioContext) { audioContext.close(); audioContext = null }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
      const panel = modal.querySelector('#cl-mic-panel')
      if (panel) panel.classList.add('hidden')
    }

    async function snap() {
      // Prefer ImageCapture API for uncompressed stills (Chrome/Edge)
      let dataUrl = null
      const track = stream?.getVideoTracks()[0]
      if (track && typeof ImageCapture !== 'undefined') {
        try {
          const ic = new ImageCapture(track)
          // Try photo first (RAW), then thumbnailRamp fallback
          let blob = null
          try {
            blob = await ic.takePhoto({ imageWidth: track.getSettings().width, imageHeight: track.getSettings().height })
          } catch {
            try { blob = await ic.takePhoto() } catch { blob = null }
          }
          if (blob) dataUrl = await blobToDataURL(blob, 'image/jpeg', 0.96)
        } catch (e) { /* fall through to canvas */ }
      }
      if (!dataUrl) {
        // Canvas fallback — but use FACE_DETECTION-style high-quality
        const canvas = document.createElement('canvas')
        canvas.width = videoEl.videoWidth
        canvas.height = videoEl.videoHeight
        canvas.getContext('2d').drawImage(videoEl, 0, 0)
        dataUrl = canvas.toDataURL('image/jpeg', 0.96)
      }
      dataUrl = await compressImage(dataUrl);

      // ── Shot-quality check (NO silent rejection) ─────────────────────────
      // IMPORTANT (UX fix): even if a frame scores below the sharpness floor,
      // we SAVE it and give the user the normal photo-was-taken feedback (thumb
      // rail + progress count). We only surface an amber "retake recommended"
      // hint on top. Silently dropping the frame left users thinking "the photo
      // wasn't taken" — a dark/glossy luxury item on a handheld phone will often
      // dip below floor 8, and dropping it with no visual state change reads as
      // "app is glitchy". Saving + hinting = the user can review the thumbnail
      // and retake if they want, or keep it. The retake hint (not a hard gate)
      // keeps accuracy honest without surprising the user on a non-blurry shot.
      const sharpness = await measureSharpness(dataUrl)
      let blurryHint = false
      if (typeof sharpness === 'number' && sharpness < SHARPNESS_FLOOR) {
        blurryHint = true
      }

      // Associate this capture with the current guided step (so thumbnails and
      // tier weighting line up), then mark it captured → unlocks Next.
      const stepIdx = guideSkipped ? images.length : guideStep
      images[stepIdx] = { data: dataUrl, name: `cam-${resolution}-${Date.now()}.jpg` }
      if (!guideSkipped) {
        images[stepIdx].tier = (currentGuide()[stepIdx] || {}).tier || 'standard'
        markStepCaptured(stepIdx)
      }

      // Explicit, always-visible capture confirmation + retake hint when soft.
      if (blurryHint) {
        toast('Photo saved — a bit soft. Tap the thumbnail to retake if you want a sharper shot.', 'warning')
      } else {
        toast(`✓ ${guideSkipped ? 'Photo' : (currentGuide()[stepIdx]?.shot || 'Step')} captured`, 'success')
      }

      // Advance guided capture step — now works with any sequence length
      // NOTE: we do NOT auto-advance here. The step shows ✓ + thumbnail and
      // the "Next →" button unlocks; the user taps it to move on (friendlier
      // flow). "Skip shot" advances without a capture.
      if (burstOn) {
        // Capture 2 more frames at 250ms intervals and pick the most-detailed one
        const candidates = [dataUrl]
        for (let i = 0; i < 2; i++) {
          await new Promise(r => setTimeout(r, 250))
          try {
            const c = document.createElement('canvas')
            c.width = videoEl.videoWidth; c.height = videoEl.videoHeight
            c.getContext('2d').drawImage(videoEl, 0, 0)
            candidates.push(c.toDataURL('image/jpeg', 0.96))
          } catch {}
        }
        let best = dataUrl, bestScore = -1
        for (const c of candidates) {
          const score = await measureSharpness(c)
          if (score > bestScore) { bestScore = score; best = c }
        }
        // Replace the just-captured slot with the burst best (keep step slot intact)
        images[stepIdx] = { ...images[stepIdx], data: best, name: `cam-burst-${Date.now()}.jpg` }
      }

      renderPreviews()

      // Update the shot counter in the guide panel (filled captures only)
      const shotCountEl = modal.querySelector('#cl-shot-count')
      if (shotCountEl) shotCountEl.textContent = `${images.filter(Boolean).length} captured`

      toast('Captured', 'success')
    }

    function blobToDataURL(blob, type, quality) {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        if (type === 'image/jpeg') {
          // Use canvas for quality control if quality < 1
          if (quality >= 1) {
            reader.readAsDataURL(blob)
          } else {
            const fr = new FileReader()
            fr.onload = () => {
              const img = new Image()
              img.onload = () => {
                const c = document.createElement('canvas')
                c.width = img.width; c.height = img.height
                c.getContext('2d').drawImage(img, 0, 0)
                resolve(c.toDataURL(type, quality))
              }
              img.src = fr.result
            }
            fr.readAsDataURL(blob)
          }
        } else {
          reader.readAsDataURL(blob)
        }
      })
    }

    let sharpnessWorker = null
    try {
      if (typeof Worker !== 'undefined') {
        sharpnessWorker = new Worker('/static/sharpness-worker.js')
      }
    } catch { /* Fallback to main thread */ }

    function measureSharpness(dataUrl) {
      return new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = 256
          const ratio = img.height / img.width
          c.height = Math.round(256 * ratio)
          const ctx = c.getContext('2d')
          ctx.drawImage(img, 0, 0, c.width, c.height)
          const imgData = ctx.getImageData(0, 0, c.width, c.height)

          if (sharpnessWorker) {
            const reqId = Date.now() + Math.random()
            const handler = (e) => {
              if (e.data && e.data.id === reqId) {
                sharpnessWorker.removeEventListener('message', handler)
                resolve(e.data.sharpness)
              }
            }
            sharpnessWorker.addEventListener('message', handler)
            sharpnessWorker.postMessage({ imageData: imgData, width: c.width, height: c.height, id: reqId })
            return
          }

          // Fallback: In-thread Laplacian edge energy computation
          const data = imgData.data
          let energy = 0
          let count = 0
          for (let y = 1; y < c.height - 1; y++) {
            for (let x = 1; x < c.width - 1; x++) {
              const i = (y * c.width + x) * 4
              const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
              const lumRight = 0.299 * data[i+4] + 0.587 * data[i+5] + 0.114 * data[i+6]
              const lumDown = 0.299 * data[i + c.width * 4] + 0.587 * data[i + c.width * 4 + 1] + 0.114 * data[i + c.width * 4 + 2]
              energy += Math.abs(lum - lumRight) + Math.abs(lum - lumDown)
              count++
            }
          }
          resolve(Math.round((energy / count) * 10) / 10)
        }
        img.src = dataUrl
      })
    }

    async function toggleTorch() {
      if (!torchTrack) return
      const caps = torchTrack.getCapabilities ? torchTrack.getCapabilities() : {}
      if (!caps.torch) { toast('Torch not supported on this device', 'info'); return }
      try {
        const settings = torchTrack.getSettings()
        await torchTrack.applyConstraints({ advanced: [{ torch: !settings.torch }] })
      } catch (e) { toast('Torch toggle failed', 'error') }
    }

    // ── LIVE quality monitor ────────────────────────────────────────────
    // Samples the live feed ~2x/sec and drives the readiness checklist +
    // the READY ring on the shutter so users know the shot is good BEFORE
    // they press. Checks: brightness (too dark/blown), steadiness (frame
    // delta), and subject presence (center-region contrast).
    let liveQaTimer = null
    let prevSample = null
    let lastReadyAt = 0

    function setCheck(id, state, hint) {
      const el = modal.querySelector(id)
      if (!el) return
      // state: 'good' | 'warn' | null (idle)
      el.className = `flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border transition-all ${
        state === 'good' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : state === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        : 'bg-white/5 border-white/10 text-white/40'}`
      el.title = hint || ''
    }

    function setShutterReady(ready) {
      const btn = modal.querySelector('#cl-cam-snap')
      const ring = modal.querySelector('#cl-ready-ring')
      if (!btn) return
      if (ready) {
        btn.classList.add('shadow-[0_0_40px_rgba(16,185,129,0.7)]')
        btn.style.borderColor = '#10b981'
        if (ring) ring.classList.remove('hidden')
        // AUTO auto-capture: snap once when the live-QA gate passes AND the current
        // guided step is not already captured (the flow doesn't auto-advance, so this
        // prevents re-snapping a finished step). Reset each time READY drops.
        const curStepOk = guideSkipped || !stepCaptured.has(guideStep)
        if (autoCaptureOn && !autoFired && curStepOk) {
          autoFired = true
          setTimeout(() => { autoFired = false; if (autoCaptureOn) snap() }, 350)
        }
      } else {
        btn.classList.remove('shadow-[0_0_40px_rgba(16,185,129,0.7)]')
        btn.style.borderColor = ''
        if (ring) ring.classList.add('hidden')
        autoFired = false
      }
    }

    function startLiveQA() {
      stopLiveQA()
      const cvs = document.createElement('canvas')
      cvs.width = 64; cvs.height = 48  // tiny — cheap
      const ctx = cvs.getContext('2d', { willReadFrequently: true })
      const RETICLE = { x0: 0.35, x1: 0.65, y0: 0.30, y1: 0.70 }  // center zone

      liveQaTimer = setInterval(() => {
        if (!stream || videoEl.readyState < 2) return
        try { ctx.drawImage(videoEl, 0, 0, cvs.width, cvs.height) } catch { return }
        const d = ctx.getImageData(0, 0, cvs.width, cvs.height).data

        // 1. Brightness (average luma)
        let sum = 0
        for (let i = 0; i < d.length; i += 4) {
          sum += 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]
        }
        const avgLuma = sum / (d.length / 4)
        const lightOk = avgLuma > 45 && avgLuma < 215
        const lightWarn = !lightOk
        setCheck('#cl-check-light', lightOk ? 'good' : 'warn',
          lightOk ? 'Good lighting' : (avgLuma <= 45 ? 'Too dark — add light or use torch' : 'Too bright — avoid direct glare'))
        // Reference "Reduce glare" advisory: amber when too bright (glare risk),
        // green when lighting is in the sweet spot for the watch face.
        const glareRisk = avgLuma >= 215
        setCheck('#cl-check-glare', glareRisk ? 'warn' : 'good',
          glareRisk ? 'Reduce glare' : 'No glare detected')

        // 2. Steadiness (mean abs diff vs previous frame)
        let steadyOk = false
        if (prevSample) {
          let diff = 0, n = 0
          for (let i = 0; i < d.length; i += 16) {
            diff += Math.abs(d[i] - prevSample[i]); n++
          }
          const md = diff / n
          steadyOk = md < 12   // small inter-frame motion = held steady
          setCheck('#cl-check-steady', steadyOk ? 'good' : 'warn',
            steadyOk ? 'Camera steady' : 'Hold still — phone is moving')
        } else {
          setCheck('#cl-check-steady', null)
        }
        prevSample = new Uint8Array(d)

        // 3. Fill frame — contrast inside the center reticle zone
        let cMin = 255, cMax = 0
        for (let y = Math.floor(cvs.height*RETICLE.y0); y < cvs.height*RETICLE.y1; y++) {
          for (let x = Math.floor(cvs.width*RETICLE.x0); x < cvs.width*RETICLE.x1; x++) {
            const i = (y*cvs.width + x)*4
            const l = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]
            if (l < cMin) cMin = l
            if (l > cMax) cMax = l
          }
        }
        const contrast = cMax - cMin
        const frameOk = contrast > 28   // a subject in the reticle gives local contrast
        setCheck('#cl-check-frame', frameOk ? 'good' : 'warn',
          frameOk ? 'Subject in reticle' : 'Center the subject inside the golden circle')

        // READY = all three good (steady needs a prior frame)
        const ready = lightOk && steadyOk && frameOk
        setShutterReady(ready)
        if (ready) lastReadyAt = Date.now()
      }, 500)
    }

    function stopLiveQA() {
      if (liveQaTimer) { clearInterval(liveQaTimer); liveQaTimer = null }
      prevSample = null
      setShutterReady(false)
    }

    function cleanup() {
      stopLiveQA()
      try { if (stream) stream.getTracks().forEach(t => t.stop()) } catch {}
      try { if (audioContext) audioContext.close() } catch {}
      try { if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop() } catch {}
      modal.remove()
    }

    // ── Wire controls ───────────────────────────────────────────────────
    modal.querySelectorAll('.cl-res-btn').forEach(b => {
      b.addEventListener('click', () => {
        modal.querySelectorAll('.cl-res-btn').forEach(x => {
          x.classList.remove('border-gold', 'text-gold', 'bg-gold/10')
        })
        b.classList.add('border-gold', 'text-gold', 'bg-gold/10')
        resolution = b.dataset.res
        startStream()
      })
    })

    modal.querySelector('#cl-macro-btn').addEventListener('click', () => toggleMacro())
    modal.querySelector('#cl-burst-btn').addEventListener('click', e => {
      burstOn = !burstOn
      e.currentTarget.classList.toggle('border-gold', burstOn)
      e.currentTarget.classList.toggle('text-gold', burstOn)
      e.currentTarget.classList.toggle('bg-gold/10', burstOn)
    })
    modal.querySelector('#cl-mic-btn').addEventListener('click', e => {
      micOn = !micOn
      e.currentTarget.classList.toggle('border-rose-300', micOn)
      e.currentTarget.classList.toggle('text-rose-300', micOn)
      e.currentTarget.classList.toggle('bg-rose-500/10', micOn)
      startStream() // need to re-acquire with audio
    })
    // Retake: jump back to the current step and clear its captured state so the
    // user can reframe (mirrors the thumb-rail retake, exposed as a labeled button).
    modal.querySelector('#cl-cam-retake').addEventListener('click', () => {
      const curIdx = guideSkipped ? Math.max(0, images.length - 1) : guideStep
      const realIdx = curIdx
      if (stepCaptured.has(realIdx)) {
        stepCaptured.delete(realIdx)                 // re-opens that step as not-yet-acquired
        if (images[realIdx]) delete images[realIdx]  // drop the old photo too
        if (realIdx !== guideStep) updateGuideStep(realIdx)
        renderThumbRail()
        toast('Retaking this shot — line it back up.', 'info')
      } else {
        toast('Capture this shot first to retake it.', 'info')
      }
    })
    // AUTO auto-capture: when ON, snap the moment the shot is READY.
    let autoCaptureOn = false
    let autoFired = false
    const autoBtn = modal.querySelector('#cl-cam-auto')
    autoBtn.addEventListener('click', () => {
      autoCaptureOn = !autoCaptureOn
      autoFired = false
      autoBtn.className = `w-10 h-10 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all ${
        autoCaptureOn ? 'bg-gold border-gold text-black shadow-[0_0_15px_rgba(138,28,44,0.4)]' : 'bg-white/5 border-white/10 text-white/40'
      }`
      toast(autoCaptureOn ? 'Auto-capture ON — snaps when ready' : 'Auto-capture OFF', autoCaptureOn ? 'success' : 'info')
    })
    modal.querySelector('#cl-cam-snap').addEventListener('click', snap)
    modal.querySelector('#cl-cam-close').addEventListener('click', cleanup)
    modal.querySelector('#cl-guide-skip').addEventListener('click', hideGuide)

    // ── Friendly step flow wiring ──────────────────────────────────────
    // Big "Take Picture" CTA, Next (unlocks on capture/skip), Skip shot.
    const megaSnap = modal.querySelector('#cl-mega-snap')
    if (megaSnap) megaSnap.addEventListener('click', snap)
    const useSaved = modal.querySelector('#cl-use-saved')
    if (useSaved) {
      useSaved.addEventListener('click', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        const picker = document.createElement('input')
        picker.type = 'file'
        picker.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*'
        picker.onchange = async () => {
          const file = picker.files && picker.files[0]
          if (!file) return
          try {
            const dataUrl = await new Promise((resolve, reject) => {
              const r = new FileReader()
              r.onload = () => resolve(r.result)
              r.onerror = () => reject(new Error('read failed'))
              r.readAsDataURL(file)
            })
            const compressed = await compressImage(dataUrl)
            const stepIdx = guideSkipped ? images.filter(Boolean).length : guideStep
            images[stepIdx] = {
              data: compressed,
              name: file.name || `library-${Date.now()}.jpg`,
              tier: (currentGuide()[stepIdx] || {}).tier || 'standard',
              source: 'library',
            }
            if (!guideSkipped) markStepCaptured(stepIdx)
            renderPreviews()
            toast(`✓ Saved photo used for ${currentGuide()[stepIdx]?.shot || 'this step'}`, 'success')
          } catch {
            toast('Could not open that photo. Try JPG or PNG.', 'error')
          }
        }
        picker.click()
      })
    }
    const nextBtn = modal.querySelector('#cl-guide-next')
    if (nextBtn) nextBtn.addEventListener('click', nextStep)
    const skipShot = modal.querySelector('#cl-guide-skip-step')
    if (skipShot) skipShot.addEventListener('click', skipStep)
    // Analyze Now — jump straight from camera to analysis, no need to close
    // the camera and hunt for the button on the page (iPhone + Android alike).
    const analyzeNowBtn = modal.querySelector('#cl-analyze-now-btn')
    if (analyzeNowBtn) {
      analyzeNowBtn.addEventListener('click', async () => {
        cleanup()               // close the camera modal first
        await runAnalyze()      // then run the shared analyze flow
      })
    }
    // toggle the "Capture details" checklist visibility
    const detailsToggle = modal.querySelector('#cl-details-toggle')
    const detailsBox = modal.querySelector('#cl-step-details')
    if (detailsToggle && detailsBox) {
      detailsToggle.addEventListener('click', () => {
        const open = detailsBox.classList.toggle('hidden')
        detailsToggle.querySelector('.fa-chevron-down').style.transform = open ? '' : 'rotate(180deg)'
      })
    }
    // tapping the framed step chip jumps to that step
    // (handled inside updateGuideStep via dotsContainer delegation)

    // Tap the collapsed example chip on mobile to expand/collapse it
    const exCard = modal.querySelector('#cl-example-card')
    if (exCard) {
      exCard.addEventListener('click', () => exCard.classList.toggle('cl-example-open'))
    }

    // ── Category selector wiring ───────────────────────────────────────
    modal.querySelectorAll('.cl-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active styling
        modal.querySelectorAll('.cl-cat-btn').forEach(b => {
          b.className = 'cl-cat-btn px-2.5 py-1 rounded text-[11px] font-medium border border-white/15 text-white/50 hover:text-gold hover:border-gold/40 transition-all'
        })
        btn.className = 'cl-cat-btn px-2.5 py-1 rounded text-[11px] font-medium border border-gold/40 bg-gold/10 text-gold transition-all'
        switchCategory(btn.dataset.cat)
      })
    })

    // Initialize the guide with the default category's steps + dot indicators
    updateGuideStep(0)

    // Set default resolution visible
    const defaultRes = modal.querySelector(`[data-res="${resolution}"]`)
    if (defaultRes) defaultRes.classList.add('border-gold', 'text-gold', 'bg-gold/10')

    await startStream()
  }

  // ── Analyze Button (uses /api/valuation/analyze) ──────────────────────────

  // ── Credit banner: fetch remaining auth credits + refresh after posting ──
  async function refreshCredits() {
    try {
      const res = await api('/api/credits/balance')
      const banner = $id('credits-banner')
      const text = $id('credits-balance-text')
      if (banner && text) {
        const c = res?.credits
        banner.classList.remove('hidden')
        text.textContent = (typeof c === 'number') ? `${c} ${c === 1 ? 'credit' : 'credits'} left` : '—'
        text.style.color = (typeof c === 'number' && c <= 5) ? '#f59e0b' : ''
      }
    } catch { /* unauthenticated or banner absent — stay hidden */ }
  }
  refreshCredits()

  // ── Analyze logic (shared: page button + in-camera "Analyze Now" button) ──
  async function runAnalyze() {
    if (images.filter(Boolean).length === 0 && !descriptionInput?.value.trim()) {
      toast('Take a photo or describe the item first', 'warning');
      return;
    }

    const filledImages = images.filter(Boolean)          // drop undefined holes
    const hasMacro = filledImages.some(i => i.tier === 'macro')
    const hasHero = filledImages.some(i => i.tier === 'hero')
    if (filledImages.length && (!hasHero || !hasMacro)) {
      toast('For a real verdict capture the hero and a readable serial/macro. This run will stay review-only.', 'warning')
    }
    if (filledImages.length > 0) {
      const confirmed = await showAnalyzeConfirmation(filledImages.length, descriptionInput?.value?.trim());
      if (!confirmed) return;
    }

    if (analyzeBtn) analyzeBtn.disabled = true;
    if (analyzeSpinner) show(analyzeSpinner);
    if (resultsEmpty) hide(resultsEmpty);
    if (resultsContent) hide(resultsContent);

    try {
      const payload = {
        images: filledImages.map(i => i.data),
        shotTiers: filledImages.map(i => i.tier || 'standard'), // accuracy weight
        description: descriptionInput?.value.trim() || undefined,
        transcript: window._voiceTranscript || undefined,
        category: activeCategory || undefined, // user-selected category → server uses it to constrain RAG + enforce category-consistency (fixes handbag→watch cross-category mismatch)
      };
      // Stash the shot tiers so the Assessment card can honestly report whether a
      // macro/serial/hero shot was captured (the server weights but doesn't echo).
      window._lastShotTiers = payload.shotTiers || [];

      const res = await api('/api/valuation/analyze', {
        method: 'POST',
        data: payload,
      });

      let data = res;
      if (res.result) data = res.result;

      renderValuationResult(data, res);
      window._voiceTranscript = null;
      toast(data.authenticityStatus === 'AUTHENTIC MATCH' ? 'Authenticated and stored' : (data.stored ? 'Stored for review' : 'Analysis complete — review required'), data.authenticityStatus === 'AUTHENTIC MATCH' ? 'success' : 'warning');
      // scroll the review panel into view (especially useful right after closing camera)
      resultsContent?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      toast(err.response?.data?.error || 'Analysis failed', 'error');
    } finally {
      if (analyzeBtn) analyzeBtn.disabled = false;
      if (analyzeSpinner) hide(analyzeSpinner);
    }
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', runAnalyze);
  }

  // ── Render valuation result ──────────────────────────────────────────────
  function renderValuationResult(data, meta) {
    if (resultsEmpty) hide(resultsEmpty);
    if (resultsContent) show(resultsContent);

    const header = $id('result-header');
    if (header) {
      header.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-xl font-serif font-bold text-white">${esc(data.brand) || 'Unknown'} ${esc(data.model)}</h3>
            <p class="text-white/40 text-sm mt-0.5">
              ${esc(data.category) || '\u2014'} ${data.referenceNumber ? '\u00b7 Ref: ' + esc(data.referenceNumber) : ''}
              ${data.year ? '\u00b7 ' + esc(data.year) : ''}
            </p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
            data.authenticityStatus === 'AUTHENTIC MATCH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            data.authenticityStatus === 'REVIEW_REQUIRED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            data.authenticityStatus === 'REQUIRES IN-PERSON VERIFICATION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }">${data.authenticityStatus || 'PENDING'}</span>
        </div>
      `;
    }

    // ── ASSESSMENT RESULT card (mimics the reference "Assessment Result" screen:
    //    Verdict + confidence + summary + evidence checklist + disclaimer) ──
    // Built from REAL analysis data — never fabricated.
    const assessHost = $id('result-header').parentElement;
    if (assessHost && !$id('cl-assessment-card')) {
      const verdict = data.authenticityStatus === 'AUTHENTIC MATCH' ? 'Likely Authentic'
        : (data.authenticityStatus === 'REVIEW_REQUIRED' || data.authenticityStatus === 'REQUIRES IN-PERSON VERIFICATION') ? 'Review Required'
        : data.authenticityStatus || 'Pending Review';
      const verdictTone = data.authenticityStatus === 'AUTHENTIC MATCH' ? 'text-gold' : 'text-amber-400';
      const verdictIcon = data.authenticityStatus === 'AUTHENTIC MATCH' ? 'fa-shield-halved' : 'fa-circle-question';

      // Evidence checklist from the per-component confidence breakdown.
      const cb = data.confidence_breakdown || {};
      const FLOOR = 70; // matches the confidence store gate — honest threshold
      const evidence = [
        { label: 'Dial characteristics consistent', score: cb.dial_texture },
        { label: 'Case / proportions consistent',    score: cb.overall_proportion ?? cb.bezel_geometry },
        { label: 'Logo & engraving format consistent', score: cb.logo },
        { label: 'Materials consistent',              score: cb.materials },
      ].filter(e => e.score !== undefined);
      // Move not inspected: honesty rule — AUTHENTIC with no macro/serial shot is softened
      const hasOCR = data.ocr_serials && data.ocr_serials.length;
      const st = data.shotTiers || window._lastShotTiers || [];
      const hasMacro = Array.isArray(st) && (st.includes('macro') || st.includes('hero'));

      const assessment = document.createElement('div');
      assessment.id = 'cl-assessment-card';
      assessment.className = 'mb-4 space-y-3';
      assessment.innerHTML = `
        <!-- Verdict card -->
        <div class="rounded-2xl border border-gold/25 bg-zinc-900/70 p-4 text-center">
          <div class="flex items-center justify-center gap-2 text-gold">
            <i class="fas ${verdictIcon} text-lg"></i>
            <span class="text-2xl font-bold ${verdictTone}" style="font-family: Georgia, 'Times New Roman', serif;">${esc(verdict)}</span>
          </div>
          <div class="text-[10px] font-mono tracking-[0.3em] text-white/40 mt-1 uppercase">Our Assessment</div>
        </div>

        <!-- Confidence block -->
        <div class="rounded-2xl bg-surface border border-gold/15 p-4 flex items-center gap-4">
          <div class="text-center shrink-0">
            <div class="text-4xl font-bold text-gold font-mono">${data.confidence ?? '—'}%</div>
            <div class="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase mt-0.5">Confidence</div>
          </div>
          <div class="flex-1 text-[12px] leading-relaxed text-white/60">${esc(data.reasoning || 'Based on our visual analysis.')}</div>
        </div>

        <!-- Summary -->
        <div class="rounded-2xl bg-surface border border-gold/15 p-4">
          <div class="text-[10px] font-mono tracking-[0.25em] text-gold/60 uppercase mb-2">Summary</div>
          <div class="space-y-1.5 text-sm">
            <div class="flex items-center gap-2"><i class="fas fa-tag text-gold/70 w-4"></i><span class="text-white/80">${esc(data.brand || 'Unknown')} ${esc(data.model || '')}</span></div>
            <div class="flex items-center gap-2"><i class="fas fa-boxes-stacked text-gold/70 w-4"></i><span class="text-white/80">${esc(data.category || '—')}${data.referenceNumber ? ' · Ref ' + esc(data.referenceNumber) : ''}</span></div>
            ${data.movement ? `<div class="flex items-center gap-2"><i class="fas fa-gear text-gold/70 w-4"></i><span class="text-white/80">${esc(data.movement)}</span></div>` : ''}
            ${data.case_material ? `<div class="flex items-center gap-2"><i class="fas fa-circle text-gold/70 w-4"></i><span class="text-white/80">${esc(data.case_material)}</span></div>` : ''}
          </div>
        </div>

        <!-- Evidence checklist -->
        <div class="rounded-2xl bg-surface border border-gold/15 p-4">
          <div class="text-[10px] font-mono tracking-[0.25em] text-gold/60 uppercase mb-2">Evidence Checklist</div>
          <div class="space-y-2">
            ${evidence.map(e => {
              const pass = typeof e.score === 'number' && e.score >= FLOOR;
              return `
                <div class="flex items-center gap-3">
                  ${pass
                    ? '<span class="w-5 h-5 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center"><i class="fas fa-check text-[9px] text-emerald-400"></i></span>'
                    : '<span class="w-5 h-5 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/50 flex items-center justify-center"><i class="fas fa-exclamation text-[9px] text-amber-400"></i></span>'}
                  <span class="text-[12px] ${pass ? 'text-white/85' : 'text-amber-300/90'}">${esc(e.label)}</span>
                  ${typeof e.score === 'number' ? `<span class="ml-auto text-[10px] font-mono ${pass ? 'text-white/30' : 'text-amber-400/80'}">${Math.round(e.score)}%</span>` : ''}
                </div>`;
            }).join('')}
            ${(!hasOCR && !hasMacro)
              ? `<div class="flex items-center gap-3">
                  <span class="w-5 h-5 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/50 flex items-center justify-center"><i class="fas fa-exclamation text-[9px] text-amber-400"></i></span>
                  <span class="text-[12px] text-amber-300/90">Movement / serial not inspected</span>
                </div>`
              : `<div class="flex items-center gap-3">
                  <span class="w-5 h-5 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center"><i class="fas fa-check text-[9px] text-emerald-400"></i></span>
                  <span class="text-[12px] text-white/85">Macro / serial evidence captured</span>
                </div>`}
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="flex items-start gap-2 text-[11px] text-white/40 leading-relaxed px-1">
          <i class="fas fa-circle-info text-gold/60 mt-0.5"></i>
          <span>This assessment is based on guided image capture and visual analysis.</span>
        </div>

        <!-- Actions: View Full Report + Start New Authentication -->
        <div class="space-y-2 pt-1">
          <button id="cl-assess-report" type="button" class="w-full bg-gold hover:bg-gold-light text-black font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(138,28,44,0.2)]">
            <i class="fas fa-file-lines"></i> View Full Report <i class="fas fa-chevron-right text-xs"></i>
          </button>
          <button id="cl-assess-new" type="button" class="w-full border border-gold/40 hover:border-gold/70 text-gold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
            <i class="fas fa-rotate-right"></i> Start New Authentication
          </button>
        </div>
      `;
      // Insert at the top of the results panel (before the old header/metre layout)
      resultsContent.insertBefore(assessment, resultsContent.firstChild);

      // Wire actions
      const reportBtn = assessment.querySelector('#cl-assess-report');
      if (reportBtn) reportBtn.addEventListener('click', () => {
        if (data.item && data.item.id) { toast('Opening full report…'); location.href = `/dossier/${data.item.id}`; }
        else toast('Full report available after you save the item.', 'info');
      });
      const newAuthBtn = assessment.querySelector('#cl-assess-new');
      if (newAuthBtn) newAuthBtn.addEventListener('click', () => {
        resultsEmpty && show(resultsEmpty);
        resultsContent && hide(resultsContent);
        if (descriptionInput) descriptionInput.value = '';
        images.length = 0; window._voiceTranscript = '';
        if (typeof previewsArea !== 'undefined' && previewsArea) previewsArea.innerHTML = '';
        toast('Ready for a new authentication.', 'success'); location.reload();
      });
    }

    const meters = $id('confidence-meters');
    if (meters) {
      const cb = data.confidence_breakdown || {};
      meters.innerHTML = [
        renderConfidenceBar('Logo & Branding', cb.logo),
        renderConfidenceBar('Serial Number', cb.serial),
        renderConfidenceBar('Materials', cb.materials),
        renderConfidenceBar('Bezel Geometry', cb.bezel_geometry),
        renderConfidenceBar('Dial Texture', cb.dial_texture),
        renderConfidenceBar('Overall Proportion', cb.overall_proportion),
      ].join('');

      if (data.confidence !== undefined) {
        meters.innerHTML += `
          <div class="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-3">
            <span class="text-xs text-white/60 w-28 text-right font-semibold">OVERALL</span>
            <div class="flex-1 h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div class="h-full rounded-full confidence-bar-fill ${data.confidence >= 70 ? 'bg-gold' : 'bg-amber-500'}" style="width:${Math.min(100, data.confidence)}%"></div>
            </div>
            <span class="text-sm font-bold font-mono ${data.confidence >= 70 ? 'text-gold' : 'text-amber-400'} w-8 text-right">${data.confidence}%</span>
          </div>
        `;
      }
    }

    const rv = $id('result-value');
    if (rv) {
      rv.textContent = fmtCurrency(data.estimatedValue);
      if (data.currency && data.currency !== 'USD') {
        rv.textContent += ` ${data.currency}`;
      }
    }

    const rr = $id('result-reasoning');
    if (rr) rr.textContent = data.reasoning || 'No reasoning provided.';

    // Condition block
    if (data.condition_label || data.condition_grade !== undefined) {
      const condDiv = document.createElement('div');
      condDiv.className = 'bg-surface rounded-lg p-3 mb-3';
      condDiv.innerHTML = `
        <div class="text-xs text-white/40 mb-1">CONDITION</div>
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold text-white">${data.condition_label || '\u2014'}</span>
          <span class="text-xs text-white/30">(Grade ${data.condition_grade ?? '\u2014'} / 4)</span>
        </div>
      `;
      const valParent = rv?.parentElement;
      if (valParent) valParent.after(condDiv);
    }

    // Red flags
    if (data.red_flags && data.red_flags.length > 0) {
      const rfDiv = document.createElement('div');
      rfDiv.className = 'bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-3';
      rfDiv.innerHTML = `
        <div class="text-xs text-red-400 mb-1 font-semibold"><i class="fas fa-triangle-exclamation mr-1"></i>RED FLAGS</div>
        <ul class="space-y-0.5">${data.red_flags.map(f => `<li class="text-xs text-red-300/70">\u00b7 ${f}</li>`).join('')}</ul>
      `;
      const valParent = rv?.parentElement;
      if (valParent) valParent.after(rfDiv);
    }

    // OCR data
    if (data.ocr_serials && data.ocr_serials.length > 0) {
      const ocrDiv = document.createElement('div');
      ocrDiv.className = 'bg-surface rounded-lg p-3 mb-3';
      ocrDiv.innerHTML = `
        <div class="text-xs text-white/40 mb-1"><i class="fas fa-barcode mr-1"></i>OCR</div>
        <div class="grid grid-cols-2 gap-1 text-xs">
          ${data.ocr_serials.length ? `<div><span class="text-white/30">Serials:</span> <span class="text-white font-mono">${data.ocr_serials.join(', ')}</span></div>` : ''}
          ${data.ocr_barcodes && data.ocr_barcodes.length ? `<div><span class="text-white/30">Barcodes:</span> <span class="text-white font-mono">${data.ocr_barcodes.join(', ')}</span></div>` : ''}
        </div>
      `;
      const valParent = rv?.parentElement;
      if (valParent) valParent.after(ocrDiv);
    }

    // ── Interactive Confirmation & Edit Panel ─────────────────────────
    let editSection = $id('result-edit-section');
    if (!editSection) {
      editSection = document.createElement('div');
      editSection.id = 'result-edit-section';
      resultsContent.appendChild(editSection);
    }

    editSection.className = 'mt-4 pt-4 border-t border-gold/20 space-y-3';
    editSection.innerHTML = `
      <div class="bg-gold/5 border border-gold/20 rounded-lg p-3 space-y-3">
        <div class="flex items-center justify-between text-xs text-gold font-mono font-bold tracking-wider uppercase">
          <span><i class="fas fa-user-check mr-1"></i> Step 3: Final Verification &amp; Confirmation</span>
          <button id="toggle-edit-fields-btn" type="button" class="text-white/40 hover:text-gold text-[10px]">
            <i class="fas fa-pen mr-1"></i> Edit Fields
          </button>
        </div>

        <div id="review-editable-fields" class="space-y-2 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[9px] text-white/30 uppercase block">Brand</label>
              <input id="rev-brand" value="${data.brand || ''}" class="w-full bg-surface border border-white/10 rounded px-2 py-1 text-white text-xs" />
            </div>
            <div>
              <label class="text-[9px] text-white/30 uppercase block">Model</label>
              <input id="rev-model" value="${data.model || ''}" class="w-full bg-surface border border-white/10 rounded px-2 py-1 text-white text-xs" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[9px] text-white/30 uppercase block">Reference Number</label>
              <input id="rev-ref" value="${data.referenceNumber || ''}" class="w-full bg-surface border border-white/10 rounded px-2 py-1 text-white text-xs font-mono" />
            </div>
            <div>
              <label class="text-[9px] text-white/30 uppercase block">Market Value (USD)</label>
              <input id="rev-value" type="number" value="${data.estimatedValue || 0}" class="w-full bg-surface border border-white/10 rounded px-2 py-1 text-gold text-xs font-mono font-bold" />
            </div>
          </div>
        </div>

        <!-- Action Control Buttons -->
        <div class="pt-2 grid grid-cols-2 gap-2">
          <button id="rev-back-btn" type="button" class="border border-white/20 hover:border-gold/50 text-white/70 hover:text-gold py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5">
            <i class="fas fa-arrow-left"></i> Back / Retake
          </button>
          <button id="rev-save-btn" type="button" class="bg-gold hover:bg-gold-light text-black font-bold py-2 rounded text-xs transition-all shadow-[0_0_15px_rgba(138,28,44,0.2)] flex items-center justify-center gap-1.5">
            <i class="fas fa-check-double"></i> Confirm &amp; Save
          </button>
        </div>
      </div>
    `;

    // Wire Back / Retake button
    const backBtn = editSection.querySelector('#rev-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (resultsContent) hide(resultsContent);
        if (resultsEmpty) show(resultsEmpty);
        toast('Returned to capture step. You can retake photos or edit description.', 'info');
      });
    }

    // Wire Save & Confirm button
    const saveBtn = editSection.querySelector('#rev-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const updated = {
          brand: $id('rev-brand')?.value || data.brand,
          model: $id('rev-model')?.value || data.model,
          reference_number: $id('rev-ref')?.value || data.referenceNumber,
          estimated_value: parseFloat($id('rev-value')?.value || data.estimatedValue || 0),
          category: data.category || 'Watches',
          condition_grade: data.condition_grade || 3,
          condition_label: data.condition_label || 'Good',
          status: 'active'
        };
        try {
          const storedRes = await api('/api/inventory', { method: 'POST', data: updated });

          // Consume one authentication credit + log to capped posted history.
          // Non-blocking: if the user is unauthenticated or out of credits, we
          // still show the result but report the credit status honestly.
          let creditMsg = '';
          try {
            const cred = await api('/api/credits/post', {
              method: 'POST',
              data: {
                inventory_id: storedRes.id || null,
                category: updated.category,
                brand: updated.brand,
                model: updated.model,
                referenceNumber: updated.reference_number,
                estimatedValue: updated.estimated_value,
                condition_label: updated.condition_label,
                confidence: data.confidence || 0,
                authenticityStatus: data.authenticityStatus || 'PENDING',
                source: data.source || 'ai'
              }
            });
            creditMsg = ` · ${cred.credits} credit${cred.credits === 1 ? '' : 's'} left`;
          } catch (cerr) {
            const creditErr = cerr?.response?.data?.error || cerr?.message || '';
            if (creditErr.includes('NO_CREDITS')) {
              creditMsg = ' · ⚠️ out of credits';
            } else {
              creditMsg = ' · (credits unavailable)';
            }
          }

          toast(`Valuation confirmed & stored${creditMsg}`, 'success');
          refreshCredits()  // update the live balance banner
          if (storedRes.id) {
            window.location.href = '/dossier/' + storedRes.id;
          }
        } catch (err) {
          toast('Failed to save confirmation: ' + (err.message || err), 'error');
        }
      });
    }

    // Pipeline metadata
    if (meta && resultsContent) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-2 text-xs text-white/20';
      const parts = [];
      if (meta.pipeline_ms) parts.push(`<span><i class="fas fa-bolt mr-1"></i>${meta.pipeline_ms}ms</span>`);
      if (meta.images_processed) parts.push(`<span><i class="fas fa-image mr-1"></i>${meta.images_processed} images</span>`);
      if (meta.ocr_images_processed) parts.push(`<span><i class="fas fa-barcode mr-1"></i>${meta.ocr_images_processed} OCR</span>`);
      if (meta.has_voice || meta.source === 'gemini_manual') parts.push(`<span><i class="fas fa-robot mr-1"></i>${meta.source || 'AI'}</span>`);
      if (meta.stored) parts.push(`<span class="text-emerald-400"><i class="fas fa-database mr-1"></i>Stored</span>`);
      else if (meta.source !== 'gemini_manual' && meta.source !== 'manual_form') parts.push(`<span class="text-amber-400"><i class="fas fa-triangle-exclamation mr-1"></i>Not stored (confidence &lt; 70)</span>`);
      metaDiv.innerHTML = parts.join('<span class="text-white/10 mx-1">|</span>');
      resultsContent.appendChild(metaDiv);
    }
  }

  // ── Tier 4 Autocomplete Engine ───────────────────────────────────────
  const brandInput = $id('mf-brand');
  const modelInput = $id('mf-model');
  const refInput = $id('mf-ref');
  const catSelect = $id('mf-category');
  const acPanel = $id('autocomplete-panel');
  const acList = $id('ac-results-list');
  const acClose = $id('ac-close-btn');

  let acDebounce = null;

  async function triggerAutocomplete(query) {
    if (!acPanel || !acList) return;
    if (!query || query.trim().length < 2) {
      hide(acPanel);
      return;
    }
    const cat = catSelect?.value || '';
    try {
      const res = await api(`/api/autocomplete/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(cat)}`);
      const items = res.results || [];
      if (items.length === 0) {
        hide(acPanel);
        return;
      }

      acList.innerHTML = items.map(item => `
        <div class="ac-item p-2.5 hover:bg-gold/10 cursor-pointer transition-colors flex items-center justify-between"
             data-brand="${fmtText(item.brand)}"
             data-model="${fmtText(item.model)}"
             data-ref="${fmtText(item.referenceNumber)}"
             data-cat="${fmtText(item.category)}"
             data-mat="${fmtText(item.caseMaterial)}"
             data-size="${item.caseSizeMm || ''}"
             data-mvmt="${fmtText(item.movement)}"
             data-brac="${fmtText(item.braceletType)}"
             data-val="${item.baselineMarketValueUSD}">
          <div>
            <div class="text-xs font-bold text-white flex items-center gap-1.5">
              <span>${fmtText(item.brand)} ${fmtText(item.model)}</span>
              <span class="px-1.5 py-0.2 bg-gold/20 text-gold text-[9px] font-mono rounded">Ref: ${fmtText(item.referenceNumber)}</span>
            </div>
            <div class="text-[10px] text-white/40 mt-0.5">
              ${fmtText(item.category)} ${item.caseMaterial ? '\u00b7 ' + item.caseMaterial : ''} ${item.movement ? '\u00b7 ' + item.movement : ''}
            </div>
          </div>
          <div class="text-right font-mono text-xs font-bold text-gold">
            $${(item.baselineMarketValueUSD || 0).toLocaleString()}
          </div>
        </div>
      `).join('');

      show(acPanel);

      // Attach click events to autocomplete items
      acList.querySelectorAll('.ac-item').forEach(el => {
        el.addEventListener('click', () => {
          if (brandInput) brandInput.value = el.dataset.brand || '';
          if (modelInput) modelInput.value = el.dataset.model || '';
          if (refInput) refInput.value = el.dataset.ref || '';
          if (catSelect && el.dataset.cat) catSelect.value = el.dataset.cat;

          const matSel = document.querySelector('[name="case_material"]');
          if (matSel && el.dataset.mat) matSel.value = el.dataset.mat;

          const sizeInp = document.querySelector('[name="case_size_mm"]');
          if (sizeInp && el.dataset.size) sizeInp.value = el.dataset.size;

          const mvmtSel = document.querySelector('[name="movement"]');
          if (mvmtSel && el.dataset.mvmt) mvmtSel.value = el.dataset.mvmt;

          const bracSel = document.querySelector('[name="bracelet_type"]');
          if (bracSel && el.dataset.brac) bracSel.value = el.dataset.brac;

          const insValInp = document.querySelector('[name="insurance_value"]');
          if (insValInp && el.dataset.val && !insValInp.value) insValInp.value = el.dataset.val;

          hide(acPanel);
          toast(`Selected ${el.dataset.brand} ${el.dataset.model} (${el.dataset.ref})`, 'success');
        });
      });

    } catch (err) {
      hide(acPanel);
    }
  }

  function handleAcInput(e) {
    clearTimeout(acDebounce);
    acDebounce = setTimeout(() => {
      triggerAutocomplete(e.target.value);
    }, 200);
  }

  if (brandInput) brandInput.addEventListener('input', handleAcInput);
  if (modelInput) modelInput.addEventListener('input', handleAcInput);
  if (refInput) refInput.addEventListener('input', handleAcInput);
  if (acClose) acClose.addEventListener('click', () => hide(acPanel));
}

// ========== Inventory Page ==========

function initInventory() {
  const tbody = $id('inventory-tbody');
  let items = [];

  async function load(filters = {}) {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-white/20">
      <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Loading inventory...</td></tr>`;
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.status) params.set('status', filters.status);
      const res = await api('/api/inventory?' + params.toString());
      items = res.items || [];
      renderTable();
      loadStats();
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-red-400/60">Failed to load inventory</td></tr>`;
    }
  }

  function renderTable() {
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-white/20">
        <i class="fas fa-box-open text-3xl mb-2 opacity-20 block"></i>No items in inventory. Add one!</td></tr>`;
      return;
    }
    tbody.innerHTML = items.map(item => `
      <tr class="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <td class="px-5 py-3.5">
          <div class="font-medium text-white">${fmtText(item.brand)} ${fmtText(item.model)}</div>
          <div class="text-xs text-white/30 mt-0.5">${fmtText(item.reference_number)}</div>
        </td>
        <td class="px-5 py-3.5 text-white/60">${fmtText(item.category)}</td>
        <td class="px-5 py-3.5">
          <span class="inline-flex items-center gap-1 text-xs">
            <span class="text-white/60">${fmtText(item.condition_label)}</span>
            <span class="text-white/20">(${item.condition_grade ?? '\u2014'})</span>
          </span>
        </td>
        <td class="px-5 py-3.5 font-mono text-white">${fmtCurrency(item.estimated_value)}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center gap-1.5">
            <div class="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div class="h-full rounded-full ${(item.confidence || 0) >= 80 ? 'bg-emerald-500' : 'bg-gold'}" style="width:${Math.min(100, item.confidence || 0)}%"></div>
            </div>
            <span class="text-xs font-mono text-white/50">${item.confidence || 0}%</span>
          </div>
        </td>
        <td class="px-5 py-3.5">${statusBadge(item.status)}</td>
        <td class="px-5 py-3.5 text-right">
          <button onclick="window._inventoryDetail('${item.id}')" class="text-white/40 hover:text-gold transition-colors mr-2" title="View Details"><i class="fas fa-eye"></i></button>
          <button onclick="window._inventoryDelete('${item.id}')" class="text-white/40 hover:text-red-400 transition-colors" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  async function loadStats() {
    try {
      const res = await api('/api/inventory/stats');
      const st = $id('stat-total'); if (st) st.textContent = res.total || 0;
      const sv = $id('stat-value'); if (sv) sv.textContent = fmtCurrency(res.total_value);
      const sw = $id('stat-watches'); if (sw) sw.textContent = res.by_category?.Watches || 0;
      const ssv = $id('stat-vehicles'); if (ssv) ssv.textContent = res.by_category?.['Luxury Vehicles'] || 0;
      const fc = $id('filter-count'); if (fc) fc.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
    } catch (e) { /* stats can fail silently */ }
  }

  const fb = $id('filter-btn');
  if (fb) {
    fb.addEventListener('click', () => {
      load({
        category: $id('filter-category')?.value,
        brand: $id('filter-brand')?.value,
        status: $id('filter-status')?.value,
      });
    });
  }

  const addForm = $id('add-item-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      if (data.estimated_value) data.estimated_value = parseFloat(data.estimated_value);
      if (data.condition_grade) data.condition_grade = parseInt(data.condition_grade);
      if (data.year) data.year = parseInt(data.year);
      try {
        await api('/api/inventory', { method: 'POST', data });
        toast('Item added successfully', 'success');
        hide($id('add-item-modal'));
        e.target.reset();
        load();
      } catch (err) { /* toast shown by api() */ }
    });
  }

  window._inventoryDetail = function(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const content = $id('detail-content');
    if (!content) return;
    content.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-serif font-bold text-white">${fmtText(item.brand)} ${fmtText(item.model)}</h2>
        <button onclick="document.getElementById('detail-modal').classList.add('hidden')" class="text-white/30 hover:text-white">&times;</button>
      </div>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Category</div><div class="text-sm text-white">${fmtText(item.category)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Reference</div><div class="text-sm text-white font-mono">${fmtText(item.reference_number)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Year</div><div class="text-sm text-white">${item.year || '\u2014'}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Condition</div><div class="text-sm text-white">${fmtText(item.condition_label)} (Grade ${item.condition_grade ?? '\u2014'})</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Value</div><div class="text-sm font-mono text-gold">${fmtCurrency(item.estimated_value)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Confidence</div><div class="text-sm text-white">${item.confidence || 0}%</div></div>
        </div>
        <div class="bg-surface rounded-lg p-3">
          <div class="text-xs text-white/30 mb-1">Authentication Notes</div>
          <p class="text-sm text-white/60">${fmtText(item.authentication_notes) || 'No notes'}</p>
        </div>
        <div class="flex gap-2 items-center">
          <span class="text-xs text-white/30">Status:</span>${statusBadge(item.status)}
          <span class="text-xs text-white/30 ml-2">Created:</span><span class="text-xs text-white/50">${fmtDate(item.created_at)}</span>
        </div>
        ${item.id ? `<a href="/dossier/${item.id}" class="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light mt-2"><i class="fas fa-file-certificate"></i> View Dossier</a>` : ''}
      </div>
    `;
    show($id('detail-modal'));
  };

  window._inventoryDelete = async function(id) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try {
      await api('/api/inventory/' + id, { method: 'DELETE' });
      toast('Item deleted', 'success');
      load();
    } catch (err) { /* toast shown by api() */ }
  };

  load();
  setInterval(loadStats, 30000);
}

// ========== Requests Page ==========

function initRequests() {
  const tbody = $id('requests-tbody');
  let requests = [];

  async function load(filters = {}) {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-white/20">
      <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Loading requests...</td></tr>`;
    try {
      const params = new URLSearchParams();
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.urgency) params.set('urgency', filters.urgency);
      if (filters.status) params.set('status', filters.status);
      const res = await api('/api/requests?' + params.toString());
      requests = res.items || [];
      renderTable();
      loadStats();
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-red-400/60">Failed to load requests</td></tr>`;
    }
  }

  function renderTable() {
    if (!tbody) return;
    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-white/20">
        <i class="fas fa-magnifying-glass text-3xl mb-2 opacity-20 block"></i>No client requests. Create one!</td></tr>`;
      return;
    }
    tbody.innerHTML = requests.map(r => `
      <tr class="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <td class="px-5 py-3.5">
          <div class="font-medium text-white">${fmtText(r.client_name)}</div>
          <div class="text-xs text-white/20">${r.id?.slice(0, 8)}</div>
        </td>
        <td class="px-5 py-3.5">
          <div class="text-sm text-white/80">${fmtText(r.looking_for_brand)} ${fmtText(r.looking_for_model)}</div>
        </td>
        <td class="px-5 py-3.5 font-mono text-white/80">${r.budget_usd ? fmtCurrency(r.budget_usd) : '\u2014'}</td>
        <td class="px-5 py-3.5">${urgencyBadge(r.urgency)}</td>
        <td class="px-5 py-3.5 text-white/50 text-sm">${r.condition_required !== undefined ? 'Grade ' + r.condition_required + '+' : '\u2014'}</td>
        <td class="px-5 py-3.5">${statusBadge(r.status)}</td>
        <td class="px-5 py-3.5 text-right">
          <button onclick="window._requestDelete('${r.id}')" class="text-white/40 hover:text-red-400 transition-colors" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  async function loadStats() {
    try {
      const res = await api('/api/requests/stats');
      const rt = $id('req-stat-total'); if (rt) rt.textContent = res.total_active || 0;
      const rb = $id('req-stat-budget'); if (rb) rb.textContent = fmtCurrency(res.total_budget);
      const ri = $id('req-stat-immediate'); if (ri) ri.textContent = res.by_urgency?.Immediate || 0;
      const rm = $id('req-stat-matched'); if (rm) rm.textContent = res.by_status?.matched || 0;
    } catch (e) { /* silent */ }
  }

  const rfb = $id('req-filter-btn');
  if (rfb) {
    rfb.addEventListener('click', () => {
      load({
        brand: $id('req-filter-brand')?.value,
        urgency: $id('req-filter-urgency')?.value,
        status: $id('req-filter-status')?.value,
      });
    });
  }

  const arf = $id('add-request-form');
  if (arf) {
    arf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      if (data.budget_usd) data.budget_usd = parseFloat(data.budget_usd);
      if (data.condition_required) data.condition_required = parseInt(data.condition_required);
      try {
        await api('/api/requests', { method: 'POST', data });
        toast('Request created', 'success');
        hide($id('add-request-modal'));
        e.target.reset();
        load();
      } catch (err) { /* toast shown by api() */ }
    });
  }

  window._requestDelete = async function(id) {
    if (!confirm('Delete this request?')) return;
    try {
      await api('/api/requests/' + id, { method: 'DELETE' });
      toast('Request deleted', 'success');
      load();
    } catch (err) { /* toast shown by api() */ }
  };

  load();
  setInterval(loadStats, 30000);
}

// ========== Matching Page ==========

function initMatching() {
  const runBtn = $id('run-match-btn');
  if (!runBtn) return;

  runBtn.addEventListener('click', async () => {
    const spinner = $id('match-spinner');
    const results = $id('match-results');

    runBtn.disabled = true;
    if (spinner) show(spinner);

    try {
      const res = await api('/api/matching/run', { method: 'POST' });

      if (!results) return;

      if (!res.matches || res.matches.length === 0) {
        results.innerHTML = `<div class="bg-card border border-border rounded-xl p-8 text-center text-white/20">
          <i class="fas fa-code-branch text-4xl mb-3 opacity-20 block"></i>
          <p>${res.message || 'No matches found. Add inventory and client requests first.'}</p>
        </div>`;
        return;
      }

      results.innerHTML = res.matches.map(m => {
        const pct = Math.round((m.score || 0) * 100);
        const color = pct >= 70 ? 'border-emerald-400/30 bg-emerald-500/5' : pct >= 40 ? 'border-gold/30 bg-gold/5' : 'border-white/10 bg-white/[0.02]';
        const scoreColor = pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-gold' : 'text-white/40';
        const canAccept = m.status === 'pending' || !m.status;
        return `
        <div class="bg-card border ${color} rounded-xl p-5 transition-all">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-white/30">Request</span>
                <span class="text-white font-medium">${fmtText(m.client_name)}</span>
                <span class="text-white/20">\u2192</span>
                <span class="text-white font-medium">${fmtText(m.item_brand)} ${fmtText(m.item_model)}</span>
              </div>
              <div class="flex items-center gap-3 text-xs text-white/40">
                <span>Budget: <span class="text-white/60">${fmtCurrency(m.request_budget)}</span></span>
                <span>Value: <span class="text-white/60">${fmtCurrency(m.item_value)}</span></span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold font-mono ${scoreColor}">${pct}%</div>
              <div class="text-xs text-white/30">match score</div>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 mb-3">
            <div class="text-center"><div class="text-xs text-white/30">Brand</div><div class="text-sm font-mono text-white/60">${Math.round((m.dimension_scores?.brand || 0) * 100)}%</div></div>
            <div class="text-center"><div class="text-xs text-white/30">Model</div><div class="text-sm font-mono text-white/60">${Math.round((m.dimension_scores?.model || 0) * 100)}%</div></div>
            <div class="text-center"><div class="text-xs text-white/30">Budget</div><div class="text-sm font-mono text-white/60">${Math.round((m.dimension_scores?.price || 0) * 100)}%</div></div>
            <div class="text-center"><div class="text-xs text-white/30">Condition</div><div class="text-sm font-mono text-white/60">${Math.round((m.dimension_scores?.condition || 0) * 100)}%</div></div>
          </div>
          ${canAccept ? `
          <div class="flex gap-2">
            <button onclick="window._matchAction('${m.id}','accepted')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
              <i class="fas fa-check mr-1"></i>Accept
            </button>
            <button onclick="window._matchAction('${m.id}','rejected')" class="flex-1 border border-white/10 hover:border-red-500/30 text-white/50 hover:text-red-400 text-xs py-1.5 rounded-lg transition-colors">
              <i class="fas fa-times mr-1"></i>Reject
            </button>
          </div>
          ` : `<div class="text-center text-xs text-white/30">${statusBadge(m.status)}</div>`}
        </div>`;
      }).join('');

      const mt = $id('match-stat-total'); if (mt) mt.textContent = res.total || res.matches.length;
      const ma = $id('match-stat-avg'); if (ma) ma.textContent = res.average_score ? Math.round(res.average_score * 100) + '%' : '\u2014';
      const mp = $id('match-stat-pending'); if (mp) mp.textContent = res.by_status?.pending || 0;
      const mac = $id('match-stat-accepted'); if (mac) mac.textContent = res.by_status?.accepted || 0;

    } catch (err) {
      if (results) {
        results.innerHTML = `<div class="bg-card border border-red-500/20 rounded-xl p-8 text-center text-red-400/60">
          <i class="fas fa-triangle-exclamation text-3xl mb-2 block"></i>
          <p>Matchmaking failed. Ensure inventory and client requests exist.</p>
        </div>`;
      }
    } finally {
      runBtn.disabled = false;
      if (spinner) hide(spinner);
    }
  });

  window._matchAction = async function(matchId, action) {
    try {
      await api(`/api/matching/${matchId}/${action}`, { method: 'POST' });
      toast('Match ' + action, 'success');
      runBtn.click();
    } catch (err) { /* toast handled */ }
  };

  // Auto-load stats
  (async () => {
    try {
      const res = await api('/api/matching/stats');
      const mt = $id('match-stat-total'); if (mt && res.total !== undefined) mt.textContent = res.total;
      const mp = $id('match-stat-pending'); if (mp && res.total_pending !== undefined) mp.textContent = res.total_pending;
      const mac = $id('match-stat-accepted'); if (mac && res.total_accepted !== undefined) mac.textContent = res.total_accepted;
    } catch (e) { /* silent */ }
  })();
}

// ========== Dossier Page ==========

function initDossier() {
  const listContainer = $id('dossiers-list');

  const pathMatch = window.location.pathname.match(/\/dossier\/(.+)/);
  if (pathMatch) loadDossier(pathMatch[1]);

  async function loadList() {
    if (!listContainer) return;
    try {
      const res = await api('/api/dossiers');
      const items = res.items || [];
      if (items.length === 0) {
        listContainer.innerHTML = `<div class="bg-card border border-border rounded-xl p-8 text-center text-white/20">
          <i class="fas fa-file-certificate text-4xl mb-3 opacity-20 block"></i>
          <p>No dossiers generated yet. Authenticate an asset first.</p>
        </div>`;
        return;
      }
      listContainer.innerHTML = items.map(d => `
        <div class="bg-card border border-border rounded-xl p-5 hover:border-gold/20 transition-colors cursor-pointer" onclick="window._dossierView('${d.id}')">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <i class="fas fa-file-certificate text-gold"></i>
                <span class="font-medium text-white">${fmtText(d.brand)} ${fmtText(d.model)}</span>
              </div>
              <div class="text-xs text-white/30">
                ${fmtText(d.reference_number)} \u00b7 ${fmtDate(d.valuation_date)}
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold font-mono text-gold">${fmtCurrency(d.estimated_value)}</div>
              <div class="text-xs text-white/40">${d.confidence || 0}% confidence</div>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-3 text-xs text-white/20">
            <span><i class="fas fa-qrcode mr-1"></i>${fmtText(d.qr_code_token)?.slice(0, 12) || '\u2014'}</span>
            <span><i class="fas fa-download mr-1"></i>${d.export_count || 0} exports</span>
          </div>
        </div>
      `).join('');
    } catch (e) {
      listContainer.innerHTML = `<div class="bg-card border border-border rounded-xl p-8 text-center text-red-400/60">Failed to load dossiers</div>`;
    }
  }

  window._dossierView = function(id) {
    loadDossier(id);
    const cert = $id('dossier-detail');
    if (cert) { show(cert); cert.scrollIntoView({ behavior: 'smooth' }); }
  };

  async function loadDossier(id) {
    try {
      const d = await api('/api/dossiers/' + id);
      show($id('dossier-detail'));

      const ca = $id('cert-asset');
      if (ca) {
        ca.innerHTML = `
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Brand</div><div class="text-sm text-white font-medium">${fmtText(d.brand)}</div></div>
            <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Model</div><div class="text-sm text-white">${fmtText(d.model)}</div></div>
            <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Category</div><div class="text-sm text-white">${fmtText(d.category)}</div></div>
            <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Reference</div><div class="text-sm text-white font-mono">${fmtText(d.reference_number)}</div></div>
            <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Year</div><div class="text-sm text-white">${d.year || '\u2014'}</div></div>
            <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Condition</div><div class="text-sm text-white">${fmtText(d.condition_label)} (Grade ${d.condition_grade ?? '\u2014'})</div></div>
            <div class="bg-surface rounded-lg p-3 col-span-2"><div class="text-xs text-white/30">Estimated Value</div><div class="text-lg font-bold font-mono text-gold">${fmtCurrency(d.estimated_value)}</div></div>
          </div>
        `;
      }

      const cb = d.confidence_breakdown || {};
      const cc = $id('cert-confidence');
      if (cc) cc.innerHTML = Object.entries(cb).map(([k, v]) => renderConfidenceBar(k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), v)).join('');

      const cr = $id('cert-reasoning');
      if (cr) cr.textContent = d.authentication_notes || d.valuation_summary || 'AI-authenticated by CuratedLux multi-modal pipeline.';

      const cq = $id('cert-qr');
      if (cq) cq.textContent = d.qr_code_token || d.id?.slice(0, 16) || '\u2014';

      const cap = $id('cert-appraiser');
      if (cap) cap.textContent = d.appraiser_name || 'CuratedLux AI';
      const cs = $id('cert-signature');
      if (cs) cs.textContent = 'Digitally signed \u00b7 CuratedLux v2.0 (Gemini 3.5 Flash)';
      const ce = $id('cert-exports');
      if (ce) ce.textContent = d.export_count || 0;
      const cd = $id('cert-date');
      if (cd) cd.textContent = 'Generated ' + fmtDate(d.created_at || d.valuation_date);

      const edb = $id('export-dossier-btn');
      if (edb) {
        edb.onclick = async () => {
          try {
            await api('/api/dossiers/' + d.id + '/export', { method: 'POST' });
            toast('Dossier exported. Export counter updated.', 'success');
            window.print();
          } catch (err) { /* toast handled */ }
        };
      }

      // ── Share: Web Share API (mobile native sheet) + copy-link fallback ──
      const verifyUrl = `${location.origin}/verify/${d.id}`
      const vlink = $id('verify-dossier-link')
      if (vlink) vlink.href = verifyUrl   // point "Verify Authenticity" at the real page

      const shareBtn = $id('share-dossier-btn')
      if (shareBtn) {
        shareBtn.onclick = async () => {
          const shareData = {
            title: `${d.brand || ''} ${d.model || ''} — CuratedLux Verification`,
            text: `CuratedLux AI verification for ${d.brand || ''} ${d.model || ''}. Tap to verify authenticity.`,
            url: verifyUrl,
          }
          try {
            if (navigator.share) {
              await navigator.share(shareData)
              toast('Shared!', 'success')
            } else if (navigator.clipboard) {
              await navigator.clipboard.writeText(verifyUrl)
              toast('Verification link copied to clipboard', 'success')
            } else {
              window.prompt('Copy verification link:', verifyUrl)
            }
          } catch (e) {
            if (e?.name !== 'AbortError') toast('Share failed', 'error')
          }
        }
      }
    } catch (err) {
      toast('Failed to load dossier', 'error');
    }
  }

  // Create dossier: load inventory items for select
  (async () => {
    try {
      const invRes = await api('/api/inventory?status=active');
      const sel = $id('dossier-inv-id');
      if (sel) {
        sel.innerHTML = '<option value="">Select an item...</option>' +
          (invRes.items || []).map(i => `<option value="${i.id}">${fmtText(i.brand)} ${fmtText(i.model)} (${fmtText(i.reference_number)})</option>`).join('');
      }
    } catch (e) { /* silent */ }
  })();

  const cdb = $id('create-dossier-btn');
  if (cdb) {
    cdb.addEventListener('click', async () => {
      const invId = $id('dossier-inv-id')?.value;
      if (!invId) { toast('Select an inventory item', 'warning'); return; }
      const notes = $id('dossier-notes')?.value;
      try {
        const res = await api('/api/dossiers', { method: 'POST', data: { inventory_item_id: invId, notes } });
        toast('Dossier generated', 'success');
        hide($id('create-dossier-modal'));
        loadList();
        loadDossier(res.id);
      } catch (err) { /* toast handled */ }
    });
  }

  loadList();
}

// ========== Helpers ==========

function fmtText(val) {
  if (!val) return '\u2014';
  // audit H2: escape HTML — fmtText feeds innerHTML template literals everywhere
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ========== Page Router ==========

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path === '/' || path === '') initHome();
  else if (path === '/valuation') initValuation();
  else if (path === '/inventory') initInventory();
  else if (path === '/requests') initRequests();
  else if (path === '/matching') initMatching();
  else if (path.startsWith('/dossier')) initDossier();
});
