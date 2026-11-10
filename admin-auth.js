import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyC_eG_drnzYDUSyNBapN7kJ7XaYsbkhCwA",
  authDomain: "mpmp-5864a.firebaseapp.com",
  databaseURL: "https://mpmp-5864a-default-rtdb.firebaseio.com",
  projectId: "mpmp-5864a",
  storageBucket: "mpmp-5864a.firebasestorage.app",
  messagingSenderId: "220776049054",
  appId: "1:1071327366091:web:53524fb1e90ba83a12ce8f"
};

const app = getApps().find((item) => item.name === "animefume-admin-auth")
  || initializeApp(firebaseConfig, "animefume-admin-auth");
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export async function verifyAdmin(user) {
  if (!user?.uid) return null;
  const snapshot = await getDoc(doc(firestore, "adminUsers", user.uid));
  const data = snapshot.exists() ? snapshot.data() : null;
  return data?.active === true ? { user, ...data } : null;
}

export async function signInAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const admin = await verifyAdmin(credential.user);
  if (!admin) {
    await signOut(auth);
    const error = new Error("บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ");
    error.code = "admin/not-authorized";
    throw error;
  }
  return admin;
}

export function requireAdmin(redirect = "../Administrator.html") {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      try {
        const admin = await verifyAdmin(user);
        if (!admin) {
          await signOut(auth).catch(() => {});
          location.replace(redirect);
          reject(new Error("Admin authorization required"));
          return;
        }
        resolve(admin);
      } catch (error) {
        location.replace(redirect);
        reject(error);
      }
    });
  });
}

export { signOut };
