/* =========================
GLOBAL STATE
========================= */
let cards = [];
let perPage = 40;
let currentPage = 1;

/* =========================
LOAD DATA FROM SHEET
========================= */
function loadFromSheet() {
  const url = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";
  fetch(url)
    .then(r => r.json())
    .then(data => {
      const container = document.getElementById("animeList");
      if(!container) return;
      container.innerHTML = "";

      data.forEach(row => {
        const card = document.createElement("a");
        card.href = row.link || "#";
        card.className = "anime-card";
        card.dataset.id = row.id || row.title;
        card.dataset.year = row.year || "0";
        card.dataset.search = "1";
        card.dataset.title = row.title || "";
        card.dataset.hidden = row.hidden?.toUpperCase() === "TRUE" ? "1" : "0";

        card.innerHTML = `
          <div class="card-img">
            <img src="${row.image || ''}" loading="lazy">
            <div class="overlay">${row.title || "ไม่มีชื่อ"}</div>
          </div>
        `;
        container.appendChild(card);
      });

      // เก็บ array ของ DOM element
      cards = [...document.querySelectorAll(".anime-card")];

      sortYear();      // เรียงปี
      renderPage();    // แสดงหน้าปัจจุบัน
      initHot();       // hot trending
    })
    .catch(err => console.error("โหลด sheet ไม่ได้", err));
}

/* =========================
SORT SYSTEM
========================= */
function sortYear() {
  cards.sort((a, b) => (parseInt(b.dataset.year) || 0) - (parseInt(a.dataset.year) || 0));
  const container = document.getElementById("animeList");
  cards.forEach(c => container.appendChild(c));
}

/* =========================
SEARCH SYSTEM
========================= */
function initSearch() {
  const input = document.querySelector(".search");
  if(!input) return;
  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    cards.forEach(c => {
      c.dataset.search = (c.dataset.title || "").toLowerCase().includes(val) ? "1" : "0";
    });
    currentPage = 1;
    renderPage();
  });
}

/* =========================
PAGINATION SYSTEM (5 หน้า ต่อชุด)
========================= */
function renderPage() {
  const visible = cards.filter(c => c.dataset.search !== "0" && c.dataset.hidden !== "1");
  const totalPages = Math.ceil(visible.length / perPage) || 1;
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  // ซ่อนทั้งหมด
  cards.forEach(c => c.style.display = "none");
  // แสดงเฉพาะหน้าปัจจุบัน
  visible.slice(start, end).forEach(c => c.style.display = "");

  renderNumbers(totalPages);
}

function renderNumbers(totalPages) {
  const box = document.getElementById("numberBox");
  if(!box) return;
  box.innerHTML = "";

  const pagesPerSet = 5;
  const currentSet = Math.floor((currentPage - 1) / pagesPerSet);
  const startPage = currentSet * pagesPerSet + 1;
  const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

  // ปุ่มชุดก่อนหน้า
  if(currentSet > 0) {
    const prevBtn = document.createElement("div");
    prevBtn.className = "num set-nav";
    prevBtn.textContent = "<";
    prevBtn.onclick = () => {
      currentPage = startPage - 1;
      renderPage();
    };
    box.appendChild(prevBtn);
  }

  // ปุ่มเลขหน้า
  for(let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("div");
    btn.className = "num";
    btn.textContent = i;
    if(i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      renderPage();
    };
    box.appendChild(btn);
  }

  // ปุ่มชุดถัดไป
  if(endPage < totalPages) {
    const nextBtn = document.createElement("div");
    nextBtn.className = "num set-nav";
    nextBtn.textContent = ">";
    nextBtn.onclick = () => {
      currentPage = endPage + 1;
      renderPage();
    };
    box.appendChild(nextBtn);
  }
}

/* =========================
HOT TRENDING
========================= */
function initHot() {
  const slider = document.getElementById("hotSlider");
  if(!slider) return;
  onValue(ref(db,"animeViews"), snap => {
    const data = snap.val();
    if(!data) return;

    const arr = [...document.querySelectorAll(".anime-card")].map(c => ({
      card: c,
      views: data[c.dataset.id] || 0
    }));
    arr.sort((a,b) => b.views - a.views);

    slider.innerHTML = "";
    arr.slice(0,6).forEach(item => {
      const clone = item.card.cloneNode(true);
      clone.classList.add("hot-card");

      const badge = document.createElement("div");
      badge.className = "hot-badge";
      badge.innerText = item.views + " views";
      clone.appendChild(badge);

      slider.appendChild(clone);
    });
  });
}

/* =========================
START SYSTEM
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadFromSheet();
  initSearch();
});