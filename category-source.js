(() => {
  'use strict';
  const SOURCE = 'https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1';
  const PER_PAGE = 40;
  const pageType = location.pathname.toLowerCase().endsWith('index3.html') ? 'dub' : 'sub';
  let allItems = [];
  let visibleItems = [];
  let currentPage = 1;

  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const isDub = (title) => /พากย์ไทย|พากย์/i.test(clean(title).replace(/\s+/g, ''));
  const categoryOf = (item) => isDub(item.title) ? 'dub' : 'sub';
  const canonicalKey = (item) => {
    const id = clean(item.id);
    if (id) return `id:${id.toLowerCase()}`;
    const link = clean(item.link).toLowerCase().replace(/^\.\//, '').replace(/\\/g, '/');
    if (link) return `link:${link}`;
    return `title:${clean(item.title).toLowerCase()}`;
  };
  const normalizeLink = (value, id) => {
    const link = clean(value);
    if (link) return link.replace(/^folder-name(\d+\.html)$/i, 'folder-name/$1');
    return `folder-name/${encodeURIComponent(id)}.html`;
  };

  const makeCard = (item) => {
    const card = document.createElement('a');
    card.className = 'anime-card';
    card.href = normalizeLink(item.link, item.id);
    card.dataset.id = clean(item.id) || canonicalKey(item);
    card.dataset.year = clean(item.year) || '0';
    card.dataset.search = '1';
    card.dataset.title = clean(item.title) || 'ไม่มีชื่อเรื่อง';
    const imageBox = document.createElement('div');
    imageBox.className = 'card-img';
    const image = document.createElement('img');
    image.src = clean(item.image);
    image.alt = card.dataset.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.textContent = card.dataset.title;
    imageBox.append(image, overlay);
    card.append(imageBox);
    return card;
  };

  const renderHot = () => {
    const box = document.getElementById('hotSlider');
    if (!box) return;
    box.replaceChildren(...allItems.slice(0, 10).map((item) => {
      const link = document.createElement('a');
      link.className = 'hot-card';
      link.href = normalizeLink(item.link, item.id);
      link.dataset.title = clean(item.title);
      const image = document.createElement('img');
      image.src = clean(item.image); image.alt = clean(item.title); image.loading = 'lazy';
      const title = document.createElement('div'); title.className = 'overlay'; title.textContent = clean(item.title);
      link.append(image, title);
      return link;
    }));
  };

  const renderNumbers = () => {
    const box = document.getElementById('numberBox');
    if (!box) return;
    const pages = Math.max(1, Math.ceil(visibleItems.length / PER_PAGE));
    box.replaceChildren();
    for (let page = 1; page <= pages; page += 1) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'num' + (page === currentPage ? ' active' : '');
      button.textContent = String(page);
      button.addEventListener('click', () => { currentPage = page; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      box.append(button);
    }
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    if (prev) { prev.disabled = currentPage <= 1; prev.onclick = () => { if (currentPage > 1) { currentPage -= 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }; }
    if (next) { next.disabled = currentPage >= pages; next.onclick = () => { if (currentPage < pages) { currentPage += 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }; }
  };

  const render = () => {
    const list = document.getElementById('animeList');
    if (!list) return;
    const start = (currentPage - 1) * PER_PAGE;
    list.replaceChildren(...visibleItems.slice(start, start + PER_PAGE).map(makeCard));
    renderNumbers();
    document.getElementById('afLoading')?.classList.add('af-load-hide');
  };

  const setupSearch = () => {
    const input = document.querySelector('.search');
    if (!input) return;
    input.addEventListener('input', () => {
      const query = clean(input.value).toLowerCase();
      visibleItems = allItems.filter((item) => clean(item.title).toLowerCase().includes(query));
      currentPage = 1; render();
    });
  };

  const setupMenuHelpers = () => {
    const bottom = document.getElementById('bottomNav');
    window.toggleBottom = () => bottom?.classList.toggle('show');
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const load = async () => {
    try {
      const response = await fetch(SOURCE, { cache: 'no-store' });
      if (!response.ok) throw new Error(`source ${response.status}`);
      const rows = await response.json();
      const unique = new Map();
      rows.forEach((item) => {
        const key = canonicalKey(item);
        if (key !== 'title:' && !unique.has(key)) unique.set(key, item);
      });
      allItems = [...unique.values()]
        .filter((item) => categoryOf(item) === pageType)
        .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      visibleItems = allItems.slice();
      renderHot(); render();
    } catch (error) {
      console.warn('AnimeFume category source unavailable', error);
      document.getElementById('afLoading')?.classList.add('af-load-hide');
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    setupMenuHelpers(); setupSearch(); load();
  }, { once: true });
})();
