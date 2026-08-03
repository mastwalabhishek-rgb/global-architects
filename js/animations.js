/* ===============================================================
   GLOBAL ARCHITECTS - animations.js
   Master Animation Controller
   Blueprint Entry -> Hero -> Scroll Reveals -> GSAP
   ===============================================================

   SEQUENCE:
   1. Blueprint SVG draws itself (2.5s)
   2. Blueprint fades out (0.9s)
   3. Hero content animates in (staggered)
   4. Nav becomes visible
   5. IntersectionObserver watches all .reveal elements
   6. GSAP ScrollTrigger handles complex scroll animations
   7. Stats counter runs when section enters viewport
   8. Philosophy words reveal one by one on scroll
   =============================================================== */

'use strict';

const AnimationManager = (() => {

  /* -- Reduced motion check -- */
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;


  /* -- DOM refs -- */
  const DOM = {
    blueprintOverlay: document.getElementById('blueprintOverlay'),
    blueprintSkip:    document.getElementById('blueprintSkip'),
    blueprintLabel:   document.querySelector('.blueprint-label'),
    nav:              document.getElementById('mainNav'),
    hero:             document.querySelector('.hero'),
    heroEyebrow:      document.querySelector('.hero__eyebrow'),
    heroHeadingLines: document.querySelectorAll('.hero__heading-line'),
    heroTagline:      document.querySelector('.hero__tagline'),
    heroDesc:         document.querySelector('.hero__desc'),
    heroCtas:         document.querySelector('.hero__ctas'),
    heroBadge:        document.querySelector('.hero__badge'),
    heroImg:          document.querySelector('.hero__img'),
    philosophyQuote:  document.querySelector('.philosophy__quote-text'),
    statsItems:       document.querySelectorAll('.stats__item'),
    statsNums:        document.querySelectorAll('[data-count]'),
    revealEls:        document.querySelectorAll('.reveal'),
    projectCards:     document.querySelectorAll('.project-card'),
    processSteps:     document.querySelectorAll('.process__step'),
    philosophyPillars:document.querySelector('.philosophy__pillars'),
    aboutMedia:       document.querySelector('.about-teaser__media'),
    aboutImgWrap:     document.querySelector('.about-teaser__img-wrap'),
    aboutSkills:      document.querySelector('.about-teaser__skills'),
    ctaSection:       document.querySelector('.cta-section'),
    pageTransition:   document.querySelector('.page-transition'),
  };


  /* ===============================================================
     1. BLUEPRINT ENTRY ANIMATION
  =============================================================== */

  const Blueprint = {

    TOTAL_DURATION: 1000, /* ms - total blueprint draw time */
    hasSkipped: false,

    init() {
      if (!DOM.blueprintOverlay) {
        this.onComplete();
        return;
      }

      /* If reduced motion - skip immediately */
      if (prefersReduced) {
        this.skip();
        return;
      }

      /* Check if user has visited before - shorter animation */
      const hasVisited = sessionStorage.getItem('ga_visited');
      if (hasVisited) {
        this.TOTAL_DURATION = 1500;
      }
      sessionStorage.setItem('ga_visited', '1');

      /* Start playing */
      DOM.blueprintOverlay.classList.add('is-playing');

      /* Bind skip button */
      if (DOM.blueprintSkip) {
        DOM.blueprintSkip.addEventListener('click', () => this.skip());
      }

      /* Keyboard skip - spacebar or Escape */
      const keySkip = (e) => {
        if (e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          this.skip();
          document.removeEventListener('keydown', keySkip);
        }
      };
      document.addEventListener('keydown', keySkip);

      /* Auto complete after duration */
      setTimeout(() => {
        if (!this.hasSkipped) this.exit();
      }, this.TOTAL_DURATION);
    },

    exit() {
      if (this.hasSkipped) return;
      DOM.blueprintOverlay.classList.add('is-exiting');

      /* Wait for exit animation then remove */
      setTimeout(() => {
        DOM.blueprintOverlay.style.display = 'none';
        DOM.blueprintOverlay.setAttribute('aria-hidden', 'true');
        this.onComplete();
      }, 400);
    },

    skip() {
      this.hasSkipped = true;

      /* Instant hide */
      DOM.blueprintOverlay.style.transition = 'opacity 0.3s ease';
      DOM.blueprintOverlay.style.opacity    = '0';

      setTimeout(() => {
        DOM.blueprintOverlay.style.display = 'none';
        DOM.blueprintOverlay.setAttribute('aria-hidden', 'true');
        this.onComplete();
      }, 300);
    },

    onComplete() {
      /* Remove loading class */
      document.body.classList.remove('js-loading');

      /* Trigger hero animations */
      Hero.animate();

      /* Show nav */
      setTimeout(() => {
        if (DOM.nav) {
          DOM.nav.classList.add('is-visible');
        }
      }, 400);

      /* Mark hero image as loaded */
      if (DOM.hero) {
        DOM.hero.classList.add('is-loaded');
      }
    },
  };


  /* ===============================================================
     2. HERO ENTRY ANIMATION SEQUENCE
  =============================================================== */

  const Hero = {

    animate() {
      if (prefersReduced) {
        /* Show everything instantly */
        this.showAll();
        return;
      }

      /* Staggered sequence */
      const sequence = [
        { el: DOM.heroEyebrow,      delay: 0,    cls: 'is-visible' },
        { el: DOM.heroTagline,      delay: 400,  cls: 'is-visible' },
        { el: DOM.heroDesc,         delay: 550,  cls: 'is-visible' },
        { el: DOM.heroCtas,         delay: 700,  cls: 'is-visible' },
        { el: DOM.heroBadge,        delay: 850,  cls: 'is-visible' },
      ];

      /* Heading lines - split animation */
      DOM.heroHeadingLines.forEach((line, i) => {
        setTimeout(() => {
          /* Wrap content in span for slide-up */
          if (!line.querySelector('span')) {
            const text = line.innerHTML;
            line.innerHTML = `<span>${text}</span>`;
          }
          line.classList.add('is-visible');
        }, 100 + (i * 80));
      });

      /* Rest of sequence */
      sequence.forEach(({ el, delay, cls }) => {
        if (!el) return;
        setTimeout(() => el.classList.add(cls), delay);
      });

      /* GSAP kinetic typography - if GSAP loaded */
      setTimeout(() => {
        if (typeof gsap !== 'undefined') {
          KineticType.init();
        }
      }, 200);
    },

    showAll() {
      [
        DOM.heroEyebrow, DOM.heroTagline,
        DOM.heroDesc, DOM.heroCtas, DOM.heroBadge
      ].forEach(el => {
        if (el) {
          el.style.opacity   = '1';
          el.style.transform = 'none';
        }
      });

      DOM.heroHeadingLines.forEach(line => {
        line.style.opacity   = '1';
        line.style.transform = 'none';
      });
    },
  };


  /* ===============================================================
     3. KINETIC TYPOGRAPHY (GSAP)
  =============================================================== */

  const KineticType = {

    ctx: null,

    splitTaglineChars(el) {
      if (!el) return null;

      const nodes = [];
      const content = el.textContent || '';
      el.innerHTML = '';

      [...content].forEach((char) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.opacity = '0';
        el.appendChild(span);
        nodes.push(span);
      });

      return { chars: nodes };
    },

    init() {
      if (typeof gsap === 'undefined') return;
      if (prefersReduced) return;

      const heading = document.querySelector('.hero__heading');
      if (!heading) return;

      this.ctx = gsap.context(() => {

        /* Tagline - character stagger */
        const tagline = DOM.heroTagline;
        const split = tagline && typeof SplitText !== 'undefined'
          ? new SplitText(tagline, { type: 'chars' })
          : this.splitTaglineChars(tagline);

        if (split?.chars?.length) {
          gsap.to(split.chars, {
            opacity: 1,
            duration: 0.04,
            stagger: 0.03,
            delay: 0.5,
            ease: 'none',
          });
        }

        /* Magnetic repel on heading chars */
        this.bindMagneticChars(heading);

      }, heading);
    },

    bindMagneticChars(heading) {
      /* Only on desktop */
      if (!window.matchMedia('(hover: hover)').matches) return;

      const chars = heading.querySelectorAll('.char, span');

      heading.addEventListener('mousemove', (e) => {
        const rect = heading.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const my   = e.clientY - rect.top;

        chars.forEach(char => {
          const cr   = char.getBoundingClientRect();
          const cx   = cr.left - rect.left + cr.width  / 2;
          const cy   = cr.top  - rect.top  + cr.height / 2;
          const dist = Math.hypot(mx - cx, my - cy);
          const maxD = 120;

          if (dist < maxD) {
            const force = (1 - dist / maxD) * 20;
            const angle = Math.atan2(my - cy, mx - cx);
            const tx    = -Math.cos(angle) * force;
            const ty    = -Math.sin(angle) * force;

            gsap.to(char, {
              x: tx, y: ty,
              duration: 0.3,
              ease: 'power2.out',
              overwrite: true,
            });
          } else {
            gsap.to(char, {
              x: 0, y: 0,
              duration: 0.6,
              ease: 'elastic.out(1, 0.5)',
              overwrite: true,
            });
          }
        });
      });

      heading.addEventListener('mouseleave', () => {
        chars.forEach(char => {
          gsap.to(char, {
            x: 0, y: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.4)',
          });
        });
      });
    },

    destroy() {
      if (this.ctx) this.ctx.revert();
    },
  };


  /* ===============================================================
     4. NAV SCROLL BEHAVIOR
  =============================================================== */

  const NavScroll = {

    THRESHOLD: 100,
    ticking: false,

    init() {
      if (!DOM.nav) return;

      window.addEventListener('scroll', () => {
        if (!this.ticking) {
          requestAnimationFrame(() => {
            this.update();
            this.ticking = false;
          });
          this.ticking = true;
        }
      }, { passive: true });

      this.update();
    },

    update() {
      const scrolled = window.scrollY > this.THRESHOLD;
      DOM.nav.classList.toggle('is-scrolled', scrolled);
    },
  };


  /* ===============================================================
     5. INTERSECTION OBSERVER - Scroll Reveals
  =============================================================== */

  const ScrollReveal = {

    observer: null,

    init() {
      if (prefersReduced) {
        /* Show all reveal elements immediately */
        document.querySelectorAll('.reveal, .project-card, .process__step, .stats__item, .philosophy__pillar').forEach(el => {
          el.classList.add('is-revealed');
          el.style.opacity   = '1';
          el.style.transform = 'none';
        });
        return;
      }

      const options = {
        root:       null,
        rootMargin: '0px 0px -80px 0px',
        threshold:  0.1,
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.reveal(entry.target);
          }
        });
      }, options);

      /* Observe all reveal targets */
      this.observeAll();
    },

    observeAll() {
      const selectors = [
        '.reveal',
        '.project-card',
        '.process__step',
        '.stats__item',
        '.philosophy__pillar',
        '.about-teaser__img-wrap',
        '.about-teaser__media',
        '.about-teaser__skills',
        '.philosophy__quote',
        '.philosophy__pillars',
        '.cta-section',
        '.section-label',
      ];

      document.querySelectorAll(selectors.join(', ')).forEach(el => {
        this.observer.observe(el);
      });
    },

    reveal(el) {
      el.classList.add('is-revealed');

      /* Special handlers */
      if (el.matches('.stats__item')) {
        const numEl = el.querySelector('[data-count]');
        if (numEl) Counter.start(numEl);
      }

      if (el.matches('.philosophy__quote')) {
        WordReveal.init(el.querySelector('[data-reveal="words"]'));
      }

      if (el.matches('.philosophy__pillars')) {
        el.classList.add('is-revealed');
      }

      if (el.matches('.cta-section')) {
        el.classList.add('is-revealed');
      }

      /* Unobserve after reveal - performance */
      if (this.observer) {
        this.observer.unobserve(el);
      }
    },
  };


  /* ===============================================================
     6. STATS COUNTER
  =============================================================== */

  const Counter = {

    start(el) {
      if (el.dataset.counted) return;
      el.dataset.counted = 'true';

      const target   = parseInt(el.dataset.count, 10);
      const duration = 1800; /* ms */
      const start    = performance.now();

      /* Ease out cubic */
      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function update(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = easeOutCubic(progress);
        const current  = Math.round(eased * target);

        /* Find the span inside dd */
        const numSpan = el.querySelector('.stats__num') || el;
        numSpan.textContent = current.toLocaleString('en-IN');

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          numSpan.textContent = target.toLocaleString('en-IN');
          numSpan.classList.add('is-counting');
          setTimeout(() => numSpan.classList.remove('is-counting'), 300);
        }
      }

      requestAnimationFrame(update);
    },
  };


  /* ===============================================================
     7. WORD-BY-WORD PHILOSOPHY REVEAL
  =============================================================== */

  const WordReveal = {

    init(el) {
      if (!el || el.dataset.wordRevealed) return;
      el.dataset.wordRevealed = 'true';

      if (prefersReduced) {
        el.style.opacity = '1';
        return;
      }

      /* Split text into word spans */
      const text  = el.innerHTML;
      const parts = text.split(/(\s+|<br\s*\/?>)/gi);

      el.innerHTML = parts.map(part => {
        if (part.match(/^\s+$/) || part.match(/<br/i)) return part;
        if (part.trim() === '') return part;
        return `<span class="word">${part}</span>`;
      }).join('');

      /* Stagger each word */
      const words = el.querySelectorAll('.word');
      words.forEach((word, i) => {
        word.style.transitionDelay = `${i * 0.04}s`;
      });

      /* Small delay then trigger */
      setTimeout(() => {
        el.classList.add('is-revealing');
      }, 100);
    },
  };


  /* ===============================================================
     8. GSAP SCROLL TRIGGER ANIMATIONS
     Runs after GSAP loads
  =============================================================== */

  const GSAPAnimations = {

    ctx: null,

    init() {
      if (typeof gsap === 'undefined' || prefersReduced) return;

      gsap.registerPlugin(ScrollTrigger);

      this.ctx = gsap.context(() => {
        this.heroParallax();
        this.projectsGrid();
        this.aboutSection();
        this.processSection();
        this.statsSection();
        this.ctaSection();
      });
    },

    /* Hero image slow parallax */
    heroParallax() {
      if (!DOM.heroImg) return;

      gsap.to(DOM.heroImg, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: DOM.hero,
          start:   'top top',
          end:     'bottom top',
          scrub:   true,
        },
      });
    },

    /* Projects grid - stagger in */
    projectsGrid() {
      const cards = document.querySelectorAll('.project-card');
      if (!cards.length) return;

      cards.forEach(card => card.classList.add('is-revealed'));

      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        cards.forEach(card => {
          card.style.opacity = '1';
          card.style.transform = 'none';
        });
        return;
      }

      gsap.fromTo(cards, {
        y:        70,
        opacity:  0,
      }, {
        scrollTrigger: {
          trigger: '.projects-grid',
          start:   'top 80%',
          toggleActions: 'play none none none',
        },
        y:        0,
        opacity:  1,
        duration: 0.9,
        ease:     'power3.out',
        stagger:  0.1,
        immediateRender: false,
        clearProps: 'transform,opacity',
      });
    },

    /* About - image reveal + text */
    aboutSection() {
      const container = document.querySelector('.about-teaser__container');
      if (!container) return;

      const img     = container.querySelector('.about-teaser__img-wrap');
      const content = container.querySelector('.about-teaser__content');

      if (img) {
        gsap.from(img, {
          scrollTrigger: {
            trigger: container,
            start:   'top 75%',
          },
          x:        -50,
          opacity:  0,
          duration: 1,
          ease:     'power3.out',
        });
      }

      if (content) {
        const children = content.children;
        gsap.from(children, {
          scrollTrigger: {
            trigger: container,
            start:   'top 70%',
          },
          y:        40,
          opacity:  0,
          duration: 0.8,
          ease:     'power3.out',
          stagger:  0.1,
        });
      }
    },

    /* Process - horizontal line reveal */
    processSection() {
      const steps = document.querySelectorAll('.process__step');
      if (!steps.length) return;

      gsap.from(steps, {
        scrollTrigger: {
          trigger: '.process__steps',
          start:   'top 80%',
          toggleActions: 'play none none none',
        },
        y:        50,
        opacity:  0,
        duration: 0.8,
        ease:     'power3.out',
        stagger:  0.15,
      });
    },

    /* Stats - count up already handled by IntersectionObserver
       GSAP adds the visual entrance */
    statsSection() {
      const grid = document.querySelector('.stats__grid');
      if (!grid) return;

      gsap.from(grid, {
        scrollTrigger: {
          trigger: grid,
          start:   'top 85%',
        },
        opacity:  0,
        y:        30,
        duration: 0.8,
        ease:     'power2.out',
      });
    },

    /* CTA - scale up from center */
    ctaSection() {
      const cta = document.querySelector('.cta-section__heading');
      if (!cta) return;

      gsap.from(cta, {
        scrollTrigger: {
          trigger: cta,
          start:   'top 85%',
        },
        scale:    0.94,
        opacity:  0,
        duration: 1,
        ease:     'power3.out',
      });
    },

    destroy() {
      if (this.ctx) this.ctx.revert();
    },
  };


  /* ===============================================================
     9. MOBILE MENU
  =============================================================== */

  const MobileMenu = {

    isOpen: false,
    hamburger: document.getElementById('navHamburger'),
    menu:      document.getElementById('mobileMenu'),
    closeBtn:  document.getElementById('mobileMenuClose'),
    focusableEls: null,

    init() {
      if (!this.hamburger || !this.menu) return;

      this.hamburger.addEventListener('click', () => this.open());
      this.closeBtn?.addEventListener('click', () => this.close());

      /* Close on backdrop click */
      this.menu.addEventListener('click', (e) => {
        if (e.target === this.menu) this.close();
      });

      /* Close on Escape */
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });

      /* Close on nav link click */
      this.menu.querySelectorAll('.mobile-menu__link').forEach(link => {
        link.addEventListener('click', () => this.close());
      });
    },

    open() {
      this.isOpen = true;
      this.menu.hidden = false;

      requestAnimationFrame(() => {
        this.menu.classList.add('is-open');
      });

      this.hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';

      /* Focus first link */
      setTimeout(() => {
        this.menu.querySelector('.mobile-menu__link')?.focus();
      }, 100);
    },

    close() {
      this.isOpen = false;
      this.menu.classList.remove('is-open');
      this.hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';

      /* Hide after animation */
      setTimeout(() => {
        this.menu.hidden = true;
      }, 600);

      this.hamburger.focus();
    },
  };


  /* ===============================================================
     10. PAGE TRANSITIONS
  =============================================================== */

  const PageTransition = {

    overlay: null,

    init() {
      /* Create overlay element */
      this.overlay = document.createElement('div');
      this.overlay.className = 'page-transition';
      document.body.appendChild(this.overlay);
      this.bindBFCacheReset();

      /* Intercept internal link clicks */
      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');

        /* Only internal links, not anchors, not external */
        if (!href ||
            href.startsWith('#') ||
            href.startsWith('http') ||
            href.startsWith('mailto') ||
            href.startsWith('tel') ||
            link.target === '_blank' ||
            prefersReduced) return;

        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigate(href);
        });
      });

      /* On page load - exit animation */
      if (!prefersReduced) {
        this.overlay.classList.add('is-leaving');
        setTimeout(() => {
          this.overlay.classList.remove('is-leaving');
        }, 500);
      }
    },

    navigate(href) {
      this.prepareOverlayForTransition();
      this.overlay.classList.add('is-entering');

      setTimeout(() => {
        window.location.href = href;
      }, 450);
    },

    prepareOverlayForTransition() {
      const overlay = this.overlay || document.querySelector('.page-transition');
      if (!overlay) return;

      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(overlay);
        gsap.set(overlay, { clearProps: 'opacity,visibility,pointerEvents,transform' });
      } else {
        overlay.style.opacity = '';
        overlay.style.visibility = '';
        overlay.style.pointerEvents = '';
        overlay.style.transform = '';
      }
    },

    bindBFCacheReset() {
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          this.resetOverlayState();
        }
      });

      window.addEventListener('pagehide', () => {
        this.resetOverlayState();
      });
    },

    resetOverlayState() {
      const overlay = this.overlay || document.querySelector('.page-transition');
      if (!overlay) return;

      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(overlay);
        gsap.set(overlay, {
          autoAlpha: 0,
          opacity: 0,
          pointerEvents: 'none',
          y: '100%',
        });
      } else {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';
        overlay.style.transform = 'translateY(100%)';
      }

      overlay.classList.remove('is-entering', 'is-leaving');
      document.documentElement.classList.remove('is-transitioning', 'is-loading', 'is-animating');
      document.body.classList.remove('is-transitioning', 'is-loading', 'is-animating');
    },
  };


  /* ===============================================================
     11. LAZY IMAGE LOADING ENHANCEMENT
  =============================================================== */

  const LazyImages = {

    init() {
      /* Native lazy loading handles most cases
         This adds a fade-in when images load */
      const imgs = document.querySelectorAll('img[loading="lazy"]');

      imgs.forEach(img => {
        if (img.complete) {
          img.style.opacity = '1';
          return;
        }

        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        img.addEventListener('load', () => {
          img.style.opacity = '1';
        });

        img.addEventListener('error', () => {
          /* Show placeholder on error */
          img.style.opacity   = '0.3';
          img.style.filter    = 'grayscale(1)';
          img.alt = img.alt || 'Image unavailable';
        });
      });
    },
  };


  /* ===============================================================
     12. WAIT FOR GSAP
     GSAP loads deferred - wait then init GSAP animations
  =============================================================== */

  function waitForGSAP(callback, attempts = 0) {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      callback();
    } else if (attempts < 20) {
      setTimeout(() => waitForGSAP(callback, attempts + 1), 100);
    }
  }


  /* ===============================================================
     INIT - Master Initialization
  =============================================================== */

  function init() {

    /* 1. Blueprint - runs first, triggers everything else */
    Blueprint.init();

    /* 2. Nav scroll behavior */
    NavScroll.init();

    /* 3. Scroll reveals - IntersectionObserver */
    ScrollReveal.init();

    /* 4. Mobile menu */
    MobileMenu.init();

    /* 5. Page transitions */
    PageTransition.init();

    /* 6. Lazy images */
    LazyImages.init();

    /* 7. GSAP - wait for CDN load */
    waitForGSAP(() => {
      GSAPAnimations.init();
    });

    /* 8. Cleanup on unload */
    window.addEventListener('beforeunload', () => {
      GSAPAnimations.destroy();
      KineticType.destroy();
    });
  }


  /* -- Public API -- */
  return { init };

})();


/* -------------------------------------------------------------
   INITIALIZE ON DOM READY
------------------------------------------------------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AnimationManager.init);
} else {
  AnimationManager.init();
}

window.AnimationManager = AnimationManager;
