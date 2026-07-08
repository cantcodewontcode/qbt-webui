
function findEl(id, container) {
  return container ? container.querySelector('#' + id) : document.getElementById(id);
}

let activeTab      = 'general';
let selectedFiles  = new Set();

let inspectorPeerRid  = 0;
let inspectorInterval = null;
let inspectorFiles    = [];
let inspectorPeers    = {};
let inspectorTrackers = [];

let _mobileContainer = null;


function renderStateBadge(t) {
  const mod = torrentStateClass(t).replace('state-', '');
  return `<span class="state-badge state-badge--${mod}">${torrentStateLabel(t)}</span>`;
}

function renderSpeedLimits(t) {
  // dl_limit: -1=global, 0=unlimited, >0=bytes/s
  const dlEnabled = (t.dl_limit ?? -1) > 0;
  const dlMbps    = dlEnabled ? bytesToMbps(t.dl_limit) : '';
  const ulEnabled = (t.up_limit ?? -1) > 0;
  const ulMbps    = ulEnabled ? bytesToMbps(t.up_limit) : '';
  return `
  <div class="inspector-section-title">Speed limits</div>
  <div class="inspector-setting-row">
    <label>
      <input type="checkbox" id="insp-dl-limited"${dlEnabled ? ' checked' : ''}>
      Download limit
    </label>
    <input type="number" id="insp-dl-limit" class="input settings-input"
           value="${dlMbps}"${!dlEnabled ? ' disabled' : ''}> Mbps
  </div>
  <div class="inspector-setting-row">
    <label>
      <input type="checkbox" id="insp-ul-limited"${ulEnabled ? ' checked' : ''}>
      Upload limit
    </label>
    <input type="number" id="insp-ul-limit" class="input settings-input"
           value="${ulMbps}"${!ulEnabled ? ' disabled' : ''}> Mbps
  </div>`;
}

function renderSeedLimits(t) {
  // ratio_limit: -1=global, -2=no limit, >=0=specific
  const ratioLimit = t.ratio_limit ?? -1;
  let mode;
  if (ratioLimit === -2)     mode = 'forever';
  else if (ratioLimit >= 0)  mode = 'specific';
  else                       mode = 'global';
  const ratioVal = ratioLimit >= 0 ? ratioLimit.toFixed(2) : '2.00';
  return `
  <div class="inspector-section-title">Seeding</div>
  <div class="inspector-setting-row">
    <label for="insp-ratio-mode">Ratio limit</label>
    <select id="insp-ratio-mode" class="insp-select">
      <option value="global"${mode === 'global' ? ' selected' : ''}>Use global setting</option>
      <option value="specific"${mode === 'specific' ? ' selected' : ''}>Stop seeding at ratio</option>
      <option value="forever"${mode === 'forever' ? ' selected' : ''}>Seed forever</option>
    </select>
    <input type="text" inputmode="decimal" id="insp-ratio-limit" class="input settings-input insp-ratio-input"
           value="${ratioVal}"${mode !== 'specific' ? ' disabled' : ''}>
  </div>`;
}

function wireGeneralControls(t, container) {
  const dlLimited = findEl('insp-dl-limited', container);
  const dlLimit   = findEl('insp-dl-limit', container);
  const ulLimited = findEl('insp-ul-limited', container);
  const ulLimit   = findEl('insp-ul-limit', container);
  const rMode     = findEl('insp-ratio-mode', container);
  const rLimit    = findEl('insp-ratio-limit', container);

  dlLimited?.addEventListener('change', () => {
    dlLimit.disabled = !dlLimited.checked;
    if (dlLimited.checked) {
      const bytes = mbpsToBytes(Number(dlLimit.value) || 10);
      if (bytes > 0) torrentSetDownloadLimit([t.hash], bytes);
    } else {
      torrentSetDownloadLimit([t.hash], -1);
    }
  });

  dlLimit?.addEventListener('change', () => {
    if (!dlLimited?.checked) return;
    const bytes = mbpsToBytes(Number(dlLimit.value) || 0);
    if (bytes > 0) torrentSetDownloadLimit([t.hash], bytes);
  });

  ulLimited?.addEventListener('change', () => {
    ulLimit.disabled = !ulLimited.checked;
    if (ulLimited.checked) {
      const bytes = mbpsToBytes(Number(ulLimit.value) || 10);
      if (bytes > 0) torrentSetUploadLimit([t.hash], bytes);
    } else {
      torrentSetUploadLimit([t.hash], -1);
    }
  });

  ulLimit?.addEventListener('change', () => {
    if (!ulLimited?.checked) return;
    const bytes = mbpsToBytes(Number(ulLimit.value) || 0);
    if (bytes > 0) torrentSetUploadLimit([t.hash], bytes);
  });

  rMode?.addEventListener('change', () => {
    const mode = rMode.value;
    if (rLimit) rLimit.disabled = mode !== 'specific';
    if (mode === 'global')   torrentSetShareLimits([t.hash], -1, -1);
    else if (mode === 'forever') torrentSetShareLimits([t.hash], -2, -1);
  });

  rLimit?.addEventListener('change', () => {
    if (rMode?.value !== 'specific') return;
    const val = parseFloat(rLimit.value);
    if (isNaN(val) || val < 0) {
      rLimit.value = (t.ratio_limit >= 0 ? t.ratio_limit : 2).toFixed(2);
      return;
    }
    torrentSetShareLimits([t.hash], val, -1);
  });
}

function renderGeneral(t, container) {
  const props = t._props || {};

  const connected    = (t.num_leechs ?? 0) + (t.num_seeds ?? 0);
  const swarmSeeds   = t.num_complete ?? 0;
  const swarmLeechs  = t.num_incomplete ?? 0;
  const swarmTotal   = swarmSeeds + swarmLeechs;
  const peersText = connected === 0
    ? 'None'
    : swarmTotal > 0
      ? `${connected} connected of ${swarmTotal} (${t.num_seeds ?? 0}↑ / ${t.num_leechs ?? 0}↓ connected, ${swarmSeeds} seeds in swarm)`
      : `${connected} connected (${t.num_seeds ?? 0} seeds, ${t.num_leechs ?? 0} leeches)`;

  const connectionsText = props.nb_connections != null
    ? `${props.nb_connections} (max: ${props.nb_connections_limit})`
    : '—';

  const isDone = (t.progress ?? 0) >= 1;

  const rows = [
    ['Name',           t.name || '—'],
    ['State',          renderStateBadge(t)],
    ['Size',           formatSize(t.total_size ?? t.size ?? 0)],
    ['Progress',       formatPercent(t.progress ?? 0)],
    !isDone && ['Remaining',      (t.amount_left != null && t.amount_left > 0) ? formatSize(t.amount_left) : '—'],
    !isDone && ['Downloaded',     formatSize(props.total_downloaded ?? t.downloaded ?? 0)],
    ['Uploaded',       formatSize(props.total_uploaded ?? t.uploaded ?? 0)],
    ['Ratio',          formatRatio(t.ratio ?? 0)],
    !isDone && ['Download speed', formatSpeed(t.dlspeed ?? 0)],
    ['Upload speed',   formatSpeed(t.upspeed ?? 0)],
    !isDone && ['ETA',            (() => {
      const sc = torrentStateClass(t);
      if (sc === 'state-finished') return '—';
      if (sc === 'state-seeding') {
        let limit = null;
        if ((t.ratio_limit ?? -2) >= 0) {
          limit = t.ratio_limit;
        } else if ((t.ratio_limit ?? -2) === -1) {
          const ge = state.prefs?.max_ratio_enabled ?? false;
          const gr = state.prefs?.max_ratio ?? null;
          if (ge && gr != null && gr > 0) limit = gr;
        }
        if (limit === null) return '—';
        const remaining = limit * (t.size || 0) - (t.uploaded ?? 0);
        if (remaining <= 0) return 'Done';
        const spd = t.upspeed ?? 0;
        return spd > 0 ? formatETA(Math.round(remaining / spd)) : '—';
      }
      return formatETA(t.eta ?? -1);
    })()],
    ['Location',       `<span class="info-value--mono">${esc((() => { if (!t.content_path) return t.save_path || '—'; const i = t.content_path.lastIndexOf('/' + (t.name || '')); return i > 0 ? t.content_path.substring(0, i) : t.save_path || t.content_path; })())}</span>`],
    ['Added',          (t.added_on && t.added_on > 946684800) ? formatDate(t.added_on) : '—'],
    ['Completed',      (t.completion_on && t.completion_on > 946684800) ? formatDate(t.completion_on) : '—'],
    !isDone && ['Availability',   (t.availability != null && t.availability >= 0)
      ? formatPercent(Math.min(1, t.availability))
      : '—'],
    ['Last active',    (t.last_activity && t.last_activity > 946684800) ? formatDate(t.last_activity) : '—'],
    ['Connections',    connectionsText],
    ['Peers',          peersText],
    ['Tracker',        esc(t.tracker || '—')],
    ['Trackers',       t.trackers_count != null ? String(t.trackers_count) : '—'],
  ].filter(Boolean);

  let html = rows.map(([label, value]) =>
    `<div class="info-row">
     <span class="info-label">${label}</span>
     <span class="info-value">${value}</span>
   </div>`
  ).join('');

  if (t.magnet_uri) {
    html += `<div class="info-row">
    <span class="info-label">Magnet</span>
    <span class="info-value">
      <button class="btn-ghost btn--sm" id="btn-copy-magnet" aria-label="Copy magnet link">
        ${iconCopy(14)} Copy link
      </button>
    </span>
  </div>`;
  }

  html += renderSpeedLimits(t);
  html += renderSeedLimits(t);

  findEl('tab-general', container).innerHTML = html;

  const copyBtn = findEl('btn-copy-magnet', container);
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(t.magnet_uri).then(() => {
        copyBtn.innerHTML = `${iconCopy(14)} Copied!`;
        setTimeout(() => { copyBtn.innerHTML = `${iconCopy(14)} Copy link`; }, 1500);
      }).catch(() => {});
    });
  }

  wireGeneralControls(t, container);
}

function updateFileRowSelection(fileList) {
  if (!fileList) return;
  fileList.querySelectorAll('.file-row').forEach(row => {
    const idx = Number(row.dataset.index);
    row.classList.toggle('file-row--selected', selectedFiles.has(idx));
  });
}

function wireFileControls(t, panel) {
  if (!panel) panel = document.getElementById('tab-files');
  if (!panel) return;

  const searchInput = panel.querySelector('#file-search-input');
  const searchClear = panel.querySelector('#file-search-clear');
  const fileList    = panel.querySelector('.file-list');

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase().replace(/\./g, ' ');
    fileList?.querySelectorAll('.file-row').forEach(row => {
      const nameEl = row.querySelector('.file-name');
      const name   = (nameEl?.textContent || '').toLowerCase().replace(/\./g, ' ');
      row.style.display = name.includes(q) ? '' : 'none';
    });
    if (searchClear) searchClear.hidden = !searchInput.value;
  });

  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.hidden = true;
    fileList?.querySelectorAll('.file-row').forEach(row => {
      row.style.display = '';
    });
    panel.querySelector('#file-search-input')?.focus();
  });

  let lastClickedFileIndex = null;

  fileList?.addEventListener('click', (e) => {
    const row = e.target.closest('.file-row');
    if (!row) return;
    if (e.target.closest('.file-priority')) return;

    const idx = Number(row.dataset.index);

    if (e.shiftKey && lastClickedFileIndex !== null) {
      const allRows = [...fileList.querySelectorAll('.file-row:not([style*="display: none"])')];
      const idxList = allRows.map(r => Number(r.dataset.index));
      const a = idxList.indexOf(lastClickedFileIndex);
      const b = idxList.indexOf(idx);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      for (let i = lo; i <= hi; i++) {
        selectedFiles.add(idxList[i]);
      }
    } else if (e.metaKey || e.ctrlKey) {
      if (selectedFiles.has(idx)) {
        selectedFiles.delete(idx);
      } else {
        selectedFiles.add(idx);
      }
    } else {
      selectedFiles.clear();
      selectedFiles.add(idx);
    }

    lastClickedFileIndex = idx;
    updateFileRowSelection(fileList);
  });

  panel.querySelectorAll('.file-priority').forEach(sel => {
    sel.addEventListener('change', async () => {
      const idx = Number(sel.dataset.index);
      const val = Number(sel.value);

      const applyTo = selectedFiles.size > 1 && selectedFiles.has(idx)
        ? [...selectedFiles]
        : [idx];

      try {
        await torrentFilePriority(state.inspectorId, applyTo, val);
        inspectorFiles = await getTorrentFiles(state.inspectorId);
        renderActiveTab(_mobileContainer || undefined);
      } catch (err) {
        showToast('Failed to update priority: ' + err.message, 'error');
      }
    });
  });
}

function renderFiles(files, container) {
  const panel = findEl('tab-files', container);

  if (!files || files.length === 0) {
    selectedFiles = new Set();
    panel.innerHTML = '<p class="inspector-empty">No files.</p>';
    return;
  }

  // ── In-place update path ──────────────────────────────────────────
  // If the file list is already rendered with the same number of files,
  // update only progress and size values directly on existing elements.
  // Never touch the search bar, focus, or selection.
  const existingList = panel.querySelector('.file-list');
  const existingRows = existingList ? existingList.querySelectorAll('.file-row') : [];
  if (existingRows.length === files.length) {
    files.forEach((file, i) => {
      const idx   = file.index ?? i;
      const row   = existingList.querySelector(`.file-row[data-index="${idx}"]`);
      if (!row) return;
      const pctEl  = row.querySelector('.file-pct');
      const sizeEl = row.querySelector('.file-size');
      const prioEl = row.querySelector('.file-priority');
      if (pctEl)  pctEl.textContent  = formatPercent(Math.min(1, file.progress ?? 0));
      if (sizeEl) sizeEl.textContent = formatSize(file.size);
      if (prioEl) {
        const wanted = (file.priority ?? 1) !== 0;
        const newVal = wanted ? String(file.priority ?? 1) : '0';
        if (prioEl.value !== newVal) prioEl.value = newVal;
      }
    });
    return;
  }
  // ── Full rebuild path (first render or file count changed) ────────
  selectedFiles = new Set();
  const existingSearch = panel.querySelector('#file-search-input')?.value || '';
  const searchHadFocus = document.activeElement?.id === 'file-search-input';

  const rows = files.map((file, i) => {
    const idx      = file.index ?? i;
    const pct      = formatPercent(Math.min(1, file.progress ?? 0));
    const priority = file.priority ?? 1;
    const wanted   = priority !== 0;

    return `<div class="file-row" data-index="${idx}">
    <div class="file-row__name">
      <span class="file-name" title="${esc(file.name)}">${esc(file.name.split('/').pop())}</span>
    </div>
    <div class="file-row__meta">
      <span class="file-size row-data">${formatSize(file.size)}</span>
      <span class="file-pct row-data">${pct}</span>
      <label class="file-priority-label">Priority
        <select class="priority-select file-priority" data-index="${idx}">
          <option value="7"${priority === 7  && wanted ? ' selected' : ''}>Maximum</option>
          <option value="6"${priority === 6  && wanted ? ' selected' : ''}>High</option>
          <option value="1"${priority === 1  && wanted ? ' selected' : ''}>Normal</option>
          <option value="0"${!wanted ? ' selected' : ''}>Skip</option>
        </select>
      </label>
    </div>
  </div>`;
  }).join('');

  const searchBar = `<div class="file-search-bar">
<div class="search-wrap">
  ${iconSearch(14)}
  <input type="text" id="file-search-input" class="search-input"
         placeholder="Search files…" autocomplete="off" spellcheck="false"
         aria-label="Search files by name">
  <button class="search-clear" id="file-search-clear"
          aria-label="Clear file search" hidden>${iconX(14)}</button>
</div>
</div>`;

  panel.innerHTML = searchBar + `<div class="file-list">${rows}</div>`;
  wireFileControls(null, panel);

  // Restore search state after re-render
  if (existingSearch) {
    const searchInput = panel.querySelector('#file-search-input');
    const searchClear = panel.querySelector('#file-search-clear');
    const fileList    = panel.querySelector('.file-list');
    if (searchInput) searchInput.value = existingSearch;
    if (searchClear) searchClear.hidden = false;
    const q = existingSearch.toLowerCase().replace(/\./g, ' ');
    fileList?.querySelectorAll('.file-row').forEach(row => {
      const nameEl = row.querySelector('.file-name');
      const name   = (nameEl?.textContent || '').toLowerCase().replace(/\./g, ' ');
      row.style.display = name.includes(q) ? '' : 'none';
    });
  }
  if (searchHadFocus) {
    const searchInput = panel.querySelector('#file-search-input');
    if (searchInput) {
      searchInput.focus();
      const len = searchInput.value.length;
      searchInput.setSelectionRange(len, len);
    }
  }
}

function renderPeers(container) {
  const peers = Object.values(inspectorPeers);
  if (peers.length === 0) {
    findEl('tab-peers', container).innerHTML =
      '<p class="inspector-empty">No peers connected.</p>';
    return;
  }

  const rows = peers.map(peer => {
    const dlSpeed = peer.dl_speed ? formatSpeed(peer.dl_speed) : '—';
    const upSpeed = peer.up_speed ? formatSpeed(peer.up_speed) : '—';
    const pct     = formatPercent(peer.progress ?? 0);

    return `<div class="peer-row">
    <div class="peer-row__main">
      <span class="peer-addr row-data">${esc(peer.ip)}:${peer.port}</span>
      <span class="peer-client">${esc(peer.client || 'Unknown')}</span>
      <span class="peer-flags" title="${esc(peer.flags_desc || '')}">${esc(peer.flags || '')}</span>
      ${peer.connection ? `<span class="peer-conn">${esc(peer.connection)}</span>` : ''}
      ${peer.country_code ? `<span class="peer-country">${esc(peer.country_code)}</span>` : ''}
    </div>
    <div class="peer-row__stats">
      <span class="peer-stat">↓ ${dlSpeed}</span>
      <span class="peer-stat">↑ ${upSpeed}</span>
      <span class="peer-stat">${pct} have</span>
      ${peer.relevance != null ? `<span class="peer-stat">${(peer.relevance * 100).toFixed(0)}% relevant</span>` : ''}
    </div>
  </div>`;
  }).join('');

  findEl('tab-peers', container).innerHTML = rows;
}

function renderTrackers(container) {
  if (!inspectorTrackers || inspectorTrackers.length === 0) {
    findEl('tab-trackers', container).innerHTML =
      '<p class="inspector-empty">No trackers.</p>';
    return;
  }

  const STATUS_LABELS = {
    0: 'Disabled',
    1: 'Not contacted',
    2: 'Working',
    3: 'Updating',
    4: 'Error',
  };

  let html = `<div class="tracker-actions">
  <button class="btn-secondary btn--sm" id="btn-reannounce-all">
    ${iconRefreshCcw(14)} Reannounce all
  </button>
</div>`;

  html += inspectorTrackers.map(tracker => {
    const isSpecial   = tracker.url.startsWith('**');
    const statusLabel = STATUS_LABELS[tracker.status] ?? 'Unknown';
    const statusClass = tracker.status === 2 ? 'tracker-ok' :
                        tracker.status === 4 ? 'tracker-error' : 'tracker-neutral';
    return `<div class="tracker-row${isSpecial ? ' tracker-row--special' : ''}">
    <div class="tracker-url row-data">${esc(tracker.url)}</div>
    <div class="tracker-meta">
      <span class="tracker-status ${statusClass}">${statusLabel}</span>
      ${tracker.num_seeds != null ? `<span class="tracker-stat">${tracker.num_seeds}↑ seeds</span>` : ''}
      ${tracker.num_leeches != null ? `<span class="tracker-stat">${tracker.num_leeches}↓ leeches</span>` : ''}
      ${tracker.num_downloaded != null ? `<span class="tracker-stat">${tracker.num_downloaded} completed</span>` : ''}
      ${tracker.msg ? `<span class="tracker-msg">${esc(tracker.msg)}</span>` : ''}
    </div>
  </div>`;
  }).join('');

  findEl('tab-trackers', container).innerHTML = html;

  findEl('btn-reannounce-all', container)?.addEventListener('click', async () => {
    if (state.inspectorId) await torrentReannounce([state.inspectorId]);
  });
}

function renderTab(tab, container) {
  if (state.inspectorId === null) return;
  const t = state.torrents.get(state.inspectorId);
  if (!t) return;
  switch (tab) {
    case 'general':  renderGeneral(t, container);           break;
    case 'files':    renderFiles(inspectorFiles, container); break;
    case 'peers':    renderPeers(container);                break;
    case 'trackers': renderTrackers(container);             break;
  }
}

function renderActiveTab(container) {
  renderTab(activeTab, container);
}

async function _refreshActiveTab(hash, tab, container) {
  try {
    if (tab === 'peers') {
      const peersData = await getTorrentPeers(hash, inspectorPeerRid);
      inspectorPeerRid = peersData.rid ?? inspectorPeerRid;
      if (peersData.full_update) {
        inspectorPeers = peersData.peers ?? {};
      } else {
        for (const [key, fields] of Object.entries(peersData.peers ?? {})) {
          inspectorPeers[key] = { ...(inspectorPeers[key] || {}), ...fields };
        }
        for (const key of (peersData.peers_removed ?? [])) delete inspectorPeers[key];
      }
    } else if (tab === 'files') {
      inspectorFiles = await getTorrentFiles(hash);
    } else if (tab === 'trackers') {
      inspectorTrackers = await getTorrentTrackers(hash);
    }
    // General tab re-renders from torrents:changed — no fetch needed
  } catch (_) {}
  if (state.inspectorId === hash && activeTab === tab) renderTab(tab, container);
}

function setActiveTab(tab, container) {
  activeTab = tab;

  const root = container || document;
  root.querySelectorAll('.inspector-tab').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('inspector-tab--active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  root.querySelectorAll('.inspector-panel').forEach(p => {
    p.classList.add('inspector-panel--hidden');
  });
  (container ? container.querySelector('#tab-' + tab)
             : document.getElementById('tab-' + tab))
    ?.classList.remove('inspector-panel--hidden');

  renderTab(tab, container);
  if (state.inspectorId) _refreshActiveTab(state.inspectorId, tab, container);
}

function closeInspectorSilent() {
  if (inspectorInterval) {
    clearInterval(inspectorInterval);
    inspectorInterval = null;
  }
  state.inspectorId = null;
  inspectorPeerRid  = 0;
  inspectorFiles    = [];
  inspectorPeers    = {};
  inspectorTrackers = [];
}

function mountInspector() {
  document.getElementById('btn-inspector-close').addEventListener('click', () => {
    setInspector(null);
  });

  document.querySelectorAll('.inspector-tab').forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });

  on('ui:inspector', async hash => {
    if (inspectorInterval) {
      clearInterval(inspectorInterval);
      inspectorInterval = null;
    }

    // ── Mobile: use option sheet ────────────────────────────────
    if (window.innerWidth < 640) {
      if (!hash) {
        closeOptionSheet();
        return;
      }

      const torrent = state.torrents.get(hash);

      openOptionSheet({
        title: torrent?.name || '—',
        buildContent: async (body) => {
          _mobileContainer = body;
          body.innerHTML = `
            <div style="display:flex;flex-direction:column;height:100%;min-height:0;">
              <nav style="display:flex;border-bottom:1px solid var(--color-border);flex-shrink:0;">
                <button class="inspector-tab inspector-tab--active" role="tab" aria-selected="true"  data-tab="general"  style="flex:1;height:44px;min-width:0;font-size:13px;">General</button>
                <button class="inspector-tab"                       role="tab" aria-selected="false" data-tab="files"    style="flex:1;height:44px;min-width:0;font-size:13px;">Files</button>
                <button class="inspector-tab"                       role="tab" aria-selected="false" data-tab="peers"    style="flex:1;height:44px;min-width:0;font-size:13px;">Peers</button>
                <button class="inspector-tab"                       role="tab" aria-selected="false" data-tab="trackers" style="flex:1;height:44px;min-width:0;font-size:13px;">Trackers</button>
              </nav>
              <div id="tab-general"   class="inspector-panel"                style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:var(--space-2) var(--space-4);"></div>
              <div id="tab-files"     class="inspector-panel inspector-panel--hidden" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0;"></div>
              <div id="tab-peers"     class="inspector-panel inspector-panel--hidden" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:var(--space-2) var(--space-4);"></div>
              <div id="tab-trackers"  class="inspector-panel inspector-panel--hidden" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:var(--space-2) var(--space-4);"></div>
            </div>`;

          body.querySelectorAll('.inspector-tab').forEach(btn => {
            btn.addEventListener('click', () => setActiveTab(btn.dataset.tab, body));
          });

          inspectorPeerRid = 0; inspectorFiles = []; inspectorPeers = {}; inspectorTrackers = [];
          const activePanel = body.querySelector('#tab-general');
          if (activePanel) activePanel.innerHTML = '<p class="inspector-empty">Loading…</p>';

          const [propsResult, filesResult, peersResult, trackersResult] = await Promise.allSettled([
            getTorrentProperties(hash),
            getTorrentFiles(hash),
            getTorrentPeers(hash, 0),
            getTorrentTrackers(hash),
          ]);

          if (filesResult.status    === 'fulfilled') inspectorFiles    = filesResult.value;
          if (peersResult.status    === 'fulfilled') { inspectorPeerRid = peersResult.value.rid ?? 0; inspectorPeers = peersResult.value.peers ?? {}; }
          if (trackersResult.status === 'fulfilled') inspectorTrackers = trackersResult.value;
          if (propsResult.status    === 'fulfilled') {
            const t = state.torrents.get(hash);
            if (t) state.torrents.set(hash, { ...t, ...propsResult.value, _props: propsResult.value });
          }

          if (state.inspectorId === hash) setActiveTab(activeTab, body);

          inspectorInterval = setInterval(async () => {
            if (!state.inspectorId) return;
            await _refreshActiveTab(state.inspectorId, activeTab, body);
          }, 3000);
        },
        onClose: () => {
          if (inspectorInterval) { clearInterval(inspectorInterval); inspectorInterval = null; }
          state.inspectorId = null;
          _mobileContainer = null;
          inspectorPeerRid = 0; inspectorFiles = []; inspectorPeers = {}; inspectorTrackers = [];
        },
      });

      return; // ← skip desktop path entirely
    }
    // ── Desktop path continues below unchanged ──────────────────

    const rightPanel      = document.getElementById('right-panel');
    const inspContent     = document.getElementById('inspector-content');
    const settingsContent = document.getElementById('settings-content');
    const logContent      = document.getElementById('log-content');

    if (!hash) {
      if (inspContent && !inspContent.hidden) {
        inspContent.hidden = true;
        rightPanel.classList.remove('right-panel--open');
        rightPanel.setAttribute('aria-hidden', 'true');
      }
      inspectorPeerRid  = 0;
      inspectorFiles    = [];
      inspectorPeers    = {};
      inspectorTrackers = [];
      return;
    }

    // Silence other panels directly — no state events, no close-branch side effects
    state.settingsOpen = false;
    state.logOpen = false;
    document.removeEventListener('keydown', handleSettingsEsc);
    if (settingsContent) settingsContent.hidden = true;
    if (logContent) logContent.hidden = true;

    if (inspContent) inspContent.hidden = false;
    rightPanel.classList.add('right-panel--open');
    rightPanel.setAttribute('aria-hidden', 'false');

    const torrent = state.torrents.get(hash);
    if (!torrent) return;

    const titleEl = document.getElementById('inspector-title');
    if (titleEl) titleEl.textContent = torrent.name || '—';

    const activePanel = document.getElementById(`tab-${activeTab}`);
    if (activePanel) activePanel.innerHTML = '<p class="inspector-empty">Loading…</p>';

    inspectorPeerRid  = 0;
    inspectorFiles    = [];
    inspectorPeers    = {};
    inspectorTrackers = [];

    const [propsResult, filesResult, peersResult, trackersResult] = await Promise.allSettled([
      getTorrentProperties(hash),
      getTorrentFiles(hash),
      getTorrentPeers(hash, 0),
      getTorrentTrackers(hash),
    ]);

    if (filesResult.status === 'fulfilled')    inspectorFiles    = filesResult.value;
    if (peersResult.status === 'fulfilled') {
      inspectorPeerRid = peersResult.value.rid ?? 0;
      inspectorPeers   = peersResult.value.peers ?? {};
    }
    if (trackersResult.status === 'fulfilled') inspectorTrackers = trackersResult.value;
    if (propsResult.status === 'fulfilled') {
      const t = state.torrents.get(hash);
      if (t) state.torrents.set(hash, { ...t, ...propsResult.value, _props: propsResult.value });
    }

    if (state.inspectorId === hash) setActiveTab(activeTab);

    inspectorInterval = setInterval(async () => {
      if (!state.inspectorId) return;
      const h = state.inspectorId;
      await _refreshActiveTab(h, activeTab);
    }, 3000);
  });

  on('torrents:changed', () => {
    if (state.inspectorId === null) return;
    const t = state.torrents.get(state.inspectorId);
    if (!t) return;
    const titleEl = _mobileContainer
      ? document.querySelector('#sort-sheet .sort-sheet__title')
      : document.getElementById('inspector-title');
    if (titleEl) titleEl.textContent = t.name || '—';
    // Files tab data comes from getTorrentFiles, not torrents:changed — skip it
    if (activeTab === 'files') return;
    if (activeTab === 'general' && !t._props) return;
    renderTab(activeTab, _mobileContainer || undefined);
  });
}
