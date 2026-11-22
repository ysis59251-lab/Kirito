(() => {
  'use strict';
  const FAV_KEY = 'animefume_favorites_v2';
  const HISTORY_KEY = 'animefume_watch_history_v2';
  const state = { items: [], query: '', category: 'all' };
  const $ = (selector) => document.querySelector(selector);
  const clean = (value) => String(value ?? '').trim();
  const read = (key) => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const keyOf = (item) => clean(item.id || item.link || item.title).toLowerCase();
  const favorites = () => read(FAV_KEY);
  const isFavorite = (item) => favorites().some((saved) => keyOf(saved) === keyOf(item));
  const normalizeLink = (item) => clean(item.link) || `folder-name/${clean(item.id).replace(/\.0$/, '')}.html`;
  const titleOf = (item) => clean(item.title) || 'ไม่มีชื่อเรื่อง';
  const isDub = (item) => /พากย์ไทย|พากย์/i.test(titleOf(item).replace(/\s+/g, ''));

  function card(item) {
    const link = document.createElement('a'); link.className = 'card'; link.href = normalizeLink(item); link.dataset.id = clean(item.id || item.anime || item.title);
    const poster = document.createElement('div'); poster.className = 'poster';
    const image = document.createElement('img'); image.src = clean(item.image); image.alt = titleOf(item); image.loading = 'lazy'; image.onerror = () => { image.style.opacity = '.18'; };
    const title = document.createElement('span'); title.className = 'card-title'; title.textContent = titleOf(item);
    const fav = document.createElement('button'); fav.type = 'button'; fav.className = `fav-toggle${isFavorite(item) ? ' active' : ''}`; fav.textContent = isFavorite(item) ? '★' : '☆'; fav.setAttribute('aria-label', 'เพิ่มหรือลบรายการโปรด');
    fav.onclick = (event) => { event.preventDefault(); event.stopPropagation(); toggleFavorite(item); renderAll(); };
    poster.append(image, title, fav); link.append(poster); return link;
  }

  function filtered() {
    const query = state.query.toLocaleLowerCase('th-TH');
    return state.items.filter((item) => (!query || titleOf(item).toLocaleLowerCase('th-TH').includes(query)) && (state.category === 'all' || (state.category === 'dub' ? isDub(item) : !isDub(item))));
  }

  function renderGrid(selector, items, empty = 'ยังไม่มีรายการ') {
    const grid = $(selector); if (!grid) return; grid.replaceChildren();
    if (!items.length) { const box = document.createElement('div'); box.className = 'empty'; box.textContent = empty; grid.append(box); return; }
    items.forEach((item) => grid.append(card(item)));
  }

  function toggleFavorite(item) {
    const saved = favorites(); const index = saved.findIndex((entry) => keyOf(entry) === keyOf(item));
    if (index >= 0) saved.splice(index, 1); else saved.unshift({ id: item.id, title: titleOf(item), image: item.image, link: normalizeLink(item), year: item.year });
    write(FAV_KEY, saved.slice(0, 100));
  }

  function renderContinue() {
    const box = $('#continue-list'); if (!box) return; box.replaceChildren();
    const items = read(HISTORY_KEY).slice(0, 8);
    $('#continue-count').textContent = items.length ? `${items.length} เรื่อง` : '';
    if (!items.length) { const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'เมื่อเริ่มดูอนิเมะ รายการที่ดูค้างไว้จะแสดงตรงนี้'; box.append(empty); return; }
    items.forEach((item) => { const link = document.createElement('a'); link.className = 'continue-card'; link.href = item.page || item.link || 'history.html'; const icon = document.createElement('div'); icon.className = 'continue-icon'; icon.textContent = '▶'; const info = document.createElement('div'); const title = document.createElement('div'); title.className = 'continue-title'; title.textContent = item.title || 'AnimeFume'; const ep = document.createElement('div'); ep.className = 'continue-ep'; ep.textContent = item.episode || 'เปิดเรื่องต่อ'; info.append(title, ep); link.append(icon, info); box.append(link); });
  }

  function renderHome() {
    const items = state.items; const hero = $('#hero'); const main = items[0];
    if (hero && main) { hero.style.setProperty('--hero-image', `url("${clean(main.image).replace(/"/g, '')}")`); hero.innerHTML = ''; const copy = document.createElement('div'); copy.className = 'hero-copy'; const eyebrow = document.createElement('div'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'AnimeFume • อัปเดตล่าสุด'; const h = document.createElement('h1'); h.textContent = titleOf(main); const p = document.createElement('p'); p.textContent = 'เลือกดูอนิเมะที่คุณชอบจากรายการล่าสุดของเรา'; const button = document.createElement('a'); button.className = 'primary'; button.href = normalizeLink(main); button.textContent = 'เริ่มดูเลย'; copy.append(eyebrow, h, p, button); hero.append(copy); }
    renderGrid('#trending-grid', items.slice(0, 8)); renderGrid('#latest-grid', items.slice(0, 20)); renderContinue();
  }

  function renderBrowse() { const list = filtered(); $('#browse-count').textContent = `พบ ${list.length.toLocaleString('th-TH')} เรื่อง`; renderGrid('#browse-grid', list, 'ไม่พบอนิเมะที่ตรงกับคำค้นหา'); }
  function renderMyList() { const list = favorites(); $('#mylist-count').textContent = `${list.length} เรื่อง`; renderGrid('#mylist-grid', list, 'ยังไม่มีอนิเมะในรายการโปรด'); }
  function renderAll() { renderHome(); renderBrowse(); renderMyList(); $('#fav-badge').textContent = favorites().length; }

  async function refreshCatalog(force = false) {
    const rows = await window.fetchAnimeFumeSheet('Sheet1', { force });
    const unique = new Map();
    rows.forEach((item) => { const key = keyOf(item); if (key && !unique.has(key)) unique.set(key, item); });
    state.items = [...unique.values()];
    renderAll();
    window.dispatchEvent(new CustomEvent('animefume:catalog-updated', { detail: { count: state.items.length } }));
  }
  window.refreshAnimeFumeCatalog = () => refreshCatalog(true);

  window.switchTab = (name) => { document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`)); document.querySelectorAll('[data-nav],[data-mobile-nav]').forEach((button) => button.classList.toggle('active', button.dataset.nav === name || button.dataset.mobileNav === name)); if (name === 'browse') renderBrowse(); if (name === 'mylist') renderMyList(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  window.handleHeaderSearch = (value) => { state.query = clean(value); $('#browse-input').value = state.query; switchTab('browse'); renderBrowse(); };

  document.addEventListener('DOMContentLoaded', async () => {
    $('#browse-input')?.addEventListener('input', (event) => { state.query = clean(event.target.value); renderBrowse(); });
    document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('active', item === button)); renderBrowse(); }));
    try { await refreshCatalog(); }
    catch { const error = document.createElement('div'); error.className = 'error'; error.textContent = 'โหลดรายการไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'; $('#latest-grid')?.replaceChildren(error); }
    window.setInterval(() => { if (!document.hidden) refreshCatalog(true).catch(() => {}); }, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshCatalog(true).catch(() => {}); });
  });
})();
