
function mountMobileFilterStrip() {
  const strip = document.getElementById('mobile-filter-strip');
  if (!strip) return;

  const chipsContainer = document.getElementById('mobile-filter-chips');
  const indicator = document.getElementById('mobile-chip-indicator');
  const repositionChipIndicator = () =>
    positionNavIndicator(chipsContainer, '.mobile-chip--active', indicator, true);

  // Wire chip clicks to setFilter()
  strip.querySelectorAll('.mobile-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      setFilter(chip.dataset.filter);
    });
  });

  // Keep chips in sync with filter state
  on('ui:filter', filter => {
    strip.querySelectorAll('.mobile-chip').forEach(chip => {
      const active = chip.dataset.filter === filter;
      chip.classList.toggle('mobile-chip--active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    repositionChipIndicator();
  });

  // Keep mobile chip counts in sync — hide zero-count chips, reset filter if active chip empties
  on('torrents:changed', () => {
    const torrents = [...state.torrents.values()];

    const setCount = (filterId, fn) => {
      const countEl = document.getElementById(`mcount-${filterId}`);
      const chipEl  = strip.querySelector(`.mobile-chip[data-filter="${filterId}"]`);
      if (!countEl || !chipEl) return;

      const count = fn ? torrents.filter(fn).length : torrents.length;
      countEl.textContent = count;

      if (filterId !== 'all') {
        chipEl.hidden = count === 0;
        if (count === 0 && chipEl.classList.contains('mobile-chip--active')) {
          setFilter('all');
        }
      }
    };

    setCount('all',         null);
    setCount('downloading', FILTER_MAP.downloading);
    setCount('seeding',     FILTER_MAP.seeding);
    setCount('paused',      FILTER_MAP.paused);
    setCount('finished',    FILTER_MAP.finished);
    setCount('errors',      FILTER_MAP.errors);
    setCount('stalled',     FILTER_MAP.stalled);
    setCount('checking',    FILTER_MAP.checking);
    setCount('moving',      FILTER_MAP.moving);
    setCount('fetching',    FILTER_MAP.fetching);

    repositionChipIndicator();
  });

  repositionChipIndicator();
}

function mountTouchContextMenu() {
  const viewport = document.getElementById('list-viewport');
  if (!viewport) return;

  let longPressTimer = null;
  let longPressRow   = null;
  let didLongPress   = false;

  const LONG_PRESS_MS = 500;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;

    const row = e.target.closest('.torrent-row');
    if (!row) return;

    didLongPress = false;
    longPressRow = row;

    longPressTimer = setTimeout(() => {
      didLongPress = true;
      const hash = row.dataset.hash;
      openMobileActionSheet(hash);
      if (navigator.vibrate) navigator.vibrate(40);
    }, LONG_PRESS_MS);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') return;
    if (longPressTimer && (Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3)) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  const cancelLongPress = (e) => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(longPressTimer);
    longPressTimer = null;
  };

  viewport.addEventListener('pointerup',     cancelLongPress);
  viewport.addEventListener('pointercancel', cancelLongPress);

  viewport.addEventListener('contextmenu', (e) => {
    if (e.pointerType !== 'mouse' || window.innerWidth < 640) {
      e.preventDefault();
    }
  });

  // Suppress tap-to-select click if a long-press just fired
  viewport.addEventListener('click', (e) => {
    if (didLongPress) {
      e.stopImmediatePropagation();
      didLongPress = false;
    }
  }, true); // capture phase — runs before list.js click handler
}

function mountMobileTapInspector() {
  const viewport = document.getElementById('list-viewport');
  if (!viewport) return;

  viewport.addEventListener('click', (e) => {
    if (window.innerWidth >= 640) return;

    const row = e.target.closest('.torrent-row');
    if (!row) return;

    const hash = row.dataset.hash;
    setSelected(new Set([hash]));

    if (state.inspectorId === hash) {
      setInspector(null);
    } else {
      setInspector(hash);
    }
  });
}

function mountMobileSortButton() {
  const btn = document.getElementById('btn-mobile-sort');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (typeof openSortSheet === 'function') {
      openSortSheet();
    } else {
      console.log('[mobile] Sort sheet not yet implemented (Phase 3)');
    }
  });
}

function mountTabletSidebarToggle() {
  const btn     = document.getElementById('btn-tablet-sidebar');
  const sidebar = document.getElementById('sidebar');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('sidebar--visible');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close sidebar when clicking outside it on tablet
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 640 || window.innerWidth >= 1024) return;
    if (!sidebar.classList.contains('sidebar--visible')) return;
    if (sidebar.contains(e.target) || btn.contains(e.target)) return;
    sidebar.classList.remove('sidebar--visible');
    btn.setAttribute('aria-expanded', 'false');
  });
}

function mountMobileFilterActions() {
  document.getElementById('btn-sort-filter')?.addEventListener('click', () => {
    openSortSheet();
  });
  document.getElementById('btn-settings-filter')?.addEventListener('click', () => {
    setSettingsOpen(!state.settingsOpen);
  });
  document.getElementById('btn-add-filter')?.addEventListener('click', () => {
    openAddModal();
  });
}


