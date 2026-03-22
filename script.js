/* =========================
FAB BUTTONS MULTI-ACTION
========================= */
document.querySelectorAll(".fab").forEach(fab => {
  fab.addEventListener("click", () => {
    const action = fab.dataset.action; // อ่าน action จาก attribute
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
FIREBASE IMPORT (ต้องอยู่บนสุด)
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
UI CONTROL
========================= */
function toggleBottom(){
  document.getElementById("bottomNav")?.classList.toggle("show");
}

/* =========================
MENU CONTROL
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
FOOTER YEAR
========================= */
function initFooter(){
  const el = document.getElementById("year");
  if(el){
    el.textContent = new Date().getFullYear();
  }
}

/* =========================
BOTTOM NAV CONTROL
========================= */
document.getElementById("prevBtn")?.addEventListener("click", prevSet);
document.getElementById("nextBtn")?.addEventListener("click", nextSet);

function nextSet(){
  const total = Math.ceil(cards.filter(c=>c.dataset.search!=="0" && c.dataset.hidden!=="1").length / perPage);
  if(currentPage < total){
    currentPage++;
    renderPage();
  }
}

function prevSet(){
  if(currentPage > 1){
    currentPage--;
    renderPage();
  }
}

/* =========================
ONLINE USERS SYSTEM
========================= */
function initOnline(){
  try{
    const userRef = push(ref(db,"onlineUsers"));
    set(userRef,{
      page:location.pathname,
      time:Date.now()
    });
    onDisconnect(userRef).remove();
  }catch(e){
    console.error("online error",e);
  }
}

/* =========================
VIEW COUNT SYSTEM
========================= */
function initViews(){
  document.addEventListener("click",(e)=>{
    const card = e.target.closest(".anime-card");
    if(!card) return;
    const id = card.dataset.id;
    if(!id) return;
    const viewRef = ref(db,"animeViews/"+id);
    runTransaction(viewRef,(val)=>(val||0)+1);
  });
}

/* =========================
LOAD DATA FROM SHEET
========================= */
function loadFromSheet(){
  const url="https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";
  fetch(url)
  .then(r=>r.json())
  .then(data=>{
    const container=document.getElementById("animeList");
    if(!container) return;
    container.innerHTML="";
    data.forEach(row=>{
      const card=document.createElement("a");
      card.href = row.link || "#";
      card.className="anime-card";
      card.dataset.id = row.id || row.title;
      card.dataset.year = row.year || "0";
      card.dataset.search = "1";
      card.dataset.title = row.title || "";
      card.dataset.hidden = row.hidden?.toUpperCase() === "TRUE" ? "1" : "0";

      // ✅ แก้ไข template literal ให้ถูกต้อง
      card.innerHTML = `
        <div class="card-img">
          <img src="${row.image || ''}" loading="lazy">
          <div class="overlay">${row.title || "ไม่มีชื่อ"}</div>
        </div>
      `;

      container.appendChild(card);
    });

    sortYear();
    initPagination();
    initHot();
  })
  .catch(err=>{
    console.error("โหลด sheet ไม่ได้",err);
  });
}

/* =========================
SEARCH SYSTEM
========================= */
function initSearch(){
  const input=document.querySelector(".search");
  if(!input) return;
  input.addEventListener("input",()=>{
    const val=input.value.toLowerCase();
    document.querySelectorAll(".anime-card").forEach(c=>{
      const t=(c.dataset.title||"").toLowerCase();
      c.dataset.search = t.includes(val) ? "1" : "0";
    });
    renderPage();
  });
}

/* =========================
SORT SYSTEM
========================= */
function renderNumbers(total){
  const box = document.getElementById("numberBox");
  if(!box) return;

  box.innerHTML = "";

  const groupSize = 5; // แสดงทีละ 5 หน้า

  // หาว่าอยู่ชุดไหน
  const currentGroup = Math.ceil(currentPage / groupSize);

  const startPage = (currentGroup - 1) * groupSize + 1;
  const endPage = Math.min(startPage + groupSize - 1, total);

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
}

/* =========================
PAGINATION SYSTEM
========================= */
function initPagination(){
  cards=[...document.querySelectorAll(".anime-card")];
  currentPage=1;
  renderPage();
}

function renderPage(){
  const visible=cards.filter(c=>c.dataset.search!=="0" && c.dataset.hidden!=="1");
  const total=Math.ceil(visible.length/perPage)||1;
  const start=(currentPage-1)*perPage;
  const end=start+perPage;

  cards.forEach(c=>c.style.display="none");
  visible.slice(start,end).forEach(c=>{ c.style.display=""; });

  renderNumbers(total);
}

function renderNumbers(total){
  const box=document.getElementById("numberBox");
  if(!box) return;
  box.innerHTML="";
  for(let i=1;i<=total;i++){
    const btn=document.createElement("div");
    btn.className="num";
    btn.textContent=i;
    if(i===currentPage) btn.classList.add("active");
    btn.onclick=()=>{
      currentPage=i;
      renderPage();
    };
    box.appendChild(btn);
  }
}

/* =========================
HOT (TRENDING)
========================= */
function initHot(){
  const slider=document.getElementById("hotSlider");
  if(!slider) return;

  onValue(ref(db,"animeViews"),snap=>{
    const data=snap.val();
    if(!data) return;

    const arr=[...document.querySelectorAll(".anime-card")].map(c=>{
      return { card:c, views:data[c.dataset.id]||0 };
    });

    arr.sort((a,b)=>b.views-a.views);

    slider.innerHTML="";
    arr.slice(0,6).forEach(item=>{
      const clone=item.card.cloneNode(true);
      clone.classList.add("hot-card");

      const badge=document.createElement("div");
      badge.className="hot-badge";
      badge.innerText=item.views+" views";

      clone.appendChild(badge);
      slider.appendChild(clone);
    });
  });
}

/* =========================
START SYSTEM
========================= */
document.addEventListener("DOMContentLoaded",()=>{
  initMenu();
  initFooter();
  loadFromSheet();
  initOnline();
  initViews();
  initSearch();
});