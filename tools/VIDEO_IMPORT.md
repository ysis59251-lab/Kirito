# Authorized Video Import Monitor

ระบบนี้ตรวจพบหน้าอนิเมะ/ตอนจาก `anifume.com` ทุกชั่วโมง และบันทึกคิวลง Firebase Realtime Database ที่ `videoImports/{key}`

## ความปลอดภัย

ตัว worker ไม่แกะ token ของตัวเล่น ไม่เดา URL วิดีโอ และไม่ดาวน์โหลดจากหน้า HTML โดยตรง การดาวน์โหลดจะทำเฉพาะเมื่อแอดมินหรือ API ที่ได้รับอนุญาตบันทึก `directMediaUrl` และสถานะเป็น `approved` หรือ `retry` แล้วเท่านั้น

ก่อนดาวน์โหลดต้องให้ host ของ `directMediaUrl` อยู่ใน `MEDIA_ALLOWLIST` เช่น `media.example.com`. ห้ามใส่คีย์ลับไว้ใน repository

## GitHub Actions secrets

ตั้งค่าใน Repository Settings → Secrets and variables → Actions:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON ของ Firebase service account ที่มีสิทธิ์อ่าน/เขียน Realtime Database และ Firebase Storage
- `MEDIA_ALLOWLIST`: รายชื่อ host ที่ได้รับอนุญาต คั่นด้วย comma เช่น `storage.example.com,cdn.example.com`

Workflow ชื่อ `Authorized Video Import Monitor` ทำงานทุกชั่วโมงตาม cron และเรียกด้วย `workflow_dispatch` ได้

## สถานะหลัก

- `discovered`: พบหน้าอนิเมะ/ตอนแล้ว
- `awaiting_media_url`: รอ direct media URL จาก API/export หรือแอดมิน
- `approved`: อนุมัติให้นำเข้า
- `uploaded`: อัปโหลด Firebase Storage สำเร็จ
- `failed`: ล้มเหลวพร้อมข้อความใน `error`

## การอนุมัติรายการ

ตัวอย่างข้อมูลที่ต้องเพิ่มใน `videoImports/{key}`:

```json
{
  "directMediaUrl": "https://media.example.com/authorized/episode-01.mp4",
  "state": "approved"
}
```

เมื่อรอบถัดไปทำงาน ระบบจะตรวจ content type, ขนาดไฟล์, ดาวน์โหลดแบบ stream, คำนวณ SHA-256 และอัปโหลดไปที่ `videos/{key}.mp4` ใน Firebase Storage

ระบบจะไม่เขียนทับ Google Sheets และเก็บ URL ต้นฉบับไว้สำหรับ rollback
