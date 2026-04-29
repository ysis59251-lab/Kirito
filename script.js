<script type="module">
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
🔥 FIREBASE CONFIG (ใช้ชุดเดียว)
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
👥 ONLINE SYSTEM (แก้แล้ว)
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

/* นับคนออนไลน์ */
onValue(ref(db, "onlineUsers"), (snap) => {
  const data = snap.val() || {};
  const count = Object.keys(data).length;

  const el = document.getElementById("onlineCount");
  if (el) el.textContent = count;
});

/* =========================
👀 VIEW COUNT (กันสแปมแล้ว)
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
  runTransaction(ref(db, "animeViews/" + id), (v) => (v || 0) + 1);
});

/* =========================
📡 ADMIN ONLINE LIST (ถ้ามี)
========================= */
onValue(ref(db, "onlineUsers"), (snap) => {
  const data = snap.val() || {};
  const box = document.getElementById("onlineList");
  if (!box) return;

  box.innerHTML = "";

  Object.entries(data).forEach(([id, user]) => {
    const div = document.createElement("div");
    div.style.padding = "6px";
    div.style.borderBottom = "1px solid #333";

    div.innerHTML = `
      👤 ${id}<br>
      📄 ${user.page}<br>
      ⏱ ${new Date(user.time).toLocaleTimeString()}
    `;

    box.appendChild(div);
  });
});
</script>