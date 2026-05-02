
const POLL_FAST_MS = 3000;
const POLL_SLOW_MS = 30000;

let syncRid           = 0;
let isCycleRunning    = false;
let consecutiveFailures = 0;
let isPolling         = false;
let pollTimer         = null;

function hasActiveTorrents() {
  for (const t of state.torrents.values()) {
    if ((t.dlspeed ?? 0) > 0 || (t.upspeed ?? 0) > 0) return true;
    if (t.state === 'checkingDL' || t.state === 'checkingUP' ||
        t.state === 'checkingResumeData' || t.state === 'moving') return true;
    if (t.state === 'metaDL') return true;
  }
  return false;
}

async function pollCycle() {
  if (isCycleRunning) return;
  isCycleRunning = true;
  try {
    const data = await api('/sync/maindata', { rid: syncRid }, 15000);
    syncRid = data.rid;

    if (data.full_update) {
      const preserved = {};
      for (const [hash, existing] of state.torrents) {
        if (existing._props) preserved[hash] = { _props: existing._props };
      }
      state.torrents.clear();
      for (const [hash, t] of Object.entries(data.torrents || {})) {
        state.torrents.set(hash, { ...(preserved[hash] || {}), ...t, hash });
      }
      emit('torrents:changed', null);
    } else {
      for (const [hash, fields] of Object.entries(data.torrents || {})) {
        state.torrents.set(hash, { ...(state.torrents.get(hash) || {}), ...fields, hash });
      }
      for (const hash of (data.torrents_removed || [])) {
        state.torrents.delete(hash);
      }
      if (Object.keys(data.torrents || {}).length > 0 || (data.torrents_removed || []).length > 0) {
        emit('torrents:changed', null);
      }
    }

    if (data.server_state) {
      setServerState(data.server_state);
    }

    // Always recompute speed totals from the torrent map.
    // server_state speeds (dl_info_speed / up_info_speed) are sampled on
    // qBittorrent's internal clock and can arrive as zero even when torrents
    // are actively transferring. The torrent map is updated every poll cycle
    // and measures the same payload-only rate — use it unconditionally.
    {
      let dlTotal = 0;
      let ulTotal = 0;
      for (const t of state.torrents.values()) {
        dlTotal += t.dlspeed ?? 0;
        ulTotal += t.upspeed ?? 0;
      }
      state.serverState = {
        ...state.serverState,
        dl_info_speed: dlTotal,
        up_info_speed: ulTotal,
      };
      emit('serverstate:changed', state.serverState);
    }

    if (data.categories || data.categories_removed) {
      if (data.full_update) {
        state.categories = data.categories || {};
      } else {
        Object.assign(state.categories, data.categories || {});
        for (const name of (data.categories_removed || [])) {
          delete state.categories[name];
        }
      }
      emit('categories:changed', state.categories);
    }

    if (consecutiveFailures > 0) {
      consecutiveFailures = 0;
      setConnected(true);
    }
  } catch (err) {
    consecutiveFailures += 1;
    if (consecutiveFailures >= 3) setConnected(false);
    console.error('[poll] cycle error:', err);
  } finally {
    isCycleRunning = false;
    if (isPolling) {
      const delay = hasActiveTorrents() ? POLL_FAST_MS : POLL_SLOW_MS;
      pollTimer = setTimeout(pollCycle, delay);
    }
  }
}

async function _doInitialLoad() {
  const [torrentsResult, prefsResult, transferResult] = await Promise.allSettled([
    api('/torrents/info'),
    getPreferences(),
    getTransferInfo(),
  ]);

  if (torrentsResult.status === 'fulfilled') {
    const torrents = torrentsResult.value;
    state.torrents.clear();
    for (const t of torrents) {
      const existing = state.torrents.get(t.hash);
      const priv = existing?._props ? { _props: existing._props } : {};
      state.torrents.set(t.hash, { ...priv, ...t });
    }
    emit('torrents:changed', null);
    try { localStorage.setItem('tx-torrent-count', String(state.torrents.size)); } catch (_) {}
    syncRid = 0;
  } else {
    console.error('[init] torrents/info failed:', torrentsResult.reason?.message);
  }

  if (prefsResult.status === 'fulfilled') {
    setPrefs(prefsResult.value);
  } else {
    console.error('[init] app/preferences failed:', prefsResult.reason?.message);
  }

  if (transferResult.status === 'fulfilled') {
    setServerState(transferResult.value);
  } else {
    console.error('[init] transfer/info failed:', transferResult.reason?.message);
  }

  setConnected(true);
}

async function initialLoad() {
  try {
    await _doInitialLoad();
  } catch (err) {
    console.error('[poll] initialLoad failed:', err);
    setConnected(false);
  }
}

function startPolling() {
  stopPolling();
  isPolling = true;
  pollTimer = setTimeout(pollCycle, POLL_FAST_MS);
}

function stopPolling() {
  if (pollTimer !== null) { clearTimeout(pollTimer); pollTimer = null; }
  isPolling = false;
}

async function forceRefresh() {
  const wasPolling = isPolling;
  stopPolling();
  await pollCycle();
  if (wasPolling) startPolling();
}

