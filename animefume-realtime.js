import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_eG_drnzYDUSyNBapN7kJ7XaYsbkhCwA",
  authDomain: "mpmp-5864a.firebaseapp.com",
  databaseURL: "https://mpmp-5864a-default-rtdb.firebaseio.com",
  projectId: "mpmp-5864a",
  storageBucket: "mpmp-5864a.firebasestorage.app",
  messagingSenderId: "1071327366091",
  appId: "1:1071327366091:android:b1d3cf11e7d8706462c44e"
};

const app = initializeApp(firebaseConfig, "animefume-realtime");
const db = getDatabase(app);
const sidKey = "animefume_live_session_id";
const sid = sessionStorage.getItem(sidKey) || crypto.randomUUID();
sessionStorage.setItem(sidKey, sid);
const userRef = ref(db, `onlineUsers/${sid}`);

const heartbeat = async () => {
  await set(userRef, {
    page: location.pathname,
    title: document.title || "AnimeFume",
    time: Date.now(),
    role: "user",
    language: navigator.language || "unknown",
    screen: `${window.innerWidth}x${window.innerHeight}`
  });
};

try {
  onDisconnect(userRef).remove();
  await heartbeat();
  window.setInterval(heartbeat, 8000);
  window.addEventListener("pagehide", () => { remove(userRef).catch(() => {}); }, { once: true });
} catch (error) {
  console.warn("AnimeFume realtime heartbeat unavailable", error);
}
