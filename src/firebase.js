import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// ใส่ค่าของ Firebase โปรเจกต์ใหม่ที่นี่ครั้งเดียว
export const firebaseConfig = {
  apiKey: 'PASTE_FIREBASE_API_KEY',
  authDomain: 'PASTE_FIREBASE_AUTH_DOMAIN',
  projectId: 'PASTE_FIREBASE_PROJECT_ID',
  storageBucket: 'PASTE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'PASTE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'PASTE_FIREBASE_APP_ID'
};
export const firebaseConfigured = !firebaseConfig.apiKey.startsWith('PASTE_');
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp };
