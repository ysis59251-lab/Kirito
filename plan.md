# AnimeFume / Kirito — แผนปรับปรุงระบบ

## เป้าหมาย
ยกระดับความเสถียร ความปลอดภัย และประสบการณ์ใช้งานของ Admin Android, เว็บ realtime และระบบ Authorized Video Import โดยไม่แตะข้อมูล production ระหว่างตรวจสอบ

## แนวทางที่เลือก
- **Design movement:** Operations cockpit แบบ dark-glass ที่เน้นสถานะชัดเจนและการตอบสนองทันที (0.06)
- **Core principles:** สถานะจริงมาก่อน optimistic UI, ล้มเหลวแล้วกู้คืนได้, สิทธิ์แยกชัด, งานเบื้องหลัง idempotent
- **Color philosophy:** พื้นเข้มลดภาระสายตา, mint ใช้กับสถานะสำเร็จ, amber เตือน, red ใช้เฉพาะ destructive/error
- **Layout paradigm:** แบ่งตามงานของผู้ดูแลและใช้ status surface ด้านบนแทนการกระจายข้อมูลทั่วหน้า
- **Signature elements:** status pill, action feedback, destructive confirmation
- **Interaction philosophy:** ทุกคำสั่งสำคัญแสดง pending → success/error และมี retry ที่เข้าใจง่าย
- **Typography:** ใช้ Material 3 hierarchy เดิมของแอปและ system sans บนเว็บ เพื่อไม่เพิ่ม dependency
- **Brand essence:** ศูนย์ควบคุม AnimeFume ที่เห็นสถานะจริงและแก้ปัญหาได้เร็ว — ชัดเจน, มั่นคง, ควบคุมได้

## ขอบเขต implementation
1. Importer: validate URL/redirect, retry/timeouts, cleanup และ state consistency
2. Web realtime: heartbeat error handling, disconnect cleanup, observer lifecycle
3. Android: write-result feedback, connection/error state, safer validation, build verification
4. CI: ตรวจ syntax/build และลดความเสี่ยงจาก workflow ที่เปลี่ยนไฟล์อัตโนมัติ

## โครงสร้าง
- `admin-android/`: แอปผู้ดูแล Kotlin/Compose และ APK
- `animefume-realtime.js`, `animefume-*.js/css`: client realtime และ UI
- `tools/anifume_importer.py`: worker ค้นหา ตรวจ และนำเข้า media ที่ได้รับอนุญาต
- `.github/workflows/`: scheduled/import และ automation workflows

## ข้อจำกัด
ห้ามเผยแพร่ service-account key, ห้ามทดสอบด้วยการเขียน/ลบข้อมูล production โดยไม่จำเป็น และห้าม bypass การป้องกันของแหล่งข้อมูลต้นทาง
