
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
    openSpeedPopover(this);
  });
  document.getElementById('speed-up').addEventListener('click', function () {
    openSpeedPopover(this);
  });

  document.getElementById('btn-alt-speed-indicator')?.addEventListener('click', function () {
    openAltSpeedPopover(this);
  });
}

function openSpeedPopover(anchorEl) {
  const wasSameAnchor = _popoverAnchor === anchorEl;
  if (_popoverCleanup) { _popoverCleanup(); }
  if (wasSameAnchor) return;

  const popover = buildPopover();
  document.body.appendChild(popover);

  const rect = anchorEl.getBoundingClientRect();
  const left = rect.left + rect.width / 2 - 150;
  popover.style.top  = (rect.bottom + 8) + 'px';
  popover.style.left = Math.max(8, Math.min(left, window.innerWidth - 308)) + 'px';

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

function buildPopover() {
  const p = state.prefs;
  const dlEnabled  = (p.dl_limit  ?? 0) > 0;
  const ulEnabled  = (p.up_limit  ?? 0) > 0;
  const altEnabled = !!(p.alt_speed_enabled);
  const schedEnabled = !!(p.scheduler_enabled);

  const fromH = String(p.schedule_from_hour ?? 9).padStart(2, '0');
  const fromM = String(p.schedule_from_min  ?? 0).padStart(2, '0');
  const toH   = String(p.schedule_to_hour   ?? 17).padStart(2, '0');
  const toM   = String(p.schedule_to_min    ?? 0).padStart(2, '0');

  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const dayMask = p.scheduler_days || 0;
  const dayCheckboxes = days.map((d, i) => {
    const bit = 1 << i;
    return `<label class="sp-day"><input type="checkbox" class="sp-day-cb" data-bit="${bit}"${(dayMask & bit) ? ' checked' : ''}> ${d}</label>`;
  }).join('');

  const pop = document.createElement('div');
  pop.className = 'speed-popover';
  pop.innerHTML = `
    <div class="speed-popover__caret" aria-hidden="true"></div>

    <div class="sp-section">
      <div class="sp-row">
        <label class="sp-label">Download limit</label>
        <label class="toggle sp-toggle" aria-label="Enable download limit">
          <input type="checkbox" id="sp-dl-on"${dlEnabled ? ' checked' : ''}>
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="sp-sub" id="sp-dl-sub"${!dlEnabled ? ' hidden' : ''}>
        <input type="number" class="input sp-input" id="sp-dl-val"
               value="${dlEnabled ? kBsToMbps(p.dl_limit) : 10}" min="0" step="0.1">
        <span class="sp-unit">Mbps</span>
      </div>
    </div>

    <div class="sp-section">
      <div class="sp-row">
        <label class="sp-label">Upload limit</label>
        <label class="toggle sp-toggle" aria-label="Enable upload limit">
          <input type="checkbox" id="sp-ul-on"${ulEnabled ? ' checked' : ''}>
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="sp-sub" id="sp-ul-sub"${!ulEnabled ? ' hidden' : ''}>
        <input type="number" class="input sp-input" id="sp-ul-val"
               value="${ulEnabled ? kBsToMbps(p.up_limit) : 10}" min="0" step="0.1">
        <span class="sp-unit">Mbps</span>
      </div>
    </div>

    <div class="sp-section">
      <div class="sp-row">
        <label class="sp-label">Alternative speeds</label>
        <label class="toggle sp-toggle" aria-label="Enable alternative speeds">
          <input type="checkbox" id="sp-alt-on"${altEnabled ? ' checked' : ''}>
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="sp-sub" id="sp-alt-sub"${!altEnabled ? ' hidden' : ''}>
        <div class="sp-alt-row">
          <span class="sp-alt-label">↓</span>
          <input type="number" class="input sp-input" id="sp-alt-dl"
                 value="${kBsToMbps(p.alt_dl_limit ?? 0)}" min="0" step="0.1">
          <span class="sp-unit">Mbps</span>
        </div>
        <div class="sp-alt-row">
          <span class="sp-alt-label">↑</span>
          <input type="number" class="input sp-input" id="sp-alt-ul"
                 value="${kBsToMbps(p.alt_up_limit ?? 0)}" min="0" step="0.1">
          <span class="sp-unit">Mbps</span>
        </div>
        <div class="sp-divider"></div>
        <div class="sp-row">
          <label class="sp-label sp-label--sm">Schedule</label>
          <label class="toggle sp-toggle sp-toggle--sm" aria-label="Enable schedule">
            <input type="checkbox" id="sp-sched-on"${schedEnabled ? ' checked' : ''}>
            <span class="toggle-track toggle-track--sm"></span>
          </label>
        </div>
        <div class="sp-sub" id="sp-sched-sub"${!schedEnabled ? ' hidden' : ''}>
          <div class="sp-days">${dayCheckboxes}</div>
          <div class="sp-time-row">
            <span class="sp-alt-label">From</span>
            <input type="time" class="input sp-time" id="sp-sched-from" value="${fromH}:${fromM}">
          </div>
          <div class="sp-time-row">
            <span class="sp-alt-label">To</span>
            <input type="time" class="input sp-time" id="sp-sched-to" value="${toH}:${toM}">
          </div>
        </div>
      </div>
    </div>
  `;

  async function save(payload) {
    try {
      await setPreferences(payload);
      const fresh = await getPreferences();
      setPrefs(fresh);
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    }
  }

  pop.querySelector('#sp-dl-on').addEventListener('change', async e => {
    const on = e.target.checked;
    const sub = pop.querySelector('#sp-dl-sub');
    sub.hidden = !on;
    const val = parseFloat(pop.querySelector('#sp-dl-val').value) || 10;
    await save({ dl_limit: on ? (mbpsToKBs(val) || mbpsToKBs(10)) : 0 });
  });

  pop.querySelector('#sp-dl-val').addEventListener('change', async e => {
    if (!pop.querySelector('#sp-dl-on').checked) return;
    const val = parseFloat(e.target.value) || 0;
    await save({ dl_limit: mbpsToKBs(val) });
  });

  pop.querySelector('#sp-ul-on').addEventListener('change', async e => {
    const on = e.target.checked;
    const sub = pop.querySelector('#sp-ul-sub');
    sub.hidden = !on;
    const val = parseFloat(pop.querySelector('#sp-ul-val').value) || 10;
    await save({ up_limit: on ? (mbpsToKBs(val) || mbpsToKBs(10)) : 0 });
  });

  pop.querySelector('#sp-ul-val').addEventListener('change', async e => {
    if (!pop.querySelector('#sp-ul-on').checked) return;
    const val = parseFloat(e.target.value) || 0;
    await save({ up_limit: mbpsToKBs(val) });
  });

  pop.querySelector('#sp-alt-on').addEventListener('change', async e => {
    const on = e.target.checked;
    pop.querySelector('#sp-alt-sub').hidden = !on;
    await save({ alt_speed_enabled: on });
  });

  pop.querySelector('#sp-alt-dl').addEventListener('change', async e => {
    await save({ alt_dl_limit: mbpsToKBs(parseFloat(e.target.value) || 0) });
  });

  pop.querySelector('#sp-alt-ul').addEventListener('change', async e => {
    await save({ alt_up_limit: mbpsToKBs(parseFloat(e.target.value) || 0) });
  });

  pop.querySelector('#sp-sched-on').addEventListener('change', async e => {
    const on = e.target.checked;
    pop.querySelector('#sp-sched-sub').hidden = !on;
    await save({ scheduler_enabled: on });
  });

  pop.querySelectorAll('.sp-day-cb').forEach(cb => {
    cb.addEventListener('change', async () => {
      let mask = 0;
      pop.querySelectorAll('.sp-day-cb').forEach(c => {
        if (c.checked) mask |= Number(c.dataset.bit);
      });
      await save({ scheduler_days: mask });
    });
  });

  pop.querySelector('#sp-sched-from').addEventListener('change', async e => {
    const [h, m] = e.target.value.split(':').map(Number);
    await save({ schedule_from_hour: h || 0, schedule_from_min: m || 0 });
  });

  pop.querySelector('#sp-sched-to').addEventListener('change', async e => {
    const [h, m] = e.target.value.split(':').map(Number);
    await save({ schedule_to_hour: h || 0, schedule_to_min: m || 0 });
  });

  return pop;
}

function openAltSpeedPopover(anchorEl) {
  const wasSameAnchor = _popoverAnchor === anchorEl;
  if (_popoverCleanup) { _popoverCleanup(); }
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

  const rect = anchorEl.getBoundingClientRect();
  const left = rect.left + rect.width / 2 - 150;
  pop.style.top  = (rect.bottom + 8) + 'px';
  pop.style.left = Math.max(8, Math.min(left, window.innerWidth - 308)) + 'px';

  _popoverAnchor = anchorEl;

  function onOutsideClick(e) {
    if (!pop.contains(e.target) && !anchorEl.contains(e.target)) close();
  }
  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }
  function close() {
    pop.remove();
    _popoverAnchor  = null;
    _popoverCleanup = null;
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('keydown', onKeydown);
  }
  _popoverCleanup = close;

  requestAnimationFrame(() => {
    const popRect = pop.getBoundingClientRect();
    const caretEl = pop.querySelector('.speed-popover__caret');
    if (caretEl) {
      const anchorCenter = rect.left + rect.width / 2;
      const caretOffset  = anchorCenter - popRect.left;
      caretEl.style.left = Math.max(12, Math.min(caretOffset, popRect.width - 12)) + 'px';
    }
  });

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

