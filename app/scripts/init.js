// ── DOM refs ─────────────────────────────────────────────
const messagesEl = document.getElementById('messages');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send-btn');
const convListEl = document.getElementById('conversation-list');

// ── Init ─────────────────────────────────────────────────
(async () => {
  if (window.electronAPI) {
    const port = await window.electronAPI.getProxyPort();
    API_BASE = `http://127.0.0.1:${port}`;
    conversations = await window.electronAPI.loadConversations();
    renderSidebar();
  }
  // Restore saved theme
  const saved = localStorage.getItem('theme');
  if (saved === 'light') applyTheme('light');
})();

marked.use({
  breaks: true,
  gfm: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

// Auto-resize textarea
promptEl.addEventListener('input', () => {
  promptEl.style.height = 'auto';
  promptEl.style.height = Math.min(promptEl.scrollHeight, 180) + 'px';
});

promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!isStreaming) sendMessage();
  }
});

// ── Pull progress events ─────────────────────────────────
window.electronAPI.onPullProgress((data) => {
  const { model, status, total, completed, done, paused } = data;

  if (paused) {
    stopSpeedInterval(model);
    pullingModels.delete(model);
    pausedModels[model] = pullProgress[model] || { pct: 0, label: 'Paused' };
    delete pullProgress[model];
    renderModelMenu();
    renderManageModels();
    return;
  }

  if (done) {
    stopSpeedInterval(model);
    pullingModels.delete(model);
    delete pullProgress[model];
    delete pausedModels[model];
    fetchLocalModels();
    return;
  }

  const prev = pullProgress[model] || {};
  let pct = prev.pct || 0;
  let label = '…';

  if (total !== undefined && completed !== undefined) {
    pct = Math.round((completed / total) * 100);
    pullProgress[model] = {
      ...prev,
      pct,
      label: `${pct}%`,
      total: formatBytes(total),
      rawCompleted: completed,
      rawTotal: total,
    };
  } else {
    if (status === 'pulling manifest')        label = 'Preparing…';
    else if (status?.startsWith('verifying')) { pct = 95; label = 'Verifying…'; }
    else if (status?.startsWith('writing'))   { pct = 98; label = 'Finalizing…'; }
    else if (status)                           label = status;
    pullProgress[model] = { ...prev, pct, label, speed: '', eta: '' };
  }

  const safeId = model.replace(/[^a-z0-9]/gi, '_');
  const barEl  = document.getElementById(`pull-bar-${safeId}`);
  const pctEl  = document.getElementById(`pull-pct-${safeId}`);
  if (barEl) { barEl.classList.remove('indeterminate'); barEl.style.width = `${pct}%`; }
  if (pctEl)   pctEl.textContent = pct > 0 ? `${pct}%` : label;

  const mmSafeId = 'mm-' + safeId;
  const mmBarEl  = document.getElementById(`${mmSafeId}-bar`);
  const mmPctEl  = document.getElementById(`${mmSafeId}-pct`);
  if (mmBarEl) mmBarEl.style.width = `${pct}%`;
  if (mmPctEl) mmPctEl.textContent = pct > 0 ? `${pct}%` : label;
});

// ── Close menus on outside click ─────────────────────────
document.addEventListener('click', (e) => {
  if (!document.getElementById('model-dropdown-wrap').contains(e.target)) {
    modelMenu.classList.remove('open');
  }
  if (!document.getElementById('manage-footer').contains(e.target)) {
    suggestionsEl.classList.remove('open');
  }
});

// ── Manage modal input events ────────────────────────────
manageAddInput.addEventListener('input', renderSuggestions);
manageAddInput.addEventListener('focus', renderSuggestions);
manageAddInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const name = manageAddInput.value.trim();
    if (name) installModel(name);
  }
  if (e.key === 'Escape') {
    suggestionsEl.classList.remove('open');
    manageAddInput.blur();
  }
});

// ── Init model dropdown ──────────────────────────────────
modelBtnLabel.textContent = currentModel;
promptEl.placeholder = `Message ${currentModel}\u2026`;
fetchLocalModels();

promptEl.focus();
