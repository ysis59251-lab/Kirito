(() => {
  const video = document.getElementById('video');
  const player = document.querySelector('.player');
  if (!video || !player) return;

  video.setAttribute('title', 'AnimeFume Video Player');
  video.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  video.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

  const status = document.getElementById('nowEp');
  const modal = document.getElementById('modal');
  const animeName = document.getElementById('animeName');
  const title = (animeName?.textContent || document.title || 'AnimeFume').trim();
  const REPORT_URL = '../ระบบควบคุมภายในเว็บ/Report%20a%20Problem.html';
  const HISTORY_KEY = 'animefume_watch_history_v2';

  const css = document.createElement('style');
  css.textContent = `
    .af-player-tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px auto 4px;max-width:900px;padding:0 10px}
    .af-player-tools button,.af-player-tools a{appearance:none;border:1px solid rgba(255,255,255,.12);background:#151515;color:#fff;text-decoration:none;min-height:42px;padding:9px 13px;border-radius:12px;font:600 13px system-ui;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}
    .af-player-tools button:hover,.af-player-tools a:hover{background:#242424}
    .af-player-tools .primary{background:linear-gradient(135deg,#e50914,#b20710);border-color:transparent}
    .af-player-state{max-width:900px;margin:8px auto;padding:0 12px;color:#aaa;font-size:12px;text-align:center;min-height:18px}
    .af-player-loading{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.62);z-index:3;pointer-events:none;opacity:1;transition:opacity .25s}
    .af-player-loading.hide{opacity:0}
    .af-player-spinner{width:38px;height:38px;border:4px solid #444;border-top-color:#fff;border-radius:50%;animation:afpspin .75s linear infinite}
    @keyframes afpspin{to{transform:rotate(360deg)}}
    @media(max-width:600px){.af-player-tools{display:grid;grid-template-columns:repeat(2,1fr);padding:0 8px}.af-player-tools button,.af-player-tools a{width:100%;min-height:46px}.af-player-tools .primary{grid-column:1/-1}}
  `;
  document.head.appendChild(css);

  const box = player.querySelector('.video-box');
  if (box) {
    box.style.position = 'relative';
    const loading = document.createElement('div');
    loading.className = 'af-player-loading';
    loading.innerHTML = '<div class="af-player-spinner" aria-label="กำลังโหลดวิดีโอ"></div>';
    box.appendChild(loading);
    video.addEventListener('load', () => loading.classList.add('hide'));
    setTimeout(() => loading.classList.add('hide'), 12000);
  }

  const tools = document.createElement('div');
  tools.className = 'af-player-tools';
  tools.innerHTML = `
    <button class="primary" data-af="episodes">📺 เลือกตอน</button>
    <button data-af="fullscreen">⛶ เต็มจอ</button>
    <button data-af="back">↩ กลับหน้าก่อน</button>
    <button data-af="share">🔗 แชร์</button>
    <button data-af="copy">📋 คัดลอกลิงก์</button>
    <a href="${REPORT_URL}" data-af="report">⚠️ แจ้งปัญหา</a>
  `;
  const control = document.querySelector('.control');
  (control || player).insertAdjacentElement('afterend', tools);

  const state = document.createElement('div');
  state.className = 'af-player-state';
  state.setAttribute('aria-live', 'polite');
  tools.insertAdjacentElement('afterend', state);

  const setState = (text) => { state.textContent = text || ''; };

  function openEpisodes(){
    if (typeof window.openModal === 'function') window.openModal();
    else if (modal) modal.style.display = 'block';
  }

  async function fullscreen(){
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (player.requestFullscreen) await player.requestFullscreen();
      else setState('เบราว์เซอร์นี้ไม่รองรับโหมดเต็มจอ');
    } catch { setState('ไม่สามารถเปิดเต็มจอได้'); }
  }

  function goBack(){
    if (history.length > 1) history.back();
    else location.href = '../home.html';
  }

  async function share(){
    const data = {title, text:`ดู ${title} บน AnimeFume`, url:location.href};
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); setState('คัดลอกลิงก์แล้ว'); }
    } catch(e) {
      if (e?.name !== 'AbortError') setState('แชร์ไม่สำเร็จ ลองคัดลอกลิงก์แทน');
    }
  }

  async function copyLink(){
    try { await navigator.clipboard.writeText(location.href); setState('คัดลอกลิงก์แล้ว ✓'); }
    catch { setState('คัดลอกไม่ได้ ให้กดค้างที่แถบที่อยู่เพื่อคัดลอก'); }
  }

  tools.addEventListener('click', e => {
    const button = e.target.closest('[data-af]');
    if (!button) return;
    const action = button.dataset.af;
    if (action === 'episodes') openEpisodes();
    if (action === 'fullscreen') fullscreen();
    if (action === 'back') goBack();
    if (action === 'share') share();
    if (action === 'copy') copyLink();
  });

  function saveHistory(){
    const text = status?.textContent?.trim() || '';
    try {
      const historyItems = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const item = {title, page:location.href, episode:text, time:Date.now()};
      const next = [item, ...historyItems.filter(x => x.page !== item.page)].slice(0,30);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  if (status) {
    const observer = new MutationObserver(saveHistory);
    observer.observe(status, {childList:true,subtree:true,characterData:true});
  }

  video.addEventListener('error', () => {
    if (status) status.textContent = '⚠️ โหลดวิดีโอไม่สำเร็จ ลองเลือกตอนใหม่อีกครั้ง';
    setState('ตรวจสอบลิงก์วิดีโอหรือเลือกตอนใหม่ แล้วลองอีกครั้ง');
  });

  window.addEventListener('offline', () => setState('📡 ออฟไลน์: การโหลดวิดีโออาจไม่ทำงาน'));
  window.addEventListener('online', () => setState('เชื่อมต่ออินเทอร์เน็ตแล้ว ✓'));

  document.addEventListener('keydown', e => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'Escape' && modal) modal.style.display = 'none';
    if (e.key === 'f' || e.key === 'F') fullscreen();
    if (e.key === 'e' || e.key === 'E') openEpisodes();
    if (e.key === 's' || e.key === 'S') share();
    if (e.key === 'ArrowRight' && typeof window.nextEp === 'function') window.nextEp();
    if (e.key === 'ArrowLeft' && typeof window.prevEp === 'function') window.prevEp();
  });

  setState('คีย์ลัด: F เต็มจอ • E เลือกตอน • ←/→ เปลี่ยนตอน');
})();
