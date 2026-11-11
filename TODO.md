# AnimeFume / Kirito — Improvement Outcomes

## ความเสถียรและความปลอดภัยของ importer
- [ ] ตรวจ URL สื่อและ redirect ทุก hop ให้อยู่ใน allowlist และใช้ scheme/port ที่ปลอดภัย
- [ ] เพิ่ม timeout/retry ที่เหมาะสมและ cleanup ไฟล์ชั่วคราวทุกกรณี
- [ ] ทำให้ state ของการอัปโหลดและ health-check สอดคล้อง และไม่สร้างงานซ้ำโดยไม่จำเป็น

## เว็บ realtime
- [ ] heartbeat ต้องจับ error และไม่สร้าง unhandled rejection
- [ ] cleanup `onDisconnect`, pagehide และ MutationObserver อย่างปลอดภัย
- [ ] คง maintenance/block overlay และการหยุด media ได้โดยไม่ทำให้หน้าเสีย

## Admin Android
- [ ] คำสั่ง Firebase ต้องแสดง pending/success/error ตามผลจริง
- [ ] การส่งข้อมูลตอนต้อง validate URL/episode และรายงานผลล้มเหลวที่แก้ได้
- [ ] สร้าง APK debug รุ่นใหม่และตรวจ syntax/build

## CI และเอกสาร
- [ ] ตรวจ workflow/importer/Android ด้วยคำสั่งที่มีอยู่จริง
- [ ] ไม่ส่ง secret ออกนอกระบบและไม่ commit ไฟล์คีย์
