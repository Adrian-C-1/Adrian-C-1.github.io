(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'margin-notes-theme';
  let savedTheme;
  let activeTransition;
  let sweepTimeout;

  try { savedTheme = localStorage.getItem(storageKey); } catch {}
  if (!['light', 'dark'].includes(savedTheme)) savedTheme = null;

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const button = document.querySelector('.theme-toggle');
    const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    button?.setAttribute('aria-label', label);
    button?.setAttribute('title', label);
    button?.setAttribute('aria-pressed', String(theme === 'dark'));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141616' : '#f6f6f2');
  }

  applyTheme(savedTheme || (preference.matches ? 'dark' : 'light'));
  root.classList.add('js');

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    applyTheme(root.dataset.theme);
    button.addEventListener('click', async () => {
      const theme = (savedTheme || root.dataset.theme) === 'dark' ? 'light' : 'dark';
      savedTheme = theme;
      try { localStorage.setItem(storageKey, theme); } catch {}

      if (reducedMotion.matches) {
        activeTransition?.skipTransition();
        applyTheme(theme);
        return;
      }

      if (!document.startViewTransition) {
        applyTheme(theme);
        root.classList.remove('theme-sweeping');
        requestAnimationFrame(() => root.classList.add('theme-sweeping'));
        clearTimeout(sweepTimeout);
        sweepTimeout = setTimeout(() => root.classList.remove('theme-sweeping'), 650);
        return;
      }

      const bounds = button.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const radius = Math.hypot(Math.max(centerX, innerWidth - centerX), Math.max(centerY, innerHeight - centerY));
      activeTransition?.skipTransition();
      activeTransition = document.startViewTransition(() => applyTheme(theme));
      try {
        await activeTransition.ready;
        root.animate({ clipPath: [`circle(0px at ${centerX}px ${centerY}px)`, `circle(${radius}px at ${centerX}px ${centerY}px)`] }, {
          duration: 560,
          easing: 'cubic-bezier(.22, 1, .36, 1)',
          pseudoElement: '::view-transition-new(root)'
        });
      } catch {
        applyTheme(savedTheme || (preference.matches ? 'dark' : 'light'));
      }
    });
  });

  preference.addEventListener('change', () => {
    if (!savedTheme) applyTheme(preference.matches ? 'dark' : 'light');
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    savedTheme = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
    applyTheme(savedTheme || (preference.matches ? 'dark' : 'light'));
  });
})();