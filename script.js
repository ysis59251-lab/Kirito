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
let hotLoaded = false;

/* =========================
SAVE STATE
========================= */
function saveState(){
  try{
    localStorage.setItem("scrollY", window.scrollY);
    localStorage.setItem("lastPage", currentPage);
    localStorage.setItem("searchText", savedSearch);
    localStorage.setItem("lastTime", Date.now());
  }catch(e){}
}

/* =========================
FAB BUTTONS (แก้ให้ DOM พร้อมก่อน)
========================= */
function initFAB(){
  document.querySelectorAll(".fab").forEach(fab => {
    fab.onclick = () => {
      const action = fab.dataset.action;

      if(action === "toggle-nav"){
        document.getElementById("bottomNav")?.classList.toggle("show");
      }
      else if(action === "open-search"){
        document.querySelector(".search")?.focus();
      }
      else if(action === "open-hot"){
        document.getElementById("hotSlider")?.scrollIntoView({behavior:"smooth"});
      }
    };
  });
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
  if(el) el.textContent = new Date().getFullYear();
}

/* =========================
ONLINE
========================= */
function initOnline(){
  try{
    const userRef = push(ref(db,"onlineUsers"));

    set(userRef,{
      page: location.pathname,
      time: Date.now()
    });

    onDisconnect(userRef).remove();
  }catch(e){}
}

/* =========================
VIEW
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

    const viewRef = ref(db,"animeViews/"+id);
    runTransaction(viewRef, val => (val||0)+1);
  });
}

/* =========================
HOT (แก้ไม่ขึ้น)
========================= */
function initHot(){
  if(hotLoaded) return;
  hotLoaded = true;

  const slider = document.getElementById("hotSlider");
  if(!slider) return;

  onValue(ref(db,"animeViews"), snap => {
    const data = snap.val();
    if(!data || !cards.length) return;

    const arr = cards.map(c => ({
      id: c.dataset.id,
      title: c.dataset.title,
      image: c.querySelector("img")?.src || "",
      link: c.href,
      views: data[c.dataset.id] || 0
    }));

    arr.sort((a,b)=>b.views-a.views);

    slider.innerHTML = "";

    arr.slice(0,10).forEach(item => {

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
      badge.innerText = item.views + " views";

      card.appendChild(badge);
      slider.appendChild(card);
    });
  });
}

/* =========================
LOAD DATA (แก้ดึงไม่ครบ)
========================= */
function loadFromSheet(){
  const url = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";

  fetch(url)
  .then(r => {
    if(!r.ok) throw new Error("โหลดไม่ได้");
    return r.json();
  })
  .then(data => {

    const container = document.getElementById("animeList");
    if(!container) return;

    container.innerHTML = "";
    cards = [];

    data.forEach((row,i) => {

      const id = row.id || row.title || ("anime_"+i);
      const title = row.title || "ไม่มีชื่อ";
      const year = parseInt(row.year) || 0;

      const image = row.image && row.image.startsWith("http")
        ? row.image
        : "https://via.placeholder.com/300x400?text=No+Image";

      const card = document.createElement("a");
      card.href = row.link || "#";
      card.className = "anime-card";

      card.dataset.id = id;
      card.dataset.year = year;
      card.dataset.title = title.toLowerCase();
      card.dataset.search = "1";
      card.dataset.hidden = row.hidden?.toUpperCase() === "TRUE" ? "1":"0";

      card.innerHTML = `
        <div class="card-img">
          <img src="${image}" loading="lazy">
          <div class="overlay">${title}</div>
        </div>
      `;

      container.appendChild(card);
      cards.push(card);
    });

    if(savedSearch){
      cards.forEach(c=>{
        c.dataset.search = c.dataset.title.includes(savedSearch) ? "1":"0";
      });
    }

    sortYear();
    renderPage();

    setTimeout(()=>initHot(),400);

  })
  .catch(()=>{
    document.getElementById("animeList").innerHTML = "โหลดข้อมูลไม่ได้";
  });
}

/* =========================
SEARCH
========================= */
function initSearch(){
  const input = document.querySelector(".search");
  if(!input) return;

  if(savedSearch) input.value = savedSearch;

  input.addEventListener("input", ()=>{
    savedSearch = input.value.toLowerCase();

    cards.forEach(c=>{
      c.dataset.search = c.dataset.title.includes(savedSearch) ? "1":"0";
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
  cards.sort((a,b)=> Number(b.dataset.year) - Number(a.dataset.year));

  const container = document.getElementById("animeList");
  cards.forEach(c=>container.appendChild(c));
}

/* =========================
PAGE
========================= */
function renderPage(){
  const visible = cards.filter(c=>c.dataset.search!="0" && c.dataset.hidden!="1");

  const totalPages = Math.ceil(visible.length/perPage)||1;
  const start = (currentPage-1)*perPage;

  cards.forEach(c=>c.style.display="none");
  visible.slice(start,start+perPage).forEach(c=>c.style.display="");

  renderNumbers(totalPages);

  if(isChangingPage){
    window.scrollTo({top:0,behavior:"smooth"});
  }

  saveState();
  isChangingPage=false;
}

/* =========================
START
========================= */
document.addEventListener("DOMContentLoaded", ()=>{

  initMenu();
  initFooter();
  initFAB(); // 🔥 สำคัญ

  const lastTime = localStorage.getItem("lastTime");

  if(lastTime && Date.now()-lastTime <= 30000){
    currentPage = parseInt(localStorage.getItem("lastPage"))||1;
    savedSearch = localStorage.getItem("searchText")||"";
  } else {
    localStorage.clear();
  }

  loadFromSheet();
  initOnline();
  initViews();
  initSearch();

});