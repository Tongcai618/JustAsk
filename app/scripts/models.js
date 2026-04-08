// ── Model dropdown & management ──────────────────────────

const modelMenu = document.getElementById('model-menu');
const modelBtnLabel = document.getElementById('model-btn-label');
const manageOverlay = document.getElementById('manage-overlay');
const manageBody = document.getElementById('manage-body');
const manageAddInput = document.getElementById('manage-add-input');
const suggestionsEl = document.getElementById('manage-suggestions');

async function fetchLocalModels() {
  try {
    const port = await window.electronAPI.getProxyPort();
    const res = await fetch(`http://127.0.0.1:${port}/api/tags`);
    const data = await res.json();
    localModels = new Set((data.models || []).map(m => m.name));
    localModelInfo = {};
    for (const m of (data.models || [])) {
      localModelInfo[m.name] = m;
    }
  } catch {
    localModels = new Set();
    localModelInfo = {};
  }
  renderModelMenu();
  renderManageModels();
}

function makeActionBtn(svgPath, title, onClick) {
  const btn = document.createElement('button');
  btn.className = 'model-pull-action';
  btn.title = title;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${svgPath}"/></svg>`;
  btn.onclick = (e) => { e.stopPropagation(); onClick(); };
  return btn;
}

function renderModelMenu() {
  modelMenu.innerHTML = '';
  for (const m of MODELS) {
    const installed = localModels.size === 0 || localModels.has(m);
    const pulling  = pullingModels.has(m);
    const paused   = !!pausedModels[m];

    const opt = document.createElement('div');

    if (pulling) {
      opt.className = 'model-option pulling';
    } else if (paused) {
      opt.className = 'model-option paused';
    } else if (!installed) {
      opt.className = 'model-option not-installed';
      opt.onclick = () => pullModel(m);
    } else {
      opt.className = 'model-option' + (m === currentModel ? ' selected' : '');
      opt.onclick = () => selectModel(m);
    }

    if (pulling || paused) {
      const safeId = m.replace(/[^a-z0-9]/gi, '_');
      const prog = (pulling ? pullProgress[m] : pausedModels[m]) || { pct: 0, label: '…' };
      const indeterminate = pulling && prog.pct === 0;
      const pctDisplay = prog.pct > 0 ? `${prog.pct}%` : prog.label;
      const statsDisplay = paused
        ? (prog.total || '')
        : [prog.speed, prog.total, prog.eta].filter(Boolean).join(' · ');

      const icon = document.createElement('span');
      icon.className = 'model-plus';
      icon.textContent = paused ? '⏸' : '↓';

      const wrap = document.createElement('div');
      wrap.className = 'model-pull-progress';
      wrap.innerHTML = `
        <div class="model-pull-top">
          <span class="model-pull-name">${m}</span>
          <span class="model-pull-pct" id="pull-pct-${safeId}">${paused ? (prog.pct > 0 ? 'Paused · ' + prog.pct + '%' : 'Paused') : pctDisplay}</span>
        </div>
        <div class="model-pull-bar-track">
          <div class="model-pull-bar-fill${indeterminate ? ' indeterminate' : ''}"
               id="pull-bar-${safeId}"
               style="width:${indeterminate ? '30' : prog.pct}%"></div>
        </div>
        <div class="model-pull-stats" id="pull-stats-${safeId}">${statsDisplay}</div>`;

      const actionBtn = paused
        ? makeActionBtn('M8 5v14l11-7z', 'Resume', () => resumePull(m))
        : makeActionBtn('M6 19h4V5H6v14zm8-14v14h4V5h-4z', 'Pause', () => pausePull(m));

      opt.appendChild(icon);
      opt.appendChild(wrap);
      opt.appendChild(actionBtn);
    } else if (!installed) {
      const plus = document.createElement('span');
      plus.className = 'model-plus';
      plus.textContent = '+';
      const label = document.createElement('span');
      label.textContent = m;
      opt.appendChild(plus);
      opt.appendChild(label);
    } else {
      const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      check.setAttribute('class', 'check');
      check.setAttribute('viewBox', '0 0 24 24');
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', 'currentColor');
      check.setAttribute('stroke-width', '2.5');
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      check.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      const label = document.createElement('span');
      label.textContent = m;
      opt.appendChild(check);
      opt.appendChild(label);
    }

    modelMenu.appendChild(opt);
  }

  // Divider + Manage button
  const divider = document.createElement('hr');
  divider.className = 'model-menu-divider';
  modelMenu.appendChild(divider);

  const manageBtn = document.createElement('div');
  manageBtn.className = 'model-option';
  manageBtn.style.color = 'var(--text-3)';
  manageBtn.style.fontSize = '12px';
  manageBtn.onclick = () => { modelMenu.classList.remove('open'); openManageModal(); };
  manageBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>Manage models…</span>`;
  modelMenu.appendChild(manageBtn);
}

// ── Manage Models modal ──────────────────────────────────

function openManageModal() {
  fetchLocalModels();
  manageOverlay.classList.add('open');
}

function closeManageModal() {
  manageOverlay.classList.remove('open');
}

function renderManageModels() {
  if (!manageOverlay.classList.contains('open')) return;
  manageBody.innerHTML = '';

  const allModels = [...MODELS];
  for (const name of localModels) {
    if (!allModels.includes(name)) allModels.push(name);
  }
  for (const name of pullingModels) {
    if (!allModels.includes(name)) allModels.push(name);
  }
  for (const name in pausedModels) {
    if (!allModels.includes(name)) allModels.push(name);
  }

  for (const m of allModels) {
    const installed = localModels.has(m);
    const pulling   = pullingModels.has(m);
    const paused    = !!pausedModels[m];
    const info      = localModelInfo[m];
    const safeId    = 'mm-' + m.replace(/[^a-z0-9]/gi, '_');

    const row = document.createElement('div');
    row.className = 'mm-row';

    const icon = document.createElement('div');
    if (pulling || paused) {
      icon.className = 'mm-icon pulling';
      icon.textContent = paused ? '⏸' : '↓';
    } else if (installed) {
      icon.className = 'mm-icon installed';
      icon.textContent = '✓';
    } else {
      icon.className = 'mm-icon available';
      icon.textContent = '+';
    }

    if (pulling || paused) {
      const prog = (pulling ? pullProgress[m] : pausedModels[m]) || { pct: 0, label: '…' };
      const pctDisplay = prog.pct > 0 ? `${prog.pct}%` : prog.label;
      const statsDisplay = paused
        ? (prog.total || '')
        : [prog.speed, prog.total, prog.eta].filter(Boolean).join(' · ');

      const wrap = document.createElement('div');
      wrap.className = 'mm-progress';
      wrap.innerHTML = `
        <div class="mm-progress-top">
          <span class="mm-name">${m}</span>
          <span class="mm-meta" id="${safeId}-pct">${paused ? (prog.pct > 0 ? 'Paused · ' + prog.pct + '%' : 'Paused') : pctDisplay}</span>
        </div>
        <div class="model-pull-bar-track">
          <div class="model-pull-bar-fill" id="${safeId}-bar" style="width:${prog.pct}%"></div>
        </div>
        <div class="mm-progress-stats" id="${safeId}-stats">${statsDisplay}</div>`;

      row.appendChild(icon);
      row.appendChild(wrap);

      const actionWrap = document.createElement('div');
      actionWrap.className = 'mm-actions';
      if (paused) {
        actionWrap.innerHTML = `<button class="mm-btn-resume" onclick="resumePull('${m}')">Resume</button>`;
      } else {
        actionWrap.innerHTML = `<button class="mm-btn-pause" onclick="pausePull('${m}')">Pause</button>`;
      }
      actionWrap.innerHTML += `<button class="mm-btn-delete" title="Cancel" onclick="cancelPull('${m}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>`;
      row.appendChild(actionWrap);
    } else {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'mm-info';
      const sizeStr = info ? formatBytes(info.size) : '';
      infoDiv.innerHTML = `
        <span class="mm-name">${m}</span>
        <span class="mm-meta">${installed ? sizeStr : (sizeStr || 'Not installed')}</span>`;
      row.appendChild(icon);
      row.appendChild(infoDiv);

      const actionWrap = document.createElement('div');
      actionWrap.className = 'mm-actions';
      if (!installed) {
        actionWrap.innerHTML = `<button class="mm-btn-install" onclick="pullModel('${m}')">Install</button>`;
        actionWrap.innerHTML += `<button class="mm-btn-delete" title="Remove" onclick="removeModel('${m}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>`;
      } else {
        if (m === currentModel) {
          actionWrap.innerHTML += `<span class="mm-meta" style="padding:4px 0;">Active</span>`;
        } else {
          actionWrap.innerHTML += `<button onclick="selectModel('${m}');renderManageModels()">Select</button>`;
        }
        actionWrap.innerHTML += `<button class="mm-btn-delete" title="Delete" onclick="deleteModel('${m}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>`;
      }
      row.appendChild(actionWrap);
    }

    manageBody.appendChild(row);
  }
}

// ── Model suggestions ────────────────────────────────────

function installModel(name) {
  if (!MODELS.includes(name)) MODELS.push(name);
  manageAddInput.value = '';
  suggestionsEl.classList.remove('open');
  pullModel(name);
  renderManageModels();
}

function renderSuggestions() {
  const query = manageAddInput.value.trim().toLowerCase();
  suggestionsEl.innerHTML = '';

  if (!query) {
    suggestionsEl.classList.remove('open');
    return;
  }

  const matches = MODEL_CATALOG.filter(m =>
    m.name.includes(query) || m.desc.toLowerCase().includes(query)
  ).slice(0, 8);

  if (matches.length === 0 && !query) {
    suggestionsEl.classList.remove('open');
    return;
  }

  for (const m of matches) {
    const installed = localModels.has(m.name);
    const item = document.createElement('div');
    item.className = 'ms-item';
    if (!installed) {
      item.onclick = () => installModel(m.name);
    }

    item.innerHTML = `
      <div class="ms-info">
        <div class="ms-name">${m.name}</div>
        <div class="ms-desc">${m.desc}</div>
      </div>
      <div class="ms-sizes">${m.sizes}</div>
      ${installed ? '<span class="ms-installed">Installed</span>' : ''}`;
    suggestionsEl.appendChild(item);
  }

  const exactMatch = matches.some(m => m.name === query);
  if (!exactMatch && query) {
    const custom = document.createElement('div');
    custom.className = 'ms-custom';
    custom.onclick = () => installModel(query);
    custom.innerHTML = `Install <strong>${query}</strong> from Ollama registry`;
    suggestionsEl.appendChild(custom);
  }

  suggestionsEl.classList.add('open');
}

// ── Model actions ────────────────────────────────────────

async function deleteModel(model) {
  try {
    await window.electronAPI.deleteModel(model);
  } catch (err) {
    console.error('Delete failed:', err);
  }
  if (model === currentModel) {
    await fetchLocalModels();
    const fallback = MODELS.find(m => localModels.has(m)) || MODELS[0];
    selectModel(fallback);
  } else {
    fetchLocalModels();
  }
}

async function pullModel(model) {
  delete pausedModels[model];
  pullingModels.add(model);
  pullProgress[model] = pullProgress[model] || { pct: 0, label: 'Preparing…' };
  renderModelMenu();
  renderManageModels();
  startSpeedInterval(model);
  try {
    await window.electronAPI.pullModel(model);
  } catch (err) {
    console.error('Pull failed:', err);
  } finally {
    if (pullingModels.has(model)) {
      stopSpeedInterval(model);
      pullingModels.delete(model);
      delete pullProgress[model];
      fetchLocalModels();
    }
  }
}

function pausePull(model) {
  window.electronAPI.pausePull(model);
}

function resumePull(model) {
  pullModel(model);
}

async function cancelPull(model) {
  if (pullingModels.has(model)) {
    await window.electronAPI.pausePull(model);
  }
  stopSpeedInterval(model);
  pullingModels.delete(model);
  delete pullProgress[model];
  delete pausedModels[model];
  if (!localModels.has(model)) {
    const idx = MODELS.indexOf(model);
    if (idx >= 0) MODELS.splice(idx, 1);
  }
  renderModelMenu();
  renderManageModels();
}

function removeModel(model) {
  const idx = MODELS.indexOf(model);
  if (idx >= 0) MODELS.splice(idx, 1);
  renderModelMenu();
  renderManageModels();
}

// ── Pull progress helpers ────────────────────────────────

function stopSpeedInterval(model) {
  clearInterval(speedIntervals[model]);
  delete speedIntervals[model];
}

function startSpeedInterval(model) {
  stopSpeedInterval(model);
  let prevCompleted = pullProgress[model]?.rawCompleted || 0;

  speedIntervals[model] = setInterval(() => {
    if (!pullingModels.has(model)) { stopSpeedInterval(model); return; }

    const prog = pullProgress[model];
    if (!prog) return;

    const curCompleted = prog.rawCompleted || 0;
    const bytesDelta   = curCompleted - prevCompleted;
    prevCompleted      = curCompleted;

    const speedRaw = bytesDelta > 0 ? bytesDelta : 0;
    const speed    = speedRaw > 0 ? formatSpeed(speedRaw) : '';
    const eta      = speedRaw > 0 && prog.rawTotal
      ? formatETA((prog.rawTotal - curCompleted) / speedRaw)
      : (prog.eta || '');

    pullProgress[model] = { ...prog, speed, eta };

    const safeId  = model.replace(/[^a-z0-9]/gi, '_');
    const statsText = [speed, prog.total, eta].filter(Boolean).join(' · ');

    const statsEl = document.getElementById(`pull-stats-${safeId}`);
    if (statsEl) statsEl.textContent = statsText;

    const mmSafeId  = 'mm-' + safeId;
    const mmStatsEl = document.getElementById(`${mmSafeId}-stats`);
    if (mmStatsEl) mmStatsEl.textContent = statsText;
  }, 1000);
}

function toggleModelMenu() {
  const willOpen = !modelMenu.classList.contains('open');
  modelMenu.classList.toggle('open');
  if (willOpen) fetchLocalModels();
}

function selectModel(model) {
  currentModel = model;
  localStorage.setItem('model', model);
  modelBtnLabel.textContent = model;
  promptEl.placeholder = `Message ${model}\u2026`;
  modelMenu.classList.remove('open');
  renderModelMenu();
}
