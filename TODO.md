# AnimeFume / Kirito — Improvement Outcomes

## ความเสถียรและความปลอดภัยของ importer
- [x] ตรวจ URL สื่อและ redirect ทุก hop ให้อยู่ใน allowlist และใช้ scheme/port ที่ปลอดภัย
- [x] เพิ่ม timeout/retry ที่เหมาะสมและ cleanup ไฟล์ชั่วคราวทุกกรณี
- [x] ทำให้ state ของการอัปโหลดและ health-check สอดคล้อง และไม่สร้างงานซ้ำโดยไม่จำเป็น

## เว็บ realtime
- [x] heartbeat ต้องจับ error และไม่สร้าง unhandled rejection
- [x] cleanup `onDisconnect`, pagehide และ MutationObserver อย่างปลอดภัย
- [x] คง maintenance/block overlay และการหยุด media ได้โดยไม่ทำให้หน้าเสีย

## Admin Android
- [ ] คำสั่ง Firebase ต้องแสดง pending/success/error ตามผลจริง
- [ ] การส่งข้อมูลตอนต้อง validate URL/episode และรายงานผลล้มเหลวที่แก้ได้
- [x] สร้าง APK debug รุ่นใหม่และตรวจ syntax/build

## CI และเอกสาร
- [x] ตรวจ workflow/importer/Android ด้วยคำสั่งที่มีอยู่จริง
- [x] ไม่ส่ง secret ออกนอกระบบและไม่ commit ไฟล์คีย์

## เว็บทนต่อข้อมูลภายนอก
- [x] การ์ดอนิเมะมี fallback เมื่อรูปปกโหลดไม่ได้
- [x] หน้าซับไทยและพากย์ไทยใช้ข้อมูลชุดเดียวกับหน้าแรกและกันรายการซ้ำ
