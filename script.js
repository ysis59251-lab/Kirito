<script type="module">
/* =========================
🔥 FIREBASE CORE (ONE SYSTEM ONLY)
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
CONFIG (เลือกอันเดียวเท่านั้น)
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

/* =========================
INIT
========================= */
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =========================
GLOBAL STATE (ใช้ร่วมทั้งเว็บ)
========================= */
let cards = [];
let currentPage = 1;
let perPage = 40;
let searchText = "";

/* =========================
💾 SAVE STATE
========================= */
function saveState() {
  localStorage.setItem("page", currentPage);
  localStorage.setItem("search", searchText);
}

/* =========================
🟢 ONLINE SYSTEM (REAL FIX)
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

  onValue(ref(db, "onlineUsers"), (snap) => {
    const data = snap.val();
    const count = data ? Object.keys(data).length : 0;

    const el = document.getElementById("onlineCount");
    if (el) el.textContent = count;
  });
}

/* =========================
👁 VIEW SYSTEM
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
🔥 LOAD DATA (SHEET → UI)
========================= */
function loadData() {
  const url = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      const box = document.getElementById("animeList");
      box.innerHTML = "";

      data.forEach((row, i) => {
        const el = document.createElement("a");

        el.href = row.link || "#";
        el.className = "anime-card";

        el.dataset.id = row.id || "anime_" + i;
        el.dataset.title = (row.title || "").toLowerCase();
        el.dataset.year = row.year || "0";
        el.dataset.hidden = row.hidden === "TRUE" ? "1" : "0";

        const img =
          row.image?.startsWith("http")
            ? row.image
            : "https://via.placeholder.com/300x400";

        el.innerHTML = `
          <div class="card-img">
            <img src="${img}">
            <div class="overlay">${row.title || "no title"}</div>
          </div>
        `;

        box.appendChild(el);
      });

      cards = [...document.querySelectorAll(".anime-card")];

      render();
    });
}

/* =========================
🔍 SEARCH
========================= */
function initSearch() {
  const input = document.querySelector(".search");
  if (!input) return;

  input.addEventListener("input", () => {
    searchText = input.value.toLowerCase();

    cards.forEach((c) => {
      c.dataset.show =
        c.dataset.title.includes(searchText) ? "1" : "0";
    });

    currentPage = 1;
    saveState();
    render();
  });
}

/* =========================
📄 RENDER (MAIN CORE)
========================= */
function render() {
  const visible = cards.filter(
    (c) => c.dataset.show !== "0" && c.dataset.hidden !== "1"
  );

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  cards.forEach((c) => (c.style.display = "none"));
  visible.slice(start, end).forEach((c) => (c.style.display = ""));

  saveState();
}

/* =========================
🔥 START SYSTEM
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const savedPage = localStorage.getItem("page");
  const savedSearch = localStorage.getItem("search");

  if (savedPage) currentPage = +savedPage;
  if (savedSearch) searchText = savedSearch;

  loadData();
  initOnline();
  initViews();
  initSearch();
});