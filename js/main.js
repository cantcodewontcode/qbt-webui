
function createIconEl(svgString) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = svgString;
  return span.firstElementChild || span;
}

function injectStaticIcons() {
  document.getElementById('btn-settings')?.setAttribute('data-tooltip', 'Settings');
  document.getElementById('btn-add-torrent')?.setAttribute('data-tooltip', 'Add torrent');
  document.getElementById('search-clear')?.setAttribute('data-tooltip', 'Clear search');
  document.getElementById('btn-inspector-close')?.setAttribute('data-tooltip', 'Close');
  document.getElementById('speed-down')?.setAttribute('data-tooltip', 'Download speed — click to set limit');
  document.getElementById('speed-up')?.setAttribute('data-tooltip', 'Upload speed — click to set limit');

  const iconMap = {
    'icon--search':       () => iconSearch(14),
    'icon--x':            () => iconX(16),
    'icon--arrow-down':   () => iconArrowDown(14),
    'icon--arrow-up':     () => iconArrowUp(14),
    'icon--settings':     () => iconSettings(16),
    'icon--plus':         () => iconPlus(14),
    'icon--file':         () => iconFile(16),
    'icon--log':          () => iconFileText(16),
    'icon--refresh-cw':   () => iconArrowsClockwise(14),
    'icon--log-search':   () => iconSearch(14),
    'icon--moon':         () => iconMoon(14),
    'icon--sort':         () => iconArrowUpDown(16),
    'icon--menu':         () => iconMenu(16),
  };

  Object.entries(iconMap).forEach(([cls, iconFn]) => {
    document.querySelectorAll('.' + cls).forEach(el => {
      el.replaceWith(createIconEl(iconFn()));
    });
  });
}

async function boot() {
  injectStaticIcons();

  mountToolbar();
  mountMobileSortButton();
  mountTabletSidebarToggle();
  mountSidebar();
  mountMobileFilterStrip();
  mountMobileFilterActions();
  mountContextMenu();
  mountInspector();
  mountModals();
  mountSettings();
  mountLog();

  const viewport = document.getElementById('list-viewport');
  mountList(viewport);
  mountTouchContextMenu();
  mountMobileTapInspector();

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      if (!inInput) {
        e.preventDefault();
        selectAll();
      }
      return;
    }

    if (inInput) return;

    if (e.key === 'Escape') {
      const inspContent = document.getElementById('inspector-content');
      if (inspContent && !inspContent.hidden) {
        setInspector(null);
        return;
      }
    }

    if (e.key === 'Enter' || e.key === 'i') {
      if (state.selected.size === 1) {
        const hash = [...state.selected][0];
        const inspContent = document.getElementById('inspector-content');
        const isOpen = inspContent && !inspContent.hidden;
        if (isOpen && state.inspectorId === hash) {
          setInspector(null);
        } else {
          setInspector(hash);
        }
      }
    }
  });

  on('connection:error', () => {
    showToast('Connection to qBittorrent lost', 'error');
    const connEl = document.getElementById('conn-status');
    if (connEl) {
      connEl.className = 'conn-status conn-status--unreachable';
      connEl.title = 'Cannot reach qBittorrent';
    }
  });

  on('connection:restored', () => {
    const connEl = document.getElementById('conn-status');
    if (connEl) {
      connEl.className = 'conn-status conn-status--connected';
      connEl.title = 'Connected';
    }
  });

  try {
    await initialLoad();
    startPolling();
  } catch (err) {
    console.error('[main] Initial load failed:', err);
    showToast('Failed to connect to qBittorrent', 'error');
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
