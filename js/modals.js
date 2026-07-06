
function showToast(message, type) {
  if (type === undefined) type = 'info';
  const container = document.getElementById('toast-container');

  // Deduplicate: if an identical message+type toast already exists, reset its
  // timer instead of adding a new one
  const existing = [...container.querySelectorAll('.toast')].find(t =>
    t.dataset.message === message && t.dataset.type === type
  );
  if (existing) {
    // Reset the fade-out by restoring opacity and restarting the timer
    existing.style.transition = '';
    existing.style.opacity = '1';
    clearTimeout(Number(existing.dataset.timer));
    const timer = setTimeout(() => {
      existing.style.transition = 'opacity 220ms';
      existing.style.opacity = '0';
      setTimeout(() => existing.remove(), 220);
    }, 4000);
    existing.dataset.timer = String(timer);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.dataset.message = message;
  toast.dataset.type = type;

  const iconMap = {
    success: iconCheck(16),
    error:   iconAlertCircle(16),
    info:    iconInfo(16),
  };

  toast.innerHTML =
    `<span class="toast-icon">${iconMap[type] ?? ''}</span>` +
    `<span class="toast__message">${message}</span>`;

  container.appendChild(toast);

  const timer = setTimeout(() => {
    toast.style.transition = 'opacity 220ms';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 220);
  }, 4000);
  toast.dataset.timer = String(timer);
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
  const magnetInput = document.getElementById('magnet-input');
  if (magnetInput) magnetInput.value = '';
  const fileInput = document.getElementById('torrent-file-input');
  if (fileInput) fileInput.value = '';
  const filenameEl = document.getElementById('dropzone-filename');
  if (filenameEl) { filenameEl.hidden = true; filenameEl.textContent = ''; }
  document.getElementById('torrent-dropzone')?.classList.remove('has-file');
  const btn = document.getElementById('btn-add-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Add'; }
}

function openAddModal() {
  // ── Mobile: use option sheet ────────────────────────────────
  if (window.innerWidth < 640) {
    openOptionSheet({
      title: 'Add Torrent',
      buildContent: (body) => {
        body.innerHTML = `
          <div style="display:flex;flex-direction:column;height:100%;min-height:0;">
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4);">
              <div class="field-group">
                <label class="field-label">Torrent file</label>
                <div style="display:flex;align-items:center;gap:var(--space-3);">
                  <button class="btn-secondary btn--md" id="btn-pick-file-mobile"
                          type="button" style="flex-shrink:0;">
                    Choose File
                  </button>
                  <span id="mobile-file-name"
                        style="font-size:var(--type-body-sm);color:var(--color-text-secondary);
                               overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                               flex:1;min-width:0;">
                    No file chosen
                  </span>
                </div>
                <input type="file" id="torrent-file-input-mobile" accept=".torrent" class="sr-only">
              </div>
              <div class="add-panel__divider"><span class="add-panel__divider-label">or</span></div>
              <div class="field-group">
                <label class="field-label" for="magnet-input-mobile">Magnet link or URL</label>
                <textarea id="magnet-input-mobile" class="input textarea"
                          placeholder="magnet:?xt=urn:btih:…" rows="3" spellcheck="false"
                          style="font-size:16px;"></textarea>
              </div>
              <div class="field-group">
                <label class="field-label" for="add-download-dir-mobile">Download to</label>
                <input type="text" id="add-download-dir-mobile" class="input" spellcheck="false"
                       style="font-size:16px;" value="${esc(state.prefs?.save_path || '')}">
              </div>
            </div>
            <div style="padding:var(--space-3) var(--space-4);border-top:1px solid var(--color-border);display:flex;gap:var(--space-2);justify-content:flex-end;flex-shrink:0;">
              <button class="btn-secondary btn--md" id="btn-add-cancel-mobile">Cancel</button>
              <button class="btn-primary btn--md" id="btn-add-confirm-mobile" disabled>Add</button>
            </div>
          </div>`;

        let mobileSelectedFile = null;
        let mobileSelectedFileBase64 = null;

        const updateMobileAddBtn = () => {
          const btn = body.querySelector('#btn-add-confirm-mobile');
          const hasMagnet = body.querySelector('#magnet-input-mobile')?.value.trim().length > 0;
          if (btn) btn.disabled = !mobileSelectedFile && !hasMagnet;
        };

        body.querySelector('#magnet-input-mobile')?.addEventListener('input', updateMobileAddBtn);

        const fileBtn   = body.querySelector('#btn-pick-file-mobile');
        const fileInput = body.querySelector('#torrent-file-input-mobile');
        const fileName  = body.querySelector('#mobile-file-name');

        fileBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', () => {
          const file = fileInput.files[0];
          if (!file) return;
          mobileSelectedFile = file;
          if (fileName) fileName.textContent = file.name;
          updateMobileAddBtn();
        });

        body.querySelector('#btn-add-cancel-mobile')?.addEventListener('click', closeOptionSheet);

        body.querySelector('#btn-add-confirm-mobile')?.addEventListener('click', async () => {
          const dir = body.querySelector('#add-download-dir-mobile')?.value.trim() || '';
          const btn = body.querySelector('#btn-add-confirm-mobile');
          if (btn) { btn.disabled = true; btn.innerHTML = iconLoader(16, 'icon--spinning') + ' Adding…'; }
          try {
            if (mobileSelectedFile) {
              await torrentAdd({ savepath: dir, torrentFile: mobileSelectedFile });
            } else {
              const magnet = body.querySelector('#magnet-input-mobile')?.value.trim() || '';
              if (!magnet) { if (btn) { btn.disabled = false; btn.textContent = 'Add'; } return; }
              await torrentAdd({ savepath: dir, urls: magnet });
            }
            closeOptionSheet();
            forceRefresh();
            showToast('Torrent added', 'success');
          } catch (err) {
            if (btn) { btn.disabled = false; btn.textContent = 'Add'; }
            showToast('Failed to add torrent: ' + err.message, 'error');
          }
        });
      },
    });
    return; // ← skip desktop path
  }
  // ── Desktop path continues below unchanged ──────────────────

  const rightPanel      = document.getElementById('right-panel');
  const addContent      = document.getElementById('add-content');
  const inspContent     = document.getElementById('inspector-content');
  const settingsContent = document.getElementById('settings-content');
  const logContent      = document.getElementById('log-content');

  // Silence other panels directly — no state events, no close-branch side effects
  closeInspectorSilent();
  state.settingsOpen = false;
  state.logOpen = false;
  document.removeEventListener('keydown', handleSettingsEsc);
  if (inspContent)     inspContent.hidden     = true;
  if (settingsContent) settingsContent.hidden = true;
  if (logContent)      logContent.hidden      = true;
  if (addContent)      addContent.hidden      = false;

  rightPanel.classList.add('right-panel--open');
  rightPanel.setAttribute('aria-hidden', 'false');

  document.getElementById('add-download-dir').value =
    state.prefs?.save_path || '';
}


function handleFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    selectedFileBase64 = reader.result.split(',')[1];
    const filenameEl = document.getElementById('dropzone-filename');
    filenameEl.textContent = file.name;
    filenameEl.hidden = false;
    document.getElementById('torrent-dropzone')?.classList.add('has-file');
    updateAddButton();
  };
  reader.readAsDataURL(file);
}

function closeAddPanel() {
  const rightPanel = document.getElementById('right-panel');
  const addContent = document.getElementById('add-content');
  if (!addContent || addContent.hidden) return;
  addContent.hidden = true;
  rightPanel.classList.remove('right-panel--open');
  rightPanel.setAttribute('aria-hidden', 'true');
  resetAddModal();
}

function mountAddModal() {
  document.getElementById('magnet-input')?.addEventListener('input', updateAddButton);

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
      if (selectedFile) {
        await torrentAdd({ savepath: dir, torrentFile: selectedFile });
      } else {
        const magnet = document.getElementById('magnet-input')?.value.trim() || '';
        if (!magnet) { btn.disabled = false; btn.textContent = 'Add'; return; }
        await torrentAdd({ savepath: dir, urls: magnet });
      }
      closeAddPanel();
      forceRefresh();
      showToast('Torrent added', 'success');
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
      const addContent = document.getElementById('add-content');
      if (addContent && !addContent.hidden) closeAddPanel();
    }
  });
}

let pendingRemoveIds = [];

function updateRemoveModalCopy() {
  const ids   = pendingRemoveIds;
  const count = ids.length;
  const name  = state.torrents.get(ids[0])?.name || 'this torrent';
  const deleteData = document.getElementById('remove-delete-data').checked;

  document.getElementById('modal-remove-title').textContent =
    count === 1 ? 'Remove Torrent' : 'Remove Torrents';

  let target;
  if (count === 1) {
    const truncated = name.length > 32 ? name.slice(0, 32) + '…' : name;
    target = `<strong>${esc(truncated)}</strong>`;
  } else {
    target = `<strong>${count} torrents</strong>`;
  }

  document.getElementById('modal-remove-desc').innerHTML =
    `Remove torrent ${target}? You can't undo this action.`;
  document.getElementById('btn-remove-confirm').textContent = deleteData ? 'Delete' : 'Remove';
}

function openRemoveModal(ids) {
  pendingRemoveIds = ids;

  let savedDelete = false;
  try {
    const stored = localStorage.getItem('tx-remove-delete-data');
    if (stored !== null) savedDelete = stored === 'true';
  } catch (_) {}
  document.getElementById('remove-delete-data').checked = savedDelete;

  updateRemoveModalCopy();

  document.getElementById('modal-remove-confirm').showModal();
}

function mountRemoveModal() {
  document.addEventListener('modal:remove', e => {
    const { ids, deleteData } = e.detail;
    openRemoveModal(ids, deleteData);
  });

  document.getElementById('remove-delete-data').addEventListener('change', updateRemoveModalCopy);

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

  async function confirmSetLocation() {
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
  }

  document.addEventListener('modal:set-location', e => {
    const { ids, torrent } = e.detail;
    pathEl.value = torrent?.save_path ?? '';
    modal._pendingIds = ids;
    modal.showModal();
    pathEl.focus();
    pathEl.setSelectionRange(pathEl.value.length, pathEl.value.length);
  });

  pathEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); confirmSetLocation(); }
  });

  document.getElementById('set-location-cancel').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('set-location-confirm').addEventListener('click', confirmSetLocation);
}

function mountRenameModal() {
  const modal   = document.getElementById('modal-rename');
  const inputEl = document.getElementById('rename-input');

  document.addEventListener('modal:rename', e => {
    const { id, torrent } = e.detail;
    inputEl.value = torrent?.name ?? '';
    modal._pendingId      = id;
    modal._pendingTorrent = torrent;
    modal.showModal();
    inputEl.select();
  });

  async function confirmRename() {
    const newName = inputEl.value.trim();
    if (!newName) return;
    const hash = modal._pendingId;
    modal.close();
    try {
      await torrentRename(hash, newName);
      await forceRefresh();
    } catch (err) {
      showToast('Failed to rename: ' + err.message, 'error');
    }
  }

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); confirmRename(); }
  });

  document.getElementById('rename-cancel').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('rename-confirm').addEventListener('click', confirmRename);
}

function mountSeedRatioModal() {
  const modal       = document.getElementById('modal-seed-ratio');
  const modeEl      = document.getElementById('share-limit-mode');
  const customRows  = document.getElementById('share-limit-custom-rows');
  const globalHint  = document.getElementById('share-limit-global-hint');
  const confirmBtn  = document.getElementById('share-limit-confirm');

  const ratioChk    = document.getElementById('share-limit-ratio-enabled');
  const ratioVal    = document.getElementById('share-limit-ratio-value');
  const timeChk     = document.getElementById('share-limit-time-enabled');
  const timeVal     = document.getElementById('share-limit-time-value');
  const inactiveChk = document.getElementById('share-limit-inactive-enabled');
  const inactiveVal = document.getElementById('share-limit-inactive-value');

  function syncUI() {
    const mode = modeEl.value;
    customRows.style.display = mode === 'custom' ? '' : 'none';

    if (mode === 'global') {
      const globalRatio   = state.prefs?.max_ratio ?? null;
      const ratioEnabled  = state.prefs?.max_ratio_enabled ?? false;
      const globalMins    = state.prefs?.max_seeding_time ?? null;
      const timeEnabled   = state.prefs?.max_seeding_time_enabled ?? false;
      const parts = [];
      if (ratioEnabled && globalRatio !== null && globalRatio >= 0) {
        parts.push(`ratio ${Number(globalRatio).toFixed(2)}`);
      }
      if (timeEnabled && globalMins !== null && globalMins >= 0) {
        const h = Math.floor(globalMins / 60);
        const m = globalMins % 60;
        parts.push(`time ${h > 0 ? h + 'h ' : ''}${m}m`);
      }
      globalHint.textContent = parts.length
        ? `Global: ${parts.join(', ')}`
        : 'Global: no limit set';
      globalHint.style.display = '';
    } else {
      globalHint.style.display = 'none';
    }

    // Enable/disable Apply
    if (mode === 'custom') {
      const anyChecked = ratioChk.checked || timeChk.checked || inactiveChk.checked;
      confirmBtn.disabled = !anyChecked;
    } else {
      confirmBtn.disabled = false;
    }
  }

  function syncCheckbox(chk, input) {
    input.disabled = !chk.checked;
    if (chk.checked) input.focus();
    syncUI();
  }

  modeEl.addEventListener('change', syncUI);
  ratioChk.addEventListener('change',    () => syncCheckbox(ratioChk,    ratioVal));
  timeChk.addEventListener('change',     () => syncCheckbox(timeChk,     timeVal));
  inactiveChk.addEventListener('change', () => syncCheckbox(inactiveChk, inactiveVal));

  // ── Open ──────────────────────────────────────────────────────────────────
  document.addEventListener('modal:seed-ratio', e => {
    const { ids } = e.detail;
    modal._pendingIds = ids;

    const torrents = ids.map(h => state.torrents.get(h)).filter(Boolean);
    const ref = torrents[0];
    const mixed = torrents.length > 1;

    // Determine mode from first torrent (or mixed default)
    let mode = 'global';
    if (!mixed && ref) {
      const rl = ref.ratio_limit   ?? -2;
      const tl = ref.seeding_time_limit ?? -2;
      if (rl >= 0 || tl >= 0 || (ref.inactive_seeding_time_limit ?? -2) >= 0) {
        mode = 'custom';
      } else if (rl === -1 && tl === -1) {
        mode = 'none';
      } else {
        mode = 'global';
      }
    }

    // Remove any stale mixed option
    modeEl.querySelector('option[value="mixed"]')?.remove();
    if (mixed) {
      const opt = document.createElement('option');
      opt.value = 'mixed-default';
      opt.textContent = 'Use global share limit (mixed)';
      opt.hidden = true;
      modeEl.insertBefore(opt, modeEl.firstChild);
      modeEl.value = 'mixed-default';
      // Treat as global for the actual send
    } else {
      modeEl.value = mode;
    }

    // Populate custom fields
    const rl  = ref?.ratio_limit ?? -1;
    const tl  = ref?.seeding_time_limit ?? -1;
    const il  = ref?.inactive_seeding_time_limit ?? -1;

    ratioChk.checked    = rl >= 0;
    ratioVal.value      = rl >= 0 ? Number(rl).toFixed(2) : '';
    ratioVal.disabled   = rl < 0;

    timeChk.checked     = tl >= 0;
    timeVal.value       = tl >= 0 ? String(tl) : '';
    timeVal.disabled    = tl < 0;

    inactiveChk.checked  = il >= 0;
    inactiveVal.value    = il >= 0 ? String(il) : '';
    inactiveVal.disabled = il < 0;

    modal.showModal();
    syncUI();

    if (mode === 'custom' && rl >= 0) {
      setTimeout(() => ratioVal.select(), 50);
    }
  });

  // ── Cancel ────────────────────────────────────────────────────────────────
  document.getElementById('share-limit-cancel')?.addEventListener('click', () => {
    modal.close();
  });

  // ── Confirm ───────────────────────────────────────────────────────────────
  confirmBtn?.addEventListener('click', async () => {
    const hashes = modal._pendingIds.slice();
    const mode = modeEl.value;
    modal.close();

    let ratioLimit, seedingTimeLimit, inactiveSeedingTimeLimit;

    if (mode === 'global' || mode === 'mixed-default') {
      ratioLimit = seedingTimeLimit = inactiveSeedingTimeLimit = -2;
    } else if (mode === 'none') {
      ratioLimit = seedingTimeLimit = inactiveSeedingTimeLimit = -1;
    } else {
      // custom
      if (ratioChk.checked) {
        const v = parseFloat(ratioVal.value);
        if (isNaN(v) || v < 0) { showToast('Invalid ratio value', 'error'); return; }
        ratioLimit = v;
      } else {
        ratioLimit = -1;
      }

      if (timeChk.checked) {
        const v = parseInt(timeVal.value, 10);
        if (isNaN(v) || v < 0) { showToast('Invalid time value', 'error'); return; }
        seedingTimeLimit = v;
      } else {
        seedingTimeLimit = -1;
      }

      if (inactiveChk.checked) {
        const v = parseInt(inactiveVal.value, 10);
        if (isNaN(v) || v < 0) { showToast('Invalid inactive time value', 'error'); return; }
        inactiveSeedingTimeLimit = v;
      } else {
        inactiveSeedingTimeLimit = -1;
      }
    }

    try {
      await torrentSetShareLimits(hashes, ratioLimit, seedingTimeLimit, inactiveSeedingTimeLimit);
      await forceRefresh();
      const count = hashes.length;
      showToast(
        count === 1 ? 'Share limit updated' : `Share limit updated for ${count} torrents`,
        'success'
      );
    } catch (err) {
      showToast('Failed to set share limit: ' + err.message, 'error');
    }
  });

  // Enter key in any input triggers confirm
  [ratioVal, timeVal, inactiveVal].forEach(input => {
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); confirmBtn?.click(); }
    });
  });
}
function mountModals() {
  mountAddModal();
  mountRemoveModal();
  mountSetLocationModal();
  mountRenameModal();
  mountSeedRatioModal();
}

