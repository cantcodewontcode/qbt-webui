// ── Sort Sheet ────────────────────────────────────────────────────
// Uses the unified option sheet (js/option-sheet.js).

const SORT_OPTIONS = [
  { key: 'name',          label: 'Name',           group: 'Content'  },
  { key: 'size',          label: 'Size',            group: 'Content'  },
  { key: 'progress',      label: 'Progress',        group: 'Transfer' },
  { key: 'dlspeed',       label: 'Download speed',  group: 'Transfer' },
  { key: 'upspeed',       label: 'Upload speed',    group: 'Transfer' },
  { key: 'eta',           label: 'ETA',             group: 'Transfer' },
  { key: 'ratio',         label: 'Ratio',           group: 'Seeding'  },
  { key: 'num_connected', label: 'Peers',           group: 'Seeding'  },
];

function openSortSheet() {
  openOptionSheet({
    title: 'Sort by',
    buildContent: (body) => {
      const wrapper = document.createElement('div');
      wrapper.style.padding = 'var(--space-2) 0';
      wrapper.innerHTML = _buildSortHTML();
      body.appendChild(wrapper);

      wrapper.querySelectorAll('.sort-option').forEach(opt => {
        opt.addEventListener('click', () => {
          const key = opt.dataset.sortKey;
          const dir = (state.sortKey === key)
            ? (state.sortDir === 'asc' ? 'desc' : 'asc')
            : (key === 'name' ? 'asc' : 'desc');
          setSort(key, dir);
          closeOptionSheet();
        });
      });

      wrapper.addEventListener('keydown', (e) => {
        const opts = [...wrapper.querySelectorAll('.sort-option')];
        const idx  = opts.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); opts[Math.min(idx + 1, opts.length - 1)]?.focus(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); opts[Math.max(idx - 1, 0)]?.focus(); }
        if (e.key === 'Enter' && opts.includes(document.activeElement)) { e.preventDefault(); document.activeElement.click(); }
      });
    },
  });

  // Override focus: land on active sort option
  requestAnimationFrame(() => {
    const body = document.querySelector('#sort-sheet .sort-sheet__body');
    const target = body?.querySelector('.sort-option--active') || body?.querySelector('.sort-option');
    target?.focus();
  });
}

function _buildSortHTML() {
  const groups = {};
  SORT_OPTIONS.forEach(opt => {
    if (!groups[opt.group]) groups[opt.group] = [];
    groups[opt.group].push(opt);
  });

  let html = '';
  let first = true;
  for (const [label, opts] of Object.entries(groups)) {
    if (!first) html += '<div class="sort-group-sep" aria-hidden="true"></div>';
    first = false;
    html += `<span class="sort-group-label">${label}</span>`;
    opts.forEach(opt => {
      const active = state.sortKey === opt.key;
      const dir = active
        ? (state.sortDir === 'asc'
            ? `<span class="sort-option__dir">${iconChevronUp(14)} asc</span>`
            : `<span class="sort-option__dir">${iconChevronDown(14)} desc</span>`)
        : '';
      html += `<div class="sort-option${active ? ' sort-option--active' : ''}"
        role="option" aria-selected="${active}"
        data-sort-key="${opt.key}" tabindex="0">
        <span>${opt.label}</span>${dir}
      </div>`;
    });
  }
  return html;
}
