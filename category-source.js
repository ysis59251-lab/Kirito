(() => {
  'use strict';
  const SOURCE = 'https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1';
  const isDub = (title) => /พากย์ไทย|พากย์/i.test(String(title || '').replace(/\s+/g, ''));
  const normalizeLink = (value, id) => {
    const link = String(value || '').trim();
    if (link) return link.replace(/^folder-name(\d+\.html)$/i, 'folder-name/$1');
    return `folder-name/${encodeURIComponent(id)}.html`;
  };
  const makeCard = (item) => {
    const card = document.createElement('a');
    card.className = 'anime-card';
    card.href = normalizeLink(item.link, item.id);
    card.dataset.id = item.id || item.title || card.href;
    card.dataset.year = item.year || '0';
    card.dataset.search = '1';
    card.dataset.title = item.title || 'ไม่มีชื่อเรื่อง';
    const imageBox = document.createElement('div');
    imageBox.className = 'card-img';
    const image = document.createElement('img');
    image.src = item.image || '';
    image.alt = item.title || '';
    image.loading = 'lazy';
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.textContent = item.title || 'ไม่มีชื่อเรื่อง';
    imageBox.append(image, overlay);
    card.append(imageBox);
    return card;
  };
  const load = async () => {
    const list = document.getElementById('animeList');
    if (!list) return;
    const target = location.pathname.toLowerCase().endsWith('index3.html') ? 'dub' : 'sub';
    try {
      const response = await fetch(SOURCE, { cache: 'no-store' });
      if (!response.ok) throw new Error(`source ${response.status}`);
      const rows = await response.json();
      const existing = new Set([...list.querySelectorAll('.anime-card')].map((card) => card.dataset.id || card.href));
      const uniqueRows = new Map();
      rows.forEach((item) => {
        const key = String(item.id || item.title || item.link || '');
        if (key && !uniqueRows.has(key)) uniqueRows.set(key, item);
      });
      [...uniqueRows.values()].filter((item) => (isDub(item.title) ? 'dub' : 'sub') === target).forEach((item) => {
        const key = String(item.id || item.title || item.link || '');
        if (!key || existing.has(key)) return;
        list.append(makeCard(item));
        existing.add(key);
      });
      list.dispatchEvent(new CustomEvent('animefume:category-source-ready'));
    } catch (error) {
      console.warn('AnimeFume category source unavailable', error);
    }
  };
  window.addEventListener('DOMContentLoaded', () => window.setTimeout(load, 900), { once: true });
})();
