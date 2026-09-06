/* AnimeFume mobile menu drawer fix */
(() => {
  const init = () => {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('menuDropdown');
    if (!btn || !menu || btn.dataset.afMenuFix === '1') return;

    btn.dataset.afMenuFix = '1';
    menu.classList.remove('af-menu-open');
    menu.style.display = 'flex';
    menu.setAttribute('aria-hidden', 'true');

    const close = () => {
      menu.classList.remove('af-menu-open');
      menu.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
      menu.classList.add('af-menu-open');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
    };

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (menu.classList.contains('af-menu-open')) close();
      else open();
    };

    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== btn) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
