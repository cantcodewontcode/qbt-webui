(function () {
  'use strict';

  // ── format.js ──────────────────────────────────────────────────────────────

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

  // ── icons.js ───────────────────────────────────────────────────────────────

  function icon(paths, size, cls) {
    if (size === undefined) size = 16;
    const sw = size <= 14 ? '1.25' : '1.5';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" class="icon${cls ? ' ' + cls : ''}" aria-hidden="true">${paths}</svg>`;
  }

  function iconP(pathData, size, cls, extra) {
    if (size === undefined) size = 16;
    // extra: optional transform string (e.g. 'scale(-1,1) translate(-256,0)' for h-flip)
    const gOpen  = extra ? `<g transform="${extra}">` : '';
    const gClose = extra ? '</g>' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" fill="currentColor" class="icon${cls ? ' ' + cls : ''}" aria-hidden="true">${gOpen}<path d="${pathData}"/>${gClose}</svg>`;
  }

  const iconArrowDown     = (size, cls) => icon('<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>', size, cls);
  const iconArrowUp       = (size, cls) => icon('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>', size, cls);
  const iconPause         = (size, cls) => iconP('M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z', size, cls);
  const iconClock         = (size, cls) => icon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', size, cls);
  const iconRefreshCw     = (size, cls) => iconP('M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-11.55,39.29c-4.79,5-9.75,10.17-12.38,16.52-2.52,6.1-2.63,13.07-2.73,19.82-.1,7-.21,14.33-3.32,17.43s-10.39,3.22-17.43,3.32c-6.75.1-13.72.21-19.82,2.73-6.35,2.63-11.52,7.59-16.52,12.38S132,224,128,224s-9.15-4.92-14.11-9.69-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82-2.63-6.35-7.59-11.52-12.38-16.52S32,132,32,128s4.92-9.15,9.69-14.11,9.75-10.17,12.38-16.52c2.52-6.1,2.63-13.07,2.73-19.82.1-7,.21-14.33,3.32-17.43S70.51,56.9,77.55,56.8c6.75-.1,13.72-.21,19.82-2.73,6.35-2.63,11.52-7.59,16.52-12.38S124,32,128,32s9.15,4.92,14.11,9.69,10.17,9.75,16.52,12.38c6.1,2.52,13.07,2.63,19.82,2.73,7,.1,14.33.21,17.43,3.32s3.22,10.39,3.32,17.43c.1,6.75.21,13.72,2.73,19.82,2.63,6.35,7.59,11.52,12.38,16.52S224,124,224,128,219.08,137.15,214.31,142.11ZM173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z', size, cls);
  const iconAlertCircle   = (size, cls) => icon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', size, cls);
  const iconMinusCircle   = (size, cls) => icon('<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>', size, cls);
  const iconLoader        = (size, cls) => icon('<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>', size, cls);
  const iconSearch        = (size, cls) => icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', size, cls);
  const iconX             = (size, cls) => icon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', size, cls);
  const iconPlus          = (size, cls) => icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', size, cls);
  const iconSettings      = (size, cls) => iconP('M64,105V40a8,8,0,0,0-16,0v65a32,32,0,0,0,0,62v49a8,8,0,0,0,16,0V167a32,32,0,0,0,0-62Zm-8,47a16,16,0,1,1,16-16A16,16,0,0,1,56,152Zm80-95V40a8,8,0,0,0-16,0V57a32,32,0,0,0,0,62v97a8,8,0,0,0,16,0V119a32,32,0,0,0,0-62Zm-8,47a16,16,0,1,1,16-16A16,16,0,0,1,128,104Zm104,64a32.06,32.06,0,0,0-24-31V40a8,8,0,0,0-16,0v97a32,32,0,0,0,0,62v17a8,8,0,0,0,16,0V199A32.06,32.06,0,0,0,232,168Zm-32,16a16,16,0,1,1,16-16A16,16,0,0,1,200,184Z', size, cls);
  const iconChevronUp     = (size, cls) => icon('<polyline points="18 15 12 9 6 15"/>', size, cls);
  const iconChevronDown   = (size, cls) => icon('<polyline points="6 9 12 15 18 9"/>', size, cls);
  const iconChevronRight  = (size, cls) => icon('<polyline points="9 18 15 12 9 6"/>', size, cls);
  const iconCheck         = (size, cls) => icon('<polyline points="20 6 9 17 4 12"/>', size, cls);
  const iconPlay          = (size, cls) => iconP('M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z', size, cls);
  const iconSquare        = (size, cls) => icon('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>', size, cls);
  const iconTrash2        = (size, cls) => iconP('M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z', size, cls);
  const iconFolderOpen    = (size, cls) => icon('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', size, cls);
  const iconEdit2         = (size, cls) => iconP('M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z', size, cls);
  const iconTag           = (size, cls) => iconP('M114.34,154.34l96-96a8,8,0,0,1,11.32,11.32l-96,96a8,8,0,0,1-11.32-11.32ZM128,88a63.9,63.9,0,0,1,20.44,3.33,8,8,0,1,0,5.11-15.16A80,80,0,0,0,48.49,160.88,8,8,0,0,0,56.43,168c.29,0,.59,0,.89-.05a8,8,0,0,0,7.07-8.83A64.92,64.92,0,0,1,64,152,64.07,64.07,0,0,1,128,88Zm99.74,13a8,8,0,0,0-14.24,7.3,96.27,96.27,0,0,1,5,75.71l-181.1-.07A96.24,96.24,0,0,1,128,56h.88a95,95,0,0,1,42.82,10.5A8,8,0,1,0,179,52.27a112,112,0,0,0-156.66,137A16.07,16.07,0,0,0,37.46,200H218.53a16,16,0,0,0,15.11-10.71,112.35,112.35,0,0,0-5.9-88.3Z', size, cls);
  const iconSkipBack      = (size, cls) => icon('<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>', size, cls);
  const iconSkipForward   = (size, cls) => icon('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>', size, cls);
  const iconArrowUpCircle = (size, cls) => icon('<circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/>', size, cls);
  const iconArrowDnCircle = (size, cls) => icon('<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>', size, cls);
  const iconRefreshCcw    = (size, cls) => icon('<polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>', size, cls);
  const iconLink          = (size, cls) => icon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', size, cls);
  const iconFile          = (size, cls) => icon('<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>', size, cls);
  const iconUsers         = (size, cls) => icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', size, cls);
  const iconWifi          = (size, cls) => iconP('M248,120a48.05,48.05,0,0,0-48-48H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48.07,48.07,0,0,0,248,120ZM48,199.93V40h0c42.81,35.91,86.63,45,104,47.24v65.48C134.65,155,90.84,164.07,48,199.93Zm131,8,0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z', size, cls, 'scale(-1,1) translate(-256,0)');
  const iconInfo          = (size, cls) => iconP('M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z', size, cls);
  const iconExternalLink  = (size, cls) => icon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>', size, cls);
  const iconListChecks    = (size, cls) => icon('<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/>', size, cls);
  const iconCopy          = (size, cls) => icon('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', size, cls);
  const iconXCircle       = (size, cls) => icon('<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>', size, cls);
  const iconStopCircle    = (size, cls) => icon('<circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/>', size, cls);
  const iconMoveUp        = (size, cls) => icon('<polyline points="8 6 12 2 16 6"/><line x1="12" y1="2" x2="12" y2="22"/><polyline points="20 18 16 22 12 18"/>', size, cls);
  const iconMoveDown      = (size, cls) => icon('<polyline points="8 18 12 22 16 18"/><line x1="12" y1="22" x2="12" y2="2"/><polyline points="20 6 16 2 12 6"/>', size, cls);
  const iconSuperSeeding  = (size, cls) => iconP('M128,88a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,152Zm73.71,7.14a80,80,0,0,1-14.08,22.2,8,8,0,0,1-11.92-10.67,63.95,63.95,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67,80.08,80.08,0,0,1,14.08,84.47ZM69,103.09a64,64,0,0,0,11.26,67.58,8,8,0,0,1-11.92,10.67,79.93,79.93,0,0,1,0-106.67A8,8,0,1,1,80.29,85.34,63.77,63.77,0,0,0,69,103.09ZM248,128a119.58,119.58,0,0,1-34.29,84,8,8,0,1,1-11.42-11.2,103.9,103.9,0,0,0,0-145.56A8,8,0,1,1,213.71,44,119.58,119.58,0,0,1,248,128ZM53.71,200.78A8,8,0,1,1,42.29,212a119.87,119.87,0,0,1,0-168,8,8,0,1,1,11.42,11.2,103.9,103.9,0,0,0,0,145.56Z', size, cls);

  // ── rpc.js (qBittorrent API v2) ────────────────────────────────────────────

  const API_BASE = '/api/v2';

  let failureCount = 0;

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

  // ── state.js ───────────────────────────────────────────────────────────────

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

  function setTorrents(torrentsArray) {
    torrentsArray.forEach(t => {
      const key = t.hash;
      state.torrents.set(key, { ...(state.torrents.get(key) || {}), ...t });
    });
    emit('torrents:changed', null);
  }

  function removeTorrents(hashes) {
    hashes.forEach(h => state.torrents.delete(h));
    emit('torrents:changed', null);
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

  function setConnected(bool) {
    state.connected = bool;
    emit('connection:' + (bool ? 'restored' : 'error'), null);
  }

  // ── poll.js ────────────────────────────────────────────────────────────────

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

  // ── row.js ─────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function peerDisplay(torrent, stateClass) {
    const connected = (torrent.num_leechs ?? 0) + (torrent.num_seeds ?? 0);
    if (stateClass === 'state-downloading' || stateClass === 'state-stalled' || stateClass === 'state-queued') {
      return {
        text:   connected > 0 ? String(connected) : '—',
        active: (torrent.dlspeed ?? 0) > 0,
        warn:   torrent.state === 'stalledDL' && connected > 0,
      };
    }
    if (stateClass === 'state-seeding') {
      return {
        text:   connected > 0 ? String(connected) : '—',
        active: (torrent.upspeed ?? 0) > 0,
        warn:   false,
      };
    }
    return { text: '—', active: false, warn: false };
  }

  function renderRow(torrent, isSelected) {
    const stateClass    = torrentStateClass(torrent);
    const selectedClass = isSelected ? 'row--selected' : '';
    const hash          = torrent.hash;
    const name          = esc(torrent.name || '—');

    const dlRaw = torrent.dlspeed || 0;
    const ulRaw = torrent.upspeed || 0;

    const dlSpeed  = formatSpeed(dlRaw);
    const ulSpeed  = formatSpeed(ulRaw);

    // stalledDL is the stalled-download state in qBT
    const dlStarved = torrent.state === 'stalledDL';
    const dlActive  = dlRaw > 0 ? 'is-active' : dlStarved ? 'is-starved' : '';
    const ulActive  = ulRaw > 0 ? 'is-active' : '';

    const ratio      = formatRatio(torrent.ratio ?? -1);
    const ratioClass = (torrent.ratio >= 1.0) ? 'is-good' : '';

    const eta  = formatETA(torrent.eta ?? -1);
    const size = formatSize(torrent.size || 0);

    const peer      = peerDisplay(torrent, stateClass);
    const peerClass = peer.active ? 'peers-active'
                    : peer.warn   ? 'peers-warn'
                    : '';

    const isFetchingMetadata = torrent.state === 'metaDL';

    let pctDisplay;
    if (isFetchingMetadata) {
      pctDisplay = torrent.progress > 0 ? formatPercent(torrent.progress) : 'Fetching…';
    } else {
      pctDisplay = formatPercent(torrent.progress || 0);
    }

    let pct = (torrent.progress || 0) * 100;
    if (stateClass === 'state-checking') {
      pct = (torrent.progress || 0) * 100;
    } else if (stateClass === 'state-seeding') {
      // ratio_limit >= 0  → per-torrent limit
      // ratio_limit === -1 → use global (state.prefs.max_ratio if enabled)
      // ratio_limit === -2 → no limit → 100%
      let effectiveRatioLimit = null;

      if ((torrent.ratio_limit ?? -2) >= 0) {
        effectiveRatioLimit = torrent.ratio_limit;
      } else if ((torrent.ratio_limit ?? -2) === -1) {
        const globalEnabled = state.prefs?.max_ratio_enabled ?? false;
        const globalRatio   = state.prefs?.max_ratio ?? null;
        if (globalEnabled && globalRatio != null && globalRatio > 0) {
          effectiveRatioLimit = globalRatio;
        }
      }

      if (effectiveRatioLimit != null) {
        const currentRatio = torrent.ratio ?? 0;
        if (currentRatio >= effectiveRatioLimit) {
          pct = 100;
        } else {
          pct = Math.min(99.9, (currentRatio / effectiveRatioLimit) * 100);
        }
      } else {
        pct = 100;
      }
    }
    pct = Math.max(0, Math.min(100, pct));
    if (stateClass === 'state-downloading' && (torrent.progress || 0) < 1) {
      pct = Math.min(pct, 99);
    }

    // qBT has no per-torrent error string in the list API; state signals the error
    const errorLine = (stateClass === 'state-error')
      ? `<span class="row-error-string">Error</span>`
      : '';

    const dlTotal = formatSize(torrent.downloaded || 0);
    const ulTotal = formatSize(torrent.uploaded   || 0);

    const dlLine = dlRaw > 0
      ? `${dlTotal} <span class="row-inline-speed ${dlActive}">(${dlSpeed})</span>`
      : dlTotal;
    const ulLine = ulRaw > 0
      ? `${ulTotal} <span class="row-inline-speed ${ulActive}">(${ulSpeed})</span>`
      : ulTotal;

    const connected  = (torrent.num_leechs ?? 0) + (torrent.num_seeds ?? 0);
    const numLeechs  = torrent.num_leechs ?? 0;
    const numSeeds   = torrent.num_seeds  ?? 0;
    let peerLine = '';
    if (stateClass === 'state-downloading' && connected > 0) {
      peerLine = `<span class="row-peer-inline">Downloading from ${numSeeds} of ${connected} peers</span>`;
    } else if (stateClass === 'state-seeding' && connected > 0) {
      if (torrent.super_seeding) {
        peerLine = `<span class="row-peer-inline row-peer-inline--super">
      ${iconSuperSeeding(13)}Super Seeding to ${numLeechs} of ${connected} peers
    </span>`;
      } else {
        peerLine = `<span class="row-peer-inline">Seeding to ${numLeechs} of ${connected} peers</span>`;
      }
    } else if (stateClass === 'state-stalled' && connected > 0) {
      peerLine = `<span class="row-peer-inline row-peer-warn">${connected} peers, no transfer</span>`;
    }

    const nameColHtml = `<div class="col col-name row-name-wrap">
  <span class="row-name">${name}</span>${errorLine}
  <div class="row-progress-inline" title="${pctDisplay}">
    <div class="row-progress-inline__fill" style="width:${pct.toFixed(1)}%"></div>
  </div>
  <div class="row-sub-line">
    <span class="row-transfer-dl">↓ ${dlLine}</span>
    <span class="row-transfer-ul">↑ ${ulLine}</span>
    ${peerLine}
  </div>
</div>`;

    return `<div class="torrent-row ${stateClass} ${selectedClass}" data-hash="${hash}" role="listitem" tabindex="-1">
  ${nameColHtml}
  <div class="col col-size row-data">${size}</div>
  <div class="col col-dl row-data row-dl-speed ${dlActive}">${dlSpeed}</div>
  <div class="col col-ul row-data row-ul-speed ${ulActive}">${ulSpeed}</div>
  <div class="col col-peers row-data row-peers ${peerClass}">${peer.text}</div>
  <div class="col col-ratio row-data row-ratio ${ratioClass}">${ratio}</div>
  <div class="col col-eta row-data row-eta">${eta}</div>
  <div class="col col-pct row-data row-pct">${pctDisplay}</div>
</div>`;
  }

  // ── list.js ────────────────────────────────────────────────────────────────

  const ROW_HEIGHT = 104;

  let filteredSorted   = [];
  let lastClickedHash  = null;
  let viewport         = null;

  const FILTER_MAP = {
    all:         () => true,
    downloading: t => ['downloading', 'stalledDL', 'forcedDL', 'allocating'].includes(t.state),
    seeding:     t => ['uploading', 'stalledUP', 'forcedUP'].includes(t.state),
    paused:      t => t.state === 'pausedDL' || t.state === 'pausedUP',
    errors:      t => t.state === 'error' || t.state === 'missingFiles',
    fetching:    t => t.state === 'metaDL',
    finished:    t => t.state === 'pausedUP',
    checking:    t => ['checkingDL', 'checkingUP', 'checkingResumeData'].includes(t.state),
    active:      t => (t.dlspeed ?? 0) > 0 || (t.upspeed ?? 0) > 0,
    inactive:    t => (t.dlspeed ?? 0) === 0 && (t.upspeed ?? 0) === 0,
    stalled:     t => t.state === 'stalledDL' || t.state === 'stalledUP',
  };

  function applyFilter(torrents, filter, search) {
    let arr = [...torrents.values()];
    // Error torrents only appear in 'all' and 'errors' — excluded everywhere else
    if (filter !== 'all' && filter !== 'errors') {
      arr = arr.filter(t => t.state !== 'error' && t.state !== 'missingFiles');
    }
    const filterFn = FILTER_MAP[filter];
    if (filterFn && filter !== 'all') {
      arr = arr.filter(filterFn);
    }
    if (state.activeCategory !== null) {
      arr = arr.filter(t => t.category === state.activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase().replace(/\./g, ' ');
      arr = arr.filter(t => {
        const name = (t.name || '').toLowerCase().replace(/\./g, ' ');
        return name.includes(q);
      });
    }
    return arr;
  }

  function applySort(arr, key, dir) {
    const mult = dir === 'asc' ? 1 : -1;

    function etaVal(t) {
      const v = t.eta ?? -1;
      return v < 0 ? Number.MAX_SAFE_INTEGER : v;
    }

    function byName(a, b) {
      return (a.name || '').localeCompare(b.name || '');
    }

    function connectedVal(t) {
      return (t.num_leechs ?? 0) + (t.num_seeds ?? 0);
    }

    return [...arr].sort((a, b) => {
      let av, bv, primary;

      if (key === 'eta') {
        av = etaVal(a);
        bv = etaVal(b);
        primary = av === bv ? 0 : mult * (av - bv);
      } else if (key === 'num_connected') {
        av = connectedVal(a);
        bv = connectedVal(b);
        primary = mult * (av - bv);
      } else {
        av = a[key] ?? 0;
        bv = b[key] ?? 0;
        if (typeof av === 'string') {
          primary = mult * av.localeCompare(bv);
        } else {
          primary = mult * (av - bv);
        }
      }

      if (primary !== 0) return primary;

      switch (key) {
        case 'progress': {
          const byRatio = (b.ratio ?? 0) - (a.ratio ?? 0);
          return byRatio !== 0 ? byRatio : byName(a, b);
        }
        case 'ratio': {
          const byPct = (b.progress ?? 0) - (a.progress ?? 0);
          return byPct !== 0 ? byPct : byName(a, b);
        }
        case 'eta': {
          const byPct = (b.progress ?? 0) - (a.progress ?? 0);
          return byPct !== 0 ? byPct : byName(a, b);
        }
        default:
          return 0;
      }
    });
  }

  function rebuild() {
    const filtered = applyFilter(state.torrents, state.filter, state.search);
    filteredSorted  = applySort(filtered, state.sortKey, state.sortDir);
  }

  function render() {
    if (!viewport) return;

    if (filteredSorted.length === 0 && state.torrents.size === 0) {
      // Show skeleton rows while waiting for first RPC response
      let count = 12;
      try {
        const cached = localStorage.getItem('tx-torrent-count');
        if (cached) count = Math.min(80, Math.max(12, parseInt(cached, 10) || 12));
      } catch (_) {}
      let skeletonHtml = '';
      for (let i = 0; i < count; i++) {
        skeletonHtml += `<div class="skeleton-row">
          <div class="skeleton-block skeleton-col-name"></div>
          <div class="skeleton-block skeleton-col-size"></div>
          <div class="skeleton-block skeleton-col-dl"></div>
          <div class="skeleton-block skeleton-col-ul"></div>
          <div class="skeleton-block skeleton-col-peers"></div>
          <div class="skeleton-block skeleton-col-ratio"></div>
          <div class="skeleton-block skeleton-col-eta"></div>
          <div class="skeleton-block skeleton-col-pct"></div>
        </div>`;
      }
      viewport.innerHTML = skeletonHtml;
      return;
    }

    if (filteredSorted.length === 0) {
      const emptyMessages = {
        all:         state.search.trim() ? 'No torrents match.' : 'No torrents match.',
        downloading: 'No active downloads.',
        seeding:     'No torrents seeding.',
        paused:      'No paused torrents.',
        fetching:    'No torrents fetching metadata.',
        finished:    'No finished torrents.',
        errors:      'No errors.',
      };
      const msg = emptyMessages[state.filter] || 'No torrents match.';
      viewport.innerHTML = `<div class="list-empty">${msg}</div>`;
      return;
    }

    let html = '';
    for (const t of filteredSorted) {
      html += renderRow(t, state.selected.has(t.hash));
    }
    viewport.innerHTML = html;
  }

  function selectAll() {
    setSelected(new Set(filteredSorted.map(t => t.hash)));
  }

  function updateSelectionClasses() {
    if (!viewport) return;
    viewport.querySelectorAll('.torrent-row').forEach(rowEl => {
      const hash = rowEl.dataset.hash;
      rowEl.classList.toggle('row--selected', state.selected.has(hash));
    });

    // If inspector is open and a single row is selected, follow the selection
    if (state.inspectorId !== null && state.selected.size === 1) {
      const selectedHash = [...state.selected][0];
      if (selectedHash !== state.inspectorId) {
        setInspector(selectedHash);
      }
    }
  }

  function mountList(containerEl) {
    viewport = containerEl;

    containerEl.addEventListener('click', (e) => {
      const row = e.target.closest('.torrent-row');
      if (!row) return;
      const hash = row.dataset.hash;

      if (e.shiftKey && lastClickedHash !== null) {
        const hashes = filteredSorted.map(t => t.hash);
        const a      = hashes.indexOf(lastClickedHash);
        const b      = hashes.indexOf(hash);
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const next = new Set(state.selected);
        for (let i = lo; i <= hi; i++) next.add(hashes[i]);
        setSelected(next);
        lastClickedHash = hash;
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const next = new Set(state.selected);
        if (next.has(hash)) next.delete(hash); else next.add(hash);
        setSelected(next);
        lastClickedHash = hash;
        return;
      }

      setSelected(new Set([hash]));
      lastClickedHash = hash;
    });

    containerEl.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.torrent-row');
      if (!row) return;
      const hash = row.dataset.hash;

      setSelected(new Set([hash]));
      lastClickedHash = hash;

      {
        const inspEl = document.getElementById('inspector');
        const isOpen = inspEl && inspEl.classList.contains('inspector--open');
        if (isOpen && state.inspectorId === hash) {
          setInspector(null);
        } else {
          setInspector(hash);
        }
      }
    });

    containerEl.addEventListener('contextmenu', (e) => {
      const row = e.target.closest('.torrent-row');
      if (!row) return;
      e.preventDefault();
      const hash = row.dataset.hash;
      if (!state.selected.has(hash)) {
        setSelected(new Set([hash]));
      }
      document.dispatchEvent(new CustomEvent('contextmenu:open', {
        detail: { id: hash, x: e.clientX, y: e.clientY }
      }));
    });

    on('torrents:changed', () => { rebuild(); render(); });
    on('ui:filter',        () => { rebuild(); render(); });
    on('ui:search',        () => { rebuild(); render(); });
    on('ui:sort',          () => { rebuild(); render(); });
    // ui:selection no longer triggers render(); updateSelectionClasses() handles it

    rebuild();
    render();
  }

  // ── toolbar.js ─────────────────────────────────────────────────────────────

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


  }

  function openSpeedPopover(anchorEl, mode) {
    const wasSameAnchor = _popoverAnchor === anchorEl;
    if (_popoverCleanup) { _popoverCleanup(); }
    if (wasSameAnchor) return;

    const popover = buildPopover(mode);
    document.body.appendChild(popover);

    const rect = anchorEl.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - 140;
    popover.style.top  = (rect.bottom + 8) + 'px';
    popover.style.left = Math.max(8, Math.min(left, window.innerWidth - 288)) + 'px';

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

  function buildPopover(mode) {
    const prefs     = state.prefs;
    const dlEnabled = (prefs.dl_limit ?? 0) > 0;
    const ulEnabled = (prefs.up_limit ?? 0) > 0;
    const caretHTML = `<div class="speed-popover__caret" aria-hidden="true"></div>`;

    const pop = document.createElement('div');
    pop.className = 'speed-popover';

    if (mode === 'dl') {
      pop.innerHTML = `
        ${caretHTML}
        <div>
          <div class="speed-popover__title">Download limit</div>
          <div class="speed-popover__row">
            <label>
              <input type="checkbox" name="dl-enabled" ${dlEnabled ? 'checked' : ''}>
              Limit
            </label>
            <input type="number" class="input speed-popover__input" name="dl-value"
                   value="${dlEnabled ? kbpsToMbps(prefs.dl_limit) : 0}" min="0">
            <span class="speed-popover__unit">Mbps</span>
          </div>
        </div>
        <div class="speed-popover__divider"></div>
        <div>
          <div class="speed-popover__title">Alternative speeds</div>
          <div class="speed-popover__row">
            <label>
              <input type="checkbox" name="alt-enabled"
                     ${prefs.alt_speed_enabled ? 'checked' : ''}>
              Enable
            </label>
          </div>
          <div class="speed-popover__row">
            <label>↓ Alt</label>
            <input type="number" class="input speed-popover__input" name="alt-dl"
                   value="${kbpsToMbps(prefs.alt_dl_limit ?? 0)}" min="0">
            <span class="speed-popover__unit">Mbps</span>
          </div>
        </div>
        <div class="speed-popover__footer">
          <button class="btn-primary btn--sm" name="apply">Apply</button>
        </div>
      `;
    } else {
      pop.innerHTML = `
        ${caretHTML}
        <div>
          <div class="speed-popover__title">Upload limit</div>
          <div class="speed-popover__row">
            <label>
              <input type="checkbox" name="ul-enabled" ${ulEnabled ? 'checked' : ''}>
              Limit
            </label>
            <input type="number" class="input speed-popover__input" name="ul-value"
                   value="${ulEnabled ? kbpsToMbps(prefs.up_limit) : 0}" min="0">
            <span class="speed-popover__unit">Mbps</span>
          </div>
        </div>
        <div class="speed-popover__divider"></div>
        <div>
          <div class="speed-popover__title">Alternative speeds</div>
          <div class="speed-popover__row">
            <label>
              <input type="checkbox" name="alt-enabled"
                     ${prefs.alt_speed_enabled ? 'checked' : ''}>
              Enable
            </label>
          </div>
          <div class="speed-popover__row">
            <label>↑ Alt</label>
            <input type="number" class="input speed-popover__input" name="alt-ul"
                   value="${kbpsToMbps(prefs.alt_up_limit ?? 0)}" min="0">
            <span class="speed-popover__unit">Mbps</span>
          </div>
        </div>
        <div class="speed-popover__footer">
          <button class="btn-primary btn--sm" name="apply">Apply</button>
        </div>
      `;
    }

    pop.querySelector('[name="apply"]').addEventListener('click', async () => {
      const payload = {};
      const altEnabled = pop.querySelector('[name="alt-enabled"]')?.checked;
      if (altEnabled !== undefined) payload.alt_speed_enabled = altEnabled;

      if (mode === 'dl') {
        const dlOn  = pop.querySelector('[name="dl-enabled"]').checked;
        const dlVal = parseInt(pop.querySelector('[name="dl-value"]').value, 10) || 0;
        const altDl = parseInt(pop.querySelector('[name="alt-dl"]')?.value,  10) || 0;
        payload.dl_limit     = dlOn ? (mbpsToKbps(dlVal) || mbpsToKbps(8)) : 0;
        payload.alt_dl_limit = mbpsToKbps(altDl);
      } else {
        const ulOn  = pop.querySelector('[name="ul-enabled"]').checked;
        const ulVal = parseInt(pop.querySelector('[name="ul-value"]').value, 10) || 0;
        const altUl = parseInt(pop.querySelector('[name="alt-ul"]')?.value,  10) || 0;
        payload.up_limit     = ulOn ? (mbpsToKbps(ulVal) || mbpsToKbps(8)) : 0;
        payload.alt_up_limit = mbpsToKbps(altUl);
      }

      try {
        await setPreferences(payload);
        if (_popoverCleanup) _popoverCleanup();
        forceRefresh();
      } catch (err) {
        console.error('Failed to apply speed limits:', err);
      }
    });

    return pop;
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

  // ── sidebar.js ─────────────────────────────────────────────────────────────

  function mountSidebar() {
    mountFilterTabs();
    mountCategoryNav();
    mountColHeaders();
  }

  function mountFilterTabs() {
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    on('ui:filter', filter => {
      document.querySelectorAll('.filter-tab').forEach(btn => {
        const active = btn.dataset.filter === filter;
        btn.classList.toggle('filter-tab--active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    });

    on('torrents:changed', () => {
      const torrents = [...state.torrents.values()];

      const setCount = (id, fn) => {
        const el = document.getElementById(id);
        if (!el) return;
        const count = fn ? torrents.filter(fn).length : torrents.length;
        el.textContent = count;

        const filter = id.replace('count-', '');
        if (filter !== 'all') {
          const tabEl = document.querySelector(`.filter-tab[data-filter="${filter}"]`);
          if (tabEl) {
            tabEl.hidden = count === 0;
            if (count === 0 && tabEl.classList.contains('filter-tab--active')) {
              setFilter('all');
            }
          }
        }
      };

      setCount('count-all',         null);
      setCount('count-downloading', FILTER_MAP.downloading);
      setCount('count-seeding',     FILTER_MAP.seeding);
      setCount('count-paused',      FILTER_MAP.paused);
      setCount('count-fetching',    FILTER_MAP.fetching);
      setCount('count-finished',    FILTER_MAP.finished);
      setCount('count-errors',      FILTER_MAP.errors);
      setCount('count-checking',    FILTER_MAP.checking);
      setCount('count-stalled',     FILTER_MAP.stalled);
    });
  }

  function mountCategoryNav() {
    const nav = document.getElementById('category-nav');
    if (!nav) return;

    function renderCategories() {
      const cats = Object.keys(state.categories);
      if (cats.length === 0) {
        nav.innerHTML = '';
        return;
      }
      let html = '<span class="category-nav-label">Categories</span>';
      html += cats.map(name => {
        const active = state.activeCategory === name ? ' category-tab--active' : '';
        return `<button class="category-tab${active}" data-category="${esc(name)}">${esc(name)}</button>`;
      }).join('');
      nav.innerHTML = html;
      nav.querySelectorAll('.category-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = btn.dataset.category;
          state.activeCategory = state.activeCategory === cat ? null : cat;
          renderCategories();
          emit('ui:filter', state.filter);
        });
      });
    }

    on('categories:changed', renderCategories);
    renderCategories();
  }

  function mountColHeaders() {
    const colHeaders = document.querySelectorAll('.col-header');

    colHeaders.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.sort;
        let dir;
        if (state.sortKey === key) {
          dir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          dir = (key === 'name') ? 'asc' : 'desc';
        }
        setSort(key, dir);
      });
    });

    on('ui:sort', ({ key, dir }) => {
      colHeaders.forEach(btn => {
        const active = btn.dataset.sort === key;
        btn.classList.toggle('is-sorted', active);

        btn.querySelector('.sort-icon')?.remove();

        if (active) {
          const iconEl = document.createElement('span');
          iconEl.className = 'sort-icon';
          iconEl.innerHTML = dir === 'asc'
            ? iconChevronUp(12)
            : iconChevronDown(12);
          btn.appendChild(iconEl);
          btn.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
        } else {
          btn.setAttribute('aria-sort', 'none');
        }
      });
    });
  }

  // ── contextmenu.js ─────────────────────────────────────────────────────────

  function mountContextMenu() {
    document.addEventListener('contextmenu:open', (e) => {
      const { id, x, y } = e.detail;
      openMenu(id, x, y);
    });

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('context-menu');
      const sub  = document.getElementById('context-submenu');
      if (!menu.contains(e.target) && !(sub && sub.contains(e.target))) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    document.addEventListener('scroll', closeMenu, { capture: true, passive: true });

    document.addEventListener('keydown', (e) => {
      const menu = document.getElementById('context-menu');
      if (menu.classList.contains('context-menu--hidden')) return;

      const items = [...menu.querySelectorAll('.context-menu__item:not(.context-menu__item--disabled)')];
      const current = document.activeElement;
      const idx = items.indexOf(current);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[Math.min(idx + 1, items.length - 1)]?.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[Math.max(idx - 1, 0)]?.focus();
      }
      if (e.key === 'Enter' && current && items.includes(current)) {
        e.preventDefault();
        current.click();
      }
    });
  }

  function closeMenu() {
    const menu = document.getElementById('context-menu');
    menu.classList.add('context-menu--hidden');
    menu.innerHTML = '';
    closeSubmenu();
  }

  function closeSubmenu() {
    const sub = document.getElementById('context-submenu');
    if (sub) sub.remove();
  }

  function positionMenu(menu, x, y) {
    const TOOLBAR_H   = document.getElementById('toolbar')?.offsetHeight   || 48;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Reset any previous constraints so we can measure natural size
    menu.style.cssText = 'left:0;top:0;max-height:none;overflow-y:visible;';
    menu.classList.remove('context-menu--hidden');

    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;

    // Horizontal — prefer right of cursor; flip left if it would overflow
    const left = (x + mw > vw) ? Math.max(0, x - mw) : x;

    // Vertical — usable space below toolbar
    const minY   = TOOLBAR_H + 4;
    const maxY   = vh - 4;
    const usable = maxY - minY;

    let top;
    let scrollable = false;

    if (mh <= usable) {
      // Menu fits — prefer below cursor, flip above if needed
      if (y + mh <= maxY) {
        top = Math.max(minY, y);
      } else {
        top = y - mh;
        if (top < minY) top = minY;
      }
    } else {
      // Taller than usable space — pin to top and scroll
      top = minY;
      scrollable = true;
    }

    menu.style.left      = left + 'px';
    menu.style.top       = top  + 'px';
    menu.style.maxHeight = scrollable ? (usable + 'px') : '';
    menu.style.overflowY = scrollable ? 'auto' : '';
  }

  async function runAction(actionFn) {
    closeMenu();
    try {
      await actionFn();
      forceRefresh();
    } catch (err) {
      console.error('[contextmenu] Action failed:', err);
      showToast('Action failed: ' + err.message, 'error');
    }
  }

  function openMenu(id, x, y) {
    if (!state.selected.has(id)) {
      setSelected(new Set([id]));
    }

    const selectedIds = [...state.selected];
    const torrent     = state.torrents.get(id);
    const isMulti     = state.selected.size > 1;

    const menu = document.getElementById('context-menu');
    menu.innerHTML = buildMenuHTML(isMulti, torrent);

    positionMenu(menu, x, y);
    wireMenuEvents(menu, id, selectedIds, torrent, isMulti);
    setTimeout(() => {
      const firstItem = menu.querySelector(
        '.context-menu__item:not(.context-menu__item--disabled)'
      );
      firstItem?.focus();
    }, 0);
  }

  function menuItem(action, iconHtml, label, modClass) {
    if (modClass === undefined) modClass = '';
    const cls = modClass ? ` ${modClass}` : '';
    return `<div class="context-menu__item${cls}" role="menuitem" data-action="${action}" tabindex="-1">
    <span class="icon" aria-hidden="true">${iconHtml}</span>
    <span class="context-menu__label">${label}</span>
  </div>`;
  }

  function menuItemSubmenu(action, iconHtml, label) {
    return `<div class="context-menu__item context-menu__item--has-sub" role="menuitem"
      data-action="${action}" tabindex="-1" aria-haspopup="true">
    <span class="icon" aria-hidden="true">${iconHtml}</span>
    <span class="context-menu__label">${label}</span>
    <span class="context-menu__sub-arrow" aria-hidden="true">${iconChevronRight(12)}</span>
  </div>`;
  }

  const SEP = '<div class="context-menu__separator" role="separator"></div>';

  function buildMenuHTML(isMulti, torrent) {
    const renameClass  = isMulti ? 'context-menu__item--disabled' : '';
    const queueEnabled = !!(state.prefs.queueing_enabled);
    const isPausedState = s => s === 'pausedDL' || s === 'pausedUP' ||
                               s === 'queuedDL' || s === 'queuedUP';

    let showStart, showForceStart, showPause;
    if (!isMulti) {
      const paused = torrent && isPausedState(torrent.state);
      showStart      = paused;
      showForceStart = paused;
      showPause      = !paused;
    } else {
      const sel = [...state.selected].map(h => state.torrents.get(h)).filter(Boolean);
      const allPaused = sel.every(t => isPausedState(t.state));
      const allActive = sel.every(t => !isPausedState(t.state));
      showStart      = !allActive;
      showForceStart = !allActive;
      showPause      = !allPaused;
    }

    const seqDl    = !isMulti && torrent?.seq_dl === true;
    const seqLabel = 'Sequential Download' + (seqDl ? ' ✓' : '');

    const seedingStates = new Set(['uploading', 'forcedUP', 'stalledUP', 'pausedUP']);
    const selectedTorrents  = [...state.selected].map(h => state.torrents.get(h)).filter(t => t != null);
    const seedingTorrents   = selectedTorrents.filter(t => seedingStates.has(t.state));
    const anySeeding        = seedingTorrents.length > 0;
    const allSuperSeeding   = anySeeding && seedingTorrents.every(t => t.super_seeding);
    const noneSuperSeeding  = anySeeding && seedingTorrents.every(t => !t.super_seeding);
    const mixedSuperSeeding = anySeeding && !allSuperSeeding && !noneSuperSeeding;

    let superSeedingItems = '';
    if (anySeeding) {
      if (allSuperSeeding || mixedSuperSeeding) {
        superSeedingItems += menuItem('super-seeding-stop',  iconSuperSeeding(14), 'Stop Super Seeding');
      }
      if (noneSuperSeeding || mixedSuperSeeding) {
        superSeedingItems += menuItem('super-seeding-start', iconSuperSeeding(14), 'Start Super Seeding');
      }
    }

    return [
      showStart      ? menuItem('start',       iconPlay(14),     'Start / Resume') : '',
      showForceStart ? menuItem('force-start',  iconPlay(14),     'Force Start')    : '',
      showPause      ? menuItem('pause',        iconPause(14),    'Pause')          : '',
      SEP,
      menuItem('show-details', iconInfo(14), 'Show Details'),
      SEP,
      menuItem('verify',     iconRefreshCw(14),  'Verify Local Data'),
      menuItem('reannounce', iconWifi(14),        'Reannounce'),
      menuItem('sequential', iconListChecks(14),  seqLabel),
      superSeedingItems,
      SEP,
      queueEnabled ? menuItem('top',    iconSkipBack(14),    'Move to Top')    : '',
      queueEnabled ? menuItem('up',     iconChevronUp(14),   'Move Up')        : '',
      queueEnabled ? menuItem('down',   iconChevronDown(14), 'Move Down')      : '',
      queueEnabled ? menuItem('bottom', iconSkipForward(14), 'Move to Bottom') : '',
      queueEnabled ? SEP : '',
      menuItemSubmenu('queue-priority', iconTag(14), 'Queue Priority'),
      menuItem('seed-ratio',  iconInfo(14),        'Set Seed Ratio\u2026'),
      SEP,
      menuItem('set-location', iconFolderOpen(14), 'Set Location\u2026'),
      menuItem('rename',      iconEdit2(14),       'Rename\u2026', renameClass),
      !isMulti ? menuItem('rename-folder', iconEdit2(14), 'Rename Folder\u2026') : '',
      SEP,
      menuItem('remove',      iconTrash2(14),      'Remove Torrent'),
    ].join('');
  }

  function wireMenuEvents(menu, id, selectedIds, torrent, isMulti) {
    menu.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.context-menu__item');
      if (!itemEl) return;
      if (itemEl.classList.contains('context-menu__item--disabled')) return;

      const action = itemEl.dataset.action;
      if (action === 'queue-priority') {
        openSubmenu(itemEl, selectedIds);
        return;
      }
      handleAction(action, itemEl, id, selectedIds, torrent, isMulti);
    });

    const qpItem = menu.querySelector('[data-action="queue-priority"]');
    if (qpItem) {
      qpItem.addEventListener('mouseenter', () => openSubmenu(qpItem, selectedIds));
      qpItem.addEventListener('mouseleave', (e) => scheduleSubmenuClose(e.relatedTarget));
    }
  }

  let _submenuCloseTimer = null;

  function scheduleSubmenuClose(relatedTarget) {
    const sub = document.getElementById('context-submenu');
    if (sub && sub.contains(relatedTarget)) return;
    _submenuCloseTimer = setTimeout(closeSubmenu, 120);
  }

  function openSubmenu(parentItem, selectedIds) {
    if (_submenuCloseTimer) { clearTimeout(_submenuCloseTimer); _submenuCloseTimer = null; }

    closeSubmenu();

    const sub = document.createElement('div');
    sub.id = 'context-submenu';
    sub.className = 'context-menu';
    sub.setAttribute('role', 'menu');
    sub.innerHTML = `
    <div class="context-menu__item" role="menuitem" data-qpriority="high"   tabindex="-1">High (Force Start)</div>
    <div class="context-menu__item" role="menuitem" data-qpriority="low"    tabindex="-1">Low (Move to Bottom)</div>
  `;

    sub.addEventListener('mouseenter', () => {
      if (_submenuCloseTimer) { clearTimeout(_submenuCloseTimer); _submenuCloseTimer = null; }
    });
    sub.addEventListener('mouseleave', (e) => scheduleSubmenuClose(e.relatedTarget));

    sub.addEventListener('click', (e) => {
      const el = e.target.closest('[data-qpriority]');
      if (!el) return;
      const qp = el.dataset.qpriority;
      if (qp === 'high') {
        runAction(async () => {
          await torrentSetForceStart(selectedIds, true);
          await torrentResume(selectedIds);
        });
      } else if (qp === 'low') {
        runAction(() => queueMoveBottom(selectedIds));
      }
    });

    document.body.appendChild(sub);

    const rect = parentItem.getBoundingClientRect();
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    const sw   = sub.offsetWidth;
    const sh   = sub.offsetHeight;

    let left = rect.right + 2;
    let top  = rect.top;
    if (left + sw > vw) left = rect.left - sw - 2;
    if (top  + sh > vh) top  = vh - sh - 4;

    sub.style.left = left + 'px';
    sub.style.top  = top  + 'px';
  }

  function handleAction(action, itemEl, id, selectedIds, torrent, isMulti) {
    switch (action) {
      case 'start':
        selectedIds.forEach(hash => {
          const t = state.torrents.get(hash);
          if (t) applyTorrentDelta({ [hash]: { state: 'downloading' } });
        });
        runAction(() => torrentResume(selectedIds));
        break;
      case 'pause':
        selectedIds.forEach(hash => {
          const t = state.torrents.get(hash);
          if (t) applyTorrentDelta({ [hash]: { state: 'pausedDL', dlspeed: 0, upspeed: 0 } });
        });
        runAction(() => torrentPause(selectedIds));
        break;
      case 'force-start':
        selectedIds.forEach(hash => {
          const t = state.torrents.get(hash);
          if (t) applyTorrentDelta({ [hash]: { state: 'forcedDL', force_start: true } });
        });
        runAction(async () => {
          await torrentSetForceStart(selectedIds, true);
          await torrentResume(selectedIds);
        });
        break;
      case 'sequential':
        runAction(() => api('/torrents/toggleSequentialDownload', { body: 'hashes=' + selectedIds.join('|') }));
        break;
      case 'super-seeding-start':
        runAction(() => torrentSetSuperSeeding(selectedIds, true));
        break;
      case 'super-seeding-stop':
        runAction(() => torrentSetSuperSeeding(selectedIds, false));
        break;
      case 'rename-folder':
        if (!isMulti) {
          closeMenu();
          document.dispatchEvent(new CustomEvent('modal:rename-folder', {
            detail: { id, torrent },
          }));
        }
        break;
      case 'verify':
        runAction(() => torrentRecheck(selectedIds));
        break;
      case 'reannounce':
        runAction(() => torrentReannounce(selectedIds));
        break;
      case 'top':
        runAction(() => queueMoveTop(selectedIds));
        break;
      case 'up':
        runAction(() => queueMoveUp(selectedIds));
        break;
      case 'down':
        runAction(() => queueMoveDown(selectedIds));
        break;
      case 'bottom':
        runAction(() => queueMoveBottom(selectedIds));
        break;
      case 'seed-ratio':
        closeMenu();
        document.dispatchEvent(new CustomEvent('modal:seed-ratio', {
          detail: { ids: selectedIds, torrent },
        }));
        break;
      case 'set-location':
        closeMenu();
        document.dispatchEvent(new CustomEvent('modal:set-location', {
          detail: { ids: selectedIds, torrent },
        }));
        break;
      case 'rename':
        if (!isMulti) {
          closeMenu();
          document.dispatchEvent(new CustomEvent('modal:rename', {
            detail: { id, torrent },
          }));
        }
        break;
      case 'remove':
        closeMenu();
        document.dispatchEvent(new CustomEvent('modal:remove', {
          detail: { ids: selectedIds, deleteData: false },
        }));
        break;
      case 'show-details':
        closeMenu();
        setSelected(new Set([id]));
        {
          const inspEl = document.getElementById('inspector');
          const isOpen = inspEl && inspEl.classList.contains('inspector--open');
          if (isOpen && state.inspectorId === id) {
            setInspector(null);
          } else {
            setInspector(id);
          }
        }
        break;
    }
  }

  // ── inspector.js ───────────────────────────────────────────────────────────

  let activeTab      = 'general';
  let selectedFiles  = new Set();

  let inspectorPeerRid  = 0;
  let inspectorInterval = null;
  let inspectorFiles    = [];
  let inspectorPeers    = {};
  let inspectorTrackers = [];

  // esc() is already defined in the row.js section above

  function renderStateBadge(t) {
    const mod = torrentStateClass(t).replace('state-', '');
    return `<span class="state-badge state-badge--${mod}">${torrentStateLabel(t)}</span>`;
  }

  function renderSpeedLimits(t) {
    // dl_limit: -1=global, 0=unlimited, >0=bytes/s
    const dlEnabled = (t.dl_limit ?? -1) > 0;
    const dlMbps    = dlEnabled ? bpsToMbps(t.dl_limit) : '';
    const ulEnabled = (t.up_limit ?? -1) > 0;
    const ulMbps    = ulEnabled ? bpsToMbps(t.up_limit) : '';
    return `
    <div class="inspector-section-title">Speed limits</div>
    <div class="inspector-setting-row">
      <label>
        <input type="checkbox" id="insp-dl-limited"${dlEnabled ? ' checked' : ''}>
        Download limit
      </label>
      <input type="number" id="insp-dl-limit" class="input settings-input"
             value="${dlMbps}"${!dlEnabled ? ' disabled' : ''}> Mbps
    </div>
    <div class="inspector-setting-row">
      <label>
        <input type="checkbox" id="insp-ul-limited"${ulEnabled ? ' checked' : ''}>
        Upload limit
      </label>
      <input type="number" id="insp-ul-limit" class="input settings-input"
             value="${ulMbps}"${!ulEnabled ? ' disabled' : ''}> Mbps
    </div>`;
  }

  function renderSeedLimits(t) {
    // ratio_limit: -1=global, -2=no limit, >=0=specific
    const ratioLimit = t.ratio_limit ?? -1;
    let mode;
    if (ratioLimit === -2)     mode = 'forever';
    else if (ratioLimit >= 0)  mode = 'specific';
    else                       mode = 'global';
    const ratioVal = ratioLimit >= 0 ? ratioLimit.toFixed(2) : '2.00';
    return `
    <div class="inspector-section-title">Seeding</div>
    <div class="inspector-setting-row">
      <label for="insp-ratio-mode">Ratio limit</label>
      <select id="insp-ratio-mode" class="insp-select">
        <option value="global"${mode === 'global' ? ' selected' : ''}>Use global setting</option>
        <option value="specific"${mode === 'specific' ? ' selected' : ''}>Stop seeding at ratio</option>
        <option value="forever"${mode === 'forever' ? ' selected' : ''}>Seed forever</option>
      </select>
      <input type="text" inputmode="decimal" id="insp-ratio-limit" class="input settings-input insp-ratio-input"
             value="${ratioVal}"${mode !== 'specific' ? ' disabled' : ''}>
    </div>`;
  }

  function wireGeneralControls(t) {
    const dlLimited = document.getElementById('insp-dl-limited');
    const dlLimit   = document.getElementById('insp-dl-limit');
    const ulLimited = document.getElementById('insp-ul-limited');
    const ulLimit   = document.getElementById('insp-ul-limit');
    const rMode     = document.getElementById('insp-ratio-mode');
    const rLimit    = document.getElementById('insp-ratio-limit');

    dlLimited?.addEventListener('change', () => {
      dlLimit.disabled = !dlLimited.checked;
      const bytes = dlLimited.checked ? mbpsToBps(Number(dlLimit.value) || 0) : 0;
      torrentSetDownloadLimit([t.hash], bytes);
    });

    dlLimit?.addEventListener('change', () => {
      const bytes = mbpsToBps(Number(dlLimit.value));
      if (dlLimited?.checked && bytes > 0) torrentSetDownloadLimit([t.hash], bytes);
    });

    ulLimited?.addEventListener('change', () => {
      ulLimit.disabled = !ulLimited.checked;
      const bytes = ulLimited.checked ? mbpsToBps(Number(ulLimit.value) || 0) : 0;
      torrentSetUploadLimit([t.hash], bytes);
    });

    ulLimit?.addEventListener('change', () => {
      const bytes = mbpsToBps(Number(ulLimit.value));
      if (ulLimited?.checked && bytes > 0) torrentSetUploadLimit([t.hash], bytes);
    });

    rMode?.addEventListener('change', () => {
      const mode = rMode.value;
      if (rLimit) rLimit.disabled = mode !== 'specific';
      if (mode === 'global')   torrentSetShareLimits([t.hash], -1, -1);
      else if (mode === 'forever') torrentSetShareLimits([t.hash], -2, -1);
    });

    rLimit?.addEventListener('change', () => {
      if (rMode?.value !== 'specific') return;
      const val = parseFloat(rLimit.value);
      if (isNaN(val) || val < 0) {
        rLimit.value = (t.ratio_limit >= 0 ? t.ratio_limit : 2).toFixed(2);
        return;
      }
      torrentSetShareLimits([t.hash], val, -1);
    });
  }

  function renderGeneral(t) {
    const props = t._props || {};

    const connected = (t.num_leechs ?? 0) + (t.num_seeds ?? 0);
    const peersText = connected === 0
      ? 'None'
      : `${connected} connected (${t.num_seeds ?? 0} seeds, ${t.num_leechs ?? 0} leeches)`;

    const piecesText = props.pieces_have != null
      ? `${props.pieces_have} / ${props.pieces_num} (${formatSize(props.piece_size ?? 0)} each)`
      : '—';

    const connectionsText = props.nb_connections != null
      ? `${props.nb_connections} (max: ${props.nb_connections_limit})`
      : '—';

    const rows = [
      ['Name',           t.name || '—'],
      ['State',          renderStateBadge(t)],
      ['Size',           formatSize(t.total_size ?? t.size ?? 0)],
      ['Progress',       formatPercent(t.progress ?? 0)],
      ['Downloaded',     formatSize(props.total_downloaded ?? t.downloaded ?? 0)],
      ['Uploaded',       formatSize(props.total_uploaded ?? t.uploaded ?? 0)],
      ['Ratio',          formatRatio(t.ratio ?? 0)],
      ['Download speed', formatSpeed(t.dlspeed ?? 0)],
      ['Upload speed',   formatSpeed(t.upspeed ?? 0)],
      ['ETA',            formatETA(t.eta ?? -1)],
      ['Location',       `<span class="info-value--mono">${esc(t.content_path || t.save_path || '—')}</span>`],
      ['Added',          (t.added_on && t.added_on > 946684800) ? formatDate(t.added_on) : '—'],
      ['Completed',      (t.completion_on && t.completion_on > 946684800) ? formatDate(t.completion_on) : '—'],
      ['Hash',           `<span class="info-value--mono">${esc(t.hash || '—')}</span>`],
      ['Availability',   (t.availability != null && t.availability >= 0)
        ? formatPercent(t.availability)
        : (t.availability === -1 ? '100%' : '—')],
      ['Pieces',         piecesText],
      ['Wasted',         props.total_wasted != null ? formatSize(props.total_wasted) : '—'],
      ['Active time',    props.time_elapsed != null ? formatDuration(props.time_elapsed) : '—'],
      ['Seeding time',   (props.seeding_time ?? t.seeding_time) != null ? formatDuration(props.seeding_time ?? t.seeding_time) : '—'],
      ['Connections',    connectionsText],
      ['Peers',          peersText],
      ['Tracker',        esc(t.tracker || '—')],
    ];

    let html = rows.map(([label, value]) =>
      `<div class="info-row">
       <span class="info-label">${label}</span>
       <span class="info-value">${value}</span>
     </div>`
    ).join('');

    if (t.magnet_uri) {
      html += `<div class="info-row">
      <span class="info-label">Magnet</span>
      <span class="info-value">
        <button class="btn-ghost btn--sm" id="btn-copy-magnet" aria-label="Copy magnet link">
          ${iconCopy(14)} Copy link
        </button>
      </span>
    </div>`;
    }

    html += renderSpeedLimits(t);
    html += renderSeedLimits(t);

    document.getElementById('tab-general').innerHTML = html;

    const copyBtn = document.getElementById('btn-copy-magnet');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(t.magnet_uri).then(() => {
          copyBtn.innerHTML = `${iconCopy(14)} Copied!`;
          setTimeout(() => { copyBtn.innerHTML = `${iconCopy(14)} Copy link`; }, 1500);
        }).catch(() => {});
      });
    }

    wireGeneralControls(t);
  }

  function updateFileRowSelection(fileList) {
    if (!fileList) return;
    fileList.querySelectorAll('.file-row').forEach(row => {
      const idx = Number(row.dataset.index);
      row.classList.toggle('file-row--selected', selectedFiles.has(idx));
    });
  }

  function wireFileControls(t) {
    const panel = document.getElementById('tab-files');
    if (!panel) return;

    const searchInput = document.getElementById('file-search-input');
    const searchClear = document.getElementById('file-search-clear');
    const fileList    = panel.querySelector('.file-list');

    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase().replace(/\./g, ' ');
      fileList?.querySelectorAll('.file-row').forEach(row => {
        const nameEl = row.querySelector('.file-name');
        const name   = (nameEl?.textContent || '').toLowerCase().replace(/\./g, ' ');
        row.style.display = name.includes(q) ? '' : 'none';
      });
      if (searchClear) searchClear.hidden = !searchInput.value;
    });

    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.hidden = true;
      fileList?.querySelectorAll('.file-row').forEach(row => {
        row.style.display = '';
      });
      searchInput?.focus();
    });

    let lastClickedFileIndex = null;

    fileList?.addEventListener('click', (e) => {
      const row = e.target.closest('.file-row');
      if (!row) return;
      if (e.target.closest('.file-priority')) return;

      const idx = Number(row.dataset.index);

      if (e.shiftKey && lastClickedFileIndex !== null) {
        const allRows = [...fileList.querySelectorAll('.file-row:not([style*="display: none"])')];
        const idxList = allRows.map(r => Number(r.dataset.index));
        const a = idxList.indexOf(lastClickedFileIndex);
        const b = idxList.indexOf(idx);
        const [lo, hi] = a < b ? [a, b] : [b, a];
        for (let i = lo; i <= hi; i++) {
          selectedFiles.add(idxList[i]);
        }
      } else if (e.metaKey || e.ctrlKey) {
        if (selectedFiles.has(idx)) {
          selectedFiles.delete(idx);
        } else {
          selectedFiles.add(idx);
        }
      } else {
        selectedFiles.clear();
        selectedFiles.add(idx);
      }

      lastClickedFileIndex = idx;
      updateFileRowSelection(fileList);
    });

    panel.querySelectorAll('.file-priority').forEach(sel => {
      sel.addEventListener('change', async () => {
        const idx = Number(sel.dataset.index);
        const val = Number(sel.value);

        const applyTo = selectedFiles.size > 1 && selectedFiles.has(idx)
          ? [...selectedFiles]
          : [idx];

        try {
          await torrentFilePriority(state.inspectorId, applyTo, val);
          inspectorFiles = await getTorrentFiles(state.inspectorId);
          renderActiveTab();
        } catch (err) {
          showToast('Failed to update priority: ' + err.message, 'error');
        }
      });
    });
  }

  function renderFiles(files) {
    selectedFiles = new Set();
    const panel = document.getElementById('tab-files');

    if (!files || files.length === 0) {
      panel.innerHTML = '<p class="inspector-empty">No files.</p>';
      return;
    }

    const rows = files.map((file, i) => {
      const idx      = file.index ?? i;
      const pct      = formatPercent(Math.min(1, file.progress ?? 0));
      const priority = file.priority ?? 1;
      const wanted   = priority !== 0;

      return `<div class="file-row" data-index="${idx}">
      <div class="file-row__name">
        <span class="file-name" title="${esc(file.name)}">${esc(file.name.split('/').pop())}</span>
      </div>
      <div class="file-row__meta">
        <span class="file-size row-data">${formatSize(file.size)}</span>
        <span class="file-pct row-data">${pct}</span>
        <label class="file-priority-label">Priority
          <select class="priority-select file-priority" data-index="${idx}">
            <option value="7"${priority === 7  && wanted ? ' selected' : ''}>Maximum</option>
            <option value="6"${priority === 6  && wanted ? ' selected' : ''}>High</option>
            <option value="1"${priority === 1  && wanted ? ' selected' : ''}>Normal</option>
            <option value="0"${!wanted ? ' selected' : ''}>Skip</option>
          </select>
        </label>
      </div>
    </div>`;
    }).join('');

    const searchBar = `<div class="file-search-bar">
  <div class="search-wrap">
    ${iconSearch(14)}
    <input type="search" id="file-search-input" class="search-input"
           placeholder="Search files…" autocomplete="off" spellcheck="false"
           aria-label="Search files by name">
    <button class="btn-ghost icon-btn search-clear" id="file-search-clear"
            aria-label="Clear file search" hidden>${iconX(16)}</button>
  </div>
</div>`;

    panel.innerHTML = searchBar + `<div class="file-list">${rows}</div>`;
    wireFileControls(null);
  }

  function decodePeerFlags(flagStr) {
    const map = {
      'D': 'Downloading from this peer',
      'd': 'Peer wants to download from you',
      'E': 'Encrypted connection',
      'H': 'Peer found via DHT',
      'h': 'Peer connected via uTP',
      'I': 'Incoming connection',
      'K': 'Peer unchoked but not interested',
      'O': 'Optimistic unchoke',
      'T': 'Peer found via PEX',
      'U': 'Uploading to this peer',
      'u': 'Peer wants us to upload to them',
      'X': 'Peer from peer exchange',
    };
    const parts = (flagStr || '').split('').map(f => map[f]).filter(Boolean);
    return { tooltip: parts.length ? parts.join(' · ') : 'No active flags' };
  }

  function renderPeers() {
    const peers = Object.values(inspectorPeers);
    if (peers.length === 0) {
      document.getElementById('tab-peers').innerHTML =
        '<p class="inspector-empty">No peers connected.</p>';
      return;
    }

    const rows = peers.map(peer => {
      const dlSpeed = peer.dl_speed ? formatSpeed(peer.dl_speed) : '—';
      const upSpeed = peer.up_speed ? formatSpeed(peer.up_speed) : '—';
      const pct     = formatPercent(peer.progress ?? 0);

      return `<div class="peer-row">
      <div class="peer-row__main">
        <span class="peer-addr row-data">${esc(peer.ip)}:${peer.port}</span>
        <span class="peer-client">${esc(peer.client || 'Unknown')}</span>
        <span class="peer-flags" title="${esc(peer.flags_desc || '')}">${esc(peer.flags || '')}</span>
        ${peer.country_code ? `<span class="peer-country">${esc(peer.country_code)}</span>` : ''}
      </div>
      <div class="peer-row__stats">
        <span class="peer-stat">↓ ${dlSpeed}</span>
        <span class="peer-stat">↑ ${upSpeed}</span>
        <span class="peer-stat">${pct} have</span>
      </div>
    </div>`;
    }).join('');

    document.getElementById('tab-peers').innerHTML = rows;
  }

  function renderTrackers() {
    if (!inspectorTrackers || inspectorTrackers.length === 0) {
      document.getElementById('tab-trackers').innerHTML =
        '<p class="inspector-empty">No trackers.</p>';
      return;
    }

    const STATUS_LABELS = {
      0: 'Disabled',
      1: 'Not contacted',
      2: 'Working',
      3: 'Updating',
      4: 'Error',
    };

    let html = `<div class="tracker-actions">
    <button class="btn-secondary btn--sm" id="btn-reannounce-all">
      ${iconRefreshCcw(14)} Reannounce all
    </button>
  </div>`;

    html += inspectorTrackers.map(tracker => {
      const isSpecial   = tracker.url.startsWith('**');
      const statusLabel = STATUS_LABELS[tracker.status] ?? 'Unknown';
      const statusClass = tracker.status === 2 ? 'tracker-ok' :
                          tracker.status === 4 ? 'tracker-error' : 'tracker-neutral';
      return `<div class="tracker-row${isSpecial ? ' tracker-row--special' : ''}">
      <div class="tracker-url row-data">${esc(tracker.url)}</div>
      <div class="tracker-meta">
        <span class="tracker-status ${statusClass}">${statusLabel}</span>
        ${tracker.num_peers ? `<span class="tracker-stat">${tracker.num_peers} peers</span>` : ''}
        ${tracker.msg ? `<span class="tracker-msg">${esc(tracker.msg)}</span>` : ''}
      </div>
    </div>`;
    }).join('');

    document.getElementById('tab-trackers').innerHTML = html;

    document.getElementById('btn-reannounce-all')?.addEventListener('click', async () => {
      if (state.inspectorId) await torrentReannounce([state.inspectorId]);
    });
  }

  function renderTab(tab) {
    if (state.inspectorId === null) return;
    const t = state.torrents.get(state.inspectorId);
    if (!t) return;
    switch (tab) {
      case 'general':  renderGeneral(t);       break;
      case 'files':    renderFiles(inspectorFiles); break;
      case 'peers':    renderPeers();          break;
      case 'trackers': renderTrackers();       break;
    }
  }

  function renderActiveTab() {
    renderTab(activeTab);
  }

  function setActiveTab(tab) {
    activeTab = tab;

    document.querySelectorAll('.inspector-tab').forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('inspector-tab--active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    document.querySelectorAll('.inspector-panel').forEach(p => {
      p.classList.add('inspector-panel--hidden');
    });
    document.getElementById(`tab-${tab}`)?.classList.remove('inspector-panel--hidden');

    renderTab(tab);
  }

  function mountInspector() {
    const inspector = document.getElementById('inspector');
    const titleEl   = document.getElementById('inspector-title');

    document.getElementById('btn-inspector-close').addEventListener('click', () => {
      setInspector(null);
    });

    document.querySelectorAll('.inspector-tab').forEach(btn => {
      btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
    });

    on('ui:inspector', async hash => {
      // Clear any running interval first
      if (inspectorInterval) {
        clearInterval(inspectorInterval);
        inspectorInterval = null;
      }

      if (!hash) {
        inspector.classList.add('inspector--closed');
        inspector.classList.remove('inspector--open');
        inspector.setAttribute('aria-hidden', 'true');
        inspectorPeerRid  = 0;
        inspectorFiles    = [];
        inspectorPeers    = {};
        inspectorTrackers = [];
        return;
      }

      if (state.settingsOpen) setSettingsOpen(false);
      const addP = document.getElementById('add-panel');
      if (addP && addP.classList.contains('add-panel--open')) {
        closeAddPanel();
      }

      inspector.classList.add('inspector--open');
      inspector.classList.remove('inspector--closed');
      inspector.setAttribute('aria-hidden', 'false');

      const torrent = state.torrents.get(hash);
      if (!torrent) return;

      titleEl.textContent = torrent.name || '—';

      const activePanel = document.getElementById(`tab-${activeTab}`);
      if (activePanel) {
        activePanel.innerHTML = '<p class="inspector-empty">Loading…</p>';
      }

      inspectorPeerRid  = 0;
      inspectorFiles    = [];
      inspectorPeers    = {};
      inspectorTrackers = [];

      const [propsResult, filesResult, peersResult, trackersResult] = await Promise.allSettled([
        getTorrentProperties(hash),
        getTorrentFiles(hash),
        getTorrentPeers(hash, 0),
        getTorrentTrackers(hash),
      ]);

      if (filesResult.status === 'fulfilled') {
        inspectorFiles = filesResult.value;
      }
      if (peersResult.status === 'fulfilled') {
        inspectorPeerRid = peersResult.value.rid ?? 0;
        inspectorPeers   = peersResult.value.peers ?? {};
      }
      if (trackersResult.status === 'fulfilled') {
        inspectorTrackers = trackersResult.value;
      }
      if (propsResult.status === 'fulfilled') {
        const t = state.torrents.get(hash);
        if (t) state.torrents.set(hash, { ...t, ...propsResult.value, _props: propsResult.value });
      }

      if (state.inspectorId === hash) {
        setActiveTab(activeTab);
      }

      inspectorInterval = setInterval(async () => {
        if (!state.inspectorId) return;
        const h = state.inspectorId;
        try {
          const peersData = await getTorrentPeers(h, inspectorPeerRid);
          inspectorPeerRid = peersData.rid ?? inspectorPeerRid;
          if (peersData.full_update) {
            inspectorPeers = peersData.peers ?? {};
          } else {
            Object.assign(inspectorPeers, peersData.peers ?? {});
            for (const key of (peersData.peers_removed ?? [])) {
              delete inspectorPeers[key];
            }
          }
          const filesData    = await getTorrentFiles(h);
          inspectorFiles     = filesData;
          const trackersData = await getTorrentTrackers(h);
          inspectorTrackers  = trackersData;
        } catch (_) {
          // silent — inspector shows slightly stale data
        }
        if (state.inspectorId === h) {
          renderActiveTab();
        }
      }, 3000);
    });

    on('torrents:changed', () => {
      if (state.inspectorId === null) return;
      const t = state.torrents.get(state.inspectorId);
      if (!t) return;
      titleEl.textContent = t.name || '—';
      if (activeTab === 'general' && !t._props) return;
      renderTab(activeTab);
    });
  }

  // ── modals.js ──────────────────────────────────────────────────────────────

  function showToast(message, type) {
    if (type === undefined) type = 'info';
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const iconMap = {
      success: iconCheck(16),
      error:   iconAlertCircle(16),
      info:    iconInfo(16),
    };

    toast.innerHTML =
      `<span class="toast-icon">${iconMap[type] ?? ''}</span>` +
      `<span class="toast__message">${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 220ms';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 220);
    }, 4000);
  }

  let selectedFile = null;
  let selectedFileBase64 = null;

  function updateAddButton() {
    const btn = document.getElementById('btn-add-confirm');
    if (!btn) return;
    const hasFile   = !!selectedFile;
    const hasMagnet = document.getElementById('magnet-input')?.value.trim().length > 0;
    btn.disabled = !hasFile && !hasMagnet;
  }

  function resetAddModal() {
    selectedFile = null;
    selectedFileBase64 = null;
    document.getElementById('magnet-input').value = '';
    const fileInput = document.getElementById('torrent-file-input');
    if (fileInput) fileInput.value = '';
    const filenameEl = document.getElementById('dropzone-filename');
    if (filenameEl) { filenameEl.hidden = true; filenameEl.textContent = ''; }
    document.getElementById('torrent-dropzone')?.classList.remove('has-file');
    const btn = document.getElementById('btn-add-confirm');
    if (btn) { btn.disabled = true; btn.textContent = 'Add'; }
  }

  function openAddModal() {
    if (state.settingsOpen) setSettingsOpen(false);
    if (state.inspectorId !== null) setInspector(null);
    const panel = document.getElementById('add-panel');
    if (!panel) return;
    document.getElementById('add-download-dir').value =
      state.prefs?.save_path || '';
    const startCb = document.getElementById('add-start-when-added');
    if (startCb) startCb.checked = !(state.prefs?.start_paused_enabled ?? false);
    panel.classList.add('add-panel--open');
    panel.classList.remove('add-panel--closed');
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeAllPanels() {
    if (state.settingsOpen) setSettingsOpen(false);
    const addPanel = document.getElementById('add-panel');
    if (addPanel && addPanel.classList.contains('add-panel--open')) {
      addPanel.classList.remove('add-panel--open');
      addPanel.classList.add('add-panel--closed');
      addPanel.setAttribute('aria-hidden', 'true');
    }
  }

  function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      selectedFileBase64 = reader.result.split(',')[1];
      const filenameEl = document.getElementById('dropzone-filename');
      filenameEl.textContent = file.name;
      filenameEl.hidden = false;
      updateAddButton();
    };
    reader.readAsDataURL(file);
  }

  function closeAddPanel() {
    const panel = document.getElementById('add-panel');
    if (!panel) return;
    panel.classList.remove('add-panel--open');
    panel.classList.add('add-panel--closed');
    panel.setAttribute('aria-hidden', 'true');
    resetAddModal();
  }

  function mountAddModal() {
    document.getElementById('magnet-input').addEventListener('input', updateAddButton);

    const dropzone  = document.getElementById('torrent-dropzone');
    const fileInput = document.getElementById('torrent-file-input');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) handleFile(fileInput.files[0]);
    });

    dropzone.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.classList.add('is-over');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-over');
    });
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('is-over');
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.torrent')) {
        handleFile(file);
      }
    });

    document.getElementById('btn-add-confirm').addEventListener('click', async () => {
      const dir = document.getElementById('add-download-dir')?.value.trim() || '';
      const btn = document.getElementById('btn-add-confirm');

      btn.disabled = true;
      btn.innerHTML = iconLoader(16, 'icon--spinning') + ' Adding…';

      try {
        const startWhenAdded = document.getElementById('add-start-when-added')?.checked ?? true;
        if (selectedFile) {
          await torrentAdd({ torrentFile: selectedFile, savepath: dir, paused: !startWhenAdded });
        } else {
          const magnet = document.getElementById('magnet-input')?.value.trim() || '';
          if (!magnet) return;
          await torrentAdd({ urls: magnet, savepath: dir, paused: !startWhenAdded });
        }
        closeAddPanel();
        showToast('Torrent added', 'success');
        await forceRefresh();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Add';
        showToast('Failed to add torrent: ' + err.message, 'error');
      }
    });

    document.getElementById('btn-add-cancel')?.addEventListener('click', closeAddPanel);
    document.getElementById('btn-add-close')?.addEventListener('click', closeAddPanel);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const panel = document.getElementById('add-panel');
        if (panel && panel.classList.contains('add-panel--open')) closeAddPanel();
      }
    });
  }

  let pendingRemoveIds = [];

  function openRemoveModal(ids) {
    const count = ids.length;
    const name  = state.torrents.get(ids[0])?.name || 'this torrent';
    const desc  = count === 1
      ? `Remove "${name}"?`
      : `Remove ${count} torrents?`;

    let savedDelete = false;
    try {
      const stored = localStorage.getItem('tx-remove-delete-data');
      if (stored !== null) savedDelete = stored === 'true';
    } catch (_) {}

    document.getElementById('modal-remove-desc').textContent = desc;
    document.getElementById('remove-delete-data').checked = savedDelete;
    pendingRemoveIds = ids;

    document.getElementById('modal-remove-confirm').showModal();
  }

  function mountRemoveModal() {
    document.addEventListener('modal:remove', e => {
      const { ids, deleteData } = e.detail;
      openRemoveModal(ids, deleteData);
    });

    document.getElementById('btn-remove-confirm').addEventListener('click', async () => {
      const deleteData = document.getElementById('remove-delete-data').checked;
      const ids = pendingRemoveIds.slice();
      try {
        localStorage.setItem('tx-remove-delete-data', String(deleteData));
      } catch (_) {}
      document.getElementById('modal-remove-confirm').close();

      try {
        await torrentDelete(ids, deleteData);

        if (ids.includes(state.inspectorId)) setInspector(null);
        setSelected(new Set());

        await forceRefresh();
        showToast(
          `Removed ${ids.length} torrent${ids.length > 1 ? 's' : ''}`,
          'success',
        );
      } catch (err) {
        showToast('Failed to remove: ' + err.message, 'error');
      }
    });

    document.querySelectorAll('#modal-remove-confirm .modal-cancel')
      .forEach(btn => btn.addEventListener('click', () => {
        document.getElementById('modal-remove-confirm').close();
      }));
  }

  function mountSetLocationModal() {
    const modal  = document.getElementById('modal-set-location');
    const pathEl = document.getElementById('set-location-path');

    document.addEventListener('modal:set-location', e => {
      const { ids, torrent } = e.detail;
      pathEl.value = torrent?.save_path ?? '';
      modal._pendingIds = ids;
      modal.showModal();
    });

    document.getElementById('set-location-cancel').addEventListener('click', () => {
      modal.close();
    });

    document.getElementById('set-location-confirm').addEventListener('click', async () => {
      const path = pathEl.value.trim();
      if (!path) return;
      const hashes = modal._pendingIds;
      modal.close();
      try {
        await torrentSetLocation(hashes, path);
        await forceRefresh();
      } catch (err) {
        showToast('Failed to set location: ' + err.message, 'error');
      }
    });
  }

  function mountRenameModal() {
    const modal   = document.getElementById('modal-rename');
    const inputEl = document.getElementById('rename-input');

    function openModal(id, torrent, isFolder, oldFolderPath) {
      inputEl.value = isFolder ? (oldFolderPath?.split('/').pop() ?? '') : (torrent?.name ?? '');
      modal._pendingId      = id;
      modal._pendingTorrent = torrent;
      modal._folderRename   = isFolder ? { oldPath: oldFolderPath } : null;
      document.getElementById('modal-rename-title').textContent = isFolder ? 'Rename Folder' : 'Rename';
      modal.showModal();
      inputEl.select();
    }

    document.addEventListener('modal:rename', e => {
      const { id, torrent } = e.detail;
      openModal(id, torrent, false, null);
    });

    document.addEventListener('modal:rename-folder', e => {
      const { id, torrent } = e.detail;
      const savePath = torrent?.save_path ?? '';
      const folderPath = savePath.replace(/\/$/, '');
      openModal(id, torrent, true, folderPath);
    });

    document.getElementById('rename-cancel').addEventListener('click', () => {
      modal.close();
    });

    document.getElementById('rename-confirm').addEventListener('click', async () => {
      const newName = inputEl.value.trim();
      if (!newName) return;
      const hash = modal._pendingId;
      const fr = modal._folderRename;
      modal.close();
      try {
        if (fr) {
          const parent = fr.oldPath.substring(0, fr.oldPath.lastIndexOf('/') + 1);
          await torrentRenameFolder(hash, fr.oldPath, parent + newName);
        } else {
          await torrentRename(hash, newName);
        }
        await forceRefresh();
      } catch (err) {
        showToast('Failed to rename: ' + err.message, 'error');
      }
    });
  }

  function mountSeedRatioModal() {
    const modal    = document.getElementById('modal-seed-ratio');
    const modeEl   = document.getElementById('seed-ratio-mode');
    const inputEl  = document.getElementById('seed-ratio-input');
    function updateLimitRowVisibility() {
      if (inputEl) inputEl.style.display = modeEl.value === 'specific' ? 'block' : 'none';
    }

    function updateSeedRatioHints() {
      const ratioHint = document.getElementById('seed-ratio-global-hint');
      const timeHint  = document.getElementById('seed-time-global-hint');
      const ratioMode = document.getElementById('seed-ratio-mode')?.value;
      const timeMode  = document.getElementById('seed-time-mode')?.value;

      if (ratioHint) {
        if (ratioMode === 'global') {
          const globalRatio   = state.prefs?.max_ratio ?? null;
          const globalEnabled = state.prefs?.max_ratio_enabled ?? false;
          if (!globalEnabled || globalRatio === null) {
            ratioHint.textContent = '(global: no limit)';
          } else {
            ratioHint.textContent = `(global: ${Number(globalRatio).toFixed(2)})`;
          }
        } else {
          ratioHint.textContent = '';
        }
      }

      if (timeHint) {
        if (timeMode === '-1') {
          const globalMins    = state.prefs?.max_seeding_time ?? null;
          const globalEnabled = state.prefs?.max_seeding_time_enabled ?? false;
          if (!globalEnabled || globalMins === null || globalMins < 0) {
            timeHint.textContent = '(global: no limit)';
          } else {
            const h = Math.floor(globalMins / 60);
            const m = globalMins % 60;
            const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
            timeHint.textContent = `(global: ${label})`;
          }
        } else {
          timeHint.textContent = '';
        }
      }
    }

    document.addEventListener('modal:seed-ratio', e => {
      const { ids, torrent } = e.detail;

      const ratioLimit = torrent?.ratio_limit ?? -1;
      let mode = 'global';
      if (ratioLimit === -2) mode = 'forever';
      else if (ratioLimit >= 0) mode = 'specific';

      if (modeEl)  modeEl.value  = mode;
      if (inputEl) inputEl.value = ratioLimit >= 0 ? ratioLimit.toFixed(2) : '2.00';
      updateLimitRowVisibility();

      const seedingTimeLimit = torrent?.seeding_time_limit ?? -1;
      const timeModeElNow = document.getElementById('seed-time-mode');
      const timeInputElNow = document.getElementById('seed-time-input');
      if (timeModeElNow) {
        if (seedingTimeLimit === -2) {
          timeModeElNow.value = '-2';
        } else if (seedingTimeLimit >= 0) {
          timeModeElNow.value = 'custom';
          if (timeInputElNow) timeInputElNow.value = seedingTimeLimit;
        } else {
          timeModeElNow.value = '-1';
        }
        if (timeInputElNow) timeInputElNow.style.display = timeModeElNow.value === 'custom' ? 'block' : 'none';
      }

      modal._pendingIds = ids;
      modal.showModal();
      updateSeedRatioHints();
      if (mode === 'specific') {
        setTimeout(() => { inputEl?.select(); }, 50);
      }
    });

    modeEl?.addEventListener('change', () => {
      updateLimitRowVisibility();
      updateSeedRatioHints();
    });

    document.getElementById('seed-ratio-cancel')?.addEventListener('click', () => {
      modal.close();
    });

    const timeInputEl  = document.getElementById('seed-time-input');
    const timeModeEl   = document.getElementById('seed-time-mode');
    function updateTimeLimitRowVisibility() {
      if (timeInputEl) timeInputEl.style.display = timeModeEl?.value === 'custom' ? 'block' : 'none';
    }
    timeModeEl?.addEventListener('change', () => {
      updateTimeLimitRowVisibility();
      updateSeedRatioHints();
    });

    document.getElementById('seed-ratio-confirm')?.addEventListener('click', async () => {
      const mode   = modeEl.value;
      const hashes = modal._pendingIds.slice();
      modal.close();

      let ratioLimit;
      if (mode === 'global') {
        ratioLimit = -1;
      } else if (mode === 'forever') {
        ratioLimit = -2;
      } else {
        const val   = inputEl.value.trim();
        const ratio = parseFloat(val);
        if (isNaN(ratio) || ratio < 0) {
          showToast('Invalid ratio value', 'error');
          return;
        }
        ratioLimit = ratio;
      }

      let seedingTimeLimit = -1;
      const timeMode = timeModeEl?.value ?? '-1';
      if (timeMode === '-2') {
        seedingTimeLimit = -2;
      } else if (timeMode === 'custom') {
        const mins = parseInt(timeInputEl?.value ?? '', 10);
        if (!isNaN(mins) && mins >= 0) seedingTimeLimit = mins;
      }

      try {
        await torrentSetShareLimits(hashes, ratioLimit, seedingTimeLimit);
        await forceRefresh();
        const count = hashes.length;
        showToast(
          count === 1 ? 'Seed limits updated' : `Seed limits updated for ${count} torrents`,
          'success'
        );
      } catch (err) {
        showToast('Failed to set limits: ' + err.message, 'error');
      }
    });

    inputEl?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('seed-ratio-confirm')?.click();
      }
    });
  }

  function mountModals() {
    mountAddModal();
    mountRemoveModal();
    mountSetLocationModal();
    mountRenameModal();
    mountSeedRatioModal();
  }

  // ── settings.js ────────────────────────────────────────────────────────────

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
        numberInput('set-dl-limit', dlEnabled ? kbpsToMbps(s.dl_limit) : '') + ' Mbps'
      )}
      ${settingsRow('Upload limit',
        toggle('set-ul-enabled', ulEnabled) +
        numberInput('set-ul-limit', ulEnabled ? kbpsToMbps(s.up_limit) : '') + ' Mbps'
      )}
      <div class="settings-group-title">Alternative speed limits</div>
      ${settingsRow('Enable alternative speeds',
        toggle('set-alt-enabled', s.alt_speed_enabled)
      )}
      <div id="alt-speed-fields"${altOn}>
        ${settingsRow('Alternative download',
          numberInput('set-alt-dl', kbpsToMbps(s.alt_dl_limit ?? 0)) + ' Mbps'
        )}
        ${settingsRow('Alternative upload',
          numberInput('set-alt-ul', kbpsToMbps(s.alt_up_limit ?? 0)) + ' Mbps'
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
      setPreferences({ dl_limit: enabled ? (mbpsToKbps(limit) || mbpsToKbps(8)) : 0 });
    });
    body.querySelector('#set-dl-limit')?.addEventListener('blur', e => {
      if (body.querySelector('#set-dl-enabled')?.checked) {
        setPreferences({ dl_limit: mbpsToKbps(Number(e.target.value) || 0) });
      }
    });

    body.querySelector('#set-ul-enabled')?.addEventListener('change', e => {
      const enabled = e.target.checked;
      const limit   = Number(body.querySelector('#set-ul-limit')?.value ?? 0);
      setPreferences({ up_limit: enabled ? (mbpsToKbps(limit) || mbpsToKbps(8)) : 0 });
    });
    body.querySelector('#set-ul-limit')?.addEventListener('blur', e => {
      if (body.querySelector('#set-ul-enabled')?.checked) {
        setPreferences({ up_limit: mbpsToKbps(Number(e.target.value) || 0) });
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
      setPreferences({ alt_dl_limit: mbpsToKbps(Number(e.target.value) || 0) });
    });
    body.querySelector('#set-alt-ul')?.addEventListener('blur', e => {
      setPreferences({ alt_up_limit: mbpsToKbps(Number(e.target.value) || 0) });
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

  function handleEsc(e) {
    if (e.key === 'Escape') setSettingsOpen(false);
  }

  function mountSettings() {
    const panel    = document.getElementById('settings-panel');
    const closeBtn = document.getElementById('btn-settings-close');
    const sel      = document.getElementById('settings-section-select');

    if (!panel || !closeBtn) return;

    closeBtn.addEventListener('click', () => setSettingsOpen(false));

    sel?.addEventListener('change', () => setActiveSection(sel.value)); // setActiveSection is async; no need to await here — fire-and-forget is fine for UI nav

    on('ui:settings', async open => {
      if (open) {
        if (state.inspectorId !== null) setInspector(null);
        const addP = document.getElementById('add-panel');
        if (addP && addP.classList.contains('add-panel--open')) {
          addP.classList.remove('add-panel--open');
          addP.classList.add('add-panel--closed');
          addP.setAttribute('aria-hidden', 'true');
        }
        panel.classList.add('settings--open');
        panel.classList.remove('settings--closed');
        panel.setAttribute('aria-hidden', 'false');
        document.addEventListener('keydown', handleEsc);

        const section = sel?.value || 'speed';

        // Render pre-warmed values immediately if available
        await setActiveSection(section);

        // Re-fetch fresh preferences and re-render
        try {
          const fresh = await getPreferences();
          setPrefs(fresh);
          await setActiveSection(section);
        } catch (err) {
          console.error('[settings] app/preferences failed:', err);
          // Pre-warmed values remain displayed — don't blank out
        }
      } else {
        panel.classList.remove('settings--open');
        panel.classList.add('settings--closed');
        panel.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', handleEsc);
      }
    });

    on('prefs:changed', () => {
      if (state.settingsOpen) {
        const sel = document.getElementById('settings-section-select');
        setActiveSection(sel?.value || 'speed');
      }
    });
  }

  // ── main.js ────────────────────────────────────────────────────────────────

  function createIconEl(svgString) {
    const span = document.createElement('span');
    span.className = 'icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = svgString;
    return span.firstElementChild || span;
  }

  function injectStaticIcons() {
    document.getElementById('btn-settings')?.setAttribute('data-tooltip', 'Settings');
    document.getElementById('btn-add-torrent')?.setAttribute('data-tooltip', 'Add torrent');
    document.getElementById('search-clear')?.setAttribute('data-tooltip', 'Clear search');
    document.getElementById('btn-inspector-close')?.setAttribute('data-tooltip', 'Close');
    document.getElementById('speed-down')?.setAttribute('data-tooltip', 'Download speed — click to set limit');
    document.getElementById('speed-up')?.setAttribute('data-tooltip', 'Upload speed — click to set limit');

    const iconMap = {
      'icon--search':       () => iconSearch(14),
      'icon--x':            () => iconX(16),
      'icon--arrow-down':   () => iconArrowDown(14),
      'icon--arrow-up':     () => iconArrowUp(14),
      'icon--settings':     () => iconSettings(16),
      'icon--plus':         () => iconPlus(14),
      'icon--file':         () => iconFile(16),

    };

    Object.entries(iconMap).forEach(([cls, iconFn]) => {
      document.querySelectorAll('.' + cls).forEach(el => {
        el.replaceWith(createIconEl(iconFn()));
      });
    });
  }

  async function boot() {
    injectStaticIcons();

    mountToolbar();
    mountSidebar();
    mountContextMenu();
    mountInspector();
    mountModals();
    mountSettings();

    const viewport = document.getElementById('list-viewport');
    mountList(viewport);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          selectAll();
        }
      }
    });

    on('connection:error', () => {
      showToast('Connection to qBittorrent lost', 'error');
      const connEl = document.getElementById('conn-status');
      if (connEl) {
        connEl.className = 'conn-status conn-status--unreachable';
        connEl.title = 'Cannot reach qBittorrent';
      }
    });

    on('connection:restored', () => {
      showToast('Reconnected to qBittorrent', 'success');
      const connEl = document.getElementById('conn-status');
      if (connEl) {
        connEl.className = 'conn-status conn-status--connected';
        connEl.title = 'Connected';
      }
    });

    try {
      await initialLoad();
      startPolling();
    } catch (err) {
      console.error('[main] Initial load failed:', err);
      showToast('Failed to connect to qBittorrent', 'error');
    }
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
