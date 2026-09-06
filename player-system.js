(() => {
  const video = document.getElementById('video');
  const player = document.querySelector('.player');
  if (!video || !player) return;
  video.setAttribute('title', 'AnimeFume Video Player');
  video.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  const status = document.getElementById('nowEp');
  video.addEventListener('error', () => {
    if (status) status.textContent = '⚠️ โหลดวิดีโอไม่สำเร็จ ลองเลือกตอนใหม่อีกครั้ง';
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal');
      if (modal) modal.style.display = 'none';
    }
  });
})();
