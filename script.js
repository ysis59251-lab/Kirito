/* =========================
GLOBAL STATE
========================= */
let cards = [];
let perPage = 40;
let currentPage = 1;

let savedSearch = "";
let isChangingPage = false;

/* =========================
SAVE STATE (Netflix Mode)
========================= */
function saveState(){
  localStorage.setItem("scrollY", window.scrollY);
  localStorage.setItem("lastPage", currentPage);
  localStorage.setItem("searchText", savedSearch);
}

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

      cards = [...document.querySelectorAll(".anime-card")];

      // 👉 restore search
      if(savedSearch){
        cards.forEach(c => {
          c.dataset.search = (c.dataset.title || "").toLowerCase().includes(savedSearch) ? "1" : "0";
        });
      }

      sortYear();
      renderPage();
      initHot();

      // 👉 restore scroll (กลับจากหน้าอื่น)
      const y = localStorage.getItem("scrollY");
      if(y){
        setTimeout(()=>{
          window.scrollTo(0, parseInt(y));
        }, 200);
      }
    })
    .catch(err => console.error("โหลด sheet ไม่ได้", err));
}

/* =========================
SEARCH SYSTEM (จำค่า)
========================= */
function initSearch(){
  const input = document.querySelector(".search");
  if(!input) return;

  const saved = localStorage.getItem("searchText");
  if(saved){
    input.value = saved;
    savedSearch = saved.toLowerCase();
  }

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    savedSearch = val;

    localStorage.setItem("searchText", val);

    cards.forEach(c => {
      c.dataset.search = (c.dataset.title || "").toLowerCase().includes(val) ? "1" : "0";
    });

    currentPage = 1;
    saveState();
    renderPage();
  });
}

/* =========================
PAGINATION SYSTEM
========================= */
function renderPage(){
  const visible = cards.filter(c => c.dataset.search !== "0" && c.dataset.hidden !== "1");
  const totalPages = Math.ceil(visible.length / perPage) || 1;
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  cards.forEach(c => c.style.display = "none");
  visible.slice(start, end).forEach(c => c.style.display = "");

  renderNumbers(totalPages);

  // 👉 ถ้าเปลี่ยนหน้า → scroll บน
  if(isChangingPage){
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  saveState();
  isChangingPage = false;
}

function renderNumbers(totalPages){
  const box = document.getElementById("numberBox");
  if(!box) return;
  box.innerHTML = "";

  const pagesPerSet = 5;
  const currentSet = Math.floor((currentPage - 1) / pagesPerSet);
  const startPage = currentSet * pagesPerSet + 1;
  const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

  if(currentSet > 0){
    const prevBtn = document.createElement("div");
    prevBtn.className = "num set-nav";
    prevBtn.textContent = "<";
    prevBtn.onclick = () => {
      isChangingPage = true;
      currentPage = startPage - 1;
      renderPage();
    };
    box.appendChild(prevBtn);
  }

  for(let i = startPage; i <= endPage; i++){
    const btn = document.createElement("div");
    btn.className = "num";
    btn.textContent = i;
    if(i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      isChangingPage = true;
      currentPage = i;
      renderPage();
    };
    box.appendChild(btn);
  }

  if(endPage < totalPages){
    const nextBtn = document.createElement("div");
    nextBtn.className = "num set-nav";
    nextBtn.textContent = ">";
    nextBtn.onclick = () => {
      isChangingPage = true;
      currentPage = endPage + 1;
      renderPage();
    };
    box.appendChild(nextBtn);
  }
}

/* =========================
BOTTOM NAV CONTROL
========================= */
document.getElementById("prevBtn")?.addEventListener("click", () => {
  if(currentPage > 1) {
    isChangingPage = true;
    currentPage--;
    renderPage();
  }
});
document.getElementById("nextBtn")?.addEventListener("click", () => {
  const visible = cards.filter(c => c.dataset.search !== "0" && c.dataset.hidden !== "1");
  const totalPages = Math.ceil(visible.length / perPage) || 1;
  if(currentPage < totalPages) {
    isChangingPage = true;
    currentPage++;
    renderPage();
  }
});

/* =========================
CLICK CARD → SAVE (สำคัญ)
========================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".anime-card");
  if(card){
    saveState();
  }
});

/* =========================
START SYSTEM
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initFooter();

  // 👉 โหลดค่าที่เคยอยู่
  const savedPage = localStorage.getItem("lastPage");
  if(savedPage){
    currentPage = parseInt(savedPage);
  }

  const saved = localStorage.getItem("searchText");
  if(saved){
    savedSearch = saved.toLowerCase();
  }

  loadFromSheet();
  initOnline();
  initViews();
  initSearch();
});