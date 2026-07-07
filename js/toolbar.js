
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

    const altActive = ss.use_alt_speed_limits === true;
    const altBtn = document.getElementById('btn-alt-speed-indicator');
    if (altBtn) altBtn.hidden = !altActive;

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

  document.getElementById('btn-alt-speed-indicator')?.addEventListener('click', function () {
    openAltSpeedPopover(this);
  });
}

// Positions a popover relative to its anchor, flipping to open above when
// there isn't enough room below (anchors near the bottom of the viewport —
// like the sidebar footer's speed readouts — never have room below them).
// Always instant — the open/close lifecycle is what's animated (see
// speed-popover-enter/exit below), not repositioning while already open.
function positionPopover(popover, anchorEl) {
  const gap  = 8;
  const rect = anchorEl.getBoundingClientRect();

  // Measure natural size before placing it — height/width don't depend on
  // top/left, so this is safe to read immediately after appendChild.
  const popRect = popover.getBoundingClientRect();

  const fitsBelow = rect.bottom + gap + popRect.height <= window.innerHeight - gap;
  const openAbove = !fitsBelow;
  popover.classList.toggle('speed-popover--above', openAbove);

  const top = openAbove
    ? Math.max(gap, rect.top - gap - popRect.height)
    : rect.bottom + gap;
  const left = rect.left + rect.width / 2 - popRect.width / 2;

  popover.style.top  = top + 'px';
  popover.style.left = Math.max(gap, Math.min(left, window.innerWidth - popRect.width - gap)) + 'px';

  // Position caret over the anchor button after layout
  requestAnimationFrame(() => {
    const finalRect = popover.getBoundingClientRect();
    const caretEl    = popover.querySelector('.speed-popover__caret');
    if (caretEl) {
      const anchorCenter = rect.left + rect.width / 2;
      const caretOffset  = anchorCenter - finalRect.left;
      caretEl.style.left = Math.max(12, Math.min(caretOffset, finalRect.width - 12)) + 'px';
    }
  });
}

function openSpeedPopover(anchorEl, mode) {
  const wasSameAnchor = _popoverAnchor === anchorEl;
  // Closing to make way for a different popover: immediate (no point
  // animating something that's about to be replaced). Re-clicking the
  // same anchor to toggle this one closed: animated, like any other close.
  if (_popoverCleanup) { _popoverCleanup(!wasSameAnchor); }
  if (wasSameAnchor) return;

  const popover = buildLimitPopover(mode || 'dl');
  document.body.appendChild(popover);
  positionPopover(popover, anchorEl);

  // Toggling the limit on/off changes the popover's height (the value
  // input row appears/disappears) — reposition instantly so it keeps
  // growing away from the anchor instead of extending downward off-screen.
  // No animation here on purpose — animation belongs to open/close below,
  // not to sliding the box around on every toggle.
  popover.addEventListener('popover:resize', () => positionPopover(popover, anchorEl));

  _popoverAnchor = anchorEl;

  function onOutsideClick(e) {
    if (!popover.contains(e.target) && !anchorEl.contains(e.target)) {
      close();
    }
  }
  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }
  // `immediate` skips the fade-out — used when a new popover is about to
  // replace this one, so there's no point animating the old one away.
  function close(immediate) {
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('keydown', onKeydown);
    _popoverAnchor  = null;
    _popoverCleanup = null;
    if (immediate) {
      popover.remove();
    } else {
      popover.classList.add('speed-popover--closing');
      popover.addEventListener('animationend', () => popover.remove(), { once: true });
    }
  }
  _popoverCleanup = close;

  setTimeout(() => {
    document.addEventListener('click', onOutsideClick, true);
    document.addEventListener('keydown', onKeydown);
  }, 0);
}

function buildLimitPopover(mode) {
  const p        = state.prefs;
  const isDownload = mode === 'dl';
  const enabled  = isDownload ? ((p.dl_limit ?? 0) > 0) : ((p.up_limit ?? 0) > 0);
  const current  = isDownload ? bytesToMbps(p.dl_limit ?? 0) : bytesToMbps(p.up_limit ?? 0);
  const label    = isDownload ? 'Download limit' : 'Upload limit';
  const onId     = `sp-${mode}-on`;
  const valId    = `sp-${mode}-val`;
  const subId    = `sp-${mode}-sub`;
  const prefKey  = isDownload ? 'dl_limit' : 'up_limit';

  const pop = document.createElement('div');
  pop.className = 'speed-popover';
  pop.innerHTML = `
    <div class="speed-popover__caret" aria-hidden="true"></div>
    <div class="sp-section">
      <div class="sp-inline-row">
        <label class="toggle sp-toggle" aria-label="Enable ${label.toLowerCase()}">
          <input type="checkbox" id="${onId}"${enabled ? ' checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <label class="sp-label">${label}</label>
        <div class="sp-inline-sub" id="${subId}"${!enabled ? ' hidden' : ''}>
          <input type="number" class="input sp-input" id="${valId}"
                 value="${enabled ? current : 10}" min="0.1" step="0.1">
          <span class="sp-unit">Mbps</span>
        </div>
      </div>
    </div>
  `;

  async function save(payload) {
    try {
      await setPreferences(payload);
      const fresh = await getPreferences();
      setPrefs(fresh);
      // Re-emit serverstate:changed so toolbar readout updates immediately
      emit('serverstate:changed', state.serverState);
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    }
  }

  pop.querySelector(`#${onId}`).addEventListener('change', async e => {
    const on  = e.target.checked;
    const sub = pop.querySelector(`#${subId}`);
    sub.hidden = !on;
    pop.dispatchEvent(new CustomEvent('popover:resize'));
    if (on) {
      const val = parseFloat(pop.querySelector(`#${valId}`).value) || 10;
      await save({ [prefKey]: mbpsToBytes(val) || mbpsToBytes(10) });
      setTimeout(() => pop.querySelector(`#${valId}`)?.select(), 50);
    } else {
      await save({ [prefKey]: 0 });
    }
  });

  pop.querySelector(`#${valId}`).addEventListener('change', async e => {
    if (!pop.querySelector(`#${onId}`).checked) return;
    const val = parseFloat(e.target.value) || 0;
    if (val > 0) await save({ [prefKey]: mbpsToBytes(val) });
  });

  return pop;
}

function openAltSpeedPopover(anchorEl) {
  const wasSameAnchor = _popoverAnchor === anchorEl;
  if (_popoverCleanup) { _popoverCleanup(!wasSameAnchor); }
  if (wasSameAnchor) return;

  const pop = document.createElement('div');
  pop.className = 'speed-popover';
  pop.innerHTML = `
    <div class="speed-popover__caret" aria-hidden="true"></div>
    <div>
      <div class="speed-popover__title">Alt speed is active</div>
      <p class="speed-popover__desc">
        Alternative speed limits are currently in effect — either set by a schedule
        or enabled in another client.
      </p>
    </div>
    <div class="speed-popover__footer">
      <button class="btn-secondary btn--sm" name="disable-alt">Disable</button>
    </div>
  `;

  document.body.appendChild(pop);
  positionPopover(pop, anchorEl);

  _popoverAnchor = anchorEl;

  function onOutsideClick(e) {
    if (!pop.contains(e.target) && !anchorEl.contains(e.target)) close();
  }
  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }
  function close(immediate) {
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('keydown', onKeydown);
    _popoverAnchor  = null;
    _popoverCleanup = null;
    if (immediate) {
      pop.remove();
    } else {
      pop.classList.add('speed-popover--closing');
      pop.addEventListener('animationend', () => pop.remove(), { once: true });
    }
  }
  _popoverCleanup = close;

  pop.querySelector('[name="disable-alt"]').addEventListener('click', async () => {
    // Hide the indicator immediately — don't wait for server round-trip
    const altBtn = document.getElementById('btn-alt-speed-indicator');
    if (altBtn) altBtn.hidden = true;
    close();
    try {
      await api('/transfer/toggleSpeedLimitsMode', { body: '' });
      // rid=0 forces full response so server_state is always included
      const data = await api('/sync/maindata', { rid: 0 });
      if (data.server_state) setServerState(data.server_state);
    } catch (err) {
      // Restore indicator if call failed
      if (altBtn) altBtn.hidden = false;
      showToast('Failed to disable alt speed: ' + err.message, 'error');
    }
  });

  setTimeout(() => {
    document.addEventListener('click', onOutsideClick, true);
    document.addEventListener('keydown', onKeydown);
  }, 0);
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

