/* AnimeFume Core — shared systems bridge */
(() => {
  'use strict';

  const AF = window.AnimeFume = window.AnimeFume || {};
  AF.version = '2.1.0';

  AF.keys = Object.assign({
    favorites: 'animefume_favorites_v2',
    history: 'animefume_watch_history_v2'
  }, AF.keys || {});

  const safeJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const saveJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('animefume:data', {
        detail: { key, value }
      }));
      return true;
    } catch (error) {
      console.warn('[AnimeFume] localStorage save failed:', error);
      return false;
    }
  };

  const normalize = value =>
    String(value ?? '')
      .normalize('NFKC')
      .trim()
      .toLowerCase();

  const identity = item => {
    if (!item) return '';
    return normalize(item.id || item.link || item.href || item.title || '');
  };

  const normalizeItem = item => {
    if (!item || typeof item !== 'object') return null;

    const normalized = {
      id: String(item.id ?? '').trim(),
      title: String(item.title ?? '').trim(),
      image: String(item.image ?? '').trim(),
      link: String(item.link ?? item.href ?? '').trim(),
      year: String(item.year ?? '').trim()
    };

    normalized.id = normalized.id || normalized.link || normalized.title;
    return normalized.id ? normalized : null;
  };

  AF.normalize = normalize;
  AF.identity = identity;

  /* =========================
     FAVORITES
  ========================= */

  AF.getFavorites = () => {
    const list = safeJSON(AF.keys.favorites, []);
    return Array.isArray(list)
      ? list.map(normalizeItem).filter(Boolean)
      : [];
  };

  AF.setFavorites = list => {
    const clean = Array.isArray(list)
      ? list.map(normalizeItem).filter(Boolean)
      : [];

    const unique = [];
    const seen = new Set();

    for (const item of clean) {
      const key = identity(item);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length >= 100) break;
    }

    return saveJSON(AF.keys.favorites, unique);
  };

  AF.isFavorite = item => {
    const key = identity(item);
    return !!key && AF.getFavorites().some(x => identity(x) === key);
  };

  AF.toggleFavorite = item => {
    const normalized = normalizeItem(item);
    if (!normalized) return false;

    const list = AF.getFavorites();
    const key = identity(normalized);
    const index = list.findIndex(x => identity(x) === key);

    if (index >= 0) {
      list.splice(index, 1);
      AF.setFavorites(list);
      return false;
    }

    list.unshift(normalized);
    AF.setFavorites(list);
    return true;
  };

  /* =========================
     WATCH HISTORY
  ========================= */

  AF.getHistory = () => {
    const list = safeJSON(AF.keys.history, []);
    return Array.isArray(list)
      ? list.map(item => ({
          ...normalizeItem(item),
          watchedAt: Number(item?.watchedAt) || 0
        })).filter(Boolean)
      : [];
  };

  AF.addHistory = item => {
    const normalized = normalizeItem(item);
    if (!normalized) return;

    const key = identity(normalized);
    const list = AF.getHistory().filter(x => identity(x) !== key);

    list.unshift({
      ...normalized,
      watchedAt: Date.now()
    });

    saveJSON(AF.keys.history, list.slice(0, 30));
  };

  AF.clearHistory = () => saveJSON(AF.keys.history, []);

  /* =========================
     SEARCH
  ========================= */

  AF.search = query => {
    const q = normalize(query);
    if (!q) return false;

    location.href = 'search.html?q=' + encodeURIComponent(q);
    return true;
  };

  /* =========================
     CROSS-TAB SYNC
  ========================= */

  window.addEventListener('storage', event => {
    if (
      event.key === AF.keys.favorites ||
      event.key === AF.keys.history
    ) {
      window.dispatchEvent(new CustomEvent('animefume:data', {
        detail: {
          key: event.key,
          external: true
        }
      }));
    }
  });

  /* =========================
     CARD → HISTORY / VIEW EVENT
     Do not trigger for buttons inside cards.
  ========================= */

  document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest('a[href]');
    if (!link || event.defaultPrevented) return;

    if (target.closest('button, input, textarea, select, [data-no-history]')) {
      return;
    }

    const card = link.closest(
      '.anime-card,.sheet2-card,.anime-item,.card'
    );

    if (!card) return;

    const title =
      card.dataset.title ||
      card.querySelector('.overlay,h3,h2,b')?.textContent?.trim() ||
      '';

    const image =
      card.querySelector('img')?.currentSrc ||
      card.querySelector('img')?.src ||
      '';

    const item = normalizeItem({
      id: card.dataset.id || link.getAttribute('href') || title,
      title,
      image,
      link: link.href,
      year: card.dataset.year || ''
    });

    if (!item) return;

    AF.addHistory(item);

    window.dispatchEvent(new CustomEvent('animefume:view', {
      detail: item
    }));
  }, true);

  /* =========================
     PAGE TELEMETRY
  ========================= */

  try {
    sessionStorage.setItem(
      'animefume_last_page',
      location.pathname || '/'
    );
    sessionStorage.setItem(
      'animefume_last_page_at',
      String(Date.now())
    );
  } catch {}

  /* =========================
     GLOBAL TOAST
  ========================= */

  AF.toast = message => {
    let el = document.getElementById('afCoreToast');

    if (!el) {
      el = document.createElement('div');
      el.id = 'afCoreToast';

      el.style.cssText =
        'position:fixed;left:50%;bottom:22px;' +
        'transform:translate(-50%,18px);opacity:0;' +
        'z-index:10050;background:#111;color:#fff;' +
        'border:1px solid #333;border-radius:14px;' +
        'padding:10px 15px;transition:.2s;' +
        'box-shadow:0 10px 30px #000;pointer-events:none;' +
        'font:14px system-ui;max-width:90%;text-align:center;';

      (document.body || document.documentElement).appendChild(el);
    }

    el.textContent = String(message || '');
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,0)';

    clearTimeout(AF.__toastTimer);
    AF.__toastTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,18px)';
    }, 1800);
  };

  document.documentElement.dataset.animefumeCore = AF.version;
})();
