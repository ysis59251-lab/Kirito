<script type="module">
/* =========================
FIREBASE IMPORT
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  push,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================
FIREBASE CONFIG (ใช้ตัวเดียว)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAlhHlFFuDRtFmWEFzCfZc-m4vI3V2Nqeg",
  authDomain: "mpmp-5864a.firebaseapp.com",
  databaseURL: "https://mpmp-5864a-default-rtdb.firebaseio.com",
  projectId: "mpmp-5864a",
  storageBucket: "mpmp-5864a.firebasestorage.app",
  messagingSenderId: "1071327366091",
  appId: "1:1071327366091:web:239403c1df5da38662c44e"
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
ONLINE SYSTEM (FIXED)
========================= */
function initOnline(){
  const sid = sessionStorage.getItem("sid") || crypto.randomUUID();
  sessionStorage.setItem("sid", sid);

  const userRef = ref(db, "onlineUsers/" + sid);

  set(userRef, {
    page: location.pathname,
    time: Date.now()
  });

  onDisconnect(userRef).remove();

  onValue(ref(db, "onlineUsers"), snap => {
    const data = snap.val() || {};
    const count = Object.keys(data).length;

    const el = document.getElementById("onlineCount");
    if (el) el.textContent = count;
  });
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

    arr.sort((a,b)=>b.views-a.views);

    slider.innerHTML = "";

    arr.slice(0,10).forEach(item=>{
      const a = document.createElement("a");
      a.href = item.link;
      a.className = "anime-card hot-card";
      a.innerHTML = `
        <div class="card-img">
          <img src="${item.image}">
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
const url = "https://opensheet.elk.sh/1NEjGfASJ7xUMtw1gozP6PWXf3LGNEKZhKVAsPbAtRh0/Sheet1";

fetch(url)
.then(r=>r.json())
.then(data=>{
  const container = document.getElementById("animeList");
  container.innerHTML = "";

  data.forEach((row,i)=>{
    const a = document.createElement("a");
    a.href = row.link || "#";
    a.className = "anime-card";
    a.dataset.id = row.id || "a"+i;
    a.dataset.year = row.year || "0";
    a.dataset.title = (row.title||"").toLowerCase();
    a.dataset.hidden = row.hidden?.toUpperCase()==="TRUE"?"1":"0";

    a.innerHTML = `
      <div class="card-img">
        <img src="${row.image || "https://via.placeholder.com/300x400"}">
        <div class="overlay">${row.title||""}</div>
      </div>
    `;

    container.appendChild(a);
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

  input.addEventListener("input", ()=>{
    savedSearch = input.value.toLowerCase();
    currentPage = 1;
    isChangingPage = true;
    renderPage();
  });
}

/* =========================
SORT
========================= */
function sortYear(){
  cards.sort((a,b)=>
    (parseInt(b.dataset.year)||0)-(parseInt(a.dataset.year)||0)
  );
}

/* =========================
PAGINATION
========================= */
function renderPage(){
  const visible = cards.filter(c=>{
    return (!savedSearch || c.dataset.title.includes(savedSearch))
      && c.dataset.hidden !== "1";
  });

  const total = Math.ceil(visible.length/perPage)||1;

  const start = (currentPage-1)*perPage;
  const end = start+perPage;

  cards.forEach(c=>c.style.display="none");
  visible.slice(start,end).forEach(c=>c.style.display="");

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
  const lastTime = localStorage.getItem("lastTime");
  const now = Date.now();

  if(lastTime && now-lastTime<=30000){
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