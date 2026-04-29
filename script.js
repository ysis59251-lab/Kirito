/* =========================
FIREBASE IMPORT
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  runTransaction,
  set,
  onDisconnect,
  push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
STATE SAVE
========================= */
function saveState(){
  localStorage.setItem("scrollY", window.scrollY);
  localStorage.setItem("lastPage", currentPage);
  localStorage.setItem("searchText", savedSearch);
  localStorage.setItem("lastTime", Date.now());
}

/* =========================
INIT UI
========================= */
function initMenu(){
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("menuDropdown");
  if(!btn || !menu) return;

  btn.onclick = () => {
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  };
}

function initFooter(){
  const el = document.getElementById("year");
  if(el) el.textContent = new Date().getFullYear();
}

function initFAB(){
  document.querySelectorAll(".fab").forEach(fab => {
    fab.addEventListener("click", () => {
      const action = fab.dataset.action;

      if(action === "toggle-nav")
        document.getElementById("bottomNav")?.classList.toggle("show");

      if(action === "open-search")
        document.querySelector(".search")?.focus();

      if(action === "open-hot")
        document.getElementById("hotSlider")?.scrollIntoView({behavior:"smooth"});
    });
  });
}

/* =========================
ONLINE USERS
========================= */
function initOnline(){
  const userRef = push(ref(db,"onlineUsers"));
  set(userRef,{
    page: location.pathname,
    time: Date.now()
  });
  onDisconnect(userRef).remove();
}

/* =========================
VIEWS SYSTEM
========================= */
function initViews(){
  document.addEventListener("click",(e)=>{
    const card = e.target.closest(".anime-card");
    if(!card) return;

    const id = card.dataset.id;
    const last = localStorage.getItem("view_"+id);
    const now = Date.now();

    if(last && now - last < 10000) return;

    localStorage.setItem("view_"+id, now);
    runTransaction(ref(db,"animeViews/"+id), v => (v||0)+1);
  });
}

/* =========================
HOT SYSTEM
========================= */
function initHot(){
  const slider = document.getElementById("hotSlider");
  if(!slider) return;

  onValue(ref(db,"animeViews"), snap => {
    const data = snap.val() || {};

    const arr = cards.map(c => ({
      id: c.dataset.id,
      title: c.dataset.title,
      image: c.querySelector("img")?.src || "",
      link: c.href,
      views: data[c.dataset.id] || 0
    })).sort((a,b)=>b.views-a.views);

    slider.innerHTML = "";

    arr.slice(0,10).forEach(item=>{
      const a = document.createElement("a");
      a.href = item.link;
      a.className = "anime-card hot-card";

      a.innerHTML = `
        <div class="card-img">
          <img src="${item.image}" loading="lazy">
          <div class="overlay">${item.title}</div>
        </div>
        <div class="hot-badge">${item.views} views</div>
      `;

      slider.appendChild(a);
    });
  });
}

/* =========================
LOAD SHEET
========================= */
function loadFromSheet(){
  const SHEET_ID = "1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58";
  const url = `https://opensheet.elk.sh/${SHEET_ID}/Sheet1`;

  fetch(url)
    .then(r=>r.json())
    .then(data=>{
      const container = document.getElementById("animeList");
      container.innerHTML = "";

      data.forEach((row,i)=>{
        const card = document.createElement("a");
        card.href = row.link || "#";
        card.className = "anime-card";

        card.dataset.id = row.id || ("id"+i);
        card.dataset.year = row.year || "0";
        card.dataset.title = (row.title || "").toLowerCase();
        card.dataset.hidden = row.hidden?.toUpperCase()==="TRUE"?"1":"0";
        card.dataset.search = "1";

        card.innerHTML = `
          <div class="card-img">
            <img src="${row.image || "https://via.placeholder.com/300x400"}">
            <div class="overlay">${row.title || ""}</div>
          </div>
        `;

        container.appendChild(card);
      });

      cards = [...document.querySelectorAll(".anime-card")];

      sortYear();
      renderPage();
      initHot();

      const y = localStorage.getItem("scrollY");
      if(y) setTimeout(()=>window.scrollTo(0,parseInt(y)),200);
    });
}

/* =========================
SEARCH
========================= */
function initSearch(){
  const input = document.querySelector(".search");
  if(!input) return;

  input.value = savedSearch;

  input.addEventListener("input",()=>{
    savedSearch = input.value.toLowerCase();

    cards.forEach(c=>{
      c.dataset.search = c.dataset.title.includes(savedSearch)?"1":"0";
    });

    currentPage = 1;
    renderPage();
    saveState();
  });
}

/* =========================
SORT
========================= */
function sortYear(){
  const container = document.getElementById("animeList");
  cards.sort((a,b)=>(+b.dataset.year)-(+a.dataset.year));
  cards.forEach(c=>container.appendChild(c));
}

/* =========================
PAGINATION
========================= */
function renderPage(){
  const visible = cards.filter(c =>
    c.dataset.search !== "0" && c.dataset.hidden !== "1"
  );

  const start = (currentPage-1)*perPage;
  const end = start + perPage;

  cards.forEach(c=>c.style.display="none");
  visible.slice(start,end).forEach(c=>c.style.display="");

  saveState();
}

/* =========================
START SYSTEM
========================= */
document.addEventListener("DOMContentLoaded",()=>{
  initMenu();
  initFooter();
  initFAB();

  initOnline();
  initViews();

  loadFromSheet();

  setTimeout(()=>{
    initSearch();
  },300);
});