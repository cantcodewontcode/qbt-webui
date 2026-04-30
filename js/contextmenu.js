
function mountContextMenu() {
  document.addEventListener('contextmenu:open', (e) => {
    const { id, x, y } = e.detail;
    openMenu(id, x, y);
  });

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    const sub  = document.getElementById('context-submenu');
    if (!menu.contains(e.target) && !(sub && sub.contains(e.target))) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  document.addEventListener('scroll', closeMenu, { capture: true, passive: true });

  document.addEventListener('keydown', (e) => {
    const menu = document.getElementById('context-menu');
    if (menu.classList.contains('context-menu--hidden')) return;

    const items = [...menu.querySelectorAll('.context-menu__item:not(.context-menu__item--disabled)')];
    const current = document.activeElement;
    const idx = items.indexOf(current);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[Math.min(idx + 1, items.length - 1)]?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[Math.max(idx - 1, 0)]?.focus();
    }
    if (e.key === 'Enter' && current && items.includes(current)) {
      e.preventDefault();
      current.click();
    }
  });
}

function closeMenu() {
  const menu = document.getElementById('context-menu');
  menu.classList.add('context-menu--hidden');
  menu.innerHTML = '';
  closeSubmenu();
}

function closeSubmenu() {
  const sub = document.getElementById('context-submenu');
  if (sub) sub.remove();
}

function positionMenu(menu, x, y) {
  const TOOLBAR_H   = document.getElementById('toolbar')?.offsetHeight   || 48;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Reset any previous constraints so we can measure natural size
  menu.style.cssText = 'left:0;top:0;max-height:none;overflow-y:visible;';
  menu.classList.remove('context-menu--hidden');

  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;

  // Horizontal — prefer right of cursor; flip left if it would overflow
  const left = (x + mw > vw) ? Math.max(0, x - mw) : x;

  // Vertical — usable space below toolbar
  const minY   = TOOLBAR_H + 4;
  const maxY   = vh - 4;
  const usable = maxY - minY;

  let top;
  let scrollable = false;

  if (mh <= usable) {
    // Menu fits — prefer below cursor, flip above if needed
    if (y + mh <= maxY) {
      top = Math.max(minY, y);
    } else {
      top = y - mh;
      if (top < minY) top = minY;
    }
  } else {
    // Taller than usable space — pin to top and scroll
    top = minY;
    scrollable = true;
  }

  menu.style.left      = left + 'px';
  menu.style.top       = top  + 'px';
  menu.style.maxHeight = scrollable ? (usable + 'px') : '';
  menu.style.overflowY = scrollable ? 'auto' : '';
}

async function runAction(actionFn) {
  closeMenu();
  try {
    await actionFn();
    forceRefresh();
  } catch (err) {
    console.error('[contextmenu] Action failed:', err);
    showToast('Action failed: ' + err.message, 'error');
  }
}

function openMenu(id, x, y) {
  if (!state.selected.has(id)) {
    setSelected(new Set([id]));
  }

  const selectedIds = [...state.selected];
  const torrent     = state.torrents.get(id);
  const isMulti     = state.selected.size > 1;

  const menu = document.getElementById('context-menu');
  menu.innerHTML = buildMenuHTML(isMulti, torrent);

  positionMenu(menu, x, y);
  wireMenuEvents(menu, id, selectedIds, torrent, isMulti);
  setTimeout(() => {
    const firstItem = menu.querySelector(
      '.context-menu__item:not(.context-menu__item--disabled)'
    );
    firstItem?.focus();
  }, 0);
}

function menuItem(action, iconHtml, label, modClass) {
  if (modClass === undefined) modClass = '';
  const cls = modClass ? ` ${modClass}` : '';
  return `<div class="context-menu__item${cls}" role="menuitem" data-action="${action}" tabindex="-1">
  <span class="icon" aria-hidden="true">${iconHtml}</span>
  <span class="context-menu__label">${label}</span>
</div>`;
}

function menuItemSubmenu(action, iconHtml, label) {
  return `<div class="context-menu__item context-menu__item--has-sub" role="menuitem"
    data-action="${action}" tabindex="-1" aria-haspopup="true">
  <span class="icon" aria-hidden="true">${iconHtml}</span>
  <span class="context-menu__label">${label}</span>
  <span class="context-menu__sub-arrow" aria-hidden="true">${iconChevronRight(12)}</span>
</div>`;
}

const SEP = '<div class="context-menu__separator" role="separator"></div>';

function buildMenuHTML(isMulti, torrent) {
  const renameClass  = isMulti ? 'context-menu__item--disabled' : '';
  const queueEnabled = !!(state.prefs.queueing_enabled);
  const isPausedState = s => s === 'pausedDL' || s === 'pausedUP' ||
                             s === 'queuedDL' || s === 'queuedUP';

  let showStart, showForceStart, showPause;
  if (!isMulti) {
    const paused = torrent && isPausedState(torrent.state);
    showStart      = paused;
    showForceStart = paused;
    showPause      = !paused;
  } else {
    const sel = [...state.selected].map(h => state.torrents.get(h)).filter(Boolean);
    const allPaused = sel.every(t => isPausedState(t.state));
    const allActive = sel.every(t => !isPausedState(t.state));
    showStart      = !allActive;
    showForceStart = !allActive;
    showPause      = !allPaused;
  }

  const seqDl    = !isMulti && torrent?.seq_dl === true;
  const seqLabel = 'Sequential Download' + (seqDl ? ' ✓' : '');

  const seedingStates = new Set(['uploading', 'forcedUP', 'stalledUP', 'pausedUP']);
  const selectedTorrents  = [...state.selected].map(h => state.torrents.get(h)).filter(t => t != null);
  const seedingTorrents   = selectedTorrents.filter(t => seedingStates.has(t.state));
  const anySeeding        = seedingTorrents.length > 0;
  const allSuperSeeding   = anySeeding && seedingTorrents.every(t => t.super_seeding);
  const noneSuperSeeding  = anySeeding && seedingTorrents.every(t => !t.super_seeding);
  const mixedSuperSeeding = anySeeding && !allSuperSeeding && !noneSuperSeeding;

  let superSeedingItems = '';
  if (anySeeding) {
    if (allSuperSeeding || mixedSuperSeeding) {
      superSeedingItems += menuItem('super-seeding-stop',  iconSuperSeeding(14), 'Stop Super Seeding');
    }
    if (noneSuperSeeding || mixedSuperSeeding) {
      superSeedingItems += menuItem('super-seeding-start', iconSuperSeeding(14), 'Start Super Seeding');
    }
  }

  return [
    showStart      ? menuItem('start',       iconPlay(14),     'Start / Resume') : '',
    showForceStart ? menuItem('force-start',  iconPlay(14),     'Force Start')    : '',
    showPause      ? menuItem('pause',        iconPause(14),    'Pause')          : '',
    SEP,
    menuItem('show-details', iconInfo(14), 'Show Details'),
    SEP,
    menuItem('verify',     iconRefreshCw(14),  'Verify Local Data'),
    menuItem('reannounce', iconWifi(14),        'Reannounce'),
    menuItem('sequential', iconListChecks(14),  seqLabel),
    superSeedingItems,
    SEP,
    queueEnabled ? menuItem('top',    iconSkipBack(14),    'Move to Top')    : '',
    queueEnabled ? menuItem('up',     iconChevronUp(14),   'Move Up')        : '',
    queueEnabled ? menuItem('down',   iconChevronDown(14), 'Move Down')      : '',
    queueEnabled ? menuItem('bottom', iconSkipForward(14), 'Move to Bottom') : '',
    queueEnabled ? SEP : '',
    menuItemSubmenu('queue-priority', iconTag(14), 'Queue Priority'),
    menuItem('seed-ratio',  iconInfo(14),        'Set Seed Ratio\u2026'),
    SEP,
    menuItem('set-location', iconFolderOpen(14), 'Set Location\u2026'),
    menuItem('rename',      iconEdit2(14),       'Rename\u2026', renameClass),
    !isMulti ? menuItem('rename-folder', iconEdit2(14), 'Rename Folder\u2026') : '',
    SEP,
    menuItem('remove',      iconTrash2(14),      'Remove Torrent'),
  ].join('');
}

function wireMenuEvents(menu, id, selectedIds, torrent, isMulti) {
  menu.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.context-menu__item');
    if (!itemEl) return;
    if (itemEl.classList.contains('context-menu__item--disabled')) return;

    const action = itemEl.dataset.action;
    if (action === 'queue-priority') {
      openSubmenu(itemEl, selectedIds);
      return;
    }
    handleAction(action, itemEl, id, selectedIds, torrent, isMulti);
  });

  const qpItem = menu.querySelector('[data-action="queue-priority"]');
  if (qpItem) {
    qpItem.addEventListener('mouseenter', () => openSubmenu(qpItem, selectedIds));
    qpItem.addEventListener('mouseleave', (e) => scheduleSubmenuClose(e.relatedTarget));
  }
}

let _submenuCloseTimer = null;

function scheduleSubmenuClose(relatedTarget) {
  const sub = document.getElementById('context-submenu');
  if (sub && sub.contains(relatedTarget)) return;
  _submenuCloseTimer = setTimeout(closeSubmenu, 120);
}

function openSubmenu(parentItem, selectedIds) {
  if (_submenuCloseTimer) { clearTimeout(_submenuCloseTimer); _submenuCloseTimer = null; }

  closeSubmenu();

  const sub = document.createElement('div');
  sub.id = 'context-submenu';
  sub.className = 'context-menu';
  sub.setAttribute('role', 'menu');
  sub.innerHTML = `
  <div class="context-menu__item" role="menuitem" data-qpriority="high"   tabindex="-1">High (Force Start)</div>
  <div class="context-menu__item" role="menuitem" data-qpriority="low"    tabindex="-1">Low (Move to Bottom)</div>
`;

  sub.addEventListener('mouseenter', () => {
    if (_submenuCloseTimer) { clearTimeout(_submenuCloseTimer); _submenuCloseTimer = null; }
  });
  sub.addEventListener('mouseleave', (e) => scheduleSubmenuClose(e.relatedTarget));

  sub.addEventListener('click', (e) => {
    const el = e.target.closest('[data-qpriority]');
    if (!el) return;
    const qp = el.dataset.qpriority;
    if (qp === 'high') {
      runAction(async () => {
        await torrentSetForceStart(selectedIds, true);
        await torrentResume(selectedIds);
      });
    } else if (qp === 'low') {
      runAction(() => queueMoveBottom(selectedIds));
    }
  });

  document.body.appendChild(sub);

  const rect = parentItem.getBoundingClientRect();
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;
  const sw   = sub.offsetWidth;
  const sh   = sub.offsetHeight;

  let left = rect.right + 2;
  let top  = rect.top;
  if (left + sw > vw) left = rect.left - sw - 2;
  if (top  + sh > vh) top  = vh - sh - 4;

  sub.style.left = left + 'px';
  sub.style.top  = top  + 'px';
}

function handleAction(action, itemEl, id, selectedIds, torrent, isMulti) {
  switch (action) {
    case 'start':
      selectedIds.forEach(hash => {
        const t = state.torrents.get(hash);
        if (t) applyTorrentDelta({ [hash]: { state: 'downloading' } });
      });
      runAction(() => torrentResume(selectedIds));
      break;
    case 'pause':
      selectedIds.forEach(hash => {
        const t = state.torrents.get(hash);
        if (t) applyTorrentDelta({ [hash]: { state: 'pausedDL', dlspeed: 0, upspeed: 0 } });
      });
      runAction(() => torrentPause(selectedIds));
      break;
    case 'force-start':
      selectedIds.forEach(hash => {
        const t = state.torrents.get(hash);
        if (t) applyTorrentDelta({ [hash]: { state: 'forcedDL', force_start: true } });
      });
      runAction(async () => {
        await torrentSetForceStart(selectedIds, true);
        await torrentResume(selectedIds);
      });
      break;
    case 'sequential':
      runAction(() => api('/torrents/toggleSequentialDownload', { body: 'hashes=' + selectedIds.join('|') }));
      break;
    case 'super-seeding-start':
      runAction(() => torrentSetSuperSeeding(selectedIds, true));
      break;
    case 'super-seeding-stop':
      runAction(() => torrentSetSuperSeeding(selectedIds, false));
      break;
    case 'rename-folder':
      if (!isMulti) {
        closeMenu();
        document.dispatchEvent(new CustomEvent('modal:rename-folder', {
          detail: { id, torrent },
        }));
      }
      break;
    case 'verify':
      runAction(() => torrentRecheck(selectedIds));
      break;
    case 'reannounce':
      runAction(() => torrentReannounce(selectedIds));
      break;
    case 'top':
      runAction(() => queueMoveTop(selectedIds));
      break;
    case 'up':
      runAction(() => queueMoveUp(selectedIds));
      break;
    case 'down':
      runAction(() => queueMoveDown(selectedIds));
      break;
    case 'bottom':
      runAction(() => queueMoveBottom(selectedIds));
      break;
    case 'seed-ratio':
      closeMenu();
      document.dispatchEvent(new CustomEvent('modal:seed-ratio', {
        detail: { ids: selectedIds, torrent },
      }));
      break;
    case 'set-location':
      closeMenu();
      document.dispatchEvent(new CustomEvent('modal:set-location', {
        detail: { ids: selectedIds, torrent },
      }));
      break;
    case 'rename':
      if (!isMulti) {
        closeMenu();
        document.dispatchEvent(new CustomEvent('modal:rename', {
          detail: { id, torrent },
        }));
      }
      break;
    case 'remove':
      closeMenu();
      document.dispatchEvent(new CustomEvent('modal:remove', {
        detail: { ids: selectedIds, deleteData: false },
      }));
      break;
    case 'show-details':
      closeMenu();
      setSelected(new Set([id]));
      {
        const inspEl = document.getElementById('inspector');
        const isOpen = inspEl && inspEl.classList.contains('inspector--open');
        if (isOpen && state.inspectorId === id) {
          setInspector(null);
        } else {
          setInspector(id);
        }
      }
      break;
  }
}

