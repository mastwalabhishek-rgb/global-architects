/* ═══════════════════════════════════════════════════════════════
   GLOBAL ARCHITECTS — main.js
   Master Controller — Wires All Modules Together
   ═══════════════════════════════════════════════════════════════

   RESPONSIBILITIES:
   1.  Material texture hover on project cards
   2.  Smooth anchor scrolling
   3.  Active nav link detection
   4.  Accessibility enhancements
   5.  Performance monitoring
   6.  Error boundary
   7.  Utility helpers
   ═══════════════════════════════════════════════════════════════ */

'use strict';


/* ═══════════════════════════════════════════════════════════════
   1. MATERIAL TEXTURE HOVER
   Project cards show material texture on hover
═══════════════════════════════════════════════════════════════ */

const MaterialHover = (() => {

  /* Material → texture file mapping */
  const TEXTURE_MAP = {
    concrete: 'assets/textures/concrete.webp',
    glass:    'assets/textures/glass.webp',
    stone:    'assets/textures/stone.webp',
    wood:     'assets/textures/wood.webp',
    metal:    'assets/textures/metal.webp',
  };

  /* Cursor label element from cursor.js */
  const cursorLabel = document.querySelector('.cursor__label');

  function init() {
    const cards = document.querySelectorAll('[data-material]');
    if (!cards.length) return;

    cards.forEach(card => {
      const material    = card.dataset.material;
      const texturePath = TEXTURE_MAP[material];
      const textureEl   = card.querySelector('.project-card__texture');

      if (!textureEl || !texturePath) return;

      /* Preload texture */
      const img    = new Image();
      img.src      = texturePath;
      img.onload   = () => {
        textureEl.style.backgroundImage = `url('${texturePath}')`;
      };

      /* Update cursor label with material name */
      card.addEventListener('mouseenter', () => {
        if (cursorLabel) {
          const materialNames = {
            concrete: 'Concrete · Glass · Steel',
            glass:    'Glass · Aluminium · Stone',
            stone:    'Stone · Timber · Earth',
            wood:     'Timber · Stone · Steel',
            metal:    'Steel · Glass · Concrete',
          };
          cursorLabel.textContent = materialNames[material] || 'View';
        }
      });

      card.addEventListener('mouseleave', () => {
        if (cursorLabel) cursorLabel.textContent = 'View';
      });
    });
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   2. ACTIVE NAV DETECTION
   Highlights current page in navigation
═══════════════════════════════════════════════════════════════ */

const NavActive = (() => {

  function init() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks    = document.querySelectorAll('.nav__link');

    navLinks.forEach(link => {
      const href     = link.getAttribute('href');
      const linkPage = href?.split('/').pop() || 'index.html';

      if (linkPage === currentPath) {
        link.closest('.nav__item')?.classList.add('nav__item--active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.closest('.nav__item')?.classList.remove('nav__item--active');
        link.removeAttribute('aria-current');
      }
    });
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   3. SMOOTH ANCHOR SCROLLING
   Handles #hash links with offset for fixed nav
═══════════════════════════════════════════════════════════════ */

const SmoothAnchor = (() => {

  const NAV_HEIGHT = 80;

  function init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href').slice(1);
        if (!id) return;

        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();

        const top = target.getBoundingClientRect().top
                  + window.scrollY
                  - NAV_HEIGHT;

        window.scrollTo({ top, behavior: 'smooth' });

        /* Update URL without triggering scroll */
        history.pushState(null, '', `#${id}`);

        /* Focus target for accessibility */
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   4. ACCESSIBILITY ENHANCEMENTS
═══════════════════════════════════════════════════════════════ */

const A11y = (() => {

  function init() {
    handleFocusVisible();
    handleSkipLink();
    handleExternalLinks();
    handleReducedMotionToggle();
  }

  /* Add keyboard-nav class when Tab is pressed
     Removes it on mouse click — shows focus ring only for keyboard */
  function handleFocusVisible() {
    document.body.classList.add('using-mouse');

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.remove('using-mouse');
        document.body.classList.add('using-keyboard');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
      document.body.classList.add('using-mouse');
    });
  }

  /* Skip to main content link */
  function handleSkipLink() {
    /* Create skip link if not present */
    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a');
      skip.href      = '#mainContent';
      skip.className = 'skip-link';
      skip.textContent = 'Skip to main content';
      skip.style.cssText = `
        position: fixed;
        top: -100px;
        left: 1rem;
        z-index: 9999;
        padding: 0.75rem 1.5rem;
        background: var(--accent-primary);
        color: var(--bg-primary);
        font-family: var(--font-body);
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 0 0 8px 8px;
        text-decoration: none;
        transition: top 0.2s ease;
      `;

      skip.addEventListener('focus', () => { skip.style.top = '0'; });
      skip.addEventListener('blur',  () => { skip.style.top = '-100px'; });

      document.body.insertBefore(skip, document.body.firstChild);
    }
  }

  /* Add rel="noopener noreferrer" to external links
     and visual indicator */
  function handleExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      /* Security */
      if (!link.rel.includes('noopener')) {
        link.rel = 'noopener noreferrer';
      }

      /* Accessibility — if no aria-label mentions "new tab" */
      const label = link.getAttribute('aria-label') || '';
      if (!label.includes('new tab') && !label.includes('opens in')) {
        link.setAttribute(
          'aria-label',
          `${link.textContent.trim()} (opens in new tab)`
        );
      }
    });
  }

  /* Reduced motion toggle for users who want to re-enable */
  function handleReducedMotionToggle() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    mq.addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.style.setProperty(
          '--duration-palette', '0ms'
        );
      } else {
        document.documentElement.style.setProperty(
          '--duration-palette', '3000ms'
        );
      }
    });
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   5. FOOTER YEAR
   Auto-updates copyright year
═══════════════════════════════════════════════════════════════ */

const FooterYear = (() => {

  function init() {
    const el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   6. HERO MEDIA LOAD
   Reveals hero video when it is ready
═══════════════════════════════════════════════════════════════ */

const HeroMedia = (() => {

  const videoQuery = window.matchMedia('(min-width: 769px)');

  function init() {
    const hero      = document.querySelector('.hero');
    const heroVideo = document.querySelector('.hero__video');
    if (!hero || !heroVideo) return;

    if (!videoQuery.matches) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.removeAttribute('src');
      heroVideo.querySelectorAll('source').forEach(source => source.remove());
      heroVideo.load?.();
      hero.classList.add('is-loaded');
      return;
    }

    heroVideo.preload = 'metadata';

    if (heroVideo.readyState >= 2) {
      hero.classList.add('is-loaded');
    } else {
      heroVideo.addEventListener('loadeddata', () => {
        hero.classList.add('is-loaded');
      }, { once: true });
    }
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   7. HERO SOUND TOGGLE
   Lets users opt in to hero video audio
═══════════════════════════════════════════════════════════════ */

const HeroSound = (() => {

  let wantsSound = false;
  let heroInView = true;
  const videoQuery = window.matchMedia('(min-width: 769px)');

  function init() {
    const hero      = document.querySelector('.hero');
    const heroVideo = document.querySelector('.hero__video');
    const toggle    = document.getElementById('heroSoundToggle');
    const label     = toggle?.querySelector('.hero__sound-text');

    if (!hero || !heroVideo || !toggle) return;
    if (!videoQuery.matches) {
      toggle.hidden = true;
      return;
    }

    heroVideo.muted = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.volume = 0.72;

    const setButtonState = (isSoundOn) => {
      toggle.classList.toggle('is-active', isSoundOn);
      toggle.setAttribute('aria-pressed', String(isSoundOn));
      toggle.setAttribute(
        'aria-label',
        isSoundOn ? 'Turn hero video sound off' : 'Turn hero video sound on'
      );
      if (label) label.textContent = isSoundOn ? 'Sound Off' : 'Sound On';
    };

    const applySoundState = async () => {
      const shouldPlaySound = wantsSound && heroInView;

      if (shouldPlaySound) {
        heroVideo.muted = false;
        heroVideo.removeAttribute('muted');
        heroVideo.volume = 0.72;
      } else {
        heroVideo.muted = true;
        heroVideo.setAttribute('muted', '');
      }

      setButtonState(shouldPlaySound);

      if (shouldPlaySound) {
        try {
          await heroVideo.play();
        } catch (error) {
          wantsSound = false;
          heroVideo.muted = true;
          heroVideo.setAttribute('muted', '');
          setButtonState(false);
        }
      }
    };

    toggle.addEventListener('click', () => {
      wantsSound = !wantsSound;
      applySoundState();
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          heroInView = entry.isIntersecting && entry.intersectionRatio > 0.35;
          applySoundState();
        });
      }, { threshold: [0, 0.35, 0.7] });

      observer.observe(hero);
    } else {
      window.addEventListener('scroll', () => {
        const rect = hero.getBoundingClientRect();
        heroInView = rect.bottom > window.innerHeight * 0.35 &&
                     rect.top < window.innerHeight * 0.65;
        applySoundState();
      }, { passive: true });
    }

    heroVideo.addEventListener('pause', () => {
      if (wantsSound && heroInView) applySoundState();
    });

    setButtonState(false);
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   7. MARQUEE PAUSE ON REDUCED MOTION
═══════════════════════════════════════════════════════════════ */

const Marquee = (() => {

  function init() {
    const track = document.querySelector('.stats__marquee-track');
    if (!track) return;

    /* Duplicate content for seamless loop if not already done */
    if (!track.dataset.duplicated) {
      track.dataset.duplicated = 'true';
      /* Content already duplicated in HTML */
    }

    /* Pause when not in viewport — performance */
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        track.style.animationPlayState =
          entry.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0 });

    const marqueeEl = document.querySelector('.stats__marquee');
    if (marqueeEl) observer.observe(marqueeEl);
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   8. IMAGE PLACEHOLDER — Shows while images load
═══════════════════════════════════════════════════════════════ */

const ImagePlaceholder = (() => {

  /* Generate subtle SVG placeholder with firm initials */
  function createPlaceholder(width = 800, height = 600) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${width}" height="${height}"
           viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#E6DFD4"/>
        <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}"
              stroke="#C8BEB2" stroke-width="0.5"/>
        <line x1="${width/2}" y1="0" x2="${width/2}" y2="${height}"
              stroke="#C8BEB2" stroke-width="0.5"/>
        <text x="50%" y="50%"
              font-family="'DM Sans', sans-serif"
              font-size="14"
              fill="#9C9088"
              text-anchor="middle"
              dominant-baseline="middle"
              letter-spacing="0.1em">
          GLOBAL ARCHITECTS
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  function init() {
    const imgs = document.querySelectorAll('img[src]');

    imgs.forEach(img => {
      /* Store original src */
      const originalSrc = img.src;

      /* If image fails to load, show placeholder */
      img.addEventListener('error', () => {
        if (!img.dataset.placeholderShown) {
          img.dataset.placeholderShown = 'true';
          img.src = createPlaceholder(
            img.naturalWidth  || img.width  || 800,
            img.naturalHeight || img.height || 600
          );
          img.alt = img.alt || 'Project image — Global Architects';
        }
      }, { once: true });
    });
  }

  return { init, createPlaceholder };

})();


/* ═══════════════════════════════════════════════════════════════
   9. PERFORMANCE MONITORING (Dev only)
═══════════════════════════════════════════════════════════════ */

const PerfMonitor = (() => {

  function init() {
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

    if (!isLocal) return;

    /* Log Core Web Vitals hints */
    if ('PerformanceObserver' in window) {

      /* Largest Contentful Paint */
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last    = entries[entries.length - 1];
          console.log(
            `%c LCP: ${last.startTime.toFixed(0)}ms ` +
            `${last.startTime < 2500 ? '✅' : '⚠️'}`,
            'background:#1C1A16;color:#C4A882;padding:2px 8px'
          );
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch(e) {}

      /* First Input Delay */
      try {
        new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            console.log(
              `%c FID: ${entry.processingStart - entry.startTime.toFixed(0)}ms ` +
              `${entry.processingStart - entry.startTime < 100 ? '✅' : '⚠️'}`,
              'background:#1C1A16;color:#C4A882;padding:2px 8px'
            );
          });
        }).observe({ type: 'first-input', buffered: true });
      } catch(e) {}

      /* Cumulative Layout Shift */
      try {
        let clsScore = 0;
        new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) clsScore += entry.value;
          });
          console.log(
            `%c CLS: ${clsScore.toFixed(4)} ` +
            `${clsScore < 0.1 ? '✅' : '⚠️'}`,
            'background:#1C1A16;color:#C4A882;padding:2px 8px'
          );
        }).observe({ type: 'layout-shift', buffered: true });
      } catch(e) {}
    }

    /* Log load time */
    window.addEventListener('load', () => {
      const timing  = performance.getEntriesByType('navigation')[0];
      if (timing) {
        const loadTime = timing.loadEventEnd - timing.startTime;
        console.log(
          `%c Global Architects — Page loaded in ${loadTime.toFixed(0)}ms ` +
          `${loadTime < 2000 ? '✅' : '⚠️'}`,
          'background:#8B6914;color:#fff;padding:4px 8px;font-weight:bold'
        );
      }
    });
  }

  return { init };

})();


/* ═══════════════════════════════════════════════════════════════
   10. ERROR BOUNDARY
   Catch and log JS errors gracefully
═══════════════════════════════════════════════════════════════ */

window.addEventListener('error', (e) => {
  /* Don't break the site — log silently */
  if (window.location.hostname === 'localhost') {
    console.error('Global Architects JS Error:', e.message, e.filename, e.lineno);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (window.location.hostname === 'localhost') {
    console.error('Global Architects Promise Error:', e.reason);
  }
  e.preventDefault();
});


/* ═══════════════════════════════════════════════════════════════
   MASTER INIT
   Initialize all modules in correct order
═══════════════════════════════════════════════════════════════ */

function initApp() {

  try { HeroMedia.init();        } catch(e) { console.warn('HeroMedia:', e); }
  try { HeroSound.init();        } catch(e) { console.warn('HeroSound:', e); }
  try { NavActive.init();        } catch(e) { console.warn('NavActive:', e); }
  try { SmoothAnchor.init();     } catch(e) { console.warn('SmoothAnchor:', e); }
  try { MaterialHover.init();    } catch(e) { console.warn('MaterialHover:', e); }
  try { A11y.init();             } catch(e) { console.warn('A11y:', e); }
  try { FooterYear.init();       } catch(e) { console.warn('FooterYear:', e); }
  try { Marquee.init();          } catch(e) { console.warn('Marquee:', e); }
  try { ImagePlaceholder.init(); } catch(e) { console.warn('ImagePlaceholder:', e); }
  try { PerfMonitor.init();      } catch(e) { console.warn('PerfMonitor:', e); }

  /* Dev console greeting */
  if (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1') {
    console.log(
      '\n%c 🏛  GLOBAL ARCHITECTS %c\n' +
      '%c Excellence in Design & Planning\n' +
      'Dehradun, Uttarakhand · Est. 2017\n' +
      'Ar. Shailesh Kumar, Principal Architect\n\n' +
      'hello@globalarchitects.in\n',
      'background:#1C1A16;color:#C4A882;font-size:16px;font-weight:bold;padding:8px 16px',
      '',
      'color:#5A5650;font-size:12px;padding:0 16px'
    );
  }
}


/* ─────────────────────────────────────────────────────────────
   START
───────────────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* Expose utilities */
window.GlobalArchitects = {
  MaterialHover,
  NavActive,
  A11y,
  ImagePlaceholder,
  HeroMedia,
  HeroSound,
  PerfMonitor,
  version: '1.0.0',
};
