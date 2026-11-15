import { readFile } from 'node:fs/promises';
const required=['index.html','watch.html','admin.html','styles.css','firestore.rules','src/firebase.js','src/home.js','src/watch.js','src/admin.js','admin-android/app/src/main/java/com/animefume/admin/MainActivity.kt'];
for(const file of required)await readFile(file,'utf8');
const source=await readFile('src/firebase.js','utf8');
if(!source.includes('getFirestore')||!source.includes('PASTE_FIREBASE_PROJECT_ID'))throw new Error('Firebase source is incomplete');
console.log('AnimeFume Firebase foundation OK — single Firestore source');
