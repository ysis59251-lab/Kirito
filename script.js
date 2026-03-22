/* =========================
GLOBAL STATE
========================= */
let animeData = []; // เก็บข้อมูลดิบจาก Sheet
let cards = [];     // element ของการ์ด
let perPage = 40;
let currentPage = 1;

/* =========================
LOAD DATA FROM SHEET + RENDER
========================= */
function loadFromSheet(){
  const url="https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";
  fetch(url)
  .then(r => r.json())
  .then(data => {
    animeData = data;       // เก็บดิบ
    renderAnime(animeData); // render ครั้งแรก
  })
  .catch(err => console.error("โหลด sheet ไม่ได้", err));
}

/* =========================
RENDER ANIME
========================= */
function renderAnime(data){
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

  // update global cards array
  cards = [...document.querySelectorAll(".anime-card")];

  // เรียงปีและ render หน้าแรก
  sortYear();
  initPagination();
}

/* =========================
SORT SYSTEM
========================= */
function sortYear(){
  animeData.sort((a,b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  renderAnime(animeData);
}

/* =========================
PAGINATION SYSTEM
========================= */
function initPagination(){
  currentPage = 1;
  renderPage();
}

function renderPage(){
  const visible = cards.filter(c => c.dataset.search !== "0" && c.dataset.hidden !== "1");
  const total = Math.ceil(visible.length / perPage) || 1;
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  cards.forEach(c => c.style.display = "none");
  visible.slice(start, end).forEach(c => c.style.display = "");

  renderNumbers(total);
}

/* =========================
PAGINATION BUTTONS 5-PAGE SET
========================= */
function renderNumbers(total){
  const box = document.getElementById("numberBox");
  if(!box) return;
  box.innerHTML = "";

  const pagesPerSet = 5;
  const currentSet = Math.floor((currentPage - 1) / pagesPerSet);
  const startPage = currentSet * pagesPerSet + 1;
  const endPage = Math.min(startPage + pagesPerSet - 1, total);

  if(currentSet > 0){
    const prevSetBtn = document.createElement("div");
    prevSetBtn.className = "num set-nav";
    prevSetBtn.textContent = "<";
    prevSetBtn.onclick = () => {
      currentPage = startPage - 1;
      renderPage();
    };
    box.appendChild(prevSetBtn);
  }

  for(let i = startPage; i <= endPage; i++){
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

  if(endPage < total){
    const nextSetBtn = document.createElement("div");
    nextSetBtn.className = "num set-nav";
    nextSetBtn.textContent = ">";
    nextSetBtn.onclick = () => {
      currentPage = endPage + 1;
      renderPage();
    };
    box.appendChild(nextSetBtn);
  }
}

/* =========================
SEARCH SYSTEM
========================= */
function initSearch(){
  const input = document.querySelector(".search");
  if(!input) return;
  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    cards.forEach(c => {
      const t = (c.dataset.title || "").toLowerCase();
      c.dataset.search = t.includes(val) ? "1" : "0";
    });
    currentPage = 1;
    renderPage();
  });
}

/* =========================
HOT (TRENDING)
========================= */
function initHot(){
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
  initMenu();
  initFooter();
  loadFromSheet();
  initOnline();
  initViews();
  initSearch();
});