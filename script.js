<script type="module">
/* =========================
FIREBASE IMPORT (ONCE)
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
FIREBASE CONFIG (MAIN ONLY)
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

/* INIT ONCE */
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
function saveState() {
  localStorage.setItem("scrollY", window.scrollY);
  localStorage.setItem("lastPage", currentPage);
  localStorage.setItem("searchText", savedSearch);
  localStorage.setItem("lastTime", Date.now());
}

/* =========================
ONLINE SYSTEM (FIXED)
========================= */
function initOnline() {
  const sid = sessionStorage.getItem("sid") || crypto.randomUUID();
  sessionStorage.setItem("sid", sid);

  const userRef = ref(db, "onlineUsers/" + sid);

  set(userRef, {
    page: location.pathname,
    time: Date.now()
  });

  onDisconnect(userRef).remove();
}

/* =========================
ONLINE COUNT FIX
========================= */
onValue(ref(db, "onlineUsers"), (snap) => {
  const count = snap.numChildren(); // ✅ FIX
  const el = document.getElementById("onlineCount");
  if (el) el.textContent = count;
});

/* =========================
VIEW COUNT
========================= */
function initViews() {
  document.addEventListener("click", e => {
    const card = e.target.closest(".anime-card");
    if (!card) return;

    const id = card.dataset.id;
    if (!id) return;

    const last = localStorage.getItem("view_" + id);
    const now = Date.now();
    if (last && (now - last) < 10000) return;

    localStorage.setItem("view_" + id, now);
    runTransaction(ref(db, "animeViews/" + id), val => (val || 0) + 1);
  });
}

/* =========================
HOT LIST
========================= */
function initHot() {
  const slider = document.getElementById("hotSlider");
  if (!slider) return;

  onValue(ref(db, "animeViews"), snap => {
    const data = snap.val();
    if (!data || cards.length === 0) return;

    const arr = cards.map(c => ({
      id: c.dataset.id,
      title: c.dataset.title,
      image: c.querySelector("img")?.src,
      link: c.href,
      views: data?.[c.dataset.id] || 0
    })).sort((a, b) => b.views - a.views);

    slider.innerHTML = "";

    arr.slice(0, 10).forEach(item => {
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
function loadFromSheet() {
  const url = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const container = document.getElementById("animeList");
      if (!container) return;

      container.innerHTML = "";

      data.forEach((row, i) => {
        const card = document.createElement("a");
        card.href = row.link || "#";
        card.className = "anime-card";
        card.dataset.id = row.id || "anime_" + i;
        card.dataset.year = row.year || "0";
        card.dataset.title = (row.title || "").toLowerCase();
        card.dataset.hidden = row.hidden?.toUpperCase() === "TRUE" ? "1" : "0";

        const img = row.image?.startsWith("http")
          ? row.image
          : "https://via.placeholder.com/300x400?text=No+Image";

        card.innerHTML = `
          <div class="card-img">
            <img src="${img}" loading="lazy">
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
      if (y) setTimeout(() => window.scrollTo(0, parseInt(y)), 200);
    });
}

/* =========================
SEARCH
========================= */
function initSearch() {
  const input = document.querySelector(".search");
  if (!input) return;

  input.value = savedSearch;

  input.addEventListener("input", () => {
    savedSearch = input.value.toLowerCase();

    cards.forEach(c => {
      c.dataset.search = c.dataset.title.includes(savedSearch) ? "1" : "0";
    });

    currentPage = 1;
    saveState();
    renderPage();
  });
}

/* =========================
SORT
========================= */
function sortYear() {
  cards.sort((a, b) =>
    (parseInt(b.dataset.year) || 0) - (parseInt(a.dataset.year) || 0)
  );

  const container = document.getElementById("animeList");
  cards.forEach(c => container.appendChild(c));
}

/* =========================
PAGINATION
========================= */
function renderPage() {
  const visible = cards.filter(c =>
    c.dataset.search !== "0" && c.dataset.hidden !== "1"
  );

  const totalPages = Math.ceil(visible.length / perPage) || 1;

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  cards.forEach(c => c.style.display = "none");
  visible.slice(start, end).forEach(c => c.style.display = "");

  saveState();

  if (isChangingPage) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    isChangingPage = false;
  }
}

/* =========================
START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const lastTime = localStorage.getItem("lastTime");
  const now = Date.now();

  if (lastTime && (now - lastTime) <= 30000) {
    currentPage = parseInt(localStorage.getItem("lastPage") || "1");
    savedSearch = (localStorage.getItem("searchText") || "").toLowerCase();
  } else {
    localStorage.clear();
  }

  loadFromSheet();
  initOnline();
  initViews();
  initSearch();
});
</script>