
function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return '—';
  const bps = bytesPerSec * 8;
  if (bps < 1_000_000)     return Math.round(bps / 1000) + ' Kbps';
  if (bps < 1_000_000_000) return (bps / 1_000_000).toFixed(1) + ' Mbps';
  return (bps / 1_000_000_000).toFixed(2) + ' Gbps';
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024)           return bytes + ' B';
  if (bytes < 1024 ** 2)      return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 ** 3)      return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  if (bytes < 1024 ** 4)      return (bytes / 1024 ** 3).toFixed(1) + ' GB';
  return (bytes / 1024 ** 4).toFixed(1) + ' TB';
}

function formatETA(seconds) {
  if (seconds < 0) return '∞';
  if (seconds === 0) return 'Done';
  if (seconds < 60) return seconds + 's';
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 10) return m + 'm';
    return m + 'm ' + s + 's';
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h + 'h ' + m + 'm';
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d + 'd ' + h + 'h';
}

function formatRatio(ratio) {
  if (ratio < 0) return '∞';
  if (ratio === 0) return '0.00';
  return ratio.toFixed(2);
}

function formatDate(unixTs) {
  if (!unixTs) return '—';
  return new Date(unixTs * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + s + 's';
  return s + 's';
}

function formatPercent(fraction) {
  return (fraction * 100).toFixed(1).replace('.0', '') + '%';
}

function kbpsToMbps(kbps) { return kbps > 0 ? +((kbps / 125).toFixed(1)) : 0; }
function mbpsToKbps(mbps)  { return Math.round(mbps * 125); }
function bpsToMbps(bps)    { return bps  > 0 ? +((bps  / 125000).toFixed(1)) : 0; }
function mbpsToBps(mbps)   { return Math.round(mbps * 125000); }

function torrentStateClass(torrent) {
  if (torrent.error === true || torrent.state === 'error' || torrent.state === 'missingFiles') {
    return 'state-error';
  }
  switch (torrent.state) {
    case 'downloading':
    case 'forcedDL':
    case 'allocating':
      return 'state-downloading';
    case 'stalledDL':
      return 'state-stalled';
    case 'metaDL':
      return 'state-metadata';
    case 'checkingDL':
    case 'checkingUP':
    case 'checkingResumeData':
    case 'moving':
      return 'state-checking';
    case 'pausedDL':
      return 'state-paused';
    case 'pausedUP':
      return 'state-finished';
    case 'queuedDL':
    case 'queuedUP':
      return 'state-queued';
    case 'uploading':
    case 'forcedUP':
    case 'stalledUP':
      return 'state-seeding';
    default:
      return 'state-paused';
  }
}

function torrentStateLabel(torrent) {
  const cls = torrentStateClass(torrent);
  switch (cls) {
    case 'state-error':       return 'Error';
    case 'state-metadata':    return 'Getting metadata';
    case 'state-checking':    return 'Checking';
    case 'state-stalled':     return 'Stalled';
    case 'state-paused':      return 'Paused';
    case 'state-finished':    return 'Finished';
    case 'state-queued':      return 'Queued';
    case 'state-downloading': return 'Downloading';
    case 'state-seeding':     return 'Seeding';
    default:                  return 'Unknown';
  }
}


function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
