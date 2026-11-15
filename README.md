# AnimeFume Clean

ระบบ AnimeFume รุ่นใหม่แบบ static และโครงสร้างเดียว

- หน้าแรก: `index.html`
- หน้า watch เดียว: `watch.html?id=<id>`
- ระบบจัดการ/ตรวจสถานะ: `admin.html`
- แหล่งข้อมูลเดียว: Firebase Firestore
- แอปแอดมิน Android: `admin-android/`

ข้อมูลเดิม, Google Sheets, player HTML ซ้ำ และ workflow เก่าถูกล้างออกจากรุ่นนี้แล้ว

ดูขั้นตอนเชื่อมโปรเจกต์ใหม่ที่ [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

## ตรวจสอบและรันในเครื่อง

```bash
npm run build
npm run serve
```

จากนั้นเปิด `http://localhost:4173/`
