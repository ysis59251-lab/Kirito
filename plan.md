# AnimeFume clean rebuild

## Direction
เว็บสาธารณะอ่านเฉพาะเอกสารที่ `published == true` จาก Firestore ส่วนแอปแอดมินเป็นจุดจัดการเรื่องและตอนผ่าน Authentication + Firestore rules

## Structure
- `src/firebase.js`: จุดเชื่อม Firebase เดียวของเว็บ
- `src/home.js`, `src/watch.js`: อ่าน catalog/episodes จาก Firestore
- `src/admin.js`: login และ CRUD สำหรับแอดมิน
- `admin-android/`: Android admin foundation ที่ใช้ collections เดียวกัน
- `firestore.rules`: ผู้ชมอ่านข้อมูลเผยแพร่ แอดมินที่มีเอกสาร `admins/{uid}` เท่านั้นที่เขียน

## Design
- **ทิศทาง**: editorial dark console — เรียบ จริงจัง เหมาะกับการจัดการข้อมูลจำนวนมาก
- **หลักการ**: แหล่งข้อมูลเดียว, สถานะเผยแพร่ชัดเจน, หน้า player เดียว, ไม่มีไฟล์ข้อมูลซ้ำ
- **สี**: charcoal เป็นพื้น, ส้มเป็น action/สถานะสำคัญ
- **รูปแบบ**: dashboard แบบแยกงานเรื่องและตอน พร้อม empty/error states
- **เสียงแบรนด์**: ตรงไปตรงมาและตรวจสอบได้ เช่น “เพิ่มแล้ว แต่ยังไม่เผยแพร่” และ “ข้อมูลจาก Firestore ชุดเดียว”
