
const LOG_TYPES  = { 1: 'info', 2: 'info', 4: 'warning', 8: 'critical' };
const LOG_LABELS = { 1: 'Normal', 2: 'Info', 4: 'Warning', 8: 'Critical' };

let _logEntries  = [];
let _logSeverity = 'all';
let _logSearch   = '';

function applyLogFilters() {
  const body = document.getElementById('log-body');
  if (!body) return;

  let entries = _logEntries;

  // Severity filter
  if (_logSeverity !== 'all') {
    entries = entries.filter(e => (LOG_TYPES[e.type] || 'info') === _logSeverity);
  }

  // Search filter
  const q = _logSearch.trim().toLowerCase();
  if (q) {
    entries = entries.filter(e => (e.message || '').toLowerCase().includes(q));
  }

  if (entries.length === 0) {
    body.innerHTML = '<p class="inspector-empty">No matching log entries.</p>';
    return;
  }

  body.innerHTML = entries.map(entry => {
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

function renderLog(entries, container) {
  const body = container
    ? container.querySelector('#log-body')
    : document.getElementById('log-body');
  if (!body) return;

  if (!entries || entries.length === 0) {
    _logEntries = [];
    body.innerHTML = '<p class="inspector-empty">No log entries.</p>';
    return;
  }

  _logEntries = [...entries].sort((a, b) => b.id - a.id);
  applyLogFilters();
}

async function loadLog(container) {
  const body = container
    ? container.querySelector('#log-body')
    : document.getElementById('log-body');
  if (body) body.innerHTML = '<p class="inspector-empty">Loading…</p>';
  try {
    const entries = await getLog();
    renderLog(entries, container);
  } catch (err) {
    if (body) body.innerHTML = `<p class="inspector-empty">Failed to load log: ${esc(err.message)}</p>`;
  }
}

function mountLog() {
  on('ui:log', async open => {
    // ── Mobile: use option sheet ──────────────────────────────
    if (window.innerWidth < 640) {
      if (!open) { closeOptionSheet(); return; }

      openOptionSheet({
        title: 'Log',
        buildContent: async (body) => {
          body.innerHTML = `
            <div style="display:flex;justify-content:flex-end;padding:var(--space-2) var(--space-3);flex-shrink:0;border-bottom:1px solid var(--color-border);">
              <button class="btn-ghost btn--sm" id="btn-log-refresh-mobile">
                ${iconRefreshCcw(14)} Refresh
              </button>
            </div>
            <div id="log-body" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;" class="log-body"></div>`;

          await loadLog(body);

          body.querySelector('#btn-log-refresh-mobile')?.addEventListener('click', () => {
            loadLog(body);
          });
        },
        onClose: () => {
          state.logOpen = false;
        },
      });

      return; // ← skip desktop path
    }
    // ── Desktop path continues below unchanged ────────────────

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

  // ── Severity filter chips ─────────────────────────────────────────
  document.getElementById('log-content')?.querySelectorAll('.log-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.log-chip').forEach(c => {
        c.classList.remove('log-chip--active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('log-chip--active');
      chip.setAttribute('aria-pressed', 'true');
      _logSeverity = chip.dataset.severity;
      applyLogFilters();
    });
  });

  // ── Log search ────────────────────────────────────────────────────
  const logSearchInput = document.getElementById('log-search-input');
  const logSearchClear = document.getElementById('log-search-clear');

  logSearchInput?.addEventListener('input', () => {
    _logSearch = logSearchInput.value;
    if (logSearchClear) logSearchClear.hidden = !_logSearch;
    applyLogFilters();
  });

  logSearchClear?.addEventListener('click', () => {
    _logSearch = '';
    if (logSearchInput) logSearchInput.value = '';
    if (logSearchClear) logSearchClear.hidden = true;
    applyLogFilters();
    logSearchInput?.focus();
  });
}
