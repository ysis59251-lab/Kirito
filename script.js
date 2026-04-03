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
  push,
  remove
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
GLOBAL
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
MENU + FOOTER
========================= */
function initMenu(){
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("menuDropdown");
  if(!btn || !menu) return;

  btn.onclick = ()=>{
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  };
}

function initFooter(){
  const el = document.getElementById("year");
  if(el) el.textContent = new Date().getFullYear();
}

/* =========================
ONLINE (แก้แล้ว)
========================= */
function initOnline(){
  try{
    const userRef = push(ref(db,"onlineUsers"));

    set(userRef,{
      page: location.pathname,
      time: Date.now()
    });

    // ✅ FIX ของเดิม
    onDisconnect(userRef).remove();

  }catch(e){
    console.warn("online error", e);
  }
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

    try{
      const viewRef = ref(db,"animeViews/"+id);
      runTransaction(viewRef, val => (val||0)+1);
    }catch(err){
      console.warn("view error", err);
    }
  });
}

/* =========================
HOT
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
          <img src="${item.image}" loading="lazy"
          onerror="this.src='https://via.placeholder.com/300x400?text=Error'">
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
LOAD SHEET (เสถียรขึ้น)
========================= */
function loadFromSheet(){
  const url = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";

  fetch(url)
  .then(r => r.json())
  .then(data => {

    const container = document.getElementById("animeList");
    if(!container) return;

    container.innerHTML = "";
    cards = [];

    data.forEach((row,i) => {

      const id = row.id || row.title || ("anime_"+i);
      const title = row.title || "ไม่มีชื่อ";

      const image = row.image && row.image.startsWith("http")
        ? row.image
        : "https://via.placeholder.com/300x400?text=No+Image";

      const year = parseInt(row.year) || 0;

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
          <img src="${image}" loading="lazy"
          onerror="this.src='https://via.placeholder.com/300x400?text=Error'">
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

    // ✅ รอ cards มาก่อนค่อย initHot
    setTimeout(()=>initHot(),500);

    const y = localStorage.getItem("scrollY");
    if(y){
      setTimeout(()=>window.scrollTo(0,parseInt(y)),200);
    }

  })
  .catch(err=>{
    console.error(err);
    const el = document.getElementById("animeList");
    if(el) el.innerHTML = "โหลดข้อมูลไม่ได้ (Sheet พังหรือเน็ตช้า)";
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

function renderNumbers(totalPages){
  const box = document.getElementById("numberBox");
  if(!box) return;

  box.innerHTML = "";

  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("div");
    btn.className = "num";
    btn.textContent = i;

    if(i===currentPage) btn.classList.add("active");

    btn.onclick = ()=>{
      currentPage=i;
      isChangingPage=true;
      renderPage();
    };

    box.appendChild(btn);
  }
}

/* =========================
START
========================= */
document.addEventListener("DOMContentLoaded", ()=>{

  initMenu();
  initFooter();

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