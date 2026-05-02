// ── Unified Option Sheet ──────────────────────────────────────────
// Shared bottom-sheet for transient option lists (sort, actions).
// Reuses #sort-sheet DOM element from index.html.
// API: openOptionSheet({ title, buildContent, onClose })
//      closeOptionSheet()

let _optionSheetOnClose = null;
let _swipeWired         = false;

function openOptionSheet({ title, buildContent, onClose }) {
  const sheet    = document.getElementById('sort-sheet');
  const backdrop = document.getElementById('sort-sheet-backdrop');
  if (!sheet || !backdrop) return;

  _optionSheetOnClose = onClose || null;

  const titleEl = sheet.querySelector('.sort-sheet__title');
  if (titleEl) titleEl.textContent = title || '';

  const body = sheet.querySelector('.sort-sheet__body');
  body.innerHTML = '';
  if (buildContent) buildContent(body);

  if (!_swipeWired) {
    _wireOptionSheetSwipe(sheet);
    _swipeWired = true;
  }

  document.documentElement.classList.add('sheet-open');

  backdrop.classList.remove('sort-sheet-backdrop--hidden');
  backdrop.classList.add('sort-sheet-backdrop--visible');
  sheet.classList.add('sort-sheet--visible');
  sheet.setAttribute('aria-hidden', 'false');

  backdrop.addEventListener('click', closeOptionSheet, { once: true });
  document.addEventListener('keydown', _optionSheetKeydown);

  requestAnimationFrame(() => {
    const first = body.querySelector('[tabindex="0"], button, [role="option"]');
    first?.focus();
  });
}

function closeOptionSheet() {
  const sheet    = document.getElementById('sort-sheet');
  const backdrop = document.getElementById('sort-sheet-backdrop');
  if (!sheet || !backdrop) return;

  sheet.classList.remove('sort-sheet--visible');
  sheet.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('sort-sheet-backdrop--visible');
  backdrop.classList.add('sort-sheet-backdrop--hidden');
  document.removeEventListener('keydown', _optionSheetKeydown);

  document.documentElement.classList.remove('sheet-open');

  if (_optionSheetOnClose) {
    _optionSheetOnClose();
    _optionSheetOnClose = null;
  }
}

function _optionSheetKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); closeOptionSheet(); }
}

function _wireOptionSheetSwipe(sheet) {
  const header = sheet.querySelector('.sort-sheet__header');
  if (!header) return;

  let startY     = 0;
  let startTime  = 0;
  let currentY   = 0;
  let dragging   = false;
  let ptrDown    = false;

  const DISTANCE_THRESHOLD = 40;  // px
  const VELOCITY_THRESHOLD = 0.3; // px/ms

  // Listen on the sheet itself so setPointerCapture is always called on the
  // element that received the event — avoids iOS inconsistency when the pip
  // child element is the direct touch target
  sheet.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    // Only initiate drag if touch started within the header zone
    if (!header.contains(e.target) && e.target !== header) return;
    ptrDown   = true;
    dragging  = false;
    startY    = e.clientY;
    startTime = Date.now();
    currentY  = e.clientY;
    // Capture on the sheet — same element as the listener, consistent on iOS
    sheet.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  sheet.addEventListener('pointermove', (e) => {
    if (!ptrDown || e.pointerType === 'mouse') return;
    const dy = e.clientY - startY;
    if (dy < 0) return;
    dragging = true;
    currentY = e.clientY;
    sheet.style.transition = 'none';
    sheet.style.transform  = `translateY(${dy}px)`;
  });

  const end = (e) => {
    if (!ptrDown || e.pointerType === 'mouse') return;
    ptrDown = false;
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    sheet.style.transform  = '';

    const distance = currentY - startY;
    const duration = Date.now() - startTime;
    const velocity = distance / Math.max(duration, 1);

    if (distance >= DISTANCE_THRESHOLD || velocity >= VELOCITY_THRESHOLD) {
      closeOptionSheet();
    }
  };

  sheet.addEventListener('pointerup',     end);
  sheet.addEventListener('pointercancel', end);
}
