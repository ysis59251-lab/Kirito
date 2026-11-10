import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
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

const renderAnnouncement = (snapshot) => {
  const data = snapshot.val();
  let banner = document.getElementById("animefume-announcement");
  if (!data?.active || !data.title || !data.body) {
    banner?.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement("aside");
    banner.id = "animefume-announcement";
    banner.setAttribute("role", "status");
    banner.style.cssText = "position:fixed;z-index:9999;left:12px;right:12px;bottom:18px;max-width:680px;margin:auto;padding:14px 44px 14px 16px;border:1px solid rgba(53,224,193,.45);border-radius:16px;background:rgba(12,20,28,.96);box-shadow:0 12px 35px rgba(0,0,0,.35);color:#fff;font:14px/1.5 system-ui,sans-serif";
    document.body.appendChild(banner);
  }
  banner.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = data.title;
  title.style.display = "block";
  title.style.color = "#35e0c1";
  const body = document.createElement("span");
  body.textContent = data.body;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", "ปิดประกาศ");
  close.style.cssText = "position:absolute;right:10px;top:8px;border:0;background:none;color:#9aa7b5;font-size:24px;cursor:pointer";
  close.onclick = () => banner.remove();
  banner.append(title, body, close);
};

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
  onValue(ref(db, "siteConfig/announcement"), renderAnnouncement);
  window.setInterval(heartbeat, 8000);
  window.addEventListener("pagehide", () => { remove(userRef).catch(() => {}); }, { once: true });
} catch (error) {
  console.warn("AnimeFume realtime heartbeat unavailable", error);
}
