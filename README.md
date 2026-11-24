# AnimeFume

เว็บดูอนิเมะที่ใช้ Google Sheets เป็นแหล่งข้อมูลรายการและตอน

## ใช้งาน

เปิดเว็บได้ที่:

https://ysis59251-lab.github.io/Kirito/

## โครงสร้างหลัก

- `home.html` หน้าแสดงรายการอนิเมะ
- `search.html` ค้นหาเรื่อง
- `favorites.html` รายการโปรด
- `history.html` ประวัติการดู
- `folder-name/` หน้าเลือกตอนและเล่นวิดีโอ
- `data-source.js` ตัวดึงข้อมูลจาก Google Sheets

ถ้าจะรันในเครื่องแบบง่าย ๆ:

```bash
python3 -m http.server 4173
```

แล้วเปิด `http://localhost:4173` ในเบราว์เซอร์

หากต้องการใช้ Google Sheets proxy ให้รัน `python3 middle-server.py` (พอร์ต 8769) ซึ่ง bind เฉพาะ `127.0.0.1` โดยปริยายและปิดการเสิร์ฟ dotfiles; อย่ากำหนด `BIND_HOST` เป็น public interface เว้นแต่จะวางหลังระบบควบคุมการเข้าถึงที่เหมาะสม
