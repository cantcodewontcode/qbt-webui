
let _popoverCleanup = null;
let _popoverAnchor  = null;

function mountToolbar() {
  mountSearch();
  mountSpeedReadouts();
  mountAddTorrent();
  mountSettingsBtn();
}

function mountSearch() {
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  let debounceTimer;

  input.addEventListener('input', () => {
    clear.hidden = input.value.length === 0;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => setSearch(input.value), 200);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    clear.hidden = true;
    setSearch('');
    input.focus();
  });
}

function mountSpeedReadouts() {
  on('serverstate:changed', () => {
    const ss = state.serverState;
    const dl = ss.dl_info_speed || 0;
    const ul = ss.up_info_speed || 0;
    document.getElementById('speed-down-value').textContent = formatSpeed(dl);
    document.getElementById('speed-up-value').textContent   = formatSpeed(ul);
    document.getElementById('speed-down').classList.toggle('is-active', dl > 0);
    document.getElementById('speed-up').classList.toggle('is-active',   ul > 0);

    const connStatus = ss.connection_status ?? 'connected';
    const connEl = document.getElementById('conn-status');
    if (connEl) {
      connEl.className = `conn-status conn-status--${connStatus}`;
      const tips = {
        connected:    'Connected',
        firewalled:   'Firewalled — incoming connections may be blocked',
        disconnected: 'qBittorrent has no peer network connection',
      };
      connEl.title = tips[connStatus] || 'Connected';
    }


  });

  document.getElementById('speed-down').addEventListener('click', function () {
    openSpeedPopover(this, 'dl');
  });
  document.getElementById('speed-up').addEventListener('click', function () {
    openSpeedPopover(this, 'ul');
  });


}

function openSpeedPopover(anchorEl, mode) {
  const wasSameAnchor = _popoverAnchor === anchorEl;
  if (_popoverCleanup) { _popoverCleanup(); }
  if (wasSameAnchor) return;

  const popover = buildPopover(mode);
  document.body.appendChild(popover);

  const rect = anchorEl.getBoundingClientRect();
  const left = rect.left + rect.width / 2 - 140;
  popover.style.top  = (rect.bottom + 8) + 'px';
  popover.style.left = Math.max(8, Math.min(left, window.innerWidth - 288)) + 'px';

  _popoverAnchor = anchorEl;

  function onOutsideClick(e) {
    if (!popover.contains(e.target) && !anchorEl.contains(e.target)) {
      close();
    }
  }
  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }
  function close() {
    popover.remove();
    _popoverAnchor  = null;
    _popoverCleanup = null;
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('keydown', onKeydown);
  }
  _popoverCleanup = close;

  // Position caret over the anchor button after layout
  requestAnimationFrame(() => {
    const popRect  = popover.getBoundingClientRect();
    const caretEl  = popover.querySelector('.speed-popover__caret');
    if (caretEl) {
      const anchorCenter = rect.left + rect.width / 2;
      const caretOffset  = anchorCenter - popRect.left;
      caretEl.style.left = Math.max(12, Math.min(caretOffset, popRect.width - 12)) + 'px';
    }
  });

  setTimeout(() => {
    document.addEventListener('click', onOutsideClick, true);
    document.addEventListener('keydown', onKeydown);
  }, 0);
}

function buildPopover(mode) {
  const prefs     = state.prefs;
  const dlEnabled = (prefs.dl_limit ?? 0) > 0;
  const ulEnabled = (prefs.up_limit ?? 0) > 0;
  const caretHTML = `<div class="speed-popover__caret" aria-hidden="true"></div>`;

  const pop = document.createElement('div');
  pop.className = 'speed-popover';

  if (mode === 'dl') {
    pop.innerHTML = `
      ${caretHTML}
      <div>
        <div class="speed-popover__title">Download limit</div>
        <div class="speed-popover__row">
          <label>
            <input type="checkbox" name="dl-enabled" ${dlEnabled ? 'checked' : ''}>
            Limit
          </label>
          <input type="number" class="input speed-popover__input" name="dl-value"
                 value="${dlEnabled ? kbpsToMbps(prefs.dl_limit) : 0}" min="0">
          <span class="speed-popover__unit">Mbps</span>
        </div>
      </div>
      <div class="speed-popover__divider"></div>
      <div>
        <div class="speed-popover__title">Alternative speeds</div>
        <div class="speed-popover__row">
          <label>
            <input type="checkbox" name="alt-enabled"
                   ${prefs.alt_speed_enabled ? 'checked' : ''}>
            Enable
          </label>
        </div>
        <div class="speed-popover__row">
          <label>↓ Alt</label>
          <input type="number" class="input speed-popover__input" name="alt-dl"
                 value="${kbpsToMbps(prefs.alt_dl_limit ?? 0)}" min="0">
          <span class="speed-popover__unit">Mbps</span>
        </div>
      </div>
      <div class="speed-popover__footer">
        <button class="btn-primary btn--sm" name="apply">Apply</button>
      </div>
    `;
  } else {
    pop.innerHTML = `
      ${caretHTML}
      <div>
        <div class="speed-popover__title">Upload limit</div>
        <div class="speed-popover__row">
          <label>
            <input type="checkbox" name="ul-enabled" ${ulEnabled ? 'checked' : ''}>
            Limit
          </label>
          <input type="number" class="input speed-popover__input" name="ul-value"
                 value="${ulEnabled ? kbpsToMbps(prefs.up_limit) : 0}" min="0">
          <span class="speed-popover__unit">Mbps</span>
        </div>
      </div>
      <div class="speed-popover__divider"></div>
      <div>
        <div class="speed-popover__title">Alternative speeds</div>
        <div class="speed-popover__row">
          <label>
            <input type="checkbox" name="alt-enabled"
                   ${prefs.alt_speed_enabled ? 'checked' : ''}>
            Enable
          </label>
        </div>
        <div class="speed-popover__row">
          <label>↑ Alt</label>
          <input type="number" class="input speed-popover__input" name="alt-ul"
                 value="${kbpsToMbps(prefs.alt_up_limit ?? 0)}" min="0">
          <span class="speed-popover__unit">Mbps</span>
        </div>
      </div>
      <div class="speed-popover__footer">
        <button class="btn-primary btn--sm" name="apply">Apply</button>
      </div>
    `;
  }

  pop.querySelector('[name="apply"]').addEventListener('click', async () => {
    const payload = {};
    const altEnabled = pop.querySelector('[name="alt-enabled"]')?.checked;
    if (altEnabled !== undefined) payload.alt_speed_enabled = altEnabled;

    if (mode === 'dl') {
      const dlOn  = pop.querySelector('[name="dl-enabled"]').checked;
      const dlVal = parseInt(pop.querySelector('[name="dl-value"]').value, 10) || 0;
      const altDl = parseInt(pop.querySelector('[name="alt-dl"]')?.value,  10) || 0;
      payload.dl_limit     = dlOn ? (mbpsToKbps(dlVal) || mbpsToKbps(8)) : 0;
      payload.alt_dl_limit = mbpsToKbps(altDl);
    } else {
      const ulOn  = pop.querySelector('[name="ul-enabled"]').checked;
      const ulVal = parseInt(pop.querySelector('[name="ul-value"]').value, 10) || 0;
      const altUl = parseInt(pop.querySelector('[name="alt-ul"]')?.value,  10) || 0;
      payload.up_limit     = ulOn ? (mbpsToKbps(ulVal) || mbpsToKbps(8)) : 0;
      payload.alt_up_limit = mbpsToKbps(altUl);
    }

    try {
      await setPreferences(payload);
      if (_popoverCleanup) _popoverCleanup();
      forceRefresh();
    } catch (err) {
      console.error('Failed to apply speed limits:', err);
    }
  });

  return pop;
}

function mountAddTorrent() {
  document.getElementById('btn-add-torrent').addEventListener('click', () => {
    openAddModal();
  });
}

// Renamed from mountSettings to avoid collision with settings.js mountSettings
function mountSettingsBtn() {
  document.getElementById('btn-settings').addEventListener('click', () => {
    setSettingsOpen(!state.settingsOpen);
  });
}

