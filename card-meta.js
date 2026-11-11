(() => {
  'use strict';

  const episodeText = (title) => {
    const text = String(title || '').replace(/\s+/g, ' ').trim();
    const match = text.match(/ตอน(?:ที่)?\s*([0-9]+)\s*(?:[-–—ถึง]\s*([0-9]+))?/i);
    if (!match) return 'จำนวนตอนยังไม่ระบุ';
    const first = Number(match[1]);
    const last = Number(match[2] || match[1]);
    if (!Number.isFinite(first) || !Number.isFinite(last)) return 'จำนวนตอนยังไม่ระบุ';
    return `${Math.max(first, last)} ตอน`;
  };

  const languageText = (title) => {
    const text = String(title || '').replace(/\s+/g, '').toLowerCase();
    const page = location.pathname.toLowerCase();
    const hasDub = page.endsWith('index3.html') || text.includes('พากย์ไทย') || text.includes('พากย์');
    return hasDub ? 'พากย์ไทย' : 'ซับไทย';
  };

  const decorate = (card) => {
    const title = [
      card.dataset.title || '',
      card.querySelector('.overlay')?.textContent || '',
      card.textContent || ''
    ].join(' ');
    const label = languageText(title);
    card.dataset.afLanguage = label === 'พากย์ไทย' ? 'dub' : 'sub';
    const existing = card.querySelector(':scope > .af-card-meta');
    if (existing) {
      const language = existing.querySelector('.af-card-language');
      if (language && language.textContent !== label) language.textContent = label;
      return;
    }
    const meta = document.createElement('div');
    meta.className = 'af-card-meta';
    const episodes = document.createElement('span');
    episodes.className = 'af-card-episodes';
    episodes.textContent = `▣ ${episodeText(title)}`;
    const language = document.createElement('span');
    language.className = 'af-card-language';
    language.textContent = label;
    language.dataset.type = card.dataset.afLanguage;
    meta.append(episodes, language);
    card.append(meta);
  };

  const applyCategory = (card) => {
    const page = location.pathname.toLowerCase();
    const required = page.endsWith('index3.html') ? 'dub' : page.endsWith('index2.html') ? 'sub' : '';
    if (!required) return;
    const shouldShow = card.dataset.afLanguage === required;
    const desired = shouldShow ? '' : 'none';
    if (card.style.display !== desired) card.style.display = desired;
  };

  const scan = () => document.querySelectorAll('.anime-card, .hot-card').forEach((card) => {
    decorate(card);
    applyCategory(card);
  });
  const list = document.getElementById('animeList');
  const hot = document.getElementById('hotSlider');
  const observer = new MutationObserver(scan);
  if (list) observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  if (hot) observer.observe(hot, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  scan();
})();
