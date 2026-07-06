
function mountSidebar() {
  mountFilterTabs();
  mountCategoryNav();
  mountColHeaders();
}

/**
 * Positions a shared sliding indicator behind whichever item in `container`
 * matches `activeSelector`, animating via CSS transition rather than each
 * item toggling its own background. The closest web analog to SwiftUI's
 * glassEffectID shared-identity morph between states.
 * `horizontal: true` slides along the x-axis (for the mobile chip strip)
 * instead of the y-axis (for vertical sidebar lists).
 */
function positionNavIndicator(container, activeSelector, indicatorEl, horizontal) {
  if (!container || !indicatorEl) return;
  const activeEl = container.querySelector(activeSelector);
  if (!activeEl || activeEl.hidden) {
    indicatorEl.classList.remove('nav-indicator--visible');
    return;
  }
  if (horizontal) {
    indicatorEl.style.transform = `translate(${activeEl.offsetLeft}px, -50%)`;
    indicatorEl.style.width = `${activeEl.offsetWidth}px`;
  } else {
    indicatorEl.style.transform = `translateY(${activeEl.offsetTop}px)`;
    indicatorEl.style.height = `${activeEl.offsetHeight}px`;
  }
  indicatorEl.classList.add('nav-indicator--visible');
}

function mountFilterTabs() {
  const nav = document.querySelector('.filter-nav');
  const indicator = document.getElementById('filter-nav-indicator');

  const reposition = () => positionNavIndicator(nav, '.filter-tab--active', indicator);

  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  on('ui:filter', filter => {
    document.querySelectorAll('.filter-tab').forEach(btn => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle('filter-tab--active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    reposition();
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
            state.activeCategory = null;
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
    setCount('count-moving',      FILTER_MAP.moving);
    setCount('count-stalled',     FILTER_MAP.stalled);

    reposition();
  });

  reposition();
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
    let html = '<div class="nav-indicator" id="category-nav-indicator" aria-hidden="true"></div>';
    html += '<span class="category-nav-label">Categories</span>';
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
    positionNavIndicator(nav, '.category-tab--active', document.getElementById('category-nav-indicator'));
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

