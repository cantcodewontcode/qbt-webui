
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

