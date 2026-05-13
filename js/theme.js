/* ═══════════════════════════════════════════════════════════════
   GLOBAL ARCHITECTS — theme.js
   Time-Aware Color Palette System
   Industry First — No top architecture firm does this
   ═══════════════════════════════════════════════════════════════

   HOW IT WORKS:
   1. On load — reads current time via Date()
   2. Sets [data-theme] on <html> element
   3. CSS variables in style.css respond instantly
   4. Smooth 3s transition between palettes
   5. Manual toggle button always available
   6. User preference saved to localStorage
   7. Checks every 60 seconds for time changes
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const ThemeManager = (() => {

  /* ── Constants ── */
  const THEMES = {
    dawn:      { label: 'Dawn',      icon: '🌅', hours: [5,  8]  },
    morning:   { label: 'Morning',   icon: '☀️',  hours: [8,  12] },
    afternoon: { label: 'Afternoon', icon: '🌤️',  hours: [12, 17] },
    evening:   { label: 'Evening',   icon: '🌆', hours: [17, 20] },
    night:     { label: 'Night',     icon: '🌙', hours: [20, 24] },
  };

  /* Hours 0–5 also map to night */
  const THEME_ORDER = ['dawn', 'morning', 'afternoon', 'evening', 'night'];

  const STORAGE_KEY   = 'ga_theme_override';
  const STORAGE_AUTO  = 'ga_theme_auto';
  const HTML_EL       = document.documentElement;
  const TOGGLE_BTN    = document.getElementById('themeToggle');

  let currentTheme    = 'morning';
  let isManualOverride = false;
  let checkInterval   = null;


  /* ─────────────────────────────────────────────────────────────
     GET THEME FROM TIME
     Returns theme name based on current hour
  ───────────────────────────────────────────────────────────── */
  function getThemeFromTime() {
    const hour = new Date().getHours();

    if (hour >= 5  && hour < 8)  return 'dawn';
    if (hour >= 8  && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night'; /* 20–24 and 0–5 */
  }


  /* ─────────────────────────────────────────────────────────────
     APPLY THEME
     Sets data-theme on <html>, updates button icon
  ───────────────────────────────────────────────────────────── */
  function applyTheme(themeName, animate = true) {
    if (!THEMES[themeName]) return;

    /* Skip if same theme already applied */
    if (HTML_EL.getAttribute('data-theme') === themeName) return;

    currentTheme = themeName;

    /* Apply — CSS transitions handle the smooth change */
    HTML_EL.setAttribute('data-theme', themeName);

    /* Update toggle button icon */
    updateToggleButton(themeName);

    /* Announce to screen readers */
    announceThemeChange(themeName);

    /* Store current auto-detected theme */
    if (!isManualOverride) {
      try {
        sessionStorage.setItem(STORAGE_AUTO, themeName);
      } catch(e) {}
    }
  }


  /* ─────────────────────────────────────────────────────────────
     UPDATE TOGGLE BUTTON
  ───────────────────────────────────────────────────────────── */
  function updateToggleButton(themeName) {
    if (!TOGGLE_BTN) return;

    const theme = THEMES[themeName];
    const isDark = themeName === 'evening' || themeName === 'night';

    /* Swap icon — sun for light themes, moon for dark */
    TOGGLE_BTN.innerHTML = isDark
      ? `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="18" height="18">
           <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
                 stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="18" height="18">
           <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5"/>
           <line x1="12" y1="2"  x2="12" y2="4"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <line x1="2"  y1="12" x2="4"  y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
         </svg>`;

    TOGGLE_BTN.setAttribute(
      'aria-label',
      `Current: ${theme.label} mode. Click to cycle themes.`
    );

    /* Add tooltip */
    TOGGLE_BTN.title = isManualOverride
      ? `${theme.label} mode (manual) — click to cycle`
      : `${theme.label} mode (auto) — click to cycle`;
  }


  /* ─────────────────────────────────────────────────────────────
     CYCLE THEMES (manual toggle)
     Goes through: dawn → morning → afternoon → evening → night → auto
  ───────────────────────────────────────────────────────────── */
  function cycleTheme() {
    const currentIdx = THEME_ORDER.indexOf(currentTheme);
    const nextIdx    = (currentIdx + 1) % THEME_ORDER.length;
    const nextTheme  = THEME_ORDER[nextIdx];

    /* Check if we've cycled all 5 — go back to auto */
    if (nextIdx === 0 && isManualOverride) {
      enableAutoMode();
      return;
    }

    isManualOverride = true;

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch(e) {}

    applyTheme(nextTheme);

    /* Show temporary indicator */
    showThemeIndicator(nextTheme);
  }


  /* ─────────────────────────────────────────────────────────────
     ENABLE AUTO MODE
     Resets to time-based automatic palette
  ───────────────────────────────────────────────────────────── */
  function enableAutoMode() {
    isManualOverride = false;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch(e) {}

    const autoTheme = getThemeFromTime();
    applyTheme(autoTheme);
    showThemeIndicator(autoTheme, true);
  }


  /* ─────────────────────────────────────────────────────────────
     THEME INDICATOR
     Small toast showing current theme name
  ───────────────────────────────────────────────────────────── */
  function showThemeIndicator(themeName, isAuto = false) {
    /* Remove existing */
    const existing = document.getElementById('themeIndicator');
    if (existing) existing.remove();

    const theme = THEMES[themeName];
    const indicator = document.createElement('div');
    indicator.id = 'themeIndicator';

    indicator.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background-color: var(--bg-elevated);
      color: var(--text-secondary);
      border: 1px solid var(--border-primary);
      border-radius: 100px;
      padding: 0.5rem 1.25rem;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      z-index: 999;
      pointer-events: none;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      white-space: nowrap;
    `;

    indicator.textContent = isAuto
      ? `Auto: ${theme.label} Mode`
      : `${theme.label} Mode`;

    document.body.appendChild(indicator);

    /* Animate in */
    requestAnimationFrame(() => {
      indicator.style.transform = 'translateX(-50%) translateY(0)';
      indicator.style.opacity   = '1';
    });

    /* Animate out after 2s */
    setTimeout(() => {
      indicator.style.transform = 'translateX(-50%) translateY(80px)';
      indicator.style.opacity   = '0';
      setTimeout(() => indicator.remove(), 400);
    }, 2000);
  }


  /* ─────────────────────────────────────────────────────────────
     ANNOUNCE TO SCREEN READERS
  ───────────────────────────────────────────────────────────── */
  function announceThemeChange(themeName) {
    const theme = THEMES[themeName];

    let announcer = document.getElementById('themeAnnouncer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'themeAnnouncer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        width: 1px; height: 1px;
        padding: 0; margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
    }

    announcer.textContent = `Theme changed to ${theme.label} mode`;
  }


  /* ─────────────────────────────────────────────────────────────
     AUTO CHECK — runs every 60 seconds
     Detects when time crosses a threshold
  ───────────────────────────────────────────────────────────── */
  function startAutoCheck() {
    if (checkInterval) clearInterval(checkInterval);

    checkInterval = setInterval(() => {
      if (isManualOverride) return;

      const timeTheme = getThemeFromTime();
      if (timeTheme !== currentTheme) {
        applyTheme(timeTheme);
      }
    }, 60 * 1000); /* Every 60 seconds */
  }


  /* ─────────────────────────────────────────────────────────────
     RESTORE PREFERENCE
     Check localStorage for manual override
  ───────────────────────────────────────────────────────────── */
  function restorePreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES[saved]) {
        isManualOverride = true;
        return saved;
      }
    } catch(e) {}
    return null;
  }


  /* ─────────────────────────────────────────────────────────────
     BIND EVENTS
  ───────────────────────────────────────────────────────────── */
  function bindEvents() {
    /* Theme toggle button */
    if (TOGGLE_BTN) {
      TOGGLE_BTN.addEventListener('click', cycleTheme);
    }

    /* Keyboard shortcut: Alt + T to cycle themes */
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        cycleTheme();
      }
    });

    /* Page visibility change — re-check time when tab becomes active */
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !isManualOverride) {
        const timeTheme = getThemeFromTime();
        if (timeTheme !== currentTheme) {
          applyTheme(timeTheme);
        }
      }
    });
  }


  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    /* 1. Check for saved manual override */
    const savedTheme = restorePreference();

    /* 2. Determine initial theme */
    const initialTheme = savedTheme || getThemeFromTime();

    /* 3. Apply immediately (no animation on first load) */
    HTML_EL.setAttribute('data-theme', initialTheme);
    currentTheme = initialTheme;

    /* 4. Update button */
    updateToggleButton(initialTheme);

    /* 5. Start auto-check interval */
    startAutoCheck();

    /* 6. Bind events */
    bindEvents();

    /* 7. Dev mode helper */
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
      console.log(
        `%c Global Architects — Theme System %c\n` +
        `Current: ${initialTheme}\n` +
        `Auto mode: ${!isManualOverride}\n` +
        `Time: ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')}\n` +
        `\nHint: Press Alt+T to cycle themes manually`,
        'background:#8B6914;color:#fff;padding:4px 8px;font-weight:bold',
        'color:#8B6914'
      );
    }
  }


  /* ── Public API ── */
  return {
    init,
    getTheme:     () => currentTheme,
    setTheme:     (name) => { isManualOverride = true; applyTheme(name); },
    enableAuto:   enableAutoMode,
    cycleTheme,
    getThemeFromTime,
  };

})();


/* ─────────────────────────────────────────────────────────────
   INITIALIZE ON DOM READY
───────────────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ThemeManager.init);
} else {
  ThemeManager.init();
}

/* Expose to window for other scripts */
window.ThemeManager = ThemeManager;