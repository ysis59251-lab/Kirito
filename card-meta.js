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
    const hasSub = page.endsWith('index2.html') || text.includes('ซับไทย') || text.includes('ซับ');
    if (hasDub && hasSub) return 'พากย์ไทย • ซับไทย';
    if (hasDub) return 'พากย์ไทย';
    if (hasSub) return 'ซับไทย';
    return 'ยังไม่ระบุภาษา';
  };

  const decorate = (card) => {
    if (card.querySelector(':scope > .af-card-meta')) return;
    const title = [
      card.dataset.title || '',
      card.querySelector('.overlay')?.textContent || '',
      card.textContent || ''
    ].join(' ');
    const meta = document.createElement('div');
    meta.className = 'af-card-meta';
    const episodes = document.createElement('span');
    episodes.className = 'af-card-episodes';
    episodes.textContent = `▣ ${episodeText(title)}`;
    const language = document.createElement('span');
    language.className = 'af-card-language';
    language.textContent = languageText(title);
    if (language.textContent.includes('พากย์ไทย')) language.dataset.type = 'dub';
    else if (language.textContent.includes('ซับไทย')) language.dataset.type = 'sub';
    meta.append(episodes, language);
    card.append(meta);
  };

  const scan = () => document.querySelectorAll('.anime-card, .hot-card').forEach(decorate);
  const list = document.getElementById('animeList');
  const hot = document.getElementById('hotSlider');
  const observer = new MutationObserver(scan);
  if (list) observer.observe(list, { childList: true, subtree: true });
  if (hot) observer.observe(hot, { childList: true, subtree: true });
  scan();
})();
