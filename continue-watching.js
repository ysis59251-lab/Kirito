(() => {
  'use strict';
  const KEY = 'animefume_watch_history_v2';
  const list = document.getElementById('continueList');
  if (!list) return;
  const readHistory = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const formatTime = value => {
    const time = Number(value) || 0;
    if (!time) return 'ยังไม่มีเวลาบันทึก';
    try { return new Date(time).toLocaleString('th-TH', {dateStyle:'medium',timeStyle:'short'}); }
    catch { return ''; }
  };
  function render() {
    const items = readHistory().slice(0, 4);
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'af-continue-empty';
      empty.textContent = 'ยังไม่มีรายการที่ดูค้างไว้ เมื่อเริ่มดูอนิเมะ รายการล่าสุดจะแสดงตรงนี้';
      list.append(empty);
      return;
    }
    items.forEach(item => {
      const link = document.createElement('a');
      link.className = 'af-continue-card';
      link.href = item.page || item.link || 'history.html';
      const thumb = document.createElement('div');
      thumb.className = 'af-continue-thumb';
      thumb.textContent = '▶';
      thumb.setAttribute('aria-hidden','true');
      const info = document.createElement('div');
      info.className = 'af-continue-info';
      const title = document.createElement('div');
      title.className = 'af-continue-title';
      title.textContent = item.title || 'AnimeFume';
      const episode = document.createElement('div');
      episode.className = 'af-continue-ep';
      episode.textContent = item.episode || 'เปิดเรื่องต่อ';
      const time = document.createElement('div');
      time.className = 'af-continue-time';
      time.textContent = 'ดูล่าสุด ' + formatTime(item.time || item.watchedAt);
      info.append(title,episode,time);
      link.append(thumb,info);
      list.append(link);
    });
  }
  window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  render();
})();
