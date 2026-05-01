
const state = {
  torrents:       new Map(),
  prefs:          {},
  serverState:    {},
  filter:         'all',
  search:         '',
  sortKey:        'dlspeed',
  sortDir:        'desc',
  selected:       new Set(),
  inspectorId:    null,
  settingsOpen:   false,
  logOpen:        false,
  connected:      true,
  categories:     {},
  activeCategory: null,
};

try {
  const savedKey = localStorage.getItem('tx-sort-key');
  const savedDir = localStorage.getItem('tx-sort-dir');
  const validKeys = ['name', 'size', 'dlspeed', 'upspeed',
                     'ratio', 'eta', 'progress', 'priority', 'num_connected'];
  const validDirs = ['asc', 'desc'];
  if (savedKey && validKeys.includes(savedKey)) state.sortKey = savedKey;
  if (savedDir && validDirs.includes(savedDir)) state.sortDir = savedDir;
} catch (_) {}

const listeners = {};

function on(event, cb) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(cb);
  return () => { listeners[event] = listeners[event].filter(f => f !== cb); };
}

function emit(event, data) {
  (listeners[event] || []).forEach(cb => cb(data));
}


function applyTorrentDelta(torrentsObj) {
  let changed = false;
  for (const [hash, fields] of Object.entries(torrentsObj)) {
    state.torrents.set(hash, {
      ...(state.torrents.get(hash) || {}),
      ...fields,
      hash,
    });
    changed = true;
  }
  if (changed) emit('torrents:changed', null);
}

function setPrefs(prefs) {
  state.prefs = prefs;
  emit('prefs:changed', prefs);
}

function setServerState(s) {
  state.serverState = { ...(state.serverState || {}), ...s };
  emit('serverstate:changed', state.serverState);
}

function setFilter(filter) {
  state.filter = filter;
  emit('ui:filter', filter);
}

function setSearch(str) {
  state.search = str;
  emit('ui:search', str);
}

function setSort(key, dir) {
  state.sortKey = key;
  state.sortDir = dir;
  try {
    localStorage.setItem('tx-sort-key', key);
    localStorage.setItem('tx-sort-dir', dir);
  } catch (_) {}
  emit('ui:sort', { key, dir });
}

function setSelected(idSet) {
  state.selected = idSet instanceof Set ? idSet : new Set(idSet);
  emit('ui:selection', state.selected);
  updateSelectionClasses();
}

function setInspector(idOrNull) {
  state.inspectorId = idOrNull;
  emit('ui:inspector', idOrNull);
}

function setSettingsOpen(bool) {
  state.settingsOpen = bool;
  emit('ui:settings', bool);
}

function setLogOpen(bool) {
  state.logOpen = bool;
  emit('ui:log', bool);
}

function setConnected(bool) {
  state.connected = bool;
  emit('connection:' + (bool ? 'restored' : 'error'), null);
}

