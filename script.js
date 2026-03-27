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
MENU / UI
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
    set(userRef,{ page: location.pathname, time: Date.now() });
    onDisconnect(userRef).remove();
  }catch(e){
    console.error(e);
  }
}

/* =========================
VIEW + HOT SYSTEM
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
    runTransaction(viewRef, val => (val || 0) + 1);
  });
}

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

    arr.slice(0,6).forEach((item,i) => {
      const clone = item.card.cloneNode(true);
      clone.classList.add("hot-card");

      const badge = document.createElement("div");
      badge.className = "hot-badge";
      badge.innerText = `🔥 #${i+1} (${item.views})`;

      clone.appendChild(badge);
      slider.appendChild(clone);
    });
  });
}

/* =========================
LOAD DATA
========================= */
function loadFromSheet(){
  const url = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";

  fetch(url)
  .then(r=>r.json())
  .then(data=>{
    const container = document.getElementById("animeList");
    container.innerHTML = "";

    data.forEach(row=>{
      const card = document.createElement("a");
      card.href = row.link || "#";
      card.className = "anime-card";
      card.dataset.id = row.id || row.title;
      card.dataset.year = row.year || "0";
      card.dataset.title = row.title || "";
      card.dataset.search = "1";
      card.dataset.hidden = row.hidden?.toUpperCase() === "TRUE" ? "1" : "0";

      card.innerHTML = `
        <div class="card-img">
          <img src="${row.image || ''}" loading="lazy">
          <div class="overlay">${row.title}</div>
        </div>
      `;
      container.appendChild(card);
    });

    cards = [...document.querySelectorAll(".anime-card")];

    // restore search
    if(savedSearch){
      cards.forEach(c=>{
        c.dataset.search = c.dataset.title.toLowerCase().includes(savedSearch) ? "1":"0";
      });
    }

    sortYear();
    renderPage();
    initHot();

    // restore scroll
    const y = localStorage.getItem("scrollY");
    if(y){
      setTimeout(()=>window.scrollTo(0,parseInt(y)),200);
    }
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
      c.dataset.search = c.dataset.title.toLowerCase().includes(savedSearch) ? "1":"0";
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
  cards.sort((a,b)=> (parseInt(b.dataset.year)||0)-(parseInt(a.dataset.year)||0));
  const container = document.getElementById("animeList");
  cards.forEach(c=>container.appendChild(c));
}

/* =========================
PAGINATION
========================= */
function renderPage(){
  const visible = cards.filter(c=>c.dataset.search!=="0" && c.dataset.hidden!=="1");
  const totalPages = Math.ceil(visible.length/perPage)||1;

  const start = (currentPage-1)*perPage;
  const end = start+perPage;

  cards.forEach(c=>c.style.display="none");
  visible.slice(start,end).forEach(c=>c.style.display="");

  renderNumbers(totalPages);

  if(isChangingPage){
    window.scrollTo({top:0,behavior:"smooth"});
  }

  saveState();
  isChangingPage=false;
}

function renderNumbers(totalPages){
  const box = document.getElementById("numberBox");
  box.innerHTML="";

  for(let i=1;i<=totalPages;i++){
    const btn=document.createElement("div");
    btn.className="num";
    btn.textContent=i;
    if(i===currentPage) btn.classList.add("active");

    btn.onclick=()=>{
      isChangingPage=true;
      currentPage=i;
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
  const now = Date.now();

  if(lastTime && (now-lastTime)<=30000){
    currentPage = parseInt(localStorage.getItem("lastPage")) || 1;
    savedSearch = (localStorage.getItem("searchText")||"").toLowerCase();
  }else{
    localStorage.clear();
  }

  loadFromSheet();
  initOnline();
  initViews();
  initSearch();
});