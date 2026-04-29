<script type="module">

/* =========================
🔥 FIREBASE (ก้อนเดียวพอ)
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
CONFIG (ใช้แค่อันเดียว)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAlhHlFFuDRtFmWEFzCfZc-m4vI3V2Nqeg",
  authDomain: "mpmp-5864a.firebaseapp.com",
  databaseURL: "https://mpmp-5864a-default-rtdb.firebaseio.com",
  projectId: "mpmp-5864a",
  appId: "1:1071327366091:web:239403c1df5da38662c44e"
};

/* =========================
INIT
========================= */
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =========================
🟢 ONLINE SYSTEM (เวอร์ชันเดียว)
========================= */
const sid = sessionStorage.getItem("sid") || crypto.randomUUID();
sessionStorage.setItem("sid", sid);

const userRef = ref(db, "onlineUsers/" + sid);

/* เข้าเว็บ */
set(userRef, {
  page: location.pathname,
  time: Date.now()
});

/* ออกจากเว็บ (auto delete) */
onDisconnect(userRef).remove();

/* แสดงจำนวนคน */
onValue(ref(db, "onlineUsers"), (snap) => {
  const data = snap.val() || {};
  const count = Object.keys(data).length;

  const el = document.getElementById("onlineCount");
  if (el) el.textContent = count;
});

</script>