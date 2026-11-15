# Firebase setup

ระบบใหม่ใช้ Firestore เป็นแหล่งข้อมูลเดียว

## Collections

- `catalog/{seriesId}`: `title`, `category`, `description`, `cover`, `color`, `published`, `createdAt`, `updatedAt`
- `episodes/{episodeId}`: `seriesId`, `number`, `title`, `videoUrl`, `published`, `createdAt`, `updatedAt`
- `admins/{uid}`: สร้างด้วย UID ของผู้ดูแลที่อนุญาตให้เขียนข้อมูล

## เชื่อมโปรเจกต์

1. สร้าง Firebase project ใหม่
2. เปิด Authentication > Email/Password และ Firestore
3. วาง Web App config ใน `src/firebase.js`
4. สร้างผู้ดูแลใน Authentication แล้วสร้างเอกสาร `admins/{uid}`
5. Deploy `firestore.rules`
6. เปิด `admin.html` เพื่อจัดการข้อมูล หรือใช้ Android admin app

ห้ามใส่ service-account private key ใน repository
