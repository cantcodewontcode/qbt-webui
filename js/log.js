
const LOG_TYPES  = { 1: 'info', 2: 'info', 4: 'warning', 8: 'critical' };
const LOG_LABELS = { 1: 'Normal', 2: 'Info', 4: 'Warning', 8: 'Critical' };

function renderLog(entries) {
  const body = document.getElementById('log-body');
  if (!body) return;

  if (!entries || entries.length === 0) {
    body.innerHTML = '<p class="inspector-empty">No log entries.</p>';
    return;
  }

  const sorted = [...entries].sort((a, b) => b.id - a.id);

  body.innerHTML = sorted.map(entry => {
    const type  = LOG_TYPES[entry.type]  || 'info';
    const label = LOG_LABELS[entry.type] || 'Info';
    const time  = new Date(entry.timestamp * 1000).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    return `<div class="log-entry log-entry--${type}">
  <span class="log-entry__time">${time}</span>
  <span class="log-entry__label">${label}</span>
  <span class="log-entry__msg">${esc(entry.message)}</span>
</div>`;
  }).join('');
}

async function loadLog() {
  const body = document.getElementById('log-body');
  if (body) body.innerHTML = '<p class="inspector-empty">Loading…</p>';
  try {
    const entries = await getLog();
    renderLog(entries);
  } catch (err) {
    if (body) body.innerHTML = `<p class="inspector-empty">Failed to load log: ${esc(err.message)}</p>`;
  }
}

function mountLog() {
  on('ui:log', async open => {
    const rightPanel      = document.getElementById('right-panel');
    const logContent      = document.getElementById('log-content');
    const inspContent     = document.getElementById('inspector-content');
    const settingsContent = document.getElementById('settings-content');
    const addContent      = document.getElementById('add-content');

    if (open) {
      closeInspectorSilent();
      state.settingsOpen = false;
      document.removeEventListener('keydown', handleSettingsEsc);
      if (inspContent)     inspContent.hidden     = true;
      if (settingsContent) settingsContent.hidden = true;
      if (addContent)      { addContent.hidden = true; resetAddModal(); }
      if (logContent)      logContent.hidden      = false;

      rightPanel.classList.add('right-panel--open');
      rightPanel.setAttribute('aria-hidden', 'false');

      await loadLog();
    } else {
      if (logContent) logContent.hidden = true;
      const anyVisible = [inspContent, settingsContent, addContent]
        .some(el => el && !el.hidden);
      if (!anyVisible) {
        rightPanel.classList.remove('right-panel--open');
        rightPanel.setAttribute('aria-hidden', 'true');
      }
    }
  });

  document.getElementById('btn-log')?.addEventListener('click', () => {
    setLogOpen(!state.logOpen);
  });

  document.getElementById('btn-log-close')?.addEventListener('click', () => {
    setLogOpen(false);
  });

  document.getElementById('btn-log-refresh')?.addEventListener('click', async () => {
    if (state.logOpen) await loadLog();
  });
}
