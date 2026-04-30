
const API_BASE = '/api/v2';


async function sendRequest(url, options, timeoutMs) {
  if (timeoutMs === undefined) timeoutMs = 0;
  const controller = new AbortController();
  let timer = null;
  if (timeoutMs > 0) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }
  try {
    const resp = await fetch(url, {
      ...options,
      signal: timeoutMs > 0 ? controller.signal : undefined,
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out after ' + timeoutMs + 'ms');
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function api(path, params, timeoutMs) {
  const url = API_BASE + path;
  let resp;
  if (!params) {
    resp = await sendRequest(url, { method: 'GET' }, timeoutMs);
    const text = await resp.text();
    try { return JSON.parse(text); } catch { return text; }
  }
  if (params.body !== undefined) {
    resp = await sendRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.body,
    }, timeoutMs);
    const text = await resp.text();
    try { return JSON.parse(text); } catch { return text; }
  }
  const qs = new URLSearchParams(params).toString();
  resp = await sendRequest(url + (qs ? '?' + qs : ''), { method: 'GET' }, timeoutMs);
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function torrentPause(hashes)      { return api('/torrents/pause',     { body: 'hashes=' + hashes.join('|') }); }
async function torrentResume(hashes)     { return api('/torrents/resume',    { body: 'hashes=' + hashes.join('|') }); }
async function torrentRecheck(hashes)    { return api('/torrents/recheck',   { body: 'hashes=' + hashes.join('|') }); }
async function torrentReannounce(hashes) { return api('/torrents/reannounce',{ body: 'hashes=' + hashes.join('|') }); }

async function torrentDelete(hashes, deleteFiles) {
  return api('/torrents/delete', { body: `hashes=${hashes.join('|')}&deleteFiles=${deleteFiles ? 'true' : 'false'}` });
}

async function torrentSetLocation(hashes, location) {
  return api('/torrents/setLocation', { body: `hashes=${hashes.join('|')}&location=${encodeURIComponent(location)}` });
}

async function torrentRename(hash, name) {
  return api('/torrents/rename', { body: `hash=${hash}&name=${encodeURIComponent(name)}` });
}

async function torrentSetShareLimits(hashes, ratioLimit, seedingTimeLimit) {
  return api('/torrents/setShareLimits', {
    body: `hashes=${hashes.join('|')}&ratioLimit=${ratioLimit}&seedingTimeLimit=${seedingTimeLimit ?? -1}`,
  });
}

async function torrentSetUploadLimit(hashes, limit) {
  return api('/torrents/setUploadLimit', { body: `hashes=${hashes.join('|')}&limit=${limit}` });
}

async function torrentSetDownloadLimit(hashes, limit) {
  return api('/torrents/setDownloadLimit', { body: `hashes=${hashes.join('|')}&limit=${limit}` });
}

async function torrentSetForceStart(hashes, value) {
  return api('/torrents/setForceStart', { body: `hashes=${hashes.join('|')}&value=${value}` });
}

async function torrentFilePriority(hash, indexes, priority) {
  return api('/torrents/filePrio', { body: `hash=${hash}&id=${indexes.join('|')}&priority=${priority}` });
}

async function torrentAdd(params) {
  const form = new FormData();
  if (params.urls)        form.append('urls', params.urls);
  if (params.torrentFile) form.append('torrents', params.torrentFile);
  if (params.savepath)    form.append('savepath', params.savepath);
  form.append('paused',           params.paused ? 'true' : 'false');
  form.append('ratioLimit',       params.ratioLimit       ?? -1);
  form.append('seedingTimeLimit', params.seedingTimeLimit ?? -1);
  const resp = await fetch(API_BASE + '/torrents/add', { method: 'POST', body: form });
  return resp.text();
}

async function queueMoveTop(hashes)    { return api('/torrents/topPrio',      { body: 'hashes=' + hashes.join('|') }); }
async function queueMoveUp(hashes)     { return api('/torrents/increasePrio', { body: 'hashes=' + hashes.join('|') }); }
async function queueMoveDown(hashes)   { return api('/torrents/decreasePrio', { body: 'hashes=' + hashes.join('|') }); }
async function queueMoveBottom(hashes) { return api('/torrents/bottomPrio',   { body: 'hashes=' + hashes.join('|') }); }

async function getPreferences()  { return api('/app/preferences'); }
async function setPreferences(prefs) {
  return api('/app/setPreferences', { body: 'json=' + encodeURIComponent(JSON.stringify(prefs)) });
}
async function getTransferInfo() { return api('/transfer/info'); }
async function toggleAltSpeedLimits()        { return api('/transfer/toggleSpeedLimitsMode', { body: '' }); }
async function setGlobalDownloadLimit(limit) { return api('/transfer/setDownloadLimit', { body: `limit=${limit}` }); }
async function setGlobalUploadLimit(limit)   { return api('/transfer/setUploadLimit',   { body: `limit=${limit}` }); }

async function getTorrentProperties(hash) { return api('/torrents/properties', { hash }); }
async function getTorrentTrackers(hash)   { return api('/torrents/trackers',   { hash }); }
async function getTorrentFiles(hash)      { return api('/torrents/files',      { hash }); }
async function getTorrentPeers(hash, rid) { return api('/sync/torrentPeers',  { hash, rid: rid ?? 0 }); }

async function torrentSetSuperSeeding(hashes, value) {
  return api('/torrents/setSuperSeeding', { body: `hashes=${hashes.join('|')}&value=${value}` });
}

async function torrentRenameFolder(hash, oldPath, newPath) {
  return api('/torrents/renameFolder', {
    body: `hash=${hash}&oldPath=${encodeURIComponent(oldPath)}&newPath=${encodeURIComponent(newPath)}`,
  });
}

