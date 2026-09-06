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

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.id = 'afMenuBackdrop';
    backdrop.setAttribute('aria-label', 'ปิดเมนู');
    backdrop.hidden = true;
    document.body.appendChild(backdrop);

    const close = () => {
      menu.classList.remove('af-menu-open');
      menu.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      backdrop.hidden = true;
      document.body.classList.remove('af-menu-lock');
    };

    const open = () => {
      menu.classList.add('af-menu-open');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      backdrop.hidden = false;
      document.body.classList.add('af-menu-lock');
      menu.querySelector('a')?.focus({preventScroll:true});
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.contains('af-menu-open') ? close() : open();
    });

    backdrop.addEventListener('click', close);
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && menu.classList.contains('af-menu-open')) {
        const links = [...menu.querySelectorAll('a')];
        if (!links.length) return;
        const first = links[0], last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    const style = document.createElement('style');
    style.textContent = `
      #afMenuBackdrop{position:fixed;inset:0;border:0;padding:0;margin:0;background:rgba(0,0,0,.58);backdrop-filter:blur(2px);z-index:2147483645;cursor:pointer}
      #afMenuBackdrop[hidden]{display:none!important}
      body.af-menu-lock{overflow:hidden!important}
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
