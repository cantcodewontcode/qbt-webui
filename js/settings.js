
const SECTION_TITLES = {
  speed:     'Speed',
  downloads: 'Downloads',
  seeding:   'Seeding',
  peers:     'Peers',
  queue:     'Queue',
  about:     'About',
};

function settingsRow(label, controlHtml) {
  return `<div class="settings-row">
  <span class="settings-label">${label}</span>
  <div class="settings-control">${controlHtml}</div>
</div>`;
}

function toggle(id, checked) {
  return `<label class="toggle" aria-label="${id}">
  <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
  <span class="toggle-track"></span>
</label>`;
}

function numberInput(id, value, width, disabled) {
  if (width === undefined) width = '80px';
  return `<input type="number" id="${id}" class="input"
  style="width:${width}" value="${value ?? ''}"${disabled ? ' disabled' : ''}>`;
}

function textInput(id, value) {
  return `<input type="text" id="${id}" class="input" value="${value ?? ''}" spellcheck="false">`;
}

function renderDaysCheckboxes(dayMask) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return days.map((d, i) => {
    const bit = 1 << i;
    return `<label class="day-checkbox">
    <input type="checkbox" class="sched-day" data-bit="${bit}"
           ${(dayMask & bit) ? 'checked' : ''}> ${d}
  </label>`;
  }).join('');
}

function renderTimeInput(id, minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `<input type="time" id="${id}" class="input" style="width:100px" value="${h}:${m}">`;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function pathRow(label, inputHtml) {
  return `<div class="settings-path-row">
    <span class="settings-path-label">${label}</span>
    <div class="settings-path-control">${inputHtml}</div>
  </div>`;
}

function infoTip(text) {
  return `<span class="info-tip" data-tooltip="${text}" aria-label="${text}">ⓘ</span>`;
}

function renderSpeed(s) {
  const dlEnabled = (s.dl_limit ?? 0) > 0;
  const ulEnabled = (s.up_limit ?? 0) > 0;
  const altOn     = s.alt_speed_enabled  ? '' : ' hidden';
  const schedOn   = s.scheduler_enabled  ? '' : ' hidden';

  const fromH = String(s.schedule_from_hour ?? 9).padStart(2, '0');
  const fromM = String(s.schedule_from_min  ?? 0).padStart(2, '0');
  const toH   = String(s.schedule_to_hour   ?? 17).padStart(2, '0');
  const toM   = String(s.schedule_to_min    ?? 0).padStart(2, '0');

  return `
  <div class="settings-section">
    ${settingsRow('Download limit',
      toggle('set-dl-enabled', dlEnabled) +
      numberInput('set-dl-limit', dlEnabled ? bytesToMbps(s.dl_limit) : '', undefined, !dlEnabled) + ' Mbps'
    )}
    ${settingsRow('Upload limit',
      toggle('set-ul-enabled', ulEnabled) +
      numberInput('set-ul-limit', ulEnabled ? bytesToMbps(s.up_limit) : '', undefined, !ulEnabled) + ' Mbps'
    )}
    <div class="settings-group-title settings-group-title--with-toggle">
      <span>ALTERNATIVE SPEED LIMITS</span>
      ${toggle('set-alt-enabled', s.alt_speed_enabled)}
    </div>
    <div id="alt-speed-fields"${altOn}>
      ${settingsRow('Download',
        numberInput('set-alt-dl', bytesToMbps(s.alt_dl_limit ?? 0)) + ' Mbps'
      )}
      ${settingsRow('Upload',
        numberInput('set-alt-ul', bytesToMbps(s.alt_up_limit ?? 0)) + ' Mbps'
      )}
      <div class="settings-group-title settings-group-title--with-toggle">
        <span>SCHEDULE</span>
        ${toggle('set-alt-sched', s.scheduler_enabled)}
      </div>
      <div id="sched-fields"${schedOn}>
        ${settingsRow('Days', renderDaysCheckboxes(s.scheduler_days || 0))}
        ${settingsRow('From',
          `<input type="time" id="set-sched-begin" class="input" style="width:100px" value="${fromH}:${fromM}">`
        )}
        ${settingsRow('To',
          `<input type="time" id="set-sched-end" class="input" style="width:100px" value="${toH}:${toM}">`
        )}
      </div>
    </div>
  </div>`;
}

function renderDownloads(s) {
  return `
  <div class="settings-section">
    ${pathRow('Download folder', textInput('set-download-dir', s.save_path))}
    ${pathRow('Incomplete folder',
      toggle('set-incomplete-enabled', s.temp_path_enabled) +
      textInput('set-incomplete-dir', s.temp_path)
    )}
    ${settingsRow('Start torrents when added',
      toggle('set-start-added', !s.start_paused_enabled)
    )}
    ${settingsRow('Delete .torrent files after adding',
      toggle('set-trash-torrent', (s.auto_delete_mode ?? 0) >= 1)
    )}
  </div>`;
}

function renderSeeding(s) {
  const ratioVal = (s.max_ratio_enabled && (s.max_ratio ?? -1) >= 0)
    ? s.max_ratio
    : '';
  const idleVal  = (s.max_seeding_time_enabled && (s.max_seeding_time ?? -1) >= 0)
    ? s.max_seeding_time
    : '';

  return `
  <div class="settings-section">
    <div class="settings-rows-grid">
      <label class="settings-grid-label">Stop seeding at ratio</label>
      <div class="settings-grid-control">
        ${toggle('set-ratio-limited', s.max_ratio_enabled)}
        <input type="number" id="set-ratio-limit" class="input settings-grid-input"
               min="0" step="0.01" value="${ratioVal}"
               ${!s.max_ratio_enabled ? 'disabled' : ''}>
      </div>

      <label class="settings-grid-label">Stop seeding if idle for</label>
      <div class="settings-grid-control">
        ${toggle('set-idle-limited', s.max_seeding_time_enabled)}
        <input type="number" id="set-idle-limit" class="input settings-grid-input"
               min="0" step="1" value="${idleVal}"
               ${!s.max_seeding_time_enabled ? 'disabled' : ''}><span class="settings-grid-unit">min</span>
      </div>
    </div>
    ${settingsRow('When ratio/time reached',
      `<select id="set-ratio-act" class="input">
        <option value="0" ${(s.max_ratio_act ?? 0) === 0 ? 'selected' : ''}>Pause torrent</option>
        <option value="1" ${(s.max_ratio_act ?? 0) === 1 ? 'selected' : ''}>Remove torrent</option>
      </select>`
    )}
  </div>`;
}

// Renamed from renderPeers to avoid collision with inspector.js renderPeers
function renderPeersSection(s) {
  const connecOn    = (s.max_connec ?? -1) >= 0;
  const connecPtOn  = (s.max_connec_per_torrent ?? -1) >= 0;
  const uploadsOn   = (s.max_uploads ?? -1) >= 0;
  const uploadsPtOn = (s.max_uploads_per_torrent ?? -1) >= 0;

  return `
  <div class="settings-section">
    ${settingsRow('Listening port',
      `<input type="number" id="set-peer-port" class="input" style="width:80px"
       min="1" max="65535" value="${s.listen_port ?? ''}">`
    )}
    ${settingsRow('Random port on startup',
      toggle('set-random-port', s.random_port)
    )}
    ${settingsRow('UPnP / NAT-PMP',
      toggle('set-upnp', s.upnp)
    )}
    <div class="settings-group-title">Protocol</div>
    ${settingsRow('DHT' + infoTip('Distributed Hash Table — finds peers without a central tracker. Useful for public torrents.'),
      toggle('set-dht', s.dht)
    )}
    ${settingsRow('Peer exchange (PeX)' + infoTip('Peers share lists of other peers they know about. Speeds up swarm discovery.'),
      toggle('set-pex', s.pex)
    )}
    ${settingsRow('Local Service Discovery (LSD)' + infoTip('Finds peers on your local network via multicast. Useful on shared networks.'),
      toggle('set-lsd', s.lsd)
    )}
    ${settingsRow('Encryption',
      `<select id="set-encryption" class="input">
        <option value="0" ${(s.encryption ?? 0) === 0 ? 'selected' : ''}>Prefer encrypted</option>
        <option value="1" ${s.encryption === 1 ? 'selected' : ''}>Require encrypted</option>
        <option value="2" ${s.encryption === 2 ? 'selected' : ''}>Allow unencrypted</option>
      </select>`
    )}
    <div class="settings-group-title">Limits</div>
    ${settingsRow('Max connections (global)',
      toggle('set-connec-limited', connecOn) +
      `<input type="number" id="set-max-connec" class="input" style="width:70px" min="0"
       value="${connecOn ? s.max_connec : ''}"${connecOn ? '' : ' disabled'}>`
    )}
    ${settingsRow('Max connections (per torrent)',
      toggle('set-connec-pt-limited', connecPtOn) +
      `<input type="number" id="set-max-connec-pt" class="input" style="width:70px" min="0"
       value="${connecPtOn ? s.max_connec_per_torrent : ''}"${connecPtOn ? '' : ' disabled'}>`
    )}
    ${settingsRow('Max upload slots (global)',
      toggle('set-uploads-limited', uploadsOn) +
      `<input type="number" id="set-max-uploads" class="input" style="width:70px" min="0"
       value="${uploadsOn ? s.max_uploads : ''}"${uploadsOn ? '' : ' disabled'}>`
    )}
    ${settingsRow('Max upload slots (per torrent)',
      toggle('set-uploads-pt-limited', uploadsPtOn) +
      `<input type="number" id="set-max-uploads-pt" class="input" style="width:70px" min="0"
       value="${uploadsPtOn ? s.max_uploads_per_torrent : ''}"${uploadsPtOn ? '' : ' disabled'}>`
    )}
  </div>`;
}

function renderQueue(s) {
  return `
  <div class="settings-section">
    ${settingsRow('Enable queuing',
      toggle('set-queue-enabled', s.queueing_enabled)
    )}
    <div id="queue-dependent-fields"${s.queueing_enabled ? '' : ' hidden'}>
      ${settingsRow('Max active downloads',
        numberInput('set-max-dl', s.max_active_downloads, '70px')
      )}
      ${settingsRow('Max active uploads',
        numberInput('set-max-ul', s.max_active_uploads, '70px')
      )}
      ${settingsRow('Max active torrents',
        numberInput('set-max-active', s.max_active_torrents, '70px')
      )}
      ${settingsRow('Do not count slow torrents',
        toggle('set-dont-count-slow', s.dont_count_slow_torrents)
      )}
    </div>
  </div>`;
}

async function renderAbout() {
  try {
    const [version, apiVersion, buildInfo] = await Promise.all([
      api('/app/version'),
      api('/app/webapiVersion'),
      api('/app/buildInfo'),
    ]);

    const ss = state.serverState;
    const freeSpace = ss.free_space_on_disk != null ? formatSize(ss.free_space_on_disk) : '—';
    const totalDl   = ss.dl_info_data  != null ? formatSize(ss.dl_info_data)  : '—';
    const totalUl   = ss.up_info_data  != null ? formatSize(ss.up_info_data)  : '—';
    const dhtNodes  = ss.dht_nodes     != null ? ss.dht_nodes.toLocaleString() : '—';

    return `
    <div class="settings-section about-section">
      <div class="about-stats">
        <div class="about-stat-row">
          <span class="about-stat-label">Free disk space</span>
          <span class="about-stat-value">${freeSpace}</span>
        </div>
        <div class="about-stat-row">
          <span class="about-stat-label">Downloaded (session)</span>
          <span class="about-stat-value">${totalDl}</span>
        </div>
        <div class="about-stat-row">
          <span class="about-stat-label">Uploaded (session)</span>
          <span class="about-stat-value">${totalUl}</span>
        </div>
        <div class="about-stat-row">
          <span class="about-stat-label">DHT nodes</span>
          <span class="about-stat-value">${dhtNodes}</span>
        </div>
      </div>
      <div class="about-divider"></div>
      <div class="about-title">qBittorrent Web UI</div>
      <div class="about-meta">
        <p>qBittorrent ${version}</p>
        <p>Web API ${apiVersion}</p>
        <p>Qt ${buildInfo.qt} · libtorrent ${buildInfo.libtorrent}</p>
        <p>OpenSSL ${buildInfo.openssl}</p>
      </div>
    </div>`;
  } catch {
    return '<p class="inspector-empty">Could not load version info.</p>';
  }
}

function wireSection(body) {
  if (!body) return;

  // ── Speed ──────────────────────────────────────────────────────────────────
  body.querySelector('#set-dl-enabled')?.addEventListener('change', e => {
    const enabled = e.target.checked;
    const limitEl = body.querySelector('#set-dl-limit');
    if (limitEl) limitEl.disabled = !enabled;
    const limit   = Number(limitEl?.value ?? 0);
    setPreferences({ dl_limit: enabled ? (mbpsToBytes(limit) || mbpsToBytes(8)) : 0 });
  });
  body.querySelector('#set-dl-limit')?.addEventListener('blur', e => {
    if (body.querySelector('#set-dl-enabled')?.checked) {
      setPreferences({ dl_limit: mbpsToBytes(Number(e.target.value) || 0) });
    }
  });

  body.querySelector('#set-ul-enabled')?.addEventListener('change', e => {
    const enabled = e.target.checked;
    const limitEl = body.querySelector('#set-ul-limit');
    if (limitEl) limitEl.disabled = !enabled;
    const limit   = Number(limitEl?.value ?? 0);
    setPreferences({ up_limit: enabled ? (mbpsToBytes(limit) || mbpsToBytes(8)) : 0 });
  });
  body.querySelector('#set-ul-limit')?.addEventListener('blur', e => {
    if (body.querySelector('#set-ul-enabled')?.checked) {
      setPreferences({ up_limit: mbpsToBytes(Number(e.target.value) || 0) });
    }
  });

  const altToggle = body.querySelector('#set-alt-enabled');
  if (altToggle) {
    altToggle.addEventListener('change', e => {
      const on = e.target.checked;
      const fields = body.querySelector('#alt-speed-fields');
      if (fields) fields.hidden = !on;

      if (on) {
        setPreferences({ alt_speed_enabled: true });
        // Schedule defaults to off when freshly enabling (per existing behaviour)
        const schedToggleEl = body.querySelector('#set-alt-sched');
        const schedFields   = body.querySelector('#sched-fields');
        if (schedToggleEl && schedToggleEl.checked) {
          schedToggleEl.checked = false;
          if (schedFields) schedFields.hidden = true;
          setPreferences({ scheduler_enabled: false });
        } else if (schedFields) {
          schedFields.hidden = true;
        }
      } else {
        // Turning off: disable schedule and zero the rate limits on the backend
        setPreferences({
          alt_speed_enabled: false,
          scheduler_enabled: false,
          alt_dl_limit: 0,
          alt_up_limit: 0,
        });
        // Reflect schedule toggle off in UI without waiting for re-render
        const schedToggleEl = body.querySelector('#set-alt-sched');
        if (schedToggleEl) schedToggleEl.checked = false;
      }
    });
  }

  body.querySelector('#set-alt-dl')?.addEventListener('blur', e => {
    setPreferences({ alt_dl_limit: mbpsToBytes(Number(e.target.value) || 0) });
  });
  body.querySelector('#set-alt-ul')?.addEventListener('blur', e => {
    setPreferences({ alt_up_limit: mbpsToBytes(Number(e.target.value) || 0) });
  });

  const schedToggle = body.querySelector('#set-alt-sched');
  if (schedToggle) {
    schedToggle.addEventListener('change', e => {
      setPreferences({ scheduler_enabled: e.target.checked });
      const fields = body.querySelector('#sched-fields');
      if (fields) fields.hidden = !e.target.checked;
    });
  }

  body.querySelector('#set-sched-begin')?.addEventListener('blur', e => {
    const [h, m] = e.target.value.split(':').map(Number);
    setPreferences({ schedule_from_hour: h || 0, schedule_from_min: m || 0 });
  });
  body.querySelector('#set-sched-end')?.addEventListener('blur', e => {
    const [h, m] = e.target.value.split(':').map(Number);
    setPreferences({ schedule_to_hour: h || 0, schedule_to_min: m || 0 });
  });

  body.querySelectorAll('.sched-day').forEach(cb => {
    cb.addEventListener('change', () => {
      let mask = 0;
      body.querySelectorAll('.sched-day').forEach(c => {
        if (c.checked) mask |= Number(c.dataset.bit);
      });
      setPreferences({ scheduler_days: mask });
    });
  });

  // ── Downloads ──────────────────────────────────────────────────────────────
  body.querySelector('#set-download-dir')?.addEventListener('blur', e => {
    setPreferences({ save_path: e.target.value });
  });
  body.querySelector('#set-incomplete-enabled')?.addEventListener('change', e => {
    setPreferences({ temp_path_enabled: e.target.checked });
  });
  body.querySelector('#set-incomplete-dir')?.addEventListener('blur', e => {
    setPreferences({ temp_path: e.target.value });
  });
  body.querySelector('#set-start-added')?.addEventListener('change', e => {
    setPreferences({ start_paused_enabled: !e.target.checked });
  });
  body.querySelector('#set-trash-torrent')?.addEventListener('change', e => {
    setPreferences({ auto_delete_mode: e.target.checked ? 1 : 0 });
  });

  // ── Seeding ────────────────────────────────────────────────────────────────
  body.querySelector('#set-ratio-limited')?.addEventListener('change', e => {
    const el = body.querySelector('#set-ratio-limit');
    el.disabled = !e.target.checked;
    if (!e.target.checked) el.value = '';
    setPreferences({ max_ratio_enabled: e.target.checked });
  });
  body.querySelector('#set-ratio-limit')?.addEventListener('blur', e => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) setPreferences({ max_ratio: val });
  });
  body.querySelector('#set-idle-limited')?.addEventListener('change', e => {
    const el = body.querySelector('#set-idle-limit');
    el.disabled = !e.target.checked;
    if (!e.target.checked) el.value = '';
    setPreferences({ max_seeding_time_enabled: e.target.checked });
  });
  body.querySelector('#set-idle-limit')?.addEventListener('blur', e => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0) setPreferences({ max_seeding_time: val });
  });
  body.querySelector('#set-ratio-act')?.addEventListener('change', e => {
    setPreferences({ max_ratio_act: Number(e.target.value) || 0 });
  });

  // ── Peers ──────────────────────────────────────────────────────────────────
  body.querySelector('#set-peer-port')?.addEventListener('blur', e => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 65535) val = 65535;
    e.target.value = val;
    setPreferences({ listen_port: val });
  });
  body.querySelector('#set-random-port')?.addEventListener('change', e => {
    setPreferences({ random_port: e.target.checked });
  });
  body.querySelector('#set-upnp')?.addEventListener('change', e => {
    setPreferences({ upnp: e.target.checked });
  });
  body.querySelector('#set-dht')?.addEventListener('change', e => {
    setPreferences({ dht: e.target.checked });
  });
  body.querySelector('#set-pex')?.addEventListener('change', e => {
    setPreferences({ pex: e.target.checked });
  });
  body.querySelector('#set-lsd')?.addEventListener('change', e => {
    setPreferences({ lsd: e.target.checked });
  });
  body.querySelector('#set-encryption')?.addEventListener('change', e => {
    setPreferences({ encryption: Number(e.target.value) || 0 });
  });

  // ── Peers: connection limits ────────────────────────────────────────────────
  function makeLimitToggleHandler(toggleId, inputId, prefKey, defaultVal) {
    body.querySelector(`#${toggleId}`)?.addEventListener('change', e => {
      const inputEl = body.querySelector(`#${inputId}`);
      if (e.target.checked) {
        if (inputEl) { inputEl.disabled = false; inputEl.value = String(defaultVal); }
        state.prefs[prefKey] = defaultVal;
        setPreferences({ [prefKey]: defaultVal });
      } else {
        if (inputEl) { inputEl.disabled = true; inputEl.value = ''; }
        state.prefs[prefKey] = -1;
        setPreferences({ [prefKey]: -1 });
      }
    });
    body.querySelector(`#${inputId}`)?.addEventListener('blur', e => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 0) val = 0;
      e.target.value = val;
      state.prefs[prefKey] = val;
      setPreferences({ [prefKey]: val });
    });
  }

  makeLimitToggleHandler('set-connec-limited',     'set-max-connec',    'max_connec',              100);
  makeLimitToggleHandler('set-connec-pt-limited',  'set-max-connec-pt', 'max_connec_per_torrent',   20);
  makeLimitToggleHandler('set-uploads-limited',    'set-max-uploads',   'max_uploads',               4);
  makeLimitToggleHandler('set-uploads-pt-limited', 'set-max-uploads-pt','max_uploads_per_torrent',   4);

  // ── Queue ──────────────────────────────────────────────────────────────────
  body.querySelector('#set-queue-enabled')?.addEventListener('change', e => {
    setPreferences({ queueing_enabled: e.target.checked });
    const dep = body.querySelector('#queue-dependent-fields');
    if (dep) dep.hidden = !e.target.checked;
  });
  body.querySelector('#set-max-dl')?.addEventListener('blur', e => {
    setPreferences({ max_active_downloads: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-max-ul')?.addEventListener('blur', e => {
    setPreferences({ max_active_uploads: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-max-active')?.addEventListener('blur', e => {
    setPreferences({ max_active_torrents: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-dont-count-slow')?.addEventListener('change', e => {
    setPreferences({ dont_count_slow_torrents: e.target.checked });
  });
}

async function setActiveSection(section, container) {
  const body = container
    ? container.querySelector('#settings-body')
    : document.getElementById('settings-body');
  if (!body) return;

  const s = state.prefs;

  if (!s || Object.keys(s).length === 0) {
    body.innerHTML = '<p class="inspector-empty">Loading settings…</p>';
    return;
  }

  switch (section) {
    case 'speed':     body.innerHTML = renderSpeed(s);          break;
    case 'downloads': body.innerHTML = renderDownloads(s);      break;
    case 'seeding':   body.innerHTML = renderSeeding(s);        break;
    case 'peers':     body.innerHTML = renderPeersSection(s);   break;
    case 'queue':     body.innerHTML = renderQueue(s);          break;
    case 'about':     body.innerHTML = await renderAbout();     break;
    default:          body.innerHTML = '';
  }

  wireSection(body);
}

function handleSettingsEsc(e) {
  if (e.key === 'Escape') setSettingsOpen(false);
}

function mountSettings() {
  const closeBtn = document.getElementById('btn-settings-close');
  const sel      = document.getElementById('settings-section-select');

  if (!closeBtn) return;

  closeBtn.addEventListener('click', () => setSettingsOpen(false));

  sel?.addEventListener('change', () => setActiveSection(sel.value, undefined)); // setActiveSection is async; no need to await here — fire-and-forget is fine for UI nav

  on('ui:settings', async open => {
    // ── Mobile: use option sheet ──────────────────────────────
    if (window.innerWidth < 640) {
      if (!open) { closeOptionSheet(); return; }

      openOptionSheet({
        title: 'Settings',
        buildContent: (body) => {
          body.innerHTML = `
            <div style="display:flex;flex-direction:column;height:100%;min-height:0;">
              <div style="padding:var(--space-2) var(--space-3);border-bottom:1px solid var(--color-border);flex-shrink:0;">
                <select id="settings-section-select-mobile" style="width:100%;font-size:16px;" class="input">
                  <option value="speed">Speed</option>
                  <option value="downloads">Downloads</option>
                  <option value="seeding">Seeding</option>
                  <option value="peers">Peers</option>
                  <option value="queue">Queue</option>
                  <option value="about">About</option>
                </select>
              </div>
              <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:var(--space-3);">
                <div id="settings-body"><p class="inspector-empty">Loading…</p></div>
              </div>
            </div>`;

          const sel = body.querySelector('#settings-section-select-mobile');
          sel.addEventListener('change', () => setActiveSection(sel.value, body));

          requestAnimationFrame(async () => {
            try {
              const fresh = await getPreferences();
              setPrefs(fresh);
            } catch (_) {}
            await setActiveSection(sel.value, body);
          });
        },
        onClose: () => {
          state.settingsOpen = false;
        },
      });

      return; // ← skip desktop path
    }
    // ── Desktop path continues below unchanged ────────────────

    const rightPanel      = document.getElementById('right-panel');
    const settingsContent = document.getElementById('settings-content');
    const inspContent     = document.getElementById('inspector-content');
    const addContent      = document.getElementById('add-content');
    const logContent      = document.getElementById('log-content');

    if (open) {
      // Silence other panels directly — no state events, no close-branch side effects
      closeInspectorSilent();
      state.logOpen = false;
      if (inspContent) inspContent.hidden = true;
      if (addContent) { addContent.hidden = true; resetAddModal(); }
      if (logContent) logContent.hidden = true;
      if (settingsContent) settingsContent.hidden = false;
      rightPanel.classList.add('right-panel--open');
      rightPanel.setAttribute('aria-hidden', 'false');
      document.addEventListener('keydown', handleSettingsEsc);

      const section = sel?.value || 'speed';
      await setActiveSection(section);
      try {
        const fresh = await getPreferences();
        setPrefs(fresh);
        await setActiveSection(section);
      } catch (err) {
        console.error('[settings] app/preferences failed:', err);
      }
    } else {
      if (settingsContent) settingsContent.hidden = true;
      // Only close the container if no other content is showing
      const anyVisible = [inspContent, addContent, logContent].some(el => el && !el.hidden);
      if (!anyVisible) {
        rightPanel.classList.remove('right-panel--open');
        rightPanel.setAttribute('aria-hidden', 'true');
      }
      document.removeEventListener('keydown', handleSettingsEsc);
    }
  });

  on('prefs:changed', () => {
    if (window.innerWidth >= 640 && state.settingsOpen) {
      const sel = document.getElementById('settings-section-select');
      setActiveSection(sel?.value || 'speed', undefined);
    }
  });
}
