

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

