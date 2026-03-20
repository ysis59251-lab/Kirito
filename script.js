/* =========================
   FAB BUTTONS TOGGLE BOTTOM NAV
========================= */
const bottomNav = document.getElementById("bottomNav");

// รองรับหลายปุ่ม FAB
document.querySelectorAll(".fab").forEach(fab => {
  fab.addEventListener("click", () => {
    bottomNav.classList.toggle("show");
  });
});

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

/* =========================
   MENU + FOOTER
========================= */
function initMenu() {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("menuDropdown");
  if(!btn || !menu) return;
  btn.onclick = () => menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}
function initFooter() {
  const el = document.getElementById("year");
  if(el) el.textContent = new Date().getFullYear();
}

/* =========================
   ONLINE SYSTEM
========================= */
function initOnline(){
  try{
    const userRef = push(ref(db,"onlineUsers"));
    set(userRef,{page:location.pathname,time:Date.now()});
    onDisconnect(userRef).remove();
  }catch(e){ console.error("online error", e); }
}

/* =========================
   VIEW COUNT
========================= */
function initViews(){
  document.addEventListener("click", e => {
    const card = e.target.closest(".anime-card");
    if(!card) return;
    const id = card.dataset.id;
    if(!id) return;
    runTransaction(ref(db,"animeViews/"+id), v => (v||0)+1);
  });
}

/* =========================
   SEARCH
========================= */
function initSearch(){
  const input = document.querySelector(".search");
  if(!input) return;
  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    document.querySelectorAll(".anime-card").forEach(c => {
      const t = (c.dataset.title||"").toLowerCase();
      c.dataset.search = t.includes(val) ? "1" : "0";
    });
    renderPage();
  });
}

/* =========================
   SORT
========================= */
function sortYear(){
  const box = document.getElementById("animeList");
  if(!box) return;
  const cardsArr = [...box.children];
  cardsArr.sort((a,b) => (b.dataset.year||0) - (a.dataset.year||0));
  box.innerHTML="";
  cardsArr.forEach(c => box.appendChild(c));
}

/* =========================
   PAGINATION
========================= */
function initPagination(){
  cards = [...document.querySelectorAll(".anime-card")];
  currentPage = parseInt(localStorage.getItem("animePage")) || 1;
  renderPage();
}

function renderPage(){
  const visible = cards.filter(c => c.dataset.search!=="0" && c.dataset.hidden!=="1");
  const total = Math.ceil(visible.length/perPage) || 1;
  if(currentPage > total) currentPage = 1;
  const start = (currentPage-1)*perPage;
  const end = start+perPage;
  cards.forEach(c => c.style.display = "none");
  visible.slice(start,end).forEach(c => c.style.display = "");
  renderNumbers(total);
}

function renderNumbers(total){
  const box = document.getElementById("numberBox");
  if(!box) return;
  box.innerHTML="";
  for(let i=1;i<=total;i++){
    const btn = document.createElement("div");
    btn.className="num";
    btn.textContent=i;
    if(i===currentPage) btn.classList.add("active");
    btn.onclick=()=>{ currentPage=i; localStorage.setItem("animePage",i); renderPage(); };
    box.appendChild(btn);
  }
}

/* =========================
   BOTTOM NAV BUTTONS ◀ ▶
========================= */
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    const visible = cards.filter(c => c.dataset.search!=="0" && c.dataset.hidden!=="1");
    const total = Math.ceil(visible.length/perPage) || 1;
    if(action==="prev" && currentPage>1) currentPage--;
    if(action==="next" && currentPage<total) currentPage++;
    localStorage.setItem("animePage", currentPage);
    renderPage();
  });
});

/* =========================
   HOT (TRENDING)
========================= */
function initHot(){
  const slider = document.getElementById("hotSlider");
  if(!slider) return;
  onValue(ref(db,"animeViews"),snap=>{
    const data = snap.val();
    if(!data) return;
    const arr = [...document.querySelectorAll(".anime-card")].map(c=>{
      return {card:c, views:data[c.dataset.id]||0};
    });
    arr.sort((a,b)=>b.views-a.views);
    slider.innerHTML="";
    arr.slice(0,6).forEach(item=>{
      const clone = item.card.cloneNode(true);
      clone.classList.add("hot-card");
      const badge = document.createElement("div");
      badge.className="hot-badge";
      badge.innerText = item.views+" views";
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
  initOnline();
  initViews();
  initSearch();
  sortYear();
  initHot();
  initPagination();
});