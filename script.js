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
SAVE STATE
========================= */
function saveState(){
  localStorage.setItem("scrollY", window.scrollY);
  localStorage.setItem("lastPage", currentPage);
  localStorage.setItem("searchText", savedSearch);
  localStorage.setItem("lastTime", Date.now());
}

/* =========================
ONLINE USERS
========================= */
function initOnline(){
  try{
    const userRef = push(ref(db,"onlineUsers"));

    set(userRef,{
      page: location.href,
      time: Date.now()
    });

    onDisconnect(userRef).remove();

    window.addEventListener("beforeunload", () => {
      set(userRef, null);
    });

  }catch(e){
    console.error(e);
  }
}

/* =========================
VIEW COUNT
========================= */
function initViews(){
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".anime-card");
    if(!card) return;

    const id = card.dataset.id;
    if(!id) return;

    const last = localStorage.getItem("view_"+id);
    const now = Date.now();
    if(last && (now - last) < 10000) return;

    localStorage.setItem("view_"+id, now);

    runTransaction(ref(db,"animeViews/"+id), val => (val||0)+1);
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
    if(!cards.length) return;

    const arr = cards.map(c => ({
      id: c.dataset.id,
      title: c.dataset.title,
      image: c.querySelector("img")?.src || "",
      link: c.href,
      views: data[c.dataset.id] || 0
    }));

    arr.sort((a,b) => b.views - a.views);

    slider.innerHTML = "";

    arr.slice(0,10).forEach(item => {
      const el = document.createElement("a");
      el.href = item.link;
      el.className = "anime-card hot-card";

      el.innerHTML = `
        <div class="card-img">
          <img src="${item.image}" loading="lazy">
          <div class="overlay">${item.title}</div>
        </div>
      `;

      const badge = document.createElement("div");
      badge.className = "hot-badge";
      badge.innerText = `${item.views} views`;

      el.appendChild(badge);
      slider.appendChild(el);
    });
  });
}

/* =========================
LOAD SHEET
========================= */
function loadFromSheet(){
const url = "https://opensheet.elk.sh/1NEjGfASJ7xUMtw1gozP6PWXf3LGNEKZhKVAsPbAtRh0/Sheet1";

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

  sortYear();
  renderPage();
  initHot();

  const y = localStorage.getItem("scrollY");
  if(y){
    setTimeout(()=> window.scrollTo(0, parseInt(y)), 200);
  }
});
}

/* =========================
SEARCH
========================= */
function initSearch(){
  const input = document.querySelector(".search");
  if(!input) return;

  input.value = savedSearch;

  input.addEventListener("input", () => {
    savedSearch = input.value.toLowerCase();
    currentPage = 1;
    isChangingPage = true;
    renderPage();
  });
}

/* =========================
SORT YEAR
========================= */
function sortYear(){
  cards.sort((a,b) =>
    (parseInt(b.dataset.year)||0)-(parseInt(a.dataset.year)||0)
  );

  const container = document.getElementById("animeList");
  cards.forEach(c => container.appendChild(c));
}

/* =========================
PAGINATION
========================= */
function renderPage(){
  const visible = cards.filter(c => {
    const match = !savedSearch ||
      (c.dataset.title || "").toLowerCase().includes(savedSearch);

    return match && c.dataset.hidden !== "1";
  });

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

/* =========================
PAGE BUTTONS
========================= */
function renderNumbers(totalPages){
  const box = document.getElementById("numberBox");
  if(!box) return;

  box.innerHTML = "";

  const setSize = 5;
  const setIndex = Math.floor((currentPage - 1)/setSize);

  const start = setIndex*setSize + 1;
  const end = Math.min(start+setSize-1, totalPages);

  if(setIndex > 0){
    const prev = document.createElement("div");
    prev.className="num";
    prev.textContent="<";
    prev.onclick=()=>{
      currentPage = start-1;
      isChangingPage = true;
      renderPage();
    };
    box.appendChild(prev);
  }

  for(let i=start;i<=end;i++){
    const btn=document.createElement("div");
    btn.className="num";
    btn.textContent=i;
    if(i===currentPage) btn.classList.add("active");

    btn.onclick=()=>{
      currentPage=i;
      isChangingPage=true;
      renderPage();
    };

    box.appendChild(btn);
  }

  if(end < totalPages){
    const next=document.createElement("div");
    next.className="num";
    next.textContent=">";

    next.onclick=()=>{
      currentPage=end+1;
      isChangingPage=true;
      renderPage();
    };

    box.appendChild(next);
  }
}

/* =========================
START SYSTEM
========================= */
document.addEventListener("DOMContentLoaded", () => {

  const lastTime = localStorage.getItem("lastTime");
  const now = Date.now();

  if(lastTime && (now - lastTime) <= 30000){
    currentPage = parseInt(localStorage.getItem("lastPage")||1);
    savedSearch = (localStorage.getItem("searchText")||"").toLowerCase();
  } else {
    localStorage.clear();
  }

  loadFromSheet();
  initSearch();
  initOnline();
  initViews();
});