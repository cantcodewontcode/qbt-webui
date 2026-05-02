
const ROW_HEIGHT = 104;

let filteredSorted   = [];
let lastClickedHash  = null;
let viewport         = null;

const FILTER_MAP = {
  all:         () => true,
  downloading: t => ['downloading', 'stalledDL', 'forcedDL', 'allocating'].includes(t.state),
  seeding:     t => ['uploading', 'stalledUP', 'forcedUP'].includes(t.state),
  paused:      t => {
    if (t.state !== 'pausedDL' && t.state !== 'pausedUP') return false;
    if (t.state === 'pausedDL') return true;
    // pausedUP — only show as Paused if it hasn't met its goal
    if ((t.progress ?? 0) < 1) return true;
    const ratioMet = (t.ratio_limit ?? -1) >= 0 && (t.ratio ?? 0) >= t.ratio_limit;
    const stlimit  = t.seeding_time_limit ?? -1;
    const timeMet  = stlimit >= 0 && (t.seeding_time ?? 0) >= stlimit;
    if (stlimit === -2) return !ratioMet; // seed forever by time — only ratio can finish it
    return !ratioMet && !timeMet;
  },
  errors:      t => t.state === 'error' || t.state === 'missingFiles',
  fetching:    t => t.state === 'metaDL',
  finished:    t => {
    if (t.state !== 'pausedUP') return false;
    if ((t.progress ?? 0) < 1) return false;
    // ratio_limit === -2 means "seed forever" — never finished
    // ratio_limit === -1 means "use global" — not handled here, treated as not finished
    const ratioMet = (t.ratio_limit ?? -1) >= 0 && (t.ratio ?? 0) >= t.ratio_limit;
    const timeMet  = (t.seeding_time_limit ?? -1) >= 0 && (t.seeding_time ?? 0) >= t.seeding_time_limit;
    // seeding_time_limit === -2 means "no limit" — not finished by time
    if ((t.seeding_time_limit ?? -1) === -2) return ratioMet;
    return ratioMet || timeMet;
  },
  checking:    t => ['checkingDL', 'checkingUP', 'checkingResumeData'].includes(t.state),
  moving:      t => t.state === 'moving',
  active:      t => (t.dlspeed ?? 0) > 0 || (t.upspeed ?? 0) > 0,
  inactive:    t => (t.dlspeed ?? 0) === 0 && (t.upspeed ?? 0) === 0,
  stalled:     t => t.state === 'stalledDL',
};

function applyFilter(torrents, filter, search) {
  let arr = [...torrents.values()];
  // Error torrents only appear in 'all' and 'errors' — excluded everywhere else
  if (filter !== 'all' && filter !== 'errors') {
    arr = arr.filter(t => t.state !== 'error' && t.state !== 'missingFiles');
  }
  const filterFn = FILTER_MAP[filter];
  if (filterFn && filter !== 'all') {
    arr = arr.filter(filterFn);
  }
  if (state.activeCategory !== null) {
    arr = arr.filter(t => t.category === state.activeCategory);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase().replace(/\./g, ' ');
    arr = arr.filter(t => {
      const name = (t.name || '').toLowerCase().replace(/\./g, ' ');
      return name.includes(q);
    });
  }
  return arr;
}

function applySort(arr, key, dir) {
  const mult = dir === 'asc' ? 1 : -1;

  function byName(a, b) {
    return (a.name || '').localeCompare(b.name || '');
  }

  function connectedVal(t) {
    return (t.num_leechs ?? 0) + (t.num_seeds ?? 0);
  }

  return [...arr].sort((a, b) => {
    let av, bv, primary;

    if (key === 'eta') {
      const aRaw = a.eta ?? -1;
      const bRaw = b.eta ?? -1;
      const aSentinel = aRaw < 0;
      const bSentinel = bRaw < 0;
      // Sentinels always go to the bottom regardless of sort direction
      if (aSentinel && bSentinel) return 0;
      if (aSentinel) return 1;
      if (bSentinel) return -1;
      primary = mult * (aRaw - bRaw);
    } else if (key === 'num_connected') {
      av = connectedVal(a);
      bv = connectedVal(b);
      primary = mult * (av - bv);
    } else {
      av = a[key] ?? 0;
      bv = b[key] ?? 0;
      if (typeof av === 'string') {
        primary = mult * av.localeCompare(bv);
      } else {
        primary = mult * (av - bv);
      }
    }

    if (primary !== 0) return primary;

    switch (key) {
      case 'progress': {
        const byRatio = (b.ratio ?? 0) - (a.ratio ?? 0);
        return byRatio !== 0 ? byRatio : byName(a, b);
      }
      case 'ratio': {
        const byPct = (b.progress ?? 0) - (a.progress ?? 0);
        return byPct !== 0 ? byPct : byName(a, b);
      }
      case 'eta': {
        const byPct = (b.progress ?? 0) - (a.progress ?? 0);
        return byPct !== 0 ? byPct : byName(a, b);
      }
      default:
        return 0;
    }
  });
}

function rebuild() {
  const filtered = applyFilter(state.torrents, state.filter, state.search);
  filteredSorted  = applySort(filtered, state.sortKey, state.sortDir);
}

function render() {
  if (!viewport) return;

  if (filteredSorted.length === 0 && state.torrents.size === 0) {
    // Show skeleton rows while waiting for first RPC response
    let count = 12;
    try {
      const cached = localStorage.getItem('tx-torrent-count');
      if (cached) count = Math.min(80, Math.max(12, parseInt(cached, 10) || 12));
    } catch (_) {}
    let skeletonHtml = '';
    for (let i = 0; i < count; i++) {
      skeletonHtml += `<div class="skeleton-row">
        <div class="skeleton-block skeleton-col-name"></div>
        <div class="skeleton-block skeleton-col-size"></div>
        <div class="skeleton-block skeleton-col-dl"></div>
        <div class="skeleton-block skeleton-col-ul"></div>
        <div class="skeleton-block skeleton-col-peers"></div>
        <div class="skeleton-block skeleton-col-ratio"></div>
        <div class="skeleton-block skeleton-col-eta"></div>
        <div class="skeleton-block skeleton-col-pct"></div>
      </div>`;
    }
    viewport.innerHTML = skeletonHtml;
    return;
  }

  if (filteredSorted.length === 0) {
    const emptyMessages = {
      all:         state.search.trim() ? 'No torrents match.' : 'No torrents.',
      downloading: 'No active downloads.',
      seeding:     'No torrents seeding.',
      paused:      'No paused torrents.',
      fetching:    'No torrents fetching metadata.',
      finished:    'No finished torrents.',
      errors:      'No errors.',
    };
    const msg = emptyMessages[state.filter] || 'No torrents match.';
    viewport.innerHTML = `<div class="list-empty">${msg}</div>`;
    return;
  }

  let html = '';
  for (const t of filteredSorted) {
    html += renderRow(t, state.selected.has(t.hash));
  }
  viewport.innerHTML = html;
}

function selectAll() {
  setSelected(new Set(filteredSorted.map(t => t.hash)));
}

function updateSelectionClasses() {
  if (!viewport) return;
  viewport.querySelectorAll('.torrent-row').forEach(rowEl => {
    const hash = rowEl.dataset.hash;
    rowEl.classList.toggle('row--selected', state.selected.has(hash));
  });

  // If inspector is open and a single row is selected, follow the selection
  if (state.inspectorId !== null && state.selected.size === 1) {
    const selectedHash = [...state.selected][0];
    if (selectedHash !== state.inspectorId) {
      setInspector(selectedHash);
    }
  }
}

function mountList(containerEl) {
  viewport = containerEl;

  containerEl.addEventListener('click', (e) => {
    const row = e.target.closest('.torrent-row');
    if (!row) return;
    const hash = row.dataset.hash;

    if (e.shiftKey && lastClickedHash !== null) {
      const hashes = filteredSorted.map(t => t.hash);
      const a      = hashes.indexOf(lastClickedHash);
      const b      = hashes.indexOf(hash);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      const next = new Set(state.selected);
      for (let i = lo; i <= hi; i++) next.add(hashes[i]);
      setSelected(next);
      lastClickedHash = hash;
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const next = new Set(state.selected);
      if (next.has(hash)) next.delete(hash); else next.add(hash);
      setSelected(next);
      lastClickedHash = hash;
      return;
    }

    setSelected(new Set([hash]));
    lastClickedHash = hash;
  });

  containerEl.addEventListener('dblclick', (e) => {
    const row = e.target.closest('.torrent-row');
    if (!row) return;
    const hash = row.dataset.hash;

    setSelected(new Set([hash]));
    lastClickedHash = hash;

    {
      const inspContent = document.getElementById('inspector-content');
      const isOpen = inspContent && !inspContent.hidden;
      if (isOpen && state.inspectorId === hash) {
        setInspector(null);
      } else {
        setInspector(hash);
      }
    }
  });

  containerEl.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('.torrent-row');
    if (!row) return;
    e.preventDefault();
    const hash = row.dataset.hash;
    if (!state.selected.has(hash)) {
      setSelected(new Set([hash]));
    }
    document.dispatchEvent(new CustomEvent('contextmenu:open', {
      detail: { id: hash, x: e.clientX, y: e.clientY }
    }));
  });

  on('torrents:changed', () => { rebuild(); render(); });
  on('ui:filter',        () => { rebuild(); render(); });
  on('ui:search',        () => { rebuild(); render(); });
  on('ui:sort',          () => { rebuild(); render(); });
  // ui:selection no longer triggers render(); updateSelectionClasses() handles it

  rebuild();
  render();
}

