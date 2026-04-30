
function showToast(message, type) {
  if (type === undefined) type = 'info';
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const iconMap = {
    success: iconCheck(16),
    error:   iconAlertCircle(16),
    info:    iconInfo(16),
  };

  toast.innerHTML =
    `<span class="toast-icon">${iconMap[type] ?? ''}</span>` +
    `<span class="toast__message">${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 220ms';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 220);
  }, 4000);
}

let selectedFile = null;
let selectedFileBase64 = null;

function updateAddButton() {
  const btn = document.getElementById('btn-add-confirm');
  if (!btn) return;
  const hasFile   = !!selectedFile;
  const hasMagnet = document.getElementById('magnet-input')?.value.trim().length > 0;
  btn.disabled = !hasFile && !hasMagnet;
}

function resetAddModal() {
  selectedFile = null;
  selectedFileBase64 = null;
  document.getElementById('magnet-input').value = '';
  const fileInput = document.getElementById('torrent-file-input');
  if (fileInput) fileInput.value = '';
  const filenameEl = document.getElementById('dropzone-filename');
  if (filenameEl) { filenameEl.hidden = true; filenameEl.textContent = ''; }
  document.getElementById('torrent-dropzone')?.classList.remove('has-file');
  const btn = document.getElementById('btn-add-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Add'; }
}

function openAddModal() {
  if (state.settingsOpen) setSettingsOpen(false);
  if (state.inspectorId !== null) setInspector(null);
  const panel = document.getElementById('add-panel');
  if (!panel) return;
  document.getElementById('add-download-dir').value =
    state.prefs?.save_path || '';
  const startCb = document.getElementById('add-start-when-added');
  if (startCb) startCb.checked = !(state.prefs?.start_paused_enabled ?? false);
  panel.classList.add('add-panel--open');
  panel.classList.remove('add-panel--closed');
  panel.setAttribute('aria-hidden', 'false');
}


function handleFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    selectedFileBase64 = reader.result.split(',')[1];
    const filenameEl = document.getElementById('dropzone-filename');
    filenameEl.textContent = file.name;
    filenameEl.hidden = false;
    updateAddButton();
  };
  reader.readAsDataURL(file);
}

function closeAddPanel() {
  const panel = document.getElementById('add-panel');
  if (!panel) return;
  panel.classList.remove('add-panel--open');
  panel.classList.add('add-panel--closed');
  panel.setAttribute('aria-hidden', 'true');
  resetAddModal();
}

function mountAddModal() {
  document.getElementById('magnet-input').addEventListener('input', updateAddButton);

  const dropzone  = document.getElementById('torrent-dropzone');
  const fileInput = document.getElementById('torrent-file-input');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('is-over');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-over');
  });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('is-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.torrent')) {
      handleFile(file);
    }
  });

  document.getElementById('btn-add-confirm').addEventListener('click', async () => {
    const dir = document.getElementById('add-download-dir')?.value.trim() || '';
    const btn = document.getElementById('btn-add-confirm');

    btn.disabled = true;
    btn.innerHTML = iconLoader(16, 'icon--spinning') + ' Adding…';

    try {
      const startWhenAdded = document.getElementById('add-start-when-added')?.checked ?? true;
      if (selectedFile) {
        await torrentAdd({ torrentFile: selectedFile, savepath: dir, paused: !startWhenAdded });
      } else {
        const magnet = document.getElementById('magnet-input')?.value.trim() || '';
        if (!magnet) return;
        await torrentAdd({ urls: magnet, savepath: dir, paused: !startWhenAdded });
      }
      closeAddPanel();
      showToast('Torrent added', 'success');
      await forceRefresh();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Add';
      showToast('Failed to add torrent: ' + err.message, 'error');
    }
  });

  document.getElementById('btn-add-cancel')?.addEventListener('click', closeAddPanel);
  document.getElementById('btn-add-close')?.addEventListener('click', closeAddPanel);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('add-panel');
      if (panel && panel.classList.contains('add-panel--open')) closeAddPanel();
    }
  });
}

let pendingRemoveIds = [];

function openRemoveModal(ids) {
  const count = ids.length;
  const name  = state.torrents.get(ids[0])?.name || 'this torrent';
  const desc  = count === 1
    ? `Remove "${name}"?`
    : `Remove ${count} torrents?`;

  let savedDelete = false;
  try {
    const stored = localStorage.getItem('tx-remove-delete-data');
    if (stored !== null) savedDelete = stored === 'true';
  } catch (_) {}

  document.getElementById('modal-remove-desc').textContent = desc;
  document.getElementById('remove-delete-data').checked = savedDelete;
  pendingRemoveIds = ids;

  document.getElementById('modal-remove-confirm').showModal();
}

function mountRemoveModal() {
  document.addEventListener('modal:remove', e => {
    const { ids, deleteData } = e.detail;
    openRemoveModal(ids, deleteData);
  });

  document.getElementById('btn-remove-confirm').addEventListener('click', async () => {
    const deleteData = document.getElementById('remove-delete-data').checked;
    const ids = pendingRemoveIds.slice();
    try {
      localStorage.setItem('tx-remove-delete-data', String(deleteData));
    } catch (_) {}
    document.getElementById('modal-remove-confirm').close();

    try {
      await torrentDelete(ids, deleteData);

      if (ids.includes(state.inspectorId)) setInspector(null);
      setSelected(new Set());

      await forceRefresh();
      showToast(
        `Removed ${ids.length} torrent${ids.length > 1 ? 's' : ''}`,
        'success',
      );
    } catch (err) {
      showToast('Failed to remove: ' + err.message, 'error');
    }
  });

  document.querySelectorAll('#modal-remove-confirm .modal-cancel')
    .forEach(btn => btn.addEventListener('click', () => {
      document.getElementById('modal-remove-confirm').close();
    }));
}

function mountSetLocationModal() {
  const modal  = document.getElementById('modal-set-location');
  const pathEl = document.getElementById('set-location-path');

  document.addEventListener('modal:set-location', e => {
    const { ids, torrent } = e.detail;
    pathEl.value = torrent?.save_path ?? '';
    modal._pendingIds = ids;
    modal.showModal();
  });

  document.getElementById('set-location-cancel').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('set-location-confirm').addEventListener('click', async () => {
    const path = pathEl.value.trim();
    if (!path) return;
    const hashes = modal._pendingIds;
    modal.close();
    try {
      await torrentSetLocation(hashes, path);
      await forceRefresh();
    } catch (err) {
      showToast('Failed to set location: ' + err.message, 'error');
    }
  });
}

function mountRenameModal() {
  const modal   = document.getElementById('modal-rename');
  const inputEl = document.getElementById('rename-input');

  function openModal(id, torrent, isFolder, oldFolderPath) {
    inputEl.value = isFolder ? (oldFolderPath?.split('/').pop() ?? '') : (torrent?.name ?? '');
    modal._pendingId      = id;
    modal._pendingTorrent = torrent;
    modal._folderRename   = isFolder ? { oldPath: oldFolderPath } : null;
    document.getElementById('modal-rename-title').textContent = isFolder ? 'Rename Folder' : 'Rename';
    modal.showModal();
    inputEl.select();
  }

  document.addEventListener('modal:rename', e => {
    const { id, torrent } = e.detail;
    openModal(id, torrent, false, null);
  });

  document.addEventListener('modal:rename-folder', e => {
    const { id, torrent } = e.detail;
    const savePath = torrent?.save_path ?? '';
    const folderPath = savePath.replace(/\/$/, '');
    openModal(id, torrent, true, folderPath);
  });

  document.getElementById('rename-cancel').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('rename-confirm').addEventListener('click', async () => {
    const newName = inputEl.value.trim();
    if (!newName) return;
    const hash = modal._pendingId;
    const fr = modal._folderRename;
    modal.close();
    try {
      if (fr) {
        const parent = fr.oldPath.substring(0, fr.oldPath.lastIndexOf('/') + 1);
        await torrentRenameFolder(hash, fr.oldPath, parent + newName);
      } else {
        await torrentRename(hash, newName);
      }
      await forceRefresh();
    } catch (err) {
      showToast('Failed to rename: ' + err.message, 'error');
    }
  });
}

function mountSeedRatioModal() {
  const modal    = document.getElementById('modal-seed-ratio');
  const modeEl   = document.getElementById('seed-ratio-mode');
  const inputEl  = document.getElementById('seed-ratio-input');
  function updateLimitRowVisibility() {
    if (inputEl) inputEl.style.display = modeEl.value === 'specific' ? 'block' : 'none';
  }

  function updateSeedRatioHints() {
    const ratioHint = document.getElementById('seed-ratio-global-hint');
    const timeHint  = document.getElementById('seed-time-global-hint');
    const ratioMode = document.getElementById('seed-ratio-mode')?.value;
    const timeMode  = document.getElementById('seed-time-mode')?.value;

    if (ratioHint) {
      if (ratioMode === 'global') {
        const globalRatio   = state.prefs?.max_ratio ?? null;
        const globalEnabled = state.prefs?.max_ratio_enabled ?? false;
        if (!globalEnabled || globalRatio === null) {
          ratioHint.textContent = '(global: no limit)';
        } else {
          ratioHint.textContent = `(global: ${Number(globalRatio).toFixed(2)})`;
        }
      } else {
        ratioHint.textContent = '';
      }
    }

    if (timeHint) {
      if (timeMode === '-1') {
        const globalMins    = state.prefs?.max_seeding_time ?? null;
        const globalEnabled = state.prefs?.max_seeding_time_enabled ?? false;
        if (!globalEnabled || globalMins === null || globalMins < 0) {
          timeHint.textContent = '(global: no limit)';
        } else {
          const h = Math.floor(globalMins / 60);
          const m = globalMins % 60;
          const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
          timeHint.textContent = `(global: ${label})`;
        }
      } else {
        timeHint.textContent = '';
      }
    }
  }

  document.addEventListener('modal:seed-ratio', e => {
    const { ids, torrent } = e.detail;

    const ratioLimit = torrent?.ratio_limit ?? -1;
    let mode = 'global';
    if (ratioLimit === -2) mode = 'forever';
    else if (ratioLimit >= 0) mode = 'specific';

    if (modeEl)  modeEl.value  = mode;
    if (inputEl) inputEl.value = ratioLimit >= 0 ? ratioLimit.toFixed(2) : '2.00';
    updateLimitRowVisibility();

    const seedingTimeLimit = torrent?.seeding_time_limit ?? -1;
    const timeModeElNow = document.getElementById('seed-time-mode');
    const timeInputElNow = document.getElementById('seed-time-input');
    if (timeModeElNow) {
      if (seedingTimeLimit === -2) {
        timeModeElNow.value = '-2';
      } else if (seedingTimeLimit >= 0) {
        timeModeElNow.value = 'custom';
        if (timeInputElNow) timeInputElNow.value = seedingTimeLimit;
      } else {
        timeModeElNow.value = '-1';
      }
      if (timeInputElNow) timeInputElNow.style.display = timeModeElNow.value === 'custom' ? 'block' : 'none';
    }

    modal._pendingIds = ids;
    modal.showModal();
    updateSeedRatioHints();
    if (mode === 'specific') {
      setTimeout(() => { inputEl?.select(); }, 50);
    }
  });

  modeEl?.addEventListener('change', () => {
    updateLimitRowVisibility();
    updateSeedRatioHints();
  });

  document.getElementById('seed-ratio-cancel')?.addEventListener('click', () => {
    modal.close();
  });

  const timeInputEl  = document.getElementById('seed-time-input');
  const timeModeEl   = document.getElementById('seed-time-mode');
  function updateTimeLimitRowVisibility() {
    if (timeInputEl) timeInputEl.style.display = timeModeEl?.value === 'custom' ? 'block' : 'none';
  }
  timeModeEl?.addEventListener('change', () => {
    updateTimeLimitRowVisibility();
    updateSeedRatioHints();
  });

  document.getElementById('seed-ratio-confirm')?.addEventListener('click', async () => {
    const mode   = modeEl.value;
    const hashes = modal._pendingIds.slice();
    modal.close();

    let ratioLimit;
    if (mode === 'global') {
      ratioLimit = -1;
    } else if (mode === 'forever') {
      ratioLimit = -2;
    } else {
      const val   = inputEl.value.trim();
      const ratio = parseFloat(val);
      if (isNaN(ratio) || ratio < 0) {
        showToast('Invalid ratio value', 'error');
        return;
      }
      ratioLimit = ratio;
    }

    let seedingTimeLimit = -1;
    const timeMode = timeModeEl?.value ?? '-1';
    if (timeMode === '-2') {
      seedingTimeLimit = -2;
    } else if (timeMode === 'custom') {
      const mins = parseInt(timeInputEl?.value ?? '', 10);
      if (!isNaN(mins) && mins >= 0) seedingTimeLimit = mins;
    }

    try {
      await torrentSetShareLimits(hashes, ratioLimit, seedingTimeLimit);
      await forceRefresh();
      const count = hashes.length;
      showToast(
        count === 1 ? 'Seed limits updated' : `Seed limits updated for ${count} torrents`,
        'success'
      );
    } catch (err) {
      showToast('Failed to set limits: ' + err.message, 'error');
    }
  });

  inputEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('seed-ratio-confirm')?.click();
    }
  });
}

function mountModals() {
  mountAddModal();
  mountRemoveModal();
  mountSetLocationModal();
  mountRenameModal();
  mountSeedRatioModal();
}

