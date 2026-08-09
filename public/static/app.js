/**
 * CuratedLux v2.0 — Client-side application logic
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
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

function fmtCurrency(n) {
  if (!n || n === 0) return '$0';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + ',' + String(n % 1000).padStart(3, '0');
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
