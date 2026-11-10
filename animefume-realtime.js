import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  remove,
  update
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
let maintenanceActive = false;
let heartbeatTimer = null;
let interactionBlockerInstalled = false;
let viewerBlocked = false;

const stopViewerActivity = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  remove(userRef).catch(() => {});
  document.querySelectorAll("video, audio").forEach((media) => {
    try { media.pause(); media.currentTime = media.currentTime; } catch (_) {}
  });
  document.querySelectorAll("iframe").forEach((frame) => { frame.style.pointerEvents = "none"; });
};

const startViewerActivity = () => {
  if (maintenanceActive || viewerBlocked || heartbeatTimer) return;
  heartbeat().catch(() => {});
  heartbeatTimer = window.setInterval(heartbeat, 8000);
  document.querySelectorAll("iframe").forEach((frame) => { frame.style.pointerEvents = ""; });
};

const renderMaintenance = (snapshot) => {
  const enabled = snapshot.val() === true;
  maintenanceActive = enabled;
  let overlay = document.getElementById("animefume-maintenance");
  if (!enabled) {
    overlay?.remove();
    document.documentElement.style.overflow = "";
    startViewerActivity();
    return;
  }
  stopViewerActivity();
  if (!interactionBlockerInstalled) {
    document.addEventListener("click", (event) => {
      if (!maintenanceActive) return;
      const target = event.target;
      if (target && target.closest && target.closest("#animefume-maintenance")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    document.addEventListener("submit", (event) => {
      if (maintenanceActive) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    interactionBlockerInstalled = true;
  }
  if (!overlay) {
    overlay = document.createElement("main");
    overlay.id = "animefume-maintenance";
    overlay.setAttribute("role", "alert");
    overlay.style.cssText = "position:fixed;z-index:10000;inset:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 30%,#182a32 0,#080b10 55%,#000 100%);color:#fff;font:16px/1.6 system-ui,sans-serif;text-align:center";
    overlay.innerHTML = '<section style="max-width:520px;padding:32px;border:1px solid rgba(53,224,193,.35);border-radius:24px;background:rgba(21,27,36,.92);box-shadow:0 20px 70px rgba(0,0,0,.45)"><div style="font-size:52px">⚙</div><h1 style="margin:12px 0;color:#35e0c1;font-size:28px">กำลังปรับปรุงเว็บไซต์</h1><p style="margin:0;color:#c7d0d9">ระบบกำลังปรับปรุงชั่วคราว โปรดลองกลับมาใหม่อีกครั้ง</p><p style="margin:18px 0 0;color:#9aa7b5;font-size:13px">AnimeFume</p></section>';
    document.body.appendChild(overlay);
  }
  document.documentElement.style.overflow = "hidden";
};

let notificationsEnabled = true;
let latestAnnouncement = null;
const renderAnnouncement = (snapshot) => {
  latestAnnouncement = snapshot;
  const data = snapshot.val();
  let banner = document.getElementById("animefume-announcement");
  if (!notificationsEnabled || !data?.active || !data.title || !data.body) {
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


const showViewerAccessOverlay = (reason) => {
  viewerBlocked = true;
  stopViewerActivity();
  let box = document.getElementById("animefume-access-control");
  if (!box) {
    box = document.createElement("main");
    box.id = "animefume-access-control";
    box.style.cssText = "position:fixed;z-index:10001;inset:0;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.96);color:#fff;font:16px/1.6 system-ui,sans-serif;text-align:center";
    document.body.appendChild(box);
  }
  box.innerHTML = "";
  const section = document.createElement("section");
  section.style.cssText = "max-width:480px;padding:30px;border:1px solid rgba(255,104,104,.5);border-radius:22px;background:#19151a";
  const heading = document.createElement("h1");
  heading.textContent = reason === "blocked" ? "บัญชี/อุปกรณ์ถูกบล็อก" : "ถูกนำออกจากเว็บไซต์";
  heading.style.color = "#ff8585";
  const text = document.createElement("p");
  text.textContent = "กรุณาติดต่อผู้ดูแลระบบหากคิดว่าเป็นความผิดพลาด";
  text.style.color = "#c7d0d9";
  section.append(heading, text);
  box.appendChild(section);
  document.documentElement.style.overflow = "hidden";
};

const handleViewerControl = (snapshot) => {
  const control = snapshot.val() || {};
  if (control.blocked === true) showViewerAccessOverlay("blocked");
  else if (control.kicked === true) showViewerAccessOverlay("kicked");
};

const renderScreenOverlay = (snapshot) => {
  const data = snapshot.val();
  let box = document.getElementById("animefume-screen-overlay");
  if (!data?.active || !data.image || maintenanceActive || viewerBlocked) { box?.remove(); return; }
  if (!box) {
    box = document.createElement("aside");
    box.id = "animefume-screen-overlay";
    box.style.cssText = "position:fixed;right:16px;bottom:82px;z-index:9997;width:min(210px,42vw);padding:8px;border:1px solid rgba(53,224,193,.55);border-radius:16px;background:rgba(10,16,22,.94);box-shadow:0 12px 30px rgba(0,0,0,.45);color:#fff;font:13px/1.35 system-ui,sans-serif";
    document.body.appendChild(box);
  }
  box.innerHTML = "";
  const image = document.createElement("img");
  image.src = data.image;
  image.alt = data.title || "AnimeFume overlay";
  image.loading = "lazy";
  image.style.cssText = "display:block;width:100%;max-height:190px;object-fit:cover;border-radius:11px";
  const title = document.createElement("strong");
  title.textContent = data.title || "";
  title.style.cssText = "display:block;margin-top:7px;color:#35e0c1";
  const caption = document.createElement("span");
  caption.textContent = data.caption || "";
  caption.style.color = "#c7d0d9";
  box.append(image, title, caption);
};

const heartbeat = async () => {
  await update(userRef, {
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
  onValue(ref(db, "siteConfig/announcement"), renderAnnouncement);
  onValue(ref(db, "siteConfig/overlay"), renderScreenOverlay);
  onValue(ref(db, `onlineUsers/${sid}`), handleViewerControl);
  onValue(ref(db, `blockedSessions/${sid}`), (snapshot) => { if (snapshot.val() === true) showViewerAccessOverlay("blocked"); });
  onValue(ref(db, "settings/maintenanceMode"), renderMaintenance);
  onValue(ref(db, "settings/notificationsEnabled"), (snapshot) => {
    notificationsEnabled = snapshot.val() !== false;
    if (latestAnnouncement) renderAnnouncement(latestAnnouncement);
  });
  window.addEventListener("pagehide", () => { remove(userRef).catch(() => {}); }, { once: true });
} catch (error) {
  console.warn("AnimeFume realtime heartbeat unavailable", error);
}
