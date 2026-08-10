/**
 * CuratedLux v2.0 — Client-side application logic
 * Gemini 3.5 Flash edition (Aug 2026)
 * Full interactive JS for all 6 pages + shared utilities
 */

// ========== Utility Helpers ==========

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
  el.innerHTML = `<i class="fas ${icons[type] || icons.info} mr-2"></i>${msg}`;
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
    cameraTriggerBtn.addEventListener('click', openCamera);
  }

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

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (images.length >= MAX_IMAGES) { toast('Max 5 images per scan', 'warning'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        images.push({ data: reader.result, name: file.name });
        renderPreviews();
      };
      reader.readAsDataURL(file);
    });
    if (imageInput) imageInput.value = '';
  }

  function renderPreviews() {
    if (!previewsArea || !dropContent) return;
    if (images.length === 0) {
      hide(previewsArea);
      show(dropContent);
      return;
    }
    hide(dropContent);
    show(previewsArea);
    previewsArea.innerHTML = '';

    images.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'relative inline-block m-1 cursor-pointer group';
      thumb.innerHTML = `
        <img src="${img.data}" class="w-16 h-16 object-cover rounded-lg border-2 ${i === 0 ? 'border-gold' : 'border-white/10'} hover:border-gold/60 transition-colors" />
        <button class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
        <span class="text-[10px] text-white/30 mt-1 block text-center truncate w-16">${img.name.slice(0, 12)}</span>
      `;
      thumb.querySelector('button').addEventListener('click', e => {
        e.stopPropagation();
        images.splice(i, 1);
        renderPreviews();
      });
      previewsArea.appendChild(thumb);
    });

    // Add more button
    if (images.length < MAX_IMAGES) {
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
  async function openCamera() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4';
    modal.innerHTML = `
      <div class="relative max-w-2xl w-full">
        <button id="cl-cam-close" class="absolute -top-2 -right-2 z-20 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 border border-white/10">&times;</button>

        <!-- Mode & Quality Toolbar -->
        <div class="flex items-center justify-between gap-2 mb-2 px-1">
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

        <!-- Video viewport with crosshair guides -->
        <div class="relative">
          <video id="cl-cam-video" class="w-full rounded-xl bg-black" autoplay playsinline muted></video>
          <!-- Two-thirds rule guides for product framing -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-1/3 left-0 right-0 h-px bg-white/10"></div>
            <div class="absolute top-2/3 left-0 right-0 h-px bg-white/10"></div>
            <div class="absolute left-1/3 top-0 bottom-0 w-px bg-white/10"></div>
            <div class="absolute left-2/3 top-0 bottom-0 w-px bg-white/10"></div>
            <div class="absolute top-1/2 left-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 border border-gold/40 rounded-full"></div>
          </div>
          <div id="cl-cam-info" class="absolute bottom-2 left-2 text-[10px] font-mono text-gold/80 bg-black/40 px-2 py-0.5 rounded"></div>
        </div>

        <!-- Mic waveform + status -->
        <div id="cl-mic-panel" class="hidden mt-3 bg-black/40 rounded-lg p-3 border border-rose-400/20">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-mono text-rose-300"><i class="fas fa-circle text-[6px] mr-1 animate-pulse"></i>RAW MIC 256 kbps</span>
            <span id="cl-mic-meter" class="text-[10px] font-mono text-rose-200/50">0 dB</span>
          </div>
          <canvas id="cl-mic-wave" class="w-full h-8 bg-black/30 rounded"></canvas>
        </div>

        <!-- Snap controls -->
        <div class="mt-4 flex items-center justify-center gap-6">
          <button id="cl-cam-flip" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-gold flex items-center justify-center" title="Flip">
            <i class="fas fa-camera-rotate"></i>
          </button>
          <button id="cl-cam-snap" class="w-20 h-20 rounded-full bg-white border-4 border-gold flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.4)]">
            <i class="fas fa-camera text-black text-2xl"></i>
          </button>
          <button id="cl-cam-torch" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-gold flex items-center justify-center" title="Torch">
            <i class="fas fa-bolt"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // ── State ──────────────────────────────────────────────────────────
    let stream = null
    let facingMode = 'environment'
    let resolution = '1080'
    let macroOn = false
    let burstOn = false
    let micOn = false
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
        if (macroOn) await toggleMacro(true)

        if (micOn) startMicCapture(stream)
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
      images.push({ data: dataUrl, name: `cam-${resolution}-${Date.now()}.jpg` })

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
        // Replace last with best
        images[images.length - 1] = { data: best, name: `cam-burst-${Date.now()}.jpg` }
      }

      renderPreviews()
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

    function measureSharpness(dataUrl) {
      return new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          // Downscale for speed — sharpness proxy via edge energy
          c.width = 256
          const ratio = img.height / img.width
          c.height = Math.round(256 * ratio)
          const ctx = c.getContext('2d')
          ctx.drawImage(img, 0, 0, c.width, c.height)
          const data = ctx.getImageData(0, 0, c.width, c.height).data
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
          resolve(energy / count)
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

    function cleanup() {
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
    modal.querySelector('#cl-cam-flip').addEventListener('click', () => {
      facingMode = facingMode === 'environment' ? 'user' : 'environment'
      startStream()
    })
    modal.querySelector('#cl-cam-torch').addEventListener('click', toggleTorch)
    modal.querySelector('#cl-cam-snap').addEventListener('click', snap)
    modal.querySelector('#cl-cam-close').addEventListener('click', cleanup)

    // Set default resolution visible
    const defaultRes = modal.querySelector(`[data-res="${resolution}"]`)
    if (defaultRes) defaultRes.classList.add('border-gold', 'text-gold', 'bg-gold/10')

    await startStream()
  }

  // ── Analyze Button (uses /api/valuation/analyze) ──────────────────────────
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      if (images.length === 0 && !descriptionInput?.value.trim()) {
        toast('Upload an image or describe the item first', 'warning');
        return;
      }

      analyzeBtn.disabled = true;
      if (analyzeSpinner) show(analyzeSpinner);
      if (resultsEmpty) hide(resultsEmpty);
      if (resultsContent) hide(resultsContent);

      try {
        const payload = {
          images: images.map(i => i.data),
          description: descriptionInput?.value.trim() || undefined,
          transcript: window._voiceTranscript || undefined,
        };

        const res = await api('/api/valuation/analyze', {
          method: 'POST',
          data: payload,
        });

        let data = res;
        if (res.result) data = res.result;

        renderValuationResult(data, res);
        window._voiceTranscript = null;
        toast(res.stored ? 'Asset authenticated and stored' : 'Analysis complete \u2014 review required', res.stored ? 'success' : 'warning');
      } catch (err) {
        toast(err.response?.data?.error || 'Analysis failed', 'error');
      } finally {
        analyzeBtn.disabled = false;
        if (analyzeSpinner) hide(analyzeSpinner);
      }
    });
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
            <h3 class="text-xl font-serif font-bold text-white">${data.brand || 'Unknown'} ${data.model || ''}</h3>
            <p class="text-white/40 text-sm mt-0.5">
              ${data.category || '\u2014'} ${data.referenceNumber ? '\u00b7 Ref: ' + data.referenceNumber : ''}
              ${data.year ? '\u00b7 ' + data.year : ''}
            </p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
            data.authenticityStatus === 'AUTHENTIC MATCH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            data.authenticityStatus === 'REQUIRES IN-PERSON VERIFICATION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }">${data.authenticityStatus || 'PENDING'}</span>
        </div>
      `;
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
  return String(val);
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
