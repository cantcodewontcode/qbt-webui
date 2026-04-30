
let activeTab      = 'general';
let selectedFiles  = new Set();

let inspectorPeerRid  = 0;
let inspectorInterval = null;
let inspectorFiles    = [];
let inspectorPeers    = {};
let inspectorTrackers = [];


function renderStateBadge(t) {
  const mod = torrentStateClass(t).replace('state-', '');
  return `<span class="state-badge state-badge--${mod}">${torrentStateLabel(t)}</span>`;
}

function renderSpeedLimits(t) {
  // dl_limit: -1=global, 0=unlimited, >0=bytes/s
  const dlEnabled = (t.dl_limit ?? -1) > 0;
  const dlMbps    = dlEnabled ? bpsToMbps(t.dl_limit) : '';
  const ulEnabled = (t.up_limit ?? -1) > 0;
  const ulMbps    = ulEnabled ? bpsToMbps(t.up_limit) : '';
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

function wireGeneralControls(t) {
  const dlLimited = document.getElementById('insp-dl-limited');
  const dlLimit   = document.getElementById('insp-dl-limit');
  const ulLimited = document.getElementById('insp-ul-limited');
  const ulLimit   = document.getElementById('insp-ul-limit');
  const rMode     = document.getElementById('insp-ratio-mode');
  const rLimit    = document.getElementById('insp-ratio-limit');

  dlLimited?.addEventListener('change', () => {
    dlLimit.disabled = !dlLimited.checked;
    const bytes = dlLimited.checked ? mbpsToBps(Number(dlLimit.value) || 0) : 0;
    torrentSetDownloadLimit([t.hash], bytes);
  });

  dlLimit?.addEventListener('change', () => {
    const bytes = mbpsToBps(Number(dlLimit.value));
    if (dlLimited?.checked && bytes > 0) torrentSetDownloadLimit([t.hash], bytes);
  });

  ulLimited?.addEventListener('change', () => {
    ulLimit.disabled = !ulLimited.checked;
    const bytes = ulLimited.checked ? mbpsToBps(Number(ulLimit.value) || 0) : 0;
    torrentSetUploadLimit([t.hash], bytes);
  });

  ulLimit?.addEventListener('change', () => {
    const bytes = mbpsToBps(Number(ulLimit.value));
    if (ulLimited?.checked && bytes > 0) torrentSetUploadLimit([t.hash], bytes);
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

function renderGeneral(t) {
  const props = t._props || {};

  const connected = (t.num_leechs ?? 0) + (t.num_seeds ?? 0);
  const peersText = connected === 0
    ? 'None'
    : `${connected} connected (${t.num_seeds ?? 0} seeds, ${t.num_leechs ?? 0} leeches)`;

  const piecesText = props.pieces_have != null
    ? `${props.pieces_have} / ${props.pieces_num} (${formatSize(props.piece_size ?? 0)} each)`
    : '—';

  const connectionsText = props.nb_connections != null
    ? `${props.nb_connections} (max: ${props.nb_connections_limit})`
    : '—';

  const rows = [
    ['Name',           t.name || '—'],
    ['State',          renderStateBadge(t)],
    ['Size',           formatSize(t.total_size ?? t.size ?? 0)],
    ['Progress',       formatPercent(t.progress ?? 0)],
    ['Downloaded',     formatSize(props.total_downloaded ?? t.downloaded ?? 0)],
    ['Uploaded',       formatSize(props.total_uploaded ?? t.uploaded ?? 0)],
    ['Ratio',          formatRatio(t.ratio ?? 0)],
    ['Download speed', formatSpeed(t.dlspeed ?? 0)],
    ['Upload speed',   formatSpeed(t.upspeed ?? 0)],
    ['ETA',            formatETA(t.eta ?? -1)],
    ['Location',       `<span class="info-value--mono">${esc((() => { if (!t.content_path) return t.save_path || '—'; const i = t.content_path.lastIndexOf('/' + (t.name || '')); return i > 0 ? t.content_path.substring(0, i) : t.save_path || t.content_path; })())}</span>`],
    ['Added',          (t.added_on && t.added_on > 946684800) ? formatDate(t.added_on) : '—'],
    ['Completed',      (t.completion_on && t.completion_on > 946684800) ? formatDate(t.completion_on) : '—'],
    ['Hash',           `<span class="info-value--mono">${esc(t.hash || '—')}</span>`],
    ['Availability',   (t.availability != null && t.availability >= 0)
      ? formatPercent(t.availability)
      : (t.availability === -1 ? '100%' : '—')],
    ['Pieces',         piecesText],
    ['Wasted',         props.total_wasted != null ? formatSize(props.total_wasted) : '—'],
    ['Active time',    props.time_elapsed != null ? formatDuration(props.time_elapsed) : '—'],
    ['Seeding time',   (props.seeding_time ?? t.seeding_time) != null ? formatDuration(props.seeding_time ?? t.seeding_time) : '—'],
    ['Connections',    connectionsText],
    ['Peers',          peersText],
    ['Tracker',        esc(t.tracker || '—')],
  ];

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

  document.getElementById('tab-general').innerHTML = html;

  const copyBtn = document.getElementById('btn-copy-magnet');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(t.magnet_uri).then(() => {
        copyBtn.innerHTML = `${iconCopy(14)} Copied!`;
        setTimeout(() => { copyBtn.innerHTML = `${iconCopy(14)} Copy link`; }, 1500);
      }).catch(() => {});
    });
  }

  wireGeneralControls(t);
}

function updateFileRowSelection(fileList) {
  if (!fileList) return;
  fileList.querySelectorAll('.file-row').forEach(row => {
    const idx = Number(row.dataset.index);
    row.classList.toggle('file-row--selected', selectedFiles.has(idx));
  });
}

function wireFileControls(t) {
  const panel = document.getElementById('tab-files');
  if (!panel) return;

  const searchInput = document.getElementById('file-search-input');
  const searchClear = document.getElementById('file-search-clear');
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
    searchInput?.focus();
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
        renderActiveTab();
      } catch (err) {
        showToast('Failed to update priority: ' + err.message, 'error');
      }
    });
  });
}

function renderFiles(files) {
  selectedFiles = new Set();
  const panel = document.getElementById('tab-files');

  if (!files || files.length === 0) {
    panel.innerHTML = '<p class="inspector-empty">No files.</p>';
    return;
  }

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
  <input type="search" id="file-search-input" class="search-input"
         placeholder="Search files…" autocomplete="off" spellcheck="false"
         aria-label="Search files by name">
  <button class="btn-ghost icon-btn search-clear" id="file-search-clear"
          aria-label="Clear file search" hidden>${iconX(16)}</button>
</div>
</div>`;

  panel.innerHTML = searchBar + `<div class="file-list">${rows}</div>`;
  wireFileControls(null);
}

function decodePeerFlags(flagStr) {
  const map = {
    'D': 'Downloading from this peer',
    'd': 'Peer wants to download from you',
    'E': 'Encrypted connection',
    'H': 'Peer found via DHT',
    'h': 'Peer connected via uTP',
    'I': 'Incoming connection',
    'K': 'Peer unchoked but not interested',
    'O': 'Optimistic unchoke',
    'T': 'Peer found via PEX',
    'U': 'Uploading to this peer',
    'u': 'Peer wants us to upload to them',
    'X': 'Peer from peer exchange',
  };
  const parts = (flagStr || '').split('').map(f => map[f]).filter(Boolean);
  return { tooltip: parts.length ? parts.join(' · ') : 'No active flags' };
}

function renderPeers() {
  const peers = Object.values(inspectorPeers);
  if (peers.length === 0) {
    document.getElementById('tab-peers').innerHTML =
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
      ${peer.country_code ? `<span class="peer-country">${esc(peer.country_code)}</span>` : ''}
    </div>
    <div class="peer-row__stats">
      <span class="peer-stat">↓ ${dlSpeed}</span>
      <span class="peer-stat">↑ ${upSpeed}</span>
      <span class="peer-stat">${pct} have</span>
    </div>
  </div>`;
  }).join('');

  document.getElementById('tab-peers').innerHTML = rows;
}

function renderTrackers() {
  if (!inspectorTrackers || inspectorTrackers.length === 0) {
    document.getElementById('tab-trackers').innerHTML =
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
      ${tracker.num_peers ? `<span class="tracker-stat">${tracker.num_peers} peers</span>` : ''}
      ${tracker.msg ? `<span class="tracker-msg">${esc(tracker.msg)}</span>` : ''}
    </div>
  </div>`;
  }).join('');

  document.getElementById('tab-trackers').innerHTML = html;

  document.getElementById('btn-reannounce-all')?.addEventListener('click', async () => {
    if (state.inspectorId) await torrentReannounce([state.inspectorId]);
  });
}

function renderTab(tab) {
  if (state.inspectorId === null) return;
  const t = state.torrents.get(state.inspectorId);
  if (!t) return;
  switch (tab) {
    case 'general':  renderGeneral(t);       break;
    case 'files':    renderFiles(inspectorFiles); break;
    case 'peers':    renderPeers();          break;
    case 'trackers': renderTrackers();       break;
  }
}

function renderActiveTab() {
  renderTab(activeTab);
}

function setActiveTab(tab) {
  activeTab = tab;

  document.querySelectorAll('.inspector-tab').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('inspector-tab--active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  document.querySelectorAll('.inspector-panel').forEach(p => {
    p.classList.add('inspector-panel--hidden');
  });
  document.getElementById(`tab-${tab}`)?.classList.remove('inspector-panel--hidden');

  renderTab(tab);
}

function mountInspector() {
  const inspector = document.getElementById('inspector');
  const titleEl   = document.getElementById('inspector-title');

  document.getElementById('btn-inspector-close').addEventListener('click', () => {
    setInspector(null);
  });

  document.querySelectorAll('.inspector-tab').forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });

  on('ui:inspector', async hash => {
    // Clear any running interval first
    if (inspectorInterval) {
      clearInterval(inspectorInterval);
      inspectorInterval = null;
    }

    if (!hash) {
      inspector.classList.add('inspector--closed');
      inspector.classList.remove('inspector--open');
      inspector.setAttribute('aria-hidden', 'true');
      inspectorPeerRid  = 0;
      inspectorFiles    = [];
      inspectorPeers    = {};
      inspectorTrackers = [];
      return;
    }

    if (state.settingsOpen) setSettingsOpen(false);
    const addP = document.getElementById('add-panel');
    if (addP && addP.classList.contains('add-panel--open')) {
      closeAddPanel();
    }

    inspector.classList.add('inspector--open');
    inspector.classList.remove('inspector--closed');
    inspector.setAttribute('aria-hidden', 'false');

    const torrent = state.torrents.get(hash);
    if (!torrent) return;

    titleEl.textContent = torrent.name || '—';

    const activePanel = document.getElementById(`tab-${activeTab}`);
    if (activePanel) {
      activePanel.innerHTML = '<p class="inspector-empty">Loading…</p>';
    }

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

    if (filesResult.status === 'fulfilled') {
      inspectorFiles = filesResult.value;
    }
    if (peersResult.status === 'fulfilled') {
      inspectorPeerRid = peersResult.value.rid ?? 0;
      inspectorPeers   = peersResult.value.peers ?? {};
    }
    if (trackersResult.status === 'fulfilled') {
      inspectorTrackers = trackersResult.value;
    }
    if (propsResult.status === 'fulfilled') {
      const t = state.torrents.get(hash);
      if (t) state.torrents.set(hash, { ...t, ...propsResult.value, _props: propsResult.value });
    }

    if (state.inspectorId === hash) {
      setActiveTab(activeTab);
    }

    inspectorInterval = setInterval(async () => {
      if (!state.inspectorId) return;
      const h = state.inspectorId;
      try {
        const peersData = await getTorrentPeers(h, inspectorPeerRid);
        inspectorPeerRid = peersData.rid ?? inspectorPeerRid;
        if (peersData.full_update) {
          inspectorPeers = peersData.peers ?? {};
        } else {
          Object.assign(inspectorPeers, peersData.peers ?? {});
          for (const key of (peersData.peers_removed ?? [])) {
            delete inspectorPeers[key];
          }
        }
        const filesData    = await getTorrentFiles(h);
        inspectorFiles     = filesData;
        const trackersData = await getTorrentTrackers(h);
        inspectorTrackers  = trackersData;
      } catch (_) {
        // silent — inspector shows slightly stale data
      }
      if (state.inspectorId === h) {
        renderActiveTab();
      }
    }, 3000);
  });

  on('torrents:changed', () => {
    if (state.inspectorId === null) return;
    const t = state.torrents.get(state.inspectorId);
    if (!t) return;
    titleEl.textContent = t.name || '—';
    if (activeTab === 'general' && !t._props) return;
    renderTab(activeTab);
  });
}

