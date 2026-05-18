'use strict';

const CursorManager = (() => {
  function init() {
    document.documentElement.classList.remove('cursor-active');
    document.querySelectorAll('.cursor').forEach(cursor => {
      cursor.setAttribute('hidden', '');
      cursor.style.display = 'none';
    });
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', CursorManager.init);
} else {
  CursorManager.init();
}

window.CursorManager = CursorManager;
