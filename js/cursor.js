/* ═══════════════════════════════════════════════════════════════
   GLOBAL ARCHITECTS — cursor.js
   Custom Magnetic Architectural Cursor
   60fps smooth — touch devices auto-disabled
   ═══════════════════════════════════════════════════════════════

   CURSOR STATES:
   default  → thin + crosshair (architectural drafting feel)
   view     → expanding circle with "View" label (on project images)
   link     → solid dot with magnetic pull (on buttons/links)
   text     → thin vertical I-beam (on readable text)

   FEATURES:
   - requestAnimationFrame loop for 60fps
   - LERP (linear interpolation) for smooth lag
   - Magnetic pull on buttons — cursor snaps toward center
   - Context-aware — detects what cursor is hovering
   - Auto-disabled on touch/mobile devices
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const CursorManager = (() => {

  /* ── Check for touch/hover support ── */
  const hasHover  = window.matchMedia('(hover: hover)').matches;
const hasFine   = window.matchMedia('(pointer: fine)').matches;
const isTouch   = !hasHover || !hasFine;

/* Bail out on touch devices */
if (isTouch) return { init: () => {} };

/* Force hide default cursor on desktop */
document.documentElement.style.cursor = 'none';
document.body.style.cursor = 'none';

  /* ── DOM Elements ── */
  const CURSOR_EL      = document.getElementById('cursor');
  const CROSSHAIR_EL   = CURSOR_EL?.querySelector('.cursor__crosshair');
  const CIRCLE_EL      = CURSOR_EL?.querySelector('.cursor__circle');
  const LABEL_EL       = CURSOR_EL?.querySelector('.cursor__label');
  const DOT_EL         = CURSOR_EL?.querySelector('.cursor__dot');

  if (!CURSOR_EL) return { init: () => {} };


  /* ── State ── */
  const mouse   = { x: -200, y: -200 }; /* Start off-screen */
  const pos     = { x: -200, y: -200 }; /* Lerped position  */
  const LERP    = 0.1;                   /* 0.1 = smooth lag, 1 = instant */

  let rafId        = null;
  let currentState = 'default';
  let isVisible    = false;
  let magnetTarget = null;
  let magnetRect   = null;


  /* ─────────────────────────────────────────────────────────────
     LERP UTILITY
     Linear interpolation for smooth cursor following
  ───────────────────────────────────────────────────────────── */
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }


  /* ─────────────────────────────────────────────────────────────
     SET STATE
     Changes cursor appearance based on context
  ───────────────────────────────────────────────────────────── */
  function setState(newState) {
    if (newState === currentState) return;

    /* Remove all state classes */
    CURSOR_EL.classList.remove(
      'cursor--view',
      'cursor--link',
      'cursor--text'
    );

    /* Apply new state */
    if (newState !== 'default') {
      CURSOR_EL.classList.add(`cursor--${newState}`);
    }

    currentState = newState;
  }


  /* ─────────────────────────────────────────────────────────────
     DETECT CONTEXT
     What is the cursor hovering over?
  ───────────────────────────────────────────────────────────── */
  function detectContext(el) {
    if (!el) return 'default';

    /* Project card image — "View" circle */
    if (el.closest('.project-card__media') ||
        el.closest('[data-cursor="view"]')) {
      return 'view';
    }

    /* Buttons, links, interactive elements — dot */
    if (el.closest('a') ||
        el.closest('button') ||
        el.closest('[role="button"]') ||
        el.closest('.btn') ||
        el.closest('.nav__link') ||
        el.closest('.project-card__link') ||
        el.closest('[data-cursor="link"]')) {
      return 'link';
    }

    /* Text content — thin vertical */
    if (el.closest('p') ||
        el.closest('h1') ||
        el.closest('h2') ||
        el.closest('h3') ||
        el.closest('blockquote') ||
        el.closest('[data-cursor="text"]')) {
      return 'text';
    }

    return 'default';
  }


  /* ─────────────────────────────────────────────────────────────
     MAGNETIC PULL
     Cursor is attracted to center of magnetic elements
  ───────────────────────────────────────────────────────────── */
  function getMagneticOffset() {
    if (!magnetTarget || !magnetRect) return { x: 0, y: 0 };

    const centerX = magnetRect.left + magnetRect.width  / 2;
    const centerY = magnetRect.top  + magnetRect.height / 2;

    /* Distance from mouse to element center */
    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;

    /* Magnetic strength — closer = stronger pull */
    const strength = 0.35;

    return {
      x: dx * strength,
      y: dy * strength,
    };
  }


  /* ─────────────────────────────────────────────────────────────
     ANIMATION LOOP — 60fps via requestAnimationFrame
  ───────────────────────────────────────────────────────────── */
  function tick() {
    /* Smooth lerp toward mouse position */
    pos.x = lerp(pos.x, mouse.x, LERP);
    pos.y = lerp(pos.y, mouse.y, LERP);

    /* Get magnetic offset if hovering a magnetic element */
    const mag = getMagneticOffset();

    /* Apply transform — translate to lerped position */
    CURSOR_EL.style.transform =
      `translate(${pos.x - 10}px, ${pos.y - 10}px)`;

    /* Apply magnetic offset to the magnetic element itself */
    if (magnetTarget && (Math.abs(mag.x) > 0.1 || Math.abs(mag.y) > 0.1)) {
      magnetTarget.style.transform =
        `translate(${mag.x}px, ${mag.y}px)`;
    }

    rafId = requestAnimationFrame(tick);
  }


  /* ─────────────────────────────────────────────────────────────
     EVENT: mousemove
  ───────────────────────────────────────────────────────────── */
  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    /* Show cursor on first move */
    if (!isVisible) {
      isVisible = true;
      CURSOR_EL.style.opacity = '1';
    }

    /* Detect context and update state */
    const context = detectContext(e.target);
    setState(context);

    /* Update magnetic rect if target changed */
    if (magnetTarget) {
      magnetRect = magnetTarget.getBoundingClientRect();
    }
  }


  /* ─────────────────────────────────────────────────────────────
     EVENT: mouseenter on magnetic elements
  ───────────────────────────────────────────────────────────── */
  function onMagneticEnter(e) {
    magnetTarget = e.currentTarget;
    magnetRect   = magnetTarget.getBoundingClientRect();
  }


  /* ─────────────────────────────────────────────────────────────
     EVENT: mouseleave on magnetic elements
  ───────────────────────────────────────────────────────────── */
  function onMagneticLeave(e) {
    if (magnetTarget) {
      /* Reset element position with transition */
      magnetTarget.style.transition =
        'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      magnetTarget.style.transform = 'translate(0, 0)';

      /* Remove transition after animation */
      setTimeout(() => {
        if (magnetTarget) {
          magnetTarget.style.transition = '';
        }
      }, 500);
    }

    magnetTarget = null;
    magnetRect   = null;
  }


  /* ─────────────────────────────────────────────────────────────
     EVENT: mouseleave document
     Hide cursor when mouse leaves window
  ───────────────────────────────────────────────────────────── */
  function onDocumentLeave() {
    CURSOR_EL.style.opacity = '0';
    isVisible = false;
  }

  function onDocumentEnter() {
    CURSOR_EL.style.opacity = '1';
    isVisible = true;
  }


  /* ─────────────────────────────────────────────────────────────
     BIND MAGNETIC ELEMENTS
     All buttons and CTAs get magnetic pull
  ───────────────────────────────────────────────────────────── */
  function bindMagneticElements() {
    const magnetSelectors = [
      '.btn',
      '.nav__cta',
      '.nav__logo',
      '.nav__theme-toggle',
      '.blueprint-skip',
      '[data-magnetic]',
    ];

    const magnetEls = document.querySelectorAll(magnetSelectors.join(', '));

    magnetEls.forEach(el => {
      el.addEventListener('mouseenter', onMagneticEnter);
      el.addEventListener('mouseleave', onMagneticLeave);
    });
  }


  /* ─────────────────────────────────────────────────────────────
     DYNAMIC LABEL — update "View" text based on project
  ───────────────────────────────────────────────────────────── */
  function updateViewLabel(el) {
    if (!LABEL_EL) return;

    const card = el?.closest('.project-card');
    if (card) {
      const type = card.querySelector('.project-card__type')?.textContent;
      LABEL_EL.textContent = type ? `View` : 'View';
    } else {
      LABEL_EL.textContent = 'View';
    }
  }


  /* ─────────────────────────────────────────────────────────────
     BIND PROJECT IMAGES — special view state
  ───────────────────────────────────────────────────────────── */
  function bindProjectImages() {
    const projectMedias = document.querySelectorAll('.project-card__media');

    projectMedias.forEach(media => {
      media.addEventListener('mouseenter', (e) => {
        updateViewLabel(e.target);
      });
    });
  }


  /* ─────────────────────────────────────────────────────────────
     SCROLL PROGRESS — for kinetic typography
     Sets --scroll-progress CSS var on :root
  ───────────────────────────────────────────────────────────── */
  function bindScrollProgress() {
    function updateScrollProgress() {
      const scrollTop    = window.scrollY;
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
      const progress     = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

      /* Hero-specific progress (0 to 1 within first viewport) */
      const heroProgress = Math.min(scrollTop / window.innerHeight, 1);

      document.documentElement.style.setProperty(
        '--scroll-progress',
        heroProgress.toFixed(3)
      );
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress(); /* Initial call */
  }


  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    /* Start RAF loop */
    rafId = requestAnimationFrame(tick);

    /* Mouse tracking */
    document.addEventListener('mousemove', onMouseMove);

    /* Document boundary */
    document.documentElement.addEventListener('mouseleave', onDocumentLeave);
    document.documentElement.addEventListener('mouseenter', onDocumentEnter);

    /* Magnetic elements */
    bindMagneticElements();

    /* Project image detection */
    bindProjectImages();

    /* Scroll progress for kinetic type */
    bindScrollProgress();

    /* Initial hidden state */
    CURSOR_EL.style.opacity = '0';
  }


  /* ─────────────────────────────────────────────────────────────
     CLEANUP — call on page unload
  ───────────────────────────────────────────────────────────── */
  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('mousemove', onMouseMove);
    document.documentElement.removeEventListener('mouseleave', onDocumentLeave);
    document.documentElement.removeEventListener('mouseenter', onDocumentEnter);
  }


  /* ── Public API ── */
  return { init, destroy, setState };

})();


/* ─────────────────────────────────────────────────────────────
   INITIALIZE
───────────────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', CursorManager.init);
} else {
  CursorManager.init();
}

window.CursorManager = CursorManager;