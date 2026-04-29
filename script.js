<script type="module">

/* =========================
🔥 FIREBASE CORE (ก้อนเดียวพอ)
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================
CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAlhHlFFuDRtFmWEFzCfZc-m4vI3V2Nqeg",
  authDomain: "mpmp-5864a.firebaseapp.com",
  databaseURL: "https://mpmp-5864a-default-rtdb.firebaseio.com",
  projectId: "mpmp-5864a",
  appId: "1:1071327366091:web:239403c1df5da38662c44e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =========================
🟢 ONLINE SYSTEM (FIX แล้ว)
========================= */
const sid = sessionStorage.getItem("sid") || crypto.randomUUID();
sessionStorage.setItem("sid", sid);

const userRef = ref(db, "onlineUsers/" + sid);

/* เข้าเว็บ */
set(userRef, {
  page: location.pathname,
  time: Date.now()
});

/* ออกจากเว็บ */
onDisconnect(userRef).remove();

/* นับคน */
onValue(ref(db, "onlineUsers"), (snap) => {
  const data = snap.val() || {};

  const el = document.getElementById("onlineCount");
  if (el) el.textContent = Object.keys(data).length;

  const box = document.getElementById("onlineList");
  if (!box) return;

  box.innerHTML = "";

  Object.entries(data).forEach(([id, u]) => {
    box.innerHTML += `
      <div style="padding:6px;border-bottom:1px solid #333">
        👤 ${id}<br>
        📄 ${u.page || "-"}
      </div>
    `;
  });
});

/* =========================
🔥 VIEW SYSTEM (กัน spam)
========================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".anime-card");
  if (!card) return;

  const id = card.dataset.id;
  if (!id) return;

  const last = localStorage.getItem("view_" + id);
  const now = Date.now();

  if (last && now - last < 10000) return;

  localStorage.setItem("view_" + id, now);

  runTransaction(ref(db, "animeViews/" + id), v => (v || 0) + 1);
});

/* =========================
🔥 HOT SYSTEM
========================= */
onValue(ref(db, "animeViews"), (snap) => {
  const data = snap.val();
  if (!data) return;

  const slider = document.getElementById("hotSlider");
  if (!slider) return;

  slider.innerHTML = "";

  const cards = [...document.querySelectorAll(".anime-card")];

  const sorted = cards.map(c => ({
    id: c.dataset.id,
    title: c.dataset.title,
    img: c.querySelector("img")?.src,
    link: c.href,
    views: data[c.dataset.id] || 0
  })).sort((a,b)=>b.views-a.views);

  sorted.slice(0,10).forEach(item => {
    const a = document.createElement("a");
    a.href = item.link;
    a.className = "anime-card";
    a.innerHTML = `
      <img src="${item.img}">
      <div>${item.title}</div>
      <span>${item.views}</span>
    `;
    slider.appendChild(a);
  });
});

/* =========================
🔥 SHEET LOAD (clean)
========================= */
async function loadFromSheet(){
  const res = await fetch("https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1");
  const data = await res.json();

  const box = document.getElementById("animeList");
  if (!box) return;

  box.innerHTML = "";

  data.forEach((row,i) => {
    const a = document.createElement("a");
    a.className = "anime-card";
    a.href = row.link || "#";

    a.dataset.id = row.id || "anime_"+i;
    a.dataset.title = (row.title || "").toLowerCase();

    a.innerHTML = `
      <img src="${row.image || "https://via.placeholder.com/300"}">
      <div>${row.title || ""}</div>
    `;

    box.appendChild(a);
  });
}

/* =========================
START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadFromSheet();
});

</script>