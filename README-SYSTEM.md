# AnimeFume System

ระบบกลางของเว็บใช้ `animefume-core.js` เพื่อแชร์รายการโปรด ประวัติการดู การค้นหา และเหตุการณ์ระหว่างหน้า ส่วน `sheet2-data.js` เก็บข้อมูล Sheet2 แบบฝังในเว็บโดยไม่ต้องเรียก Google Sheets

ตรวจสุขภาพระบบได้ที่ `system-health.html`.

## Firebase viewer session

ระบบ realtime ของผู้ชมใช้ Firebase Anonymous Authentication เพื่อให้ heartbeat อัปเดต session เดิมได้ต่อเนื่อง โดยไม่เปิดสิทธิ์อ่านข้อมูลผู้ชมให้บุคคลทั่วไป ต้องเปิดผู้ให้บริการ **Anonymous** ใน Firebase Authentication และ deploy `database.rules.example.json` เป็น Realtime Database Rules ก่อนใช้งานระบบออนไลน์จริง.
