<script type="module">
/* =========================
🔥 FIREBASE IMPORT
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
🔥 CONFIG (ใช้อันเดียวพอ)
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
🟢 GLOBAL STATE
========================= */
let cards = [];
let perPage = 40;
let currentPage = 1;
let savedSearch = "";
let isChangingPage = false;

/* =========================
💾 SAVE STATE
========================= */
function saveState() {
  localStorage.setItem("scrollY", window.scrollY);
  localStorage.setItem("lastPage", currentPage);
  localStorage.setItem("searchText", savedSearch);
  localStorage.setItem("lastTime", Date.now());
}

/* =========================
🔥 ONLINE SYSTEM (FIXED)
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
👁 VIEW COUNT
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

    runTransaction(ref(db, "animeViews/" + id), (val) => (val || 0) + 1);
  });
}

/* =========================
🔥 HOT LIST
========================= */
function initHot() {
  const slider = document.getElementById("hotSlider");
  if (!slider) return;

  onValue(ref(db, "animeViews"), (snap) => {
    const data = snap.val() || {};

    const arr = cards.map((c) => ({
      id: c.dataset.id,
      title: c.dataset.title,
      image: c.querySelector("img")?.src,
      link: c.href,
      views: data[c.dataset.id] || 0
    }));

    arr.sort((a, b) => b.views - a.views);

    slider.innerHTML = "";

    arr.slice(0, 10).forEach((item) => {
      const el = document.createElement("a");
      el.href = item.link;
      el.className = "anime-card hot-card";
      el.innerHTML = `
        <div class="card-img">
          <img src="${item.image}">
          <div class="overlay">${item.title}</div>
        </div>
        <div class="hot-badge">${item.views} views</div>
      `;
      slider.appendChild(el);
    });
  });
}

/* =========================
📦 LOAD SHEET
========================= */
function loadFromSheet() {
  const url =
    "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      const container = document.getElementById("animeList");
      container.innerHTML = "";

      data.forEach((row, i) => {
        const card = document.createElement("a");

        card.href = row.link || "#";
        card.className = "anime-card";

        card.dataset.id = row.id || row.title || "anime_" + i;
        card.dataset.year = row.year || "0";
        card.dataset.title = (row.title || "").toLowerCase();
        card.dataset.search = "1";
        card.dataset.hidden = row.hidden?.toUpperCase() === "TRUE" ? "1" : "0";

        const img =
          row.image && row.image.startsWith("http")
            ? row.image
            : "https://via.placeholder.com/300x400?text=No+Image";

        card.innerHTML = `
          <div class="card-img">
            <img src="${img}">
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
      if (y) setTimeout(() => window.scrollTo(0, +y), 200);
    });
}

/* =========================
🔍 SEARCH
========================= */
function initSearch() {
  const input = document.querySelector(".search");
  if (!input) return;

  if (savedSearch) input.value = savedSearch;

  input.addEventListener("input", () => {
    savedSearch = input.value.toLowerCase();

    cards.forEach((c) => {
      c.dataset.search = c.dataset.title.includes(savedSearch) ? "1" : "0";
    });

    currentPage = 1;
    isChangingPage = true;

    saveState();
    renderPage();
  });
}

/* =========================
📊 SORT
========================= */
function sortYear() {
  cards.sort(
    (a, b) => (parseInt(b.dataset.year) || 0) - (parseInt(a.dataset.year) || 0)
  );

  const container = document.getElementById("animeList");
  cards.forEach((c) => container.appendChild(c));
}

/* =========================
📄 PAGINATION
========================= */
function renderPage() {
  const visible = cards.filter(
    (c) => c.dataset.search !== "0" && c.dataset.hidden !== "1"
  );

  const totalPages = Math.ceil(visible.length / perPage) || 1;

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  cards.forEach((c) => (c.style.display = "none"));
  visible.slice(start, end).forEach((c) => (c.style.display = ""));

  renderNumbers(totalPages);

  if (isChangingPage) window.scrollTo({ top: 0, behavior: "smooth" });

  saveState();
  isChangingPage = false;
}

/* =========================
🔢 PAGE BUTTONS
========================= */
function renderNumbers(totalPages) {
  const box = document.getElementById("numberBox");
  if (!box) return;

  box.innerHTML = "";

  const setSize = 5;
  const setIndex = Math.floor((currentPage - 1) / setSize);

  const start = setIndex * setSize + 1;
  const end = Math.min(start + setSize - 1, totalPages);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("div");
    btn.className = "num";
    btn.textContent = i;

    if (i === currentPage) btn.classList.add("active");

    btn.onclick = () => {
      currentPage = i;
      isChangingPage = true;
      renderPage();
    };

    box.appendChild(btn);
  }
}

/* =========================
🚀 START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const lastTime = localStorage.getItem("lastTime");
  const now = Date.now();

  if (lastTime && now - lastTime < 30000) {
    currentPage = +(localStorage.getItem("lastPage") || 1);
    savedSearch = (localStorage.getItem("searchText") || "").toLowerCase();
  }

  loadFromSheet();
  initOnline();
  initViews();
  initSearch();
});