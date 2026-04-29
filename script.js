<script type="module">
/* =========================
FIREBASE IMPORT (ครั้งเดียวพอ)
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
FIREBASE CONFIG (ใช้ตัวเดียวเท่านั้น)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAlhHlFFuDRtFmWEFzCfZc-m4vI3V2Nqeg",
  authDomain: "mpmp-5864a.firebaseapp.com",
  databaseURL: "https://mpmp-5864a-default-rtdb.firebaseio.com",
  projectId: "mpmp-5864a",
  storageBucket: "mpmp-5864a.firebasestorage.app",
  messagingSenderId: "1071327366091",
  appId: "1:1071327366091:web:239403c1df5da38662c44e",
  measurementId: "G-PP1HLR95BV"
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
ONLINE SYSTEM (FIXED)
========================= */
const sid = sessionStorage.getItem("sid") || crypto.randomUUID();
sessionStorage.setItem("sid", sid);

const userRef = ref(db, "onlineUsers/" + sid);

/* เข้าเว็บ */
set(userRef, {
  page: location.pathname,
  time: Date.now()
});

/* ออกเว็บ */
onDisconnect(userRef).remove();

/* นับคนออนไลน์ */
onValue(ref(db, "onlineUsers"), (snap) => {
  const count = snap.size || 0;
  const el = document.getElementById("onlineCount");
  if (el) el.textContent = count;
});

/* =========================
VIEW COUNT (กัน spam)
========================= */
function initViews() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".anime-card");
    if (!card) return;

    const id = card.dataset.id;
    if (!id) return;

    const last = localStorage.getItem("view_" + id);
    const now = Date.now();

    if (last && now - last < 10000) return;

    localStorage.setItem("view_" + id, now);

    runTransaction(ref(db, "animeViews/" + id), (v) => (v || 0) + 1);
  });
}

/* =========================
HOT LIST
========================= */
function initHot() {
  const slider = document.getElementById("hotSlider");
  if (!slider) return;

  onValue(ref(db, "animeViews"), (snap) => {
    const data = snap.val();
    if (!data || !cards.length) return;

    const arr = cards.map(c => ({
      id: c.dataset.id,
      title: c.dataset.title,
      image: c.querySelector("img")?.src,
      link: c.href,
      views: data[c.dataset.id] || 0
    })).sort((a, b) => b.views - a.views);

    slider.innerHTML = "";

    arr.slice(0, 10).forEach(item => {
      const a = document.createElement("a");
      a.href = item.link;
      a.className = "anime-card hot-card";
      a.innerHTML = `
        <img src="${item.image}">
        <div>${item.title}</div>
        <small>${item.views} views</small>
      `;
      slider.appendChild(a);
    });
  });
}

/* =========================
LOAD DATA
========================= */
async function loadFromSheet() {
  const url = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";
  const data = await fetch(url).then(r => r.json());

  const container = document.getElementById("animeList");
  container.innerHTML = "";

  data.forEach((row, i) => {
    const a = document.createElement("a");
    a.href = row.link || "#";
    a.className = "anime-card";

    a.dataset.id = row.id || i;
    a.dataset.title = (row.title || "").toLowerCase();
    a.dataset.year = row.year || 0;
    a.dataset.hidden = row.hidden === "TRUE" ? "1" : "0";

    a.innerHTML = `
      <img src="${row.image || "https://via.placeholder.com/300"}">
      <div>${row.title || "no title"}</div>
    `;

    container.appendChild(a);
  });

  cards = [...document.querySelectorAll(".anime-card")];

  sortYear();
  renderPage();
  initHot();
}

/* =========================
SORT
========================= */
function sortYear() {
  cards.sort((a, b) => (b.dataset.year || 0) - (a.dataset.year || 0));
}

/* =========================
PAGINATION
========================= */
function renderPage() {
  const visible = cards.filter(c => c.dataset.hidden !== "1");

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  cards.forEach(c => c.style.display = "none");
  visible.slice(start, end).forEach(c => c.style.display = "block");
}

/* =========================
SEARCH
========================= */
function initSearch() {
  const input = document.querySelector(".search");
  if (!input) return;

  input.addEventListener("input", () => {
    savedSearch = input.value.toLowerCase();

    cards.forEach(c => {
      c.style.display =
        c.dataset.title.includes(savedSearch) ? "block" : "none";
    });
  });
}

/* =========================
START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadFromSheet();
  initSearch();
  initViews();
});
</script>

 </body>  
</html>