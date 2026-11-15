(() => {
  'use strict';

  const start = () => {
    const container = document.getElementById('animeList');
    const load = window.fetchAnimeFumeSheet;
    if (!container || typeof load !== 'function' || container.children.length) return;

    load('Sheet1').then((rows) => {
      if (container.children.length) return;
      const fragment = document.createDocumentFragment();
      rows.forEach((row) => {
        const title = String(row.title || 'ไม่มีชื่อ');
        const id = String(row.id || title);
        const card = document.createElement('a');
        card.className = 'anime-card';
        card.href = String(row.link || `folder-name/${id}.html`)
          .replace(/^folder-name(\d+\.html)$/i, 'folder-name/$1');
        card.dataset.id = id;
        card.dataset.title = title;
        card.dataset.year = String(row.year || '0');
        card.dataset.search = '1';
        card.dataset.hidden = String(row.hidden || '').toUpperCase() === 'TRUE' ? '1' : '0';

        const wrap = document.createElement('div');
        wrap.className = 'card-img';
        const image = document.createElement('img');
        image.src = String(row.image || '');
        image.loading = 'lazy';
        image.alt = title;
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.textContent = title;
        wrap.append(image, overlay);
        card.appendChild(wrap);
        fragment.appendChild(card);
      });
      container.appendChild(fragment);
      document.dispatchEvent(new CustomEvent('animefume:data-ready', { detail: { count: rows.length, fallback: true } }));
    }).catch((error) => {
      console.error('[AnimeFume] โหลดรายการสำรองไม่สำเร็จ', error);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
