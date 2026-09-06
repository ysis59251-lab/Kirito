/* AnimeFume Core — shared systems bridge */
(() => {
  'use strict';
  const AF = window.AnimeFume = window.AnimeFume || {};
  AF.version = '2.0.0';
  AF.keys = Object.assign({
    favorites: 'animefume_favorites_v2',
    history: 'animefume_watch_history_v2'
  }, AF.keys || {});

  const safeJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const saveJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('animefume:data', {detail:{key,value}})); return true; }
    catch { return false; }
  };
  const normalize = v => String(v ?? '').normalize('NFKC').trim().toLowerCase();
  const identity = item => normalize(item?.id || item?.link || item?.title || '');

  AF.normalize = normalize;
  AF.getFavorites = () => safeJSON(AF.keys.favorites, []);
  AF.setFavorites = list => saveJSON(AF.keys.favorites, Array.isArray(list) ? list.slice(0,100) : []);
  AF.isFavorite = item => AF.getFavorites().some(x => identity(x) === identity(item));
  AF.toggleFavorite = item => {
    const list = AF.getFavorites();
    const i = list.findIndex(x => identity(x) === identity(item));
    if (i >= 0) list.splice(i,1); else list.unshift(item);
    AF.setFavorites(list);
    return i < 0;
  };

  AF.getHistory = () => safeJSON(AF.keys.history, []);
  AF.addHistory = item => {
    if (!item) return;
    const list = AF.getHistory().filter(x => identity(x) !== identity(item));
    list.unshift(Object.assign({}, item, {watchedAt: Date.now()}));
    saveJSON(AF.keys.history, list.slice(0,30));
  };
  AF.clearHistory = () => saveJSON(AF.keys.history, []);

  // Keep old and new pages synchronized when favorites/history change in another tab.
  window.addEventListener('storage', e => {
    if (e.key === AF.keys.favorites || e.key === AF.keys.history) {
      window.dispatchEvent(new CustomEvent('animefume:data', {detail:{key:e.key}}));
    }
  });

  // Global search helper. Existing page-specific search functions continue to work.
  AF.search = query => {
    const q = normalize(query);
    if (!q) return;
    location.href = 'search.html?q=' + encodeURIComponent(q);
  };

  // Make links opened from cards consistently count as a watch/history action.
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented) return;
    const card = link.closest('.anime-card,.sheet2-card,.anime-item,.card');
    if (!card) return;
    const title = card.dataset.title || card.querySelector('.overlay,h3,h2,b')?.textContent?.trim() || '';
    const image = card.querySelector('img')?.currentSrc || card.querySelector('img')?.src || '';
    const item = {id:card.dataset.id || link.getAttribute('href') || title,title,image,link:link.href,year:card.dataset.year || ''};
    AF.addHistory(item);
    window.dispatchEvent(new CustomEvent('animefume:view', {detail:item}));
  }, true);

  // Lightweight page telemetry that does not replace Firebase's existing counters.
  const pageKey = location.pathname || '/';
  try {
    const stamp = Date.now();
    sessionStorage.setItem('animefume_last_page', pageKey);
    sessionStorage.setItem('animefume_last_page_at', String(stamp));
  } catch {}

  // Allow every page to request a unified status/toast without requiring a framework.
  AF.toast = msg => {
    let el = document.getElementById('afCoreToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'afCoreToast';
      el.style.cssText='position:fixed;left:50%;bottom:22px;transform:translate(-50%,18px);opacity:0;z-index:10050;background:#111;color:#fff;border:1px solid #333;border-radius:14px;padding:10px 15px;transition:.2s;box-shadow:0 10px 30px #000;pointer-events:none;font:14px system-ui;max-width:90%;text-align:center';
      document.body.appendChild(el);
    }
    el.textContent = String(msg || ''); el.style.opacity='1'; el.style.transform='translate(-50%,0)';
    clearTimeout(AF.__toastTimer); AF.__toastTimer=setTimeout(()=>{el.style.opacity='0';el.style.transform='translate(-50%,18px)'},1800);
  };

  document.documentElement.dataset.animefumeCore = AF.version;
})();
