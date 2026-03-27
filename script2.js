/* =========================
FIREBASE IMPORT
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, set, onDisconnect, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================
FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyCUxv...",
  authDomain: "reader-4a13f.firebaseapp.com",
  databaseURL: "https://reader-4a13f-default-rtdb.firebaseio.com",
  projectId: "reader-4a13f",
  storageBucket: "reader-4a13f.firebasestorage.app",
  messagingSenderId: "220776049054",
  appId: "1:220776049054:web:53524fb1e90ba83a12ce8f"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =========================
GLOBAL STATE
========================= */
let cards = [];
let perPage = 40;
let currentPage = 1;

let savedSearch = "";
let isChangingPage = false;

/* =========================
SAVE STATE (30 วิ)
========================= */
function saveState(){
  localStorage.setItem("scrollY", window.scrollY);
  localStorage.setItem("lastPage", currentPage);
  localStorage.setItem("searchText", savedSearch);
  localStorage.setItem("lastTime", Date.now());
}

/* =========================
FAB BUTTONS
========================= */
document.querySelectorAll(".fab").forEach(fab => {
  fab.addEventListener("click", () => {
    const action = fab.dataset.action;
    switch(action){
      case "toggle-nav":
        document.getElementById("bottomNav")?.classList.toggle("show");
        break;
      case "open-search":
        document.querySelector(".search")?.focus();
        break;
      case "open-hot":
        document.getElementById("hotSlider")?.scrollIntoView({behavior:"smooth"});
        break;
      default:
        document.getElementById("bottomNav")?.classList.toggle("show");
        break;
    }
  });
});

/* =========================
UI CONTROL
========================= */
function toggleBottom(){
  document.getElementById("bottomNav")?.classList.toggle("show");
}

/* =========================
MENU
========================= */
function initMenu(){
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("menuDropdown");
  if(!btn || !menu) return;
  btn.onclick = ()=>{
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  };
}

/* =========================
FOOTER
========================= */
function initFooter(){
  const el = document.getElementById("year");
  if(el){
    el.textContent = new Date().getFullYear();
  }
}

/* =========================
ONLINE USERS
========================= */
function initOnline(){
  try{
    const userRef = push(ref(db,"onlineUsers"));
    set(userRef,{
      page: location.pathname,
      time: Date.now()
    });
    onDisconnect(userRef).remove();
  }catch(e){
    console.error("online error", e);
  }
}

/* =========================
VIEW COUNT + กันกดรัว
========================= */
function initViews(){
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".anime-card");
    if(!card) return;

    const id = card.dataset.id;
    if(!id) return;

    // 🔥 กันกดรัว 10 วิ
    const last = localStorage.getItem("view_"+id);
    const now = Date.now();
    if(last && (now - last) < 10000) return;

    localStorage.setItem("view_"+id, now);

    // 👑 นับสะสม
    const viewRef = ref(db,"animeViews/"+id);
    runTransaction(viewRef, val => (val||0)+1);
  });
}

/* =========================
HOT (ยอดฮิตสะสม)
========================= */
function initHot(){
  const slider = document.getElementById("hotSlider");
  if(!slider) return;

  onValue(ref(db,"animeViews"), snap => {
    const data = snap.val();
    if(!data || cards.length === 0) return;

    // 🔥 รวมข้อมูลทั้งเว็บจริง
    const arr = cards.map(c => ({
      id: c.dataset.id,
      title: c.dataset.title,
      image: c.querySelector("img")?.src || "",
      link: c.href,
      views: data[c.dataset.id] || 0
    }));

    // 👑 เรียงยอดวิวมาก → น้อย
    arr.sort((a,b) => b.views - a.views);

    slider.innerHTML = "";

    // 🔥 เอา Top 10
    arr.slice(0,10).forEach((item,i) => {

      const card = document.createElement("a");
      card.href = item.link;
      card.className = "anime-card hot-card";

      card.innerHTML = `
        <div class="card-img">
          <img src="${item.image}" loading="lazy">
          <div class="overlay">${item.title}</div>
        </div>
      `;

      const badge = document.createElement("div");
      badge.className = "hot-badge";
      badge.innerText = `${item.views} views`;

      card.appendChild(badge);
      slider.appendChild(card);
    });

  });
}

/* =========================
LOAD DATA
========================= */
function loadFromSheet(){
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

    // restore search
    if(savedSearch){
      cards.forEach(c => {
        c.dataset.search = (c.dataset.title || "").toLowerCase().includes(savedSearch) ? "1":"0";
      });
    }

    sortYear();
    renderPage();
    initHot();

    // restore scroll
    const y = localStorage.getItem("scrollY");
    if(y){
      setTimeout(()=>{
        window.scrollTo(0, parseInt(y));
      },200);
    }
  });
}

/* =========================
SEARCH
========================= */
function initSearch(){
  const input = document.querySelector(".search");
  if(!input) return;

  if(savedSearch){
    input.value = savedSearch;
  }

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    savedSearch = val;

    cards.forEach(c => {
      c.dataset.search = (c.dataset.title || "").toLowerCase().includes(val) ? "1":"0";
    });

    currentPage = 1;
    isChangingPage = true;
    saveState();
    renderPage();
  });
}

/* =========================
SORT
========================= */
function sortYear(){
  cards.sort((a,b) => (parseInt(b.dataset.year)||0)-(parseInt(a.dataset.year)||0));
  const container = document.getElementById("animeList");
  cards.forEach(c => container.appendChild(c));
}

/* =========================
PAGINATION
========================= */
function renderPage(){
  const visible = cards.filter(c => c.dataset.search !== "0" && c.dataset.hidden !== "1");
  const totalPages = Math.ceil(visible.length / perPage) || 1;

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  cards.forEach(c => c.style.display = "none");
  visible.slice(start, end).forEach(c => c.style.display = "");

  renderNumbers(totalPages);

  if(isChangingPage){
    window.scrollTo({top:0, behavior:"smooth"});
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
BOTTOM NAV
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
CLICK SAVE
========================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".anime-card");
  if(card){
    saveState();
  }
});

/* =========================
START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initFooter();

  const lastTime = localStorage.getItem("lastTime");
  const now = Date.now();

  if(lastTime && (now - lastTime) <= 30000){
    const savedPage = localStorage.getItem("lastPage");
    if(savedPage) currentPage = parseInt(savedPage);

    const saved = localStorage.getItem("searchText");
    if(saved) savedSearch = saved.toLowerCase();
  } else {
    localStorage.clear();
  }

  loadFromSheet();
  initOnline();
  initViews();
  initSearch();
});