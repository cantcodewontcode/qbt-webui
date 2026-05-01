
const SECTION_TITLES = {
  speed:     'Speed',
  downloads: 'Downloads',
  seeding:   'Seeding',
  peers:     'Peers',
  queue:     'Queue',
  ui:        'Interface',
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

function numberInput(id, value, width) {
  if (width === undefined) width = '80px';
  return `<input type="number" id="${id}" class="input"
  style="width:${width}" value="${value ?? ''}">`;
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
      numberInput('set-dl-limit', dlEnabled ? kBsToMbps(s.dl_limit) : '') + ' Mbps'
    )}
    ${settingsRow('Upload limit',
      toggle('set-ul-enabled', ulEnabled) +
      numberInput('set-ul-limit', ulEnabled ? kBsToMbps(s.up_limit) : '') + ' Mbps'
    )}
    <div class="settings-group-title">Alternative speed limits</div>
    ${settingsRow('Enable alternative speeds',
      toggle('set-alt-enabled', s.alt_speed_enabled)
    )}
    <div id="alt-speed-fields"${altOn}>
      ${settingsRow('Alternative download',
        numberInput('set-alt-dl', kBsToMbps(s.alt_dl_limit ?? 0)) + ' Mbps'
      )}
      ${settingsRow('Alternative upload',
        numberInput('set-alt-ul', kBsToMbps(s.alt_up_limit ?? 0)) + ' Mbps'
      )}
      <div class="settings-group-title">Schedule</div>
      ${settingsRow('Use scheduled times',
        toggle('set-alt-sched', s.scheduler_enabled)
      )}
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
  return `
  <div class="settings-section">
    ${settingsRow('Stop seeding at ratio',
      toggle('set-ratio-limited', s.max_ratio_enabled) +
      numberInput('set-ratio-limit', s.max_ratio, '70px')
    )}
    ${settingsRow('Stop seeding if idle for',
      toggle('set-idle-limited', s.max_seeding_time_enabled) +
      numberInput('set-idle-limit', s.max_seeding_time, '70px') + ' min'
    )}
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
  return `
  <div class="settings-section">
    ${settingsRow('Listening port',
      numberInput('set-peer-port', s.listen_port, '80px')
    )}
    ${settingsRow('Random port on startup',
      toggle('set-random-port', s.random_port)
    )}
    ${settingsRow('UPnP / NAT-PMP',
      toggle('set-upnp', s.upnp)
    )}
    <p class="settings-note">Port test is not available via the API. Check qBittorrent logs for port status.</p>
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
    ${settingsRow('Max connections (global)',       numberInput('set-max-connec',    s.max_connec,              '70px'))}
    ${settingsRow('Max connections (per torrent)',  numberInput('set-max-connec-pt', s.max_connec_per_torrent,  '70px'))}
    ${settingsRow('Max upload slots (global)',      numberInput('set-max-uploads',   s.max_uploads,             '70px'))}
    ${settingsRow('Max upload slots (per torrent)', numberInput('set-max-uploads-pt',s.max_uploads_per_torrent, '70px'))}
  </div>`;
}

function renderQueue(s) {
  return `
  <div class="settings-section">
    ${settingsRow('Enable queuing',
      toggle('set-queue-enabled', s.queueing_enabled)
    )}
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
  </div>`;
}

function renderUI() {
  return `
  <div class="settings-section">
    ${settingsRow('Refresh rate', `<span style="color:var(--color-text-secondary);font-size:var(--type-body-sm)">3 s while active &nbsp;·&nbsp; 30 s when idle</span>`)}
  </div>`;
}

async function renderAbout() {
  try {
    const [version, apiVersion, buildInfo] = await Promise.all([
      api('/app/version'),
      api('/app/webapiVersion'),
      api('/app/buildInfo'),
    ]);
    return `
    <div class="settings-section about-section">
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

function wireSection() {
  const body = document.getElementById('settings-body');
  if (!body) return;

  // ── Speed ──────────────────────────────────────────────────────────────────
  body.querySelector('#set-dl-enabled')?.addEventListener('change', e => {
    const enabled = e.target.checked;
    const limit   = Number(body.querySelector('#set-dl-limit')?.value ?? 0);
    setPreferences({ dl_limit: enabled ? (mbpsToKBs(limit) || mbpsToKBs(8)) : 0 });
  });
  body.querySelector('#set-dl-limit')?.addEventListener('blur', e => {
    if (body.querySelector('#set-dl-enabled')?.checked) {
      setPreferences({ dl_limit: mbpsToKBs(Number(e.target.value) || 0) });
    }
  });

  body.querySelector('#set-ul-enabled')?.addEventListener('change', e => {
    const enabled = e.target.checked;
    const limit   = Number(body.querySelector('#set-ul-limit')?.value ?? 0);
    setPreferences({ up_limit: enabled ? (mbpsToKBs(limit) || mbpsToKBs(8)) : 0 });
  });
  body.querySelector('#set-ul-limit')?.addEventListener('blur', e => {
    if (body.querySelector('#set-ul-enabled')?.checked) {
      setPreferences({ up_limit: mbpsToKBs(Number(e.target.value) || 0) });
    }
  });

  const altToggle = body.querySelector('#set-alt-enabled');
  if (altToggle) {
    altToggle.addEventListener('change', e => {
      setPreferences({ alt_speed_enabled: e.target.checked });
      const fields = body.querySelector('#alt-speed-fields');
      if (fields) fields.hidden = !e.target.checked;
    });
  }

  body.querySelector('#set-alt-dl')?.addEventListener('blur', e => {
    setPreferences({ alt_dl_limit: mbpsToKBs(Number(e.target.value) || 0) });
  });
  body.querySelector('#set-alt-ul')?.addEventListener('blur', e => {
    setPreferences({ alt_up_limit: mbpsToKBs(Number(e.target.value) || 0) });
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
    setPreferences({ max_ratio_enabled: e.target.checked });
  });
  body.querySelector('#set-ratio-limit')?.addEventListener('blur', e => {
    setPreferences({ max_ratio: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-idle-limited')?.addEventListener('change', e => {
    setPreferences({ max_seeding_time_enabled: e.target.checked });
  });
  body.querySelector('#set-idle-limit')?.addEventListener('blur', e => {
    setPreferences({ max_seeding_time: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-ratio-act')?.addEventListener('change', e => {
    setPreferences({ max_ratio_act: Number(e.target.value) || 0 });
  });

  // ── Peers ──────────────────────────────────────────────────────────────────
  body.querySelector('#set-peer-port')?.addEventListener('blur', e => {
    setPreferences({ listen_port: Number(e.target.value) || 0 });
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
  body.querySelector('#set-max-connec')?.addEventListener('blur', e => {
    setPreferences({ max_connec: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-max-connec-pt')?.addEventListener('blur', e => {
    setPreferences({ max_connec_per_torrent: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-max-uploads')?.addEventListener('blur', e => {
    setPreferences({ max_uploads: Number(e.target.value) || 0 });
  });
  body.querySelector('#set-max-uploads-pt')?.addEventListener('blur', e => {
    setPreferences({ max_uploads_per_torrent: Number(e.target.value) || 0 });
  });

  // ── Queue ──────────────────────────────────────────────────────────────────
  body.querySelector('#set-queue-enabled')?.addEventListener('change', e => {
    setPreferences({ queueing_enabled: e.target.checked });
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

async function setActiveSection(section) {
  const body = document.getElementById('settings-body');
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
    case 'ui':        body.innerHTML = renderUI();               break;
    case 'about':     body.innerHTML = await renderAbout();     break;
    default:          body.innerHTML = '';
  }

  wireSection();
}

function handleSettingsEsc(e) {
  if (e.key === 'Escape') setSettingsOpen(false);
}

function mountSettings() {
  const closeBtn = document.getElementById('btn-settings-close');
  const sel      = document.getElementById('settings-section-select');

  if (!closeBtn) return;

  closeBtn.addEventListener('click', () => setSettingsOpen(false));

  sel?.addEventListener('change', () => setActiveSection(sel.value)); // setActiveSection is async; no need to await here — fire-and-forget is fine for UI nav

  on('ui:settings', async open => {
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
    if (state.settingsOpen) {
      const sel = document.getElementById('settings-section-select');
      setActiveSection(sel?.value || 'speed');
    }
  });
}

