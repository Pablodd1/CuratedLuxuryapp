/**
 * CuratedLux v2.0 — Client-side application logic
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
  const colors = { info: 'bg-blue-600', error: 'bg-red-600', success: 'bg-emerald-600', warning: 'bg-amber-600' };
  const icons = { info: 'fa-circle-info', error: 'fa-circle-exclamation', success: 'fa-circle-check', warning: 'fa-triangle-exclamation' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
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
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function $id(id) { return document.getElementById(id); }
function $q(sel, ctx) { return (ctx || document).querySelector(sel); }
function $qa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }
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
  // Home page cards are server-rendered. Add shimmer animation.
  document.querySelectorAll('.hero-gradient').forEach(el => {
    el.style.animation = 'shimmer 4s ease-in-out infinite alternate';
  });
}

// ========== Valuation Page ==========

function initValuation() {
  const dropZone = $id('drop-zone');
  const imageInput = $id('image-input');
  const previewContainer = $id('preview-container');
  const previewImg = $id('preview-img');
  const dropContent = $id('drop-content');
  const analyzeBtn = $id('analyze-btn');
  const analyzeSpinner = $id('analyze-spinner');
  const descriptionInput = $id('description-input');
  const voiceBtn = $id('voice-btn');
  const voiceStatus = $id('voice-status');
  const resultsEmpty = $id('results-empty');
  const resultsContent = $id('results-content');

  // Multi-image support
  const images = [];
  const MAX_IMAGES = 5;

  // --- Image handling: drag & drop + click + multi-image ---
  dropZone.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleFiles);
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-gold/60'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-gold/60'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('border-gold/60');
    handleFiles({ target: { files: e.dataTransfer.files } });
  });

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
    imageInput.value = '';
  }

  function renderPreviews() {
    if (images.length === 0) {
      hide(previewContainer);
      show(dropContent);
      return;
    }
    hide(dropContent);
    show(previewContainer);
    // Show first image as main preview
    previewImg.src = images[0].data;
    // Build thumbnail strip
    let existingStrip = $q('.preview-strip');
    if (existingStrip) existingStrip.remove();
    const strip = document.createElement('div');
    strip.className = 'preview-strip flex gap-2 mt-3 justify-center flex-wrap';
    images.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'relative cursor-pointer group';
      thumb.innerHTML = `
        <img src="${img.data}" class="w-16 h-16 object-cover rounded-lg border-2 ${i === 0 ? 'border-gold' : 'border-white/10'} hover:border-gold/60 transition-colors" />
        <button class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-idx="${i}">&times;</button>
        <span class="text-[10px] text-white/30 mt-1 block text-center truncate w-16">${img.name.slice(0, 12)}</span>
      `;
      thumb.querySelector('img').addEventListener('click', () => {
        previewImg.src = img.data;
        strip.querySelectorAll('img').forEach(t => t.classList.remove('border-gold'));
        thumb.querySelector('img').classList.add('border-gold');
      });
      thumb.querySelector('button').addEventListener('click', e => {
        e.stopPropagation();
        images.splice(i, 1);
        renderPreviews();
      });
      strip.appendChild(thumb);
    });
    // Add camera button
    if (images.length < MAX_IMAGES) {
      const addBtn = document.createElement('button');
      addBtn.className = 'w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-gold/40 flex items-center justify-center text-white/30 hover:text-gold transition-colors';
      addBtn.innerHTML = '<i class="fas fa-plus text-lg"></i>';
      addBtn.title = 'Add another image';
      addBtn.addEventListener('click', () => imageInput.click());
      strip.appendChild(addBtn);
      // Camera capture button
      const camBtn = document.createElement('button');
      camBtn.className = 'w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-gold/40 flex items-center justify-center text-white/30 hover:text-gold transition-colors';
      camBtn.innerHTML = '<i class="fas fa-camera text-lg"></i>';
      camBtn.title = 'Take a photo';
      camBtn.addEventListener('click', openCamera);
      strip.appendChild(camBtn);
    }
    previewContainer.appendChild(strip);
  }

  function openCamera() {
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    const captureBtn = document.createElement('button');
    let stream = null;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4';
    modal.innerHTML = `
      <div class="relative max-w-lg w-full">
        <button id="close-camera" class="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">&times;</button>
        <video id="camera-video" class="w-full rounded-xl" autoplay playsinline></video>
        <button id="camera-snap" class="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-gold flex items-center justify-center hover:scale-105 transition-transform">
          <i class="fas fa-camera text-black text-xl"></i>
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
      stream = s;
      const v = modal.querySelector('#camera-video');
      v.srcObject = s;
    }).catch(() => toast('Camera access denied', 'error'));

    modal.querySelector('#close-camera').addEventListener('click', () => cleanup());
    modal.querySelector('#camera-snap').addEventListener('click', () => {
      const v = modal.querySelector('#camera-video');
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext('2d').drawImage(v, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      images.push({ data: dataUrl, name: `camera-${Date.now()}.jpg` });
      renderPreviews();
      cleanup();
    });

    function cleanup() {
      if (stream) stream.getTracks().forEach(t => t.stop());
      modal.remove();
    }
  }

  // --- Analyze ---
  analyzeBtn.addEventListener('click', async () => {
    if (images.length === 0 && !descriptionInput.value.trim()) {
      toast('Upload an image or describe the item first', 'warning');
      return;
    }

    analyzeBtn.disabled = true;
    show(analyzeSpinner);
    hide(resultsEmpty);
    hide(resultsContent);

    try {
      const payload = {
        images: images.map(i => i.data),
        description: descriptionInput.value.trim() || undefined,
        transcript: window._voiceTranscript || undefined,
      };

      const res = await api('/api/valuation/scan', {
        method: 'POST',
        data: payload,
      });

      // Restore legacy compatibility: if API returned a flat result (single image path)
      let data = res;
      if (res.result) data = res.result;

      renderValuationResult(data, res);
      window._voiceTranscript = null;
      toast(res.stored ? 'Asset authenticated and stored' : 'Analysis complete — review required', res.stored ? 'success' : 'warning');
    } catch (err) {
      toast(err.response?.data?.error || 'Analysis failed', 'error');
    } finally {
      analyzeBtn.disabled = false;
      hide(analyzeSpinner);
    }
  });

  // --- Voice Recording using Web Speech API ---
  let recognition = null;
  voiceBtn.addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast('Voice input not supported in this browser. Try Chrome.', 'warning');
      return;
    }

    if (recognition && recognition.listening) {
      recognition.stop();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    voiceBtn.classList.add('border-rose-400', 'text-rose-400');
    voiceBtn.querySelector('i').classList.add('animate-pulse');
    show(voiceStatus);
    voiceStatus.textContent = 'Listening... speak clearly';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      voiceStatus.textContent = transcript || 'Listening...';
      window._voiceTranscript = transcript;
    };

    recognition.onerror = (event) => {
      toast('Voice error: ' + event.error, 'error');
      stopVoice();
    };

    recognition.onend = () => stopVoice();

    recognition.start();
  });

  function stopVoice() {
    if (recognition) {
      try { recognition.stop(); } catch (e) { /* ignore */ }
    }
    voiceBtn.classList.remove('border-rose-400', 'text-rose-400');
    const icon = voiceBtn.querySelector('i');
    if (icon) icon.classList.remove('animate-pulse');
    if (!window._voiceTranscript) hide(voiceStatus);
    else voiceStatus.textContent = 'Transcript captured. Click Analyze to include it.';
  }

  // --- Render valuation result ---
  function renderValuationResult(data, meta) {
    hide(resultsEmpty);
    show(resultsContent);

    const header = $id('result-header');
    header.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-xl font-serif font-bold text-white">${data.brand || 'Unknown'} ${data.model || ''}</h3>
          <p class="text-white/40 text-sm mt-0.5">
            ${data.category || '—'} ${data.referenceNumber ? '· Ref: ' + data.referenceNumber : ''}
            ${data.year ? '· ' + data.year : ''}
          </p>
        </div>
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
          data.authenticityStatus === 'AUTHENTIC MATCH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          data.authenticityStatus === 'REQUIRES IN-PERSON VERIFICATION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          'bg-red-500/10 text-red-400 border-red-500/20'
        }">${data.authenticityStatus || 'PENDING'}</span>
      </div>
    `;

    // Confidence meters
    const meters = $id('confidence-meters');
    const cb = data.confidence_breakdown || {};
    meters.innerHTML = [
      renderConfidenceBar('Logo & Branding', cb.logo),
      renderConfidenceBar('Serial Number', cb.serial),
      renderConfidenceBar('Materials', cb.materials),
      renderConfidenceBar('Bezel Geometry', cb.bezel_geometry),
      renderConfidenceBar('Dial Texture', cb.dial_texture),
      renderConfidenceBar('Overall Proportion', cb.overall_proportion),
    ].join('');

    // Overall confidence
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

    // Value
    $id('result-value').textContent = fmtCurrency(data.estimatedValue);
    if (data.currency && data.currency !== 'USD') {
      $id('result-value').textContent += ` ${data.currency}`;
    }

    // Reasoning
    $id('result-reasoning').textContent = data.reasoning || 'No reasoning provided.';

    // Condition
    if (data.condition_label || data.condition_grade !== undefined) {
      const condDiv = document.createElement('div');
      condDiv.className = 'bg-surface rounded-lg p-4 mb-4';
      condDiv.innerHTML = `
        <div class="text-xs text-white/40 mb-1">CONDITION</div>
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold text-white">${data.condition_label || '—'}</span>
          <span class="text-xs text-white/30">(Grade ${data.condition_grade ?? '—'} / 4)</span>
        </div>
      `;
      $id('result-value').parentElement.after(condDiv);
    }

    // Red flags
    if (data.red_flags && data.red_flags.length > 0) {
      const rfDiv = document.createElement('div');
      rfDiv.className = 'bg-red-500/5 border border-red-500/10 rounded-lg p-4 mb-4';
      rfDiv.innerHTML = `
        <div class="text-xs text-red-400 mb-2 font-semibold"><i class="fas fa-triangle-exclamation mr-1"></i>RED FLAGS DETECTED</div>
        <ul class="space-y-1">${data.red_flags.map(f => `<li class="text-sm text-red-300/70">· ${f}</li>`).join('')}</ul>
      `;
      $id('result-value').parentElement.after(rfDiv);
    }

    // OCR data
    if (data.ocr_serials && data.ocr_serials.length > 0) {
      const ocrDiv = document.createElement('div');
      ocrDiv.className = 'bg-surface rounded-lg p-4 mb-4';
      ocrDiv.innerHTML = `
        <div class="text-xs text-white/40 mb-2"><i class="fas fa-barcode mr-1"></i>OCR EXTRACTIONS</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          ${data.ocr_serials.length ? `<div><span class="text-white/30">Serials:</span> <span class="text-white font-mono">${data.ocr_serials.join(', ')}</span></div>` : ''}
          ${data.ocr_barcodes && data.ocr_barcodes.length ? `<div><span class="text-white/30">Barcodes:</span> <span class="text-white font-mono">${data.ocr_barcodes.join(', ')}</span></div>` : ''}
        </div>
      `;
      $id('result-value').parentElement.after(ocrDiv);
    }

    // Pipeline metadata
    if (meta) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap gap-3 text-xs text-white/20';
      const parts = [];
      if (meta.pipeline_ms) parts.push(`<span><i class="fas fa-bolt mr-1"></i>${meta.pipeline_ms}ms</span>`);
      if (meta.images_processed) parts.push(`<span><i class="fas fa-image mr-1"></i>${meta.images_processed} images</span>`);
      if (meta.ocr_images_processed) parts.push(`<span><i class="fas fa-barcode mr-1"></i>${meta.ocr_images_processed} OCR</span>`);
      if (meta.has_voice) parts.push(`<span><i class="fas fa-microphone mr-1"></i>Voice</span>`);
      if (meta.source) parts.push(`<span><i class="fas fa-robot mr-1"></i>${meta.source}</span>`);
      if (meta.stored) parts.push(`<span class="text-emerald-400"><i class="fas fa-database mr-1"></i>Stored</span>`);
      else parts.push(`<span class="text-amber-400"><i class="fas fa-triangle-exclamation mr-1"></i>Not stored (confidence &lt; 70)</span>`);
      metaDiv.innerHTML = parts.join('<span class="text-white/10">|</span>');
      resultsContent.appendChild(metaDiv);
    }
  }
}

// ========== Inventory Page ==========

function initInventory() {
  const tbody = $id('inventory-tbody');
  let items = [];

  // Load inventory
  async function load(filters = {}) {
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
            <span class="text-white/20">(${item.condition_grade ?? '—'})</span>
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
      $id('stat-total').textContent = res.total || 0;
      $id('stat-value').textContent = fmtCurrency(res.total_value);
      $id('stat-watches').textContent = res.by_category?.Watches || 0;
      $id('stat-vehicles').textContent = res.by_category?.['Luxury Vehicles'] || 0;
      $id('filter-count').textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
    } catch (e) { /* stats panel can fail silently */ }
  }

  // Filters
  $id('filter-btn').addEventListener('click', () => {
    load({
      category: $id('filter-category').value,
      brand: $id('filter-brand').value,
      status: $id('filter-status').value,
    });
  });

  // Add Item form
  $id('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    if (data.estimated_value) data.estimated_value = parseFloat(data.estimated_value);
    if (data.condition_grade) data.condition_grade = parseInt(data.condition_grade);
    if (data.year) data.year = parseInt(data.year);
    try {
      await api('/api/inventory', { method: 'POST', data });
      toast('Item added successfully', 'success');
      hide($id('add-item-modal'));
      form.reset();
      load();
    } catch (err) { /* toast shown by api() */ }
  });

  // Detail modal
  window._inventoryDetail = function(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const content = $id('detail-content');
    content.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-serif font-bold text-white">${fmtText(item.brand)} ${fmtText(item.model)}</h2>
        <button onclick="document.getElementById('detail-modal').classList.add('hidden')" class="text-white/30 hover:text-white">&times;</button>
      </div>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Category</div><div class="text-sm text-white">${fmtText(item.category)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Reference</div><div class="text-sm text-white font-mono">${fmtText(item.reference_number)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Year</div><div class="text-sm text-white">${item.year || '—'}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Condition</div><div class="text-sm text-white">${fmtText(item.condition_label)} (Grade ${item.condition_grade ?? '—'})</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Value</div><div class="text-sm font-mono text-gold">${fmtCurrency(item.estimated_value)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Confidence</div><div class="text-sm text-white">${item.confidence || 0}%</div></div>
        </div>
        <div class="bg-surface rounded-lg p-3">
          <div class="text-xs text-white/30 mb-2">Authentication Notes</div>
          <p class="text-sm text-white/60">${fmtText(item.authentication_notes) || 'No notes'}</p>
        </div>
        <div class="flex gap-2">
          <span class="text-xs text-white/30">Status:</span>${statusBadge(item.status)}
          <span class="text-xs text-white/30 ml-2">Created:</span><span class="text-xs text-white/50">${fmtDate(item.created_at)}</span>
        </div>
        ${item.id ? `<a href="/dossier/${item.id}" class="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light mt-2"><i class="fas fa-file-certificate"></i> View Dossier</a>` : ''}
      </div>
    `;
    show($id('detail-modal'));
  };

  // Delete
  window._inventoryDelete = async function(id) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try {
      await api('/api/inventory/' + id, { method: 'DELETE' });
      toast('Item deleted', 'success');
      load();
    } catch (err) { /* toast shown by api() */ }
  };

  // Initial load
  load();

  // Reload stats periodically
  setInterval(loadStats, 30000);
}

// ========== Requests Page ==========

function initRequests() {
  const tbody = $id('requests-tbody');
  let requests = [];

  async function load(filters = {}) {
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
        <td class="px-5 py-3.5 font-mono text-white/80">${r.budget_usd ? fmtCurrency(r.budget_usd) : '—'}</td>
        <td class="px-5 py-3.5">${urgencyBadge(r.urgency)}</td>
        <td class="px-5 py-3.5 text-white/50 text-sm">${r.condition_required !== undefined ? 'Grade ' + r.condition_required + '+' : '—'}</td>
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
      $id('req-stat-total').textContent = res.total_active || 0;
      $id('req-stat-budget').textContent = fmtCurrency(res.total_budget);
      $id('req-stat-immediate').textContent = res.by_urgency?.Immediate || 0;
      $id('req-stat-matched').textContent = res.by_status?.matched || 0;
    } catch (e) { /* silent */ }
  }

  $id('req-filter-btn').addEventListener('click', () => {
    load({
      brand: $id('req-filter-brand').value,
      urgency: $id('req-filter-urgency').value,
      status: $id('req-filter-status').value,
    });
  });

  $id('add-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    if (data.budget_usd) data.budget_usd = parseFloat(data.budget_usd);
    if (data.condition_required) data.condition_required = parseInt(data.condition_required);
    try {
      await api('/api/requests', { method: 'POST', data });
      toast('Request created', 'success');
      hide($id('add-request-modal'));
      form.reset();
      load();
    } catch (err) { /* toast shown by api() */ }
  });

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
  $id('run-match-btn').addEventListener('click', async () => {
    const btn = $id('run-match-btn');
    const spinner = $id('match-spinner');
    const results = $id('match-results');

    btn.disabled = true;
    show(spinner);

    try {
      const res = await api('/api/matching/run', { method: 'POST' });

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
                <span class="text-white/20">→</span>
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
          <!-- Dimension scores -->
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

      // Update stats
      $id('match-stat-total').textContent = res.total || res.matches.length;
      $id('match-stat-avg').textContent = res.average_score ? Math.round(res.average_score * 100) + '%' : '—';
      $id('match-stat-pending').textContent = res.by_status?.pending || 0;
      $id('match-stat-accepted').textContent = res.by_status?.accepted || 0;

    } catch (err) {
      results.innerHTML = `<div class="bg-card border border-red-500/20 rounded-xl p-8 text-center text-red-400/60">
        <i class="fas fa-triangle-exclamation text-3xl mb-2 block"></i>
        <p>Matchmaking failed. Ensure inventory and client requests exist.</p>
      </div>`;
    } finally {
      btn.disabled = false;
      hide(spinner);
    }
  });

  window._matchAction = async function(matchId, action) {
    try {
      await api(`/api/matching/${matchId}/${action}`, { method: 'POST' });
      toast('Match ' + action, 'success');
      // Re-run matchmaking to refresh
      $id('run-match-btn').click();
    } catch (err) { /* toast handled */ }
  };

  // Auto-load stats on page load
  (async () => {
    try {
      const res = await api('/api/matching/stats');
      if (res.total !== undefined) $id('match-stat-total').textContent = res.total;
      if (res.total_pending !== undefined) $id('match-stat-pending').textContent = res.total_pending;
      if (res.total_accepted !== undefined) $id('match-stat-accepted').textContent = res.total_accepted;
    } catch (e) { /* silent */ }
  })();
}

// ========== Dossier Page ==========

function initDossier() {
  const listContainer = $id('dossiers-list');

  // If specific dossier ID in URL path
  const pathMatch = window.location.pathname.match(/\/dossier\/(.+)/);
  if (pathMatch) {
    loadDossier(pathMatch[1]);
  }

  // Load dossiers list
  async function loadList() {
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
                ${fmtText(d.reference_number)} · ${fmtDate(d.valuation_date)}
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold font-mono text-gold">${fmtCurrency(d.estimated_value)}</div>
              <div class="text-xs text-white/40">${d.confidence || 0}% confidence</div>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-3 text-xs text-white/20">
            <span><i class="fas fa-qrcode mr-1"></i>${fmtText(d.qr_code_token)?.slice(0, 12) || '—'}</span>
            <span><i class="fas fa-download mr-1"></i>${d.export_count || 0} exports</span>
          </div>
        </div>
      `).join('');
    } catch (e) {
      listContainer.innerHTML = `<div class="bg-card border border-border rounded-xl p-8 text-center text-red-400/60">Failed to load dossiers</div>`;
    }
  }

  // View single dossier
  window._dossierView = function(id) {
    loadDossier(id);
    // Scroll to certificate
    const cert = $id('dossier-detail');
    if (cert) { show(cert); cert.scrollIntoView({ behavior: 'smooth' }); }
  };

  async function loadDossier(id) {
    try {
      const d = await api('/api/dossiers/' + id);
      show($id('dossier-detail'));

      // Asset details
      $id('cert-asset').innerHTML = `
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Brand</div><div class="text-sm text-white font-medium">${fmtText(d.brand)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Model</div><div class="text-sm text-white">${fmtText(d.model)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Category</div><div class="text-sm text-white">${fmtText(d.category)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Reference</div><div class="text-sm text-white font-mono">${fmtText(d.reference_number)}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Year</div><div class="text-sm text-white">${d.year || '—'}</div></div>
          <div class="bg-surface rounded-lg p-3"><div class="text-xs text-white/30">Condition</div><div class="text-sm text-white">${fmtText(d.condition_label)} (Grade ${d.condition_grade ?? '—'})</div></div>
          <div class="bg-surface rounded-lg p-3 col-span-2"><div class="text-xs text-white/30">Estimated Value</div><div class="text-lg font-bold font-mono text-gold">${fmtCurrency(d.estimated_value)}</div></div>
        </div>
      `;

      // Confidence breakdown
      const cb = d.confidence_breakdown || {};
      $id('cert-confidence').innerHTML = Object.entries(cb).map(([k, v]) => renderConfidenceBar(k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), v)).join('');

      // Reasoning
      $id('cert-reasoning').textContent = d.authentication_notes || d.valuation_summary || 'AI-authenticated by CuratedLux multi-modal pipeline.';

      // QR
      $id('cert-qr').textContent = d.qr_code_token || d.id?.slice(0, 16) || '—';

      // Signature
      $id('cert-appraiser').textContent = d.appraiser_name || 'CuratedLux AI';
      $id('cert-signature').textContent = 'Digitally signed · CuratedLux v2.0';
      $id('cert-exports').textContent = d.export_count || 0;
      $id('cert-date').textContent = 'Generated ' + fmtDate(d.created_at || d.valuation_date);

      // Export button
      $id('export-dossier-btn').onclick = async () => {
        try {
          await api('/api/dossiers/' + d.id + '/export', { method: 'POST' });
          toast('Dossier exported. Export counter updated.', 'success');
          // Simple print trigger
          window.print();
        } catch (err) { /* toast handled */ }
      };

    } catch (err) {
      toast('Failed to load dossier', 'error');
    }
  }

  // Create dossier
  // Load inventory items for select
  (async () => {
    try {
      const invRes = await api('/api/inventory?status=active');
      const sel = $id('dossier-inv-id');
      sel.innerHTML = '<option value="">Select an item...</option>' +
        (invRes.items || []).map(i => `<option value="${i.id}">${fmtText(i.brand)} ${fmtText(i.model)} (${fmtText(i.reference_number)})</option>`).join('');
    } catch (e) { /* silent */ }
  })();

  $id('create-dossier-btn').addEventListener('click', async () => {
    const invId = $id('dossier-inv-id').value;
    if (!invId) { toast('Select an inventory item', 'warning'); return; }
    const notes = $id('dossier-notes').value;
    try {
      const res = await api('/api/dossiers', { method: 'POST', data: { inventory_item_id: invId, notes } });
      toast('Dossier generated', 'success');
      hide($id('create-dossier-modal'));
      loadList();
      loadDossier(res.id);
    } catch (err) { /* toast handled */ }
  });

  loadList();
}

// ========== Helpers ==========

function fmtText(val) {
  if (!val) return '—';
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
