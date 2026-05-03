/* =========================
FIREBASE
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, onValue, runTransaction,
  set, onDisconnect, push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
STATE
========================= */
let cards = [];
let perPage = 40;
let currentPage = 1;
let savedSearch = "";
let isChangingPage = false;
let hotInitialized = false;

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
FAB
========================= */
function initFAB(){
  document.querySelectorAll(".fab").forEach(fab=>{
    fab.onclick=()=>{
      const action=fab.dataset.action;
      const bottomNav=document.getElementById("bottomNav");
      const search=document.querySelector(".search");
      const hot=document.getElementById("hotSlider");

      if(action==="toggle-nav" && bottomNav) bottomNav.classList.toggle("show");
      if(action==="open-search" && search) search.focus();
      if(action==="open-hot" && hot) hot.scrollIntoView({behavior:"smooth"});
    };
  });
}

/* =========================
MENU / FOOTER
========================= */
function initMenu(){
  const btn=document.getElementById("menuBtn");
  const menu=document.getElementById("menuDropdown");
  if(btn && menu){
    btn.onclick=()=>menu.style.display =
      menu.style.display==="flex"?"none":"flex";
  }
}

function initFooter(){
  const el=document.getElementById("year");
  if(el) el.textContent=new Date().getFullYear();
}

/* =========================
ONLINE
========================= */
function initOnline(){
  try{
    const userRef=push(ref(db,"onlineUsers"));
    set(userRef,{page:location.pathname,time:Date.now()});
    onDisconnect(userRef).remove();
  }catch(e){console.error(e);}
}

/* =========================
VIEWS
========================= */
function initViews(){
  document.addEventListener("click",e=>{
    const card=e.target.closest(".anime-card");
    if(!card) return;

    const id=card.dataset.id;
    if(!id) return;

    const last=localStorage.getItem("view_"+id);
    const now=Date.now();
    if(last && now-last<10000) return;

    localStorage.setItem("view_"+id,now);
    runTransaction(ref(db,"animeViews/"+id),v=>(v||0)+1);
  });
}

/* =========================
HOT
========================= */
function initHot(){
  if(hotInitialized) return;
  hotInitialized=true;

  const slider=document.getElementById("hotSlider");
  if(!slider) return;

  onValue(ref(db,"animeViews"),snap=>{
    const data=snap.val()||{};
    if(cards.length===0) return;

    const arr=cards.map(c=>({
      id:c.dataset.id,
      title:c.dataset.title,
      image:c.querySelector("img")?.src||"",
      link:c.href,
      views:data[c.dataset.id]||0
    }));

    arr.sort((a,b)=>b.views-a.views);

    slider.innerHTML="";
    arr.slice(0,10).forEach(item=>{
      const a=document.createElement("a");
      a.href=item.link;
      a.className="anime-card hot-card";

      a.innerHTML=`
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
LOAD DATA
========================= */
function loadFromSheet(){
  const url=`https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1`;

  fetch(url)
  .then(r=>r.json())
  .then(data=>{
    const container=document.getElementById("animeList");
    if(!container) return;

    container.innerHTML="";

    data.forEach((row,i)=>{
      const card=document.createElement("a");
      card.className="anime-card";
      card.href=row.link||"#";

      card.dataset.id=row.id||"id"+i;
      card.dataset.title=(row.title||"").toLowerCase();
      card.dataset.year=row.year||"0";
      card.dataset.hidden=row.hidden?.toUpperCase()==="TRUE"?"1":"0";
      card.dataset.search="1";

      const img=row.image?.startsWith("http")
        ? row.image
        : "https://via.placeholder.com/300x400";

      card.innerHTML=`
        <div class="card-img">
          <img src="${img}" loading="lazy">
          <div class="overlay">${row.title||""}</div>
        </div>
      `;

      container.appendChild(card);
    });

    cards=[...document.querySelectorAll(".anime-card")];

    initSearch();
    sortYear();
    renderPage();
    initHot();

    restoreScroll();
  })
  .catch(()=>{
    const c=document.getElementById("animeList");
    if(c) c.innerHTML="<p style='text-align:center'>โหลดข้อมูลไม่สำเร็จ</p>";
  });
}

/* =========================
SEARCH
========================= */
function initSearch(){
  const input=document.querySelector(".search");
  if(!input) return;

  input.value=savedSearch;

  function doSearch(){
    savedSearch=input.value.toLowerCase();
    cards.forEach(c=>{
      c.dataset.search=c.dataset.title.includes(savedSearch)?"1":"0";
    });
    currentPage=1;
    renderPage();
    input.blur();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function reset(){
    savedSearch="";
    cards.forEach(c=>c.dataset.search="1");
    currentPage=1;
    renderPage();
  }

  input.oninput=()=>{
    if(input.value==="") reset();
  };

  input.onkeydown=e=>{
    if(e.key==="Enter") doSearch();
  };

  input.addEventListener("search",doSearch);
}

/* =========================
SORT
========================= */
function sortYear(){
  cards.sort((a,b)=>(b.dataset.year||0)-(a.dataset.year||0));
  const c=document.getElementById("animeList");
  cards.forEach(x=>c.appendChild(x));
}

/* =========================
PAGINATION
========================= */
function renderPage(){
  const visible=cards.filter(c=>c.dataset.search!=="0" && c.dataset.hidden!=="1");

  const start=(currentPage-1)*perPage;
  const end=start+perPage;

  cards.forEach(c=>c.style.display="none");
  visible.slice(start,end).forEach(c=>c.style.display="");

  renderNumbers(visible.length);
  saveState();
}

function renderNumbers(total){
  const box=document.getElementById("numberBox");
  if(!box) return;

  const pages=Math.ceil(total/perPage);
  box.innerHTML="";

  for(let i=1;i<=pages;i++){
    const b=document.createElement("button");
    b.textContent=i;
    if(i===currentPage) b.classList.add("active");

    b.onclick=()=>{
      currentPage=i;
      renderPage();
      window.scrollTo({top:0,behavior:"smooth"});
    };

    box.appendChild(b);
  }
}

/* =========================
RESTORE
========================= */
function restoreScroll(){
  const y=localStorage.getItem("scrollY");
  if(y) setTimeout(()=>window.scrollTo(0,+y),200);
}

/* =========================
START
========================= */
document.addEventListener("DOMContentLoaded",()=>{
  initFAB();
  initMenu();
  initFooter();
  initOnline();
  initViews();

  const last=localStorage.getItem("lastTime");
  if(last && Date.now()-last<30000){
    currentPage=+localStorage.getItem("lastPage")||1;
    savedSearch=(localStorage.getItem("searchText")||"").toLowerCase();
  }else{
    localStorage.clear();
  }

  loadFromSheet();
});