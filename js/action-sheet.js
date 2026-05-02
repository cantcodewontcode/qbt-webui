// ── Mobile Action Sheet ───────────────────────────────────────────
// Long-press torrent action menu. Uses the unified option sheet.
// Called by mountTouchContextMenu() in js/mobile.js.

function openMobileActionSheet(hash) {
  const torrent = state.torrents.get(hash);
  if (!torrent) return;

  setSelected(new Set([hash]));

  openOptionSheet({
    title: torrent.name || '—',
    buildContent: (body) => {
      const wrapper = document.createElement('div');
      wrapper.style.padding = 'var(--space-2) 0';
      wrapper.innerHTML = _buildActionHTML(hash, torrent);
      body.appendChild(wrapper);

      wrapper.querySelectorAll('.action-item[data-action]').forEach(item => {
        item.addEventListener('click', () => {
          closeOptionSheet();
          _handleMobileAction(item.dataset.action, hash, torrent);
        });
      });
    },
  });
}

function _buildActionHTML(hash, torrent) {
  const isPaused = ['pausedDL', 'pausedUP', 'queuedDL', 'queuedUP'].includes(torrent.state);
  const SEP = '<div class="sort-group-sep" aria-hidden="true"></div>';
  const item = (action, iconHtml, label, danger) =>
    `<div class="action-item${danger ? ' action-item--destructive' : ''}"
          role="menuitem" data-action="${action}">
      <span class="icon" aria-hidden="true">${iconHtml}</span>
      <span>${label}</span>
    </div>`;

  return [
    isPaused ? item('start', iconPlay(18), 'Start / Resume') : item('pause', iconPause(18), 'Pause'),
    item('show-details', iconInfo(18), 'Show Details'),
    SEP,
    item('verify',      iconRefreshCw(18),  'Verify Local Data'),
    item('reannounce',  iconWifi(18),       'Reannounce'),
    SEP,
    item('set-location', iconFolderOpen(18), 'Set Location…'),
    item('rename',       iconEdit2(18),      'Rename…'),
    item('seed-ratio',   iconInfo(18),       'Set Seed Ratio…'),
    SEP,
    item('remove',       iconTrash2(18),     'Remove Torrent', true),
  ].join('');
}

function _handleMobileAction(action, hash, torrent) {
  const hashes = [hash];
  const run = async (fn) => {
    try { await fn(); forceRefresh(); }
    catch (err) { showToast('Action failed: ' + err.message, 'error'); }
  };
  switch (action) {
    case 'start':
      run(async () => { await torrentSetForceStart(hashes, true); await torrentResume(hashes); });
      break;
    case 'pause':        run(() => torrentPause(hashes));  break;
    case 'show-details': setInspector(hash);                break;
    case 'verify':       run(() => torrentRecheck(hashes)); break;
    case 'reannounce':   run(() => torrentReannounce(hashes)); break;
    case 'set-location':
      document.dispatchEvent(new CustomEvent('modal:set-location', { detail: { ids: hashes, torrent } }));
      break;
    case 'rename':
      document.dispatchEvent(new CustomEvent('modal:rename', { detail: { id: hash, torrent } }));
      break;
    case 'seed-ratio':
      document.dispatchEvent(new CustomEvent('modal:seed-ratio', { detail: { ids: hashes, torrent } }));
      break;
    case 'remove':
      document.dispatchEvent(new CustomEvent('modal:remove', { detail: { ids: hashes, deleteData: false } }));
      break;
  }
}
